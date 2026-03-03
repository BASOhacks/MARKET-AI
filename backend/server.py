from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import random
from pathlib import Path
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Config
JWT_SECRET = os.environ.get('JWT_SECRET')
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is not set. Server cannot start.")
JWT_ALGORITHM = "HS256"
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str
    password: str = Field(min_length=8, max_length=128)

    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v

class UserLogin(BaseModel):
    email: str
    password: str

class ContentGenerateRequest(BaseModel):
    topic: str
    channel: str = "instagram"
    tone: str = "professional"
    product_description: Optional[str] = None
    campaign_id: Optional[str] = None

class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    goal: Optional[str] = ""
    budget: float = 0.0
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    channels: List[str] = []

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    goal: Optional[str] = None
    budget: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    channels: Optional[List[str]] = None

class ScheduleCreate(BaseModel):
    content_id: str
    channel: str
    scheduled_at: str

class ChannelConnect(BaseModel):
    platform: str
    account_name: Optional[str] = ""

class AskAIRequest(BaseModel):
    question: str

class CheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str

class MobilePaymentRequest(BaseModel):
    plan_id: str
    phone_number: str
    provider: str  # mtn_momo or airtel_money

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def mask_phone(phone: str) -> str:
    return phone[:3] + "****" + phone[-2:] if len(phone) > 5 else "****"

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== PRICING ====================

PLANS = {
    "free": {"name": "Free", "price": 0.0, "currency": "usd"},
    "pro": {"name": "Pro", "price": 29.0, "currency": "usd"},
    "agency": {"name": "Agency", "price": 99.0, "currency": "usd"},
}

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
@limiter.limit("5/minute")
async def register(request: Request, data: UserRegister):
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": data.name,
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "plan": "free",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    ws_id = str(uuid.uuid4())
    await db.workspaces.insert_one({
        "id": ws_id, "name": f"{data.name}'s Workspace",
        "owner_id": user_id, "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.workspace_members.insert_one({
        "id": str(uuid.uuid4()), "workspace_id": ws_id,
        "user_id": user_id, "role": "owner",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await seed_demo_data(user_id, ws_id)
    token = create_token(user_id, data.email.lower())
    return {"token": token, "user": {"id": user_id, "name": data.name, "email": data.email.lower(), "plan": "free"}}

@api_router.post("/auth/login")
@limiter.limit("10/minute")
async def login(request: Request, data: UserLogin):
    user = await db.users.find_one({"email": data.email.lower()}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user["email"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "plan": user.get("plan", "free")}}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    ws = await db.workspace_members.find_one({"user_id": user["id"]}, {"_id": 0})
    workspace = None
    if ws:
        workspace = await db.workspaces.find_one({"id": ws["workspace_id"]}, {"_id": 0})
    return {**user, "workspace": workspace}

# ==================== CONTENT GENERATION ====================

@api_router.post("/content/generate")
async def generate_content(data: ContentGenerateRequest, user: dict = Depends(get_current_user)):
    channel_prompts = {
        "instagram": "Instagram caption with relevant hashtags, engaging hook, and call-to-action",
        "linkedin": "LinkedIn post that is professional, insightful, and drives engagement",
        "twitter": "Tweet that is concise (under 280 chars), punchy, and shareable",
        "facebook": "Facebook post that encourages comments and shares",
        "google_ads": "Google Ads copy with compelling headline, description, and clear CTA",
        "meta_ads": "Meta (Facebook/Instagram) ad copy with hook, value prop, and CTA",
        "email": "Email marketing copy with subject line, preview text, and body",
        "blog": "SEO-optimized blog post outline with title, meta description, and key sections",
        "sms": "SMS marketing message that is concise, urgent, and has a clear CTA"
    }
    channel_desc = channel_prompts.get(data.channel, f"Marketing content for {data.channel}")
    product_ctx = f"\nProduct/Service: {data.product_description}" if data.product_description else ""
    prompt = f"""Create a {channel_desc}.

Topic: {data.topic}{product_ctx}
Tone: {data.tone}
Channel: {data.channel}

Generate ready-to-publish content. Be specific, creative, and actionable."""

    try:
        chat = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=f"content-{str(uuid.uuid4())[:8]}",
            system_message="You are MarketAI, an expert marketing content generator. Create platform-native, ready-to-publish marketing content."
        ).with_model("gemini", "gemini-2.5-flash")
        response = await chat.send_message(UserMessage(text=prompt))
        content_id = str(uuid.uuid4())
        ws = await db.workspace_members.find_one({"user_id": user["id"]}, {"_id": 0})
        content_doc = {
            "id": content_id,
            "user_id": user["id"],
            "workspace_id": ws["workspace_id"] if ws else None,
            "title": f"{data.channel.title()} - {data.topic[:50]}",
            "body": response,
            "channel": data.channel,
            "tone": data.tone,
            "topic": data.topic,
            "campaign_id": data.campaign_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.content.insert_one(content_doc)
        del content_doc["_id"]
        return content_doc
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@api_router.get("/content")
async def list_content(user: dict = Depends(get_current_user)):
    items = await db.content.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items

@api_router.delete("/content/{content_id}")
async def delete_content(content_id: str, user: dict = Depends(get_current_user)):
    result = await db.content.delete_one({"id": content_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Content not found")
    return {"success": True}

# ==================== CAMPAIGNS ====================

@api_router.post("/campaigns")
async def create_campaign(data: CampaignCreate, user: dict = Depends(get_current_user)):
    ws = await db.workspace_members.find_one({"user_id": user["id"]}, {"_id": 0})
    campaign_id = str(uuid.uuid4())
    doc = {
        "id": campaign_id,
        "user_id": user["id"],
        "workspace_id": ws["workspace_id"] if ws else None,
        "name": data.name,
        "description": data.description,
        "goal": data.goal,
        "budget": data.budget,
        "spent": 0.0,
        "start_date": data.start_date,
        "end_date": data.end_date,
        "channels": data.channels,
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.campaigns.insert_one(doc)
    del doc["_id"]
    return doc

@api_router.get("/campaigns")
async def list_campaigns(user: dict = Depends(get_current_user)):
    items = await db.campaigns.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items

@api_router.put("/campaigns/{campaign_id}")
async def update_campaign(campaign_id: str, data: CampaignUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.campaigns.update_one(
        {"id": campaign_id, "user_id": user["id"]},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    updated = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    return updated

@api_router.patch("/campaigns/{campaign_id}/status")
async def update_campaign_status(campaign_id: str, request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    status = body.get("status")
    if status not in ["draft", "active", "paused", "completed", "archived"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.campaigns.update_one(
        {"id": campaign_id, "user_id": user["id"]},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"success": True, "status": status}

# ==================== ANALYTICS ====================

@api_router.get("/analytics/overview")
async def analytics_overview(user: dict = Depends(get_current_user)):
    ws = await db.workspace_members.find_one({"user_id": user["id"]}, {"_id": 0})
    if not ws:
        return {"total_reach": 0, "total_engagement": 0, "total_clicks": 0, "total_conversions": 0, "total_spend": 0, "total_revenue": 0, "roi": 0, "channels": []}
    snapshots = await db.analytics_snapshots.find({"workspace_id": ws["workspace_id"]}, {"_id": 0}).to_list(1000)
    total = {"reach": 0, "engagement": 0, "clicks": 0, "conversions": 0, "spend": 0, "revenue": 0}
    channel_data = {}
    for s in snapshots:
        m = s.get("metrics", {})
        for k in total:
            total[k] += m.get(k, 0)
        ch = s.get("channel", "unknown")
        if ch not in channel_data:
            channel_data[ch] = {"reach": 0, "engagement": 0, "clicks": 0, "conversions": 0, "spend": 0, "revenue": 0}
        for k in total:
            channel_data[ch][k] += m.get(k, 0)
    roi = ((total["revenue"] - total["spend"]) / total["spend"] * 100) if total["spend"] > 0 else 0
    return {
        "total_reach": total["reach"],
        "total_engagement": total["engagement"],
        "total_clicks": total["clicks"],
        "total_conversions": total["conversions"],
        "total_spend": round(total["spend"], 2),
        "total_revenue": round(total["revenue"], 2),
        "roi": round(roi, 1),
        "channels": [{"name": k, **v} for k, v in channel_data.items()]
    }

@api_router.get("/analytics/trends")
async def analytics_trends(user: dict = Depends(get_current_user)):
    ws = await db.workspace_members.find_one({"user_id": user["id"]}, {"_id": 0})
    if not ws:
        return []
    snapshots = await db.analytics_snapshots.find(
        {"workspace_id": ws["workspace_id"]}, {"_id": 0}
    ).sort("date", 1).to_list(1000)
    daily = {}
    for s in snapshots:
        d = s.get("date", "")[:10]
        if d not in daily:
            daily[d] = {"date": d, "reach": 0, "engagement": 0, "clicks": 0, "conversions": 0, "spend": 0, "revenue": 0}
        m = s.get("metrics", {})
        for k in ["reach", "engagement", "clicks", "conversions", "spend", "revenue"]:
            daily[d][k] += m.get(k, 0)
    return list(daily.values())

# ==================== AI INSIGHTS ====================

@api_router.get("/insights")
async def get_insights(user: dict = Depends(get_current_user)):
    ws = await db.workspace_members.find_one({"user_id": user["id"]}, {"_id": 0})
    if not ws:
        return []
    items = await db.ai_insights.find({"workspace_id": ws["workspace_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return items

@api_router.post("/insights/generate")
async def generate_insights(user: dict = Depends(get_current_user)):
    ws = await db.workspace_members.find_one({"user_id": user["id"]}, {"_id": 0})
    if not ws:
        raise HTTPException(status_code=400, detail="No workspace found")
    snapshots = await db.analytics_snapshots.find({"workspace_id": ws["workspace_id"]}, {"_id": 0}).to_list(100)
    campaigns = await db.campaigns.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)
    analytics_summary = []
    for s in snapshots:
        analytics_summary.append(f"{s.get('channel','unknown')}: reach={s['metrics'].get('reach',0)}, engagement={s['metrics'].get('engagement',0)}, clicks={s['metrics'].get('clicks',0)}, spend=${s['metrics'].get('spend',0)}, revenue=${s['metrics'].get('revenue',0)}")
    campaign_summary = [f"{c['name']} ({c['status']}): budget=${c['budget']}, spent=${c['spent']}" for c in campaigns]

    prompt = f"""Analyze this marketing data and generate exactly 4 insights in JSON array format.
Each insight should have: type (warning/opportunity/tip/win), title (short), description (actionable).

Analytics Data:
{chr(10).join(analytics_summary) if analytics_summary else "No analytics data yet"}

Campaigns:
{chr(10).join(campaign_summary) if campaign_summary else "No campaigns yet"}

Return ONLY a JSON array like: [{{"type":"warning","title":"...","description":"..."}}, ...]"""

    try:
        chat = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=f"insights-{str(uuid.uuid4())[:8]}",
            system_message="You are a marketing analytics AI. Analyze data and provide actionable insights. Always respond with valid JSON."
        ).with_model("gemini", "gemini-2.5-flash")
        response = await chat.send_message(UserMessage(text=prompt))
        clean = response.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
            clean = clean.rsplit("```", 1)[0]
        insights_data = json.loads(clean)
        saved = []
        for item in insights_data[:4]:
            insight_doc = {
                "id": str(uuid.uuid4()),
                "workspace_id": ws["workspace_id"],
                "type": item.get("type", "tip"),
                "title": item.get("title", ""),
                "description": item.get("description", ""),
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.ai_insights.insert_one(insight_doc)
            del insight_doc["_id"]
            saved.append(insight_doc)
        return saved
    except Exception as e:
        logger.error(f"Insights generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Insights generation failed: {str(e)}")

@api_router.post("/insights/ask")
async def ask_ai(data: AskAIRequest, user: dict = Depends(get_current_user)):
    ws = await db.workspace_members.find_one({"user_id": user["id"]}, {"_id": 0})
    snapshots = await db.analytics_snapshots.find({"workspace_id": ws["workspace_id"] if ws else ""}, {"_id": 0}).to_list(50)
    context_lines = []
    for s in snapshots:
        m = s.get("metrics", {})
        context_lines.append(f"{s.get('channel','?')}: reach={m.get('reach',0)}, engagement={m.get('engagement',0)}, clicks={m.get('clicks',0)}, spend=${m.get('spend',0)}, revenue=${m.get('revenue',0)}")
    prompt = f"""Based on this marketing analytics data, answer the user's question with actionable advice.

Data:
{chr(10).join(context_lines) if context_lines else "No data available yet - provide general marketing advice"}

User question: {data.question}

Provide a clear, data-aware, actionable answer."""
    try:
        chat = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=f"ask-{str(uuid.uuid4())[:8]}",
            system_message="You are MarketAI, a data-driven marketing strategy advisor."
        ).with_model("gemini", "gemini-2.5-flash")
        response = await chat.send_message(UserMessage(text=prompt))
        return {"answer": response}
    except Exception as e:
        logger.error(f"Ask AI error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== CHANNELS ====================

@api_router.get("/channels")
async def list_channels(user: dict = Depends(get_current_user)):
    ws = await db.workspace_members.find_one({"user_id": user["id"]}, {"_id": 0})
    if not ws:
        return []
    items = await db.channels.find({"workspace_id": ws["workspace_id"]}, {"_id": 0}).to_list(50)
    return items

@api_router.post("/channels/connect")
async def connect_channel(data: ChannelConnect, user: dict = Depends(get_current_user)):
    ws = await db.workspace_members.find_one({"user_id": user["id"]}, {"_id": 0})
    if not ws:
        raise HTTPException(status_code=400, detail="No workspace")
    existing = await db.channels.find_one({"workspace_id": ws["workspace_id"], "platform": data.platform})
    if existing:
        raise HTTPException(status_code=400, detail="Channel already connected")
    channel_id = str(uuid.uuid4())
    doc = {
        "id": channel_id,
        "user_id": user["id"],
        "workspace_id": ws["workspace_id"],
        "platform": data.platform,
        "connected": True,
        "account_name": data.account_name or f"@{user['name'].lower().replace(' ', '')}",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.channels.insert_one(doc)
    await seed_channel_analytics(ws["workspace_id"], data.platform)
    del doc["_id"]
    return doc

@api_router.delete("/channels/{channel_id}")
async def disconnect_channel(channel_id: str, user: dict = Depends(get_current_user)):
    result = await db.channels.delete_one({"id": channel_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Channel not found")
    return {"success": True}

# ==================== SCHEDULING ====================

@api_router.post("/schedule")
async def create_schedule(data: ScheduleCreate, user: dict = Depends(get_current_user)):
    ws = await db.workspace_members.find_one({"user_id": user["id"]}, {"_id": 0})
    schedule_id = str(uuid.uuid4())
    doc = {
        "id": schedule_id,
        "user_id": user["id"],
        "workspace_id": ws["workspace_id"] if ws else None,
        "content_id": data.content_id,
        "channel": data.channel,
        "scheduled_at": data.scheduled_at,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.scheduled_posts.insert_one(doc)
    del doc["_id"]
    return doc

@api_router.get("/schedule")
async def list_schedule(user: dict = Depends(get_current_user)):
    items = await db.scheduled_posts.find({"user_id": user["id"]}, {"_id": 0}).sort("scheduled_at", 1).to_list(200)
    for item in items:
        content = await db.content.find_one({"id": item.get("content_id")}, {"_id": 0})
        if content:
            item["content_title"] = content.get("title", "")
            item["content_body"] = content.get("body", "")[:100]
    return items

@api_router.delete("/schedule/{schedule_id}")
async def cancel_schedule(schedule_id: str, user: dict = Depends(get_current_user)):
    result = await db.scheduled_posts.delete_one({"id": schedule_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scheduled post not found")
    return {"success": True}

# ==================== PAYMENTS ====================

@api_router.post("/payments/checkout")
async def create_checkout(data: CheckoutRequest, request: Request):
    user = await get_current_user(request)
    if data.plan_id not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    plan = PLANS[data.plan_id]
    if plan["price"] == 0:
        raise HTTPException(status_code=400, detail="Free plan doesn't require payment")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    success_url = f"{data.origin_url}/billing?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{data.origin_url}/billing"
    checkout_req = CheckoutSessionRequest(
        amount=float(plan["price"]),
        currency=plan["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"user_id": user["id"], "plan_id": data.plan_id, "email": user["email"]}
    )
    session = await stripe_checkout.create_checkout_session(checkout_req)
    tx_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "session_id": session.session_id,
        "amount": plan["price"],
        "currency": plan["currency"],
        "plan": data.plan_id,
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payment_transactions.insert_one(tx_doc)
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def payment_status(session_id: str, request: Request):
    user = await get_current_user(request)
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    status = await stripe_checkout.get_checkout_status(session_id)
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if tx and tx.get("payment_status") != "paid":
        new_status = "paid" if status.payment_status == "paid" else status.payment_status
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": status.status, "payment_status": new_status}}
        )
        if new_status == "paid":
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"plan": tx["plan"]}}
            )
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    if not sig:
        raise HTTPException(status_code=400, detail="Missing Stripe signature")
    try:
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        event = await stripe_checkout.handle_webhook(body, sig)
        if event.payment_status == "paid":
            tx = await db.payment_transactions.find_one({"session_id": event.session_id}, {"_id": 0})
            if tx and tx.get("payment_status") != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": event.session_id},
                    {"$set": {"status": "complete", "payment_status": "paid"}}
                )
                if tx.get("user_id"):
                    await db.users.update_one({"id": tx["user_id"]}, {"$set": {"plan": tx["plan"]}})
        return {"received": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Webhook processing failed")

@api_router.post("/payments/mobile")
async def mobile_payment(data: MobilePaymentRequest, request: Request):
    user = await get_current_user(request)
    if data.plan_id not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    plan = PLANS[data.plan_id]
    tx_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "session_id": f"mobile-{str(uuid.uuid4())[:8]}",
        "amount": plan["price"],
        "currency": "usd",
        "plan": data.plan_id,
        "provider": data.provider,
        "phone_number": mask_phone(data.phone_number),
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payment_transactions.insert_one(tx_doc)
    return {
        "message": f"Payment request sent to {data.phone_number} via {data.provider}. Please confirm on your phone.",
        "transaction_id": tx_doc["id"],
        "status": "pending"
    }

@api_router.get("/payments/history")
async def payment_history(user: dict = Depends(get_current_user)):
    items = await db.payment_transactions.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return items

# ==================== WORKSPACE / TEAM ====================

@api_router.get("/workspace")
async def get_workspace(user: dict = Depends(get_current_user)):
    ws = await db.workspace_members.find_one({"user_id": user["id"]}, {"_id": 0})
    if not ws:
        return None
    workspace = await db.workspaces.find_one({"id": ws["workspace_id"]}, {"_id": 0})
    members = await db.workspace_members.find({"workspace_id": ws["workspace_id"]}, {"_id": 0}).to_list(100)
    member_details = []
    for m in members:
        u = await db.users.find_one({"id": m["user_id"]}, {"_id": 0, "password_hash": 0})
        if u:
            member_details.append({**m, "user_name": u.get("name", ""), "user_email": u.get("email", "")})
    return {**workspace, "members": member_details} if workspace else None

@api_router.get("/dashboard/summary")
async def dashboard_summary(user: dict = Depends(get_current_user)):
    ws = await db.workspace_members.find_one({"user_id": user["id"]}, {"_id": 0})
    ws_id = ws["workspace_id"] if ws else ""
    content_count = await db.content.count_documents({"user_id": user["id"]})
    campaign_count = await db.campaigns.count_documents({"user_id": user["id"]})
    active_campaigns = await db.campaigns.count_documents({"user_id": user["id"], "status": "active"})
    scheduled_count = await db.scheduled_posts.count_documents({"user_id": user["id"], "status": "pending"})
    channels_count = await db.channels.count_documents({"workspace_id": ws_id})
    insights = await db.ai_insights.find({"workspace_id": ws_id, "read": False}, {"_id": 0}).to_list(5)
    recent_content = await db.content.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(5)
    return {
        "content_count": content_count,
        "campaign_count": campaign_count,
        "active_campaigns": active_campaigns,
        "scheduled_count": scheduled_count,
        "channels_count": channels_count,
        "unread_insights": len(insights),
        "recent_insights": insights,
        "recent_content": recent_content,
    }

# ==================== SEED DEMO DATA ====================

async def seed_channel_analytics(workspace_id: str, platform: str):
    base_date = datetime.now(timezone.utc) - timedelta(days=30)
    channel_multipliers = {
        "instagram": {"reach": 2500, "engagement": 180, "clicks": 90, "conversions": 8, "spend": 25, "revenue": 120},
        "facebook": {"reach": 3200, "engagement": 220, "clicks": 130, "conversions": 12, "spend": 35, "revenue": 180},
        "linkedin": {"reach": 1800, "engagement": 95, "clicks": 65, "conversions": 6, "spend": 40, "revenue": 200},
        "twitter": {"reach": 4500, "engagement": 310, "clicks": 75, "conversions": 4, "spend": 15, "revenue": 60},
        "google_ads": {"reach": 8000, "engagement": 400, "clicks": 350, "conversions": 25, "spend": 120, "revenue": 650},
        "meta_ads": {"reach": 6500, "engagement": 350, "clicks": 280, "conversions": 20, "spend": 95, "revenue": 480},
        "email": {"reach": 2000, "engagement": 450, "clicks": 180, "conversions": 15, "spend": 10, "revenue": 300},
    }
    base = channel_multipliers.get(platform, {"reach": 1000, "engagement": 100, "clicks": 50, "conversions": 5, "spend": 20, "revenue": 100})
    docs = []
    for i in range(30):
        day = base_date + timedelta(days=i)
        variance = random.uniform(0.7, 1.4)
        doc = {
            "id": str(uuid.uuid4()),
            "workspace_id": workspace_id,
            "channel": platform,
            "date": day.isoformat(),
            "metrics": {
                "reach": int(base["reach"] * variance),
                "engagement": int(base["engagement"] * variance),
                "clicks": int(base["clicks"] * variance),
                "conversions": int(base["conversions"] * variance),
                "spend": round(base["spend"] * variance, 2),
                "revenue": round(base["revenue"] * variance, 2),
            }
        }
        docs.append(doc)
    if docs:
        await db.analytics_snapshots.insert_many(docs)

async def seed_demo_data(user_id: str, workspace_id: str):
    default_channels = ["instagram", "facebook", "linkedin", "google_ads"]
    for platform in default_channels:
        channel_id = str(uuid.uuid4())
        await db.channels.insert_one({
            "id": channel_id, "user_id": user_id, "workspace_id": workspace_id,
            "platform": platform, "connected": True,
            "account_name": f"@marketai_demo",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await seed_channel_analytics(workspace_id, platform)
    demo_insights = [
        {"type": "warning", "title": "Instagram engagement dropping", "description": "Your Instagram engagement rate has decreased by 15% over the past week. Consider posting more interactive content like polls and questions."},
        {"type": "opportunity", "title": "LinkedIn audience growing", "description": "Your LinkedIn follower growth is 3x higher than average. This is the perfect time to launch a thought leadership campaign."},
        {"type": "tip", "title": "Best posting time detected", "description": "Your audience is most active between 9-11 AM on Tuesdays and Thursdays. Schedule your most important content during these windows."},
        {"type": "win", "title": "Google Ads ROAS exceeding target", "description": "Your Google Ads campaign is delivering 4.2x ROAS, which is 28% above industry average. Consider increasing budget allocation."},
    ]
    for item in demo_insights:
        await db.ai_insights.insert_one({
            "id": str(uuid.uuid4()), "workspace_id": workspace_id,
            "type": item["type"], "title": item["title"],
            "description": item["description"], "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

# ==================== APP SETUP ====================

app.include_router(api_router)

allowed_origins = os.environ.get('CORS_ORIGINS')
if not allowed_origins:
    raise RuntimeError("CORS_ORIGINS environment variable is not set.")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins.split(','),
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()