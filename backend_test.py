#!/usr/bin/env python3
"""
Comprehensive backend API testing for MarketAI application.
Tests all endpoints with authentication, content generation, campaigns, analytics, etc.
"""

import requests
import json
import sys
import time
from datetime import datetime

class MarketAIAPITester:
    def __init__(self, base_url="https://content-command-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Test credentials
        self.test_email = "test@example.com"
        self.test_password = "password123"

    def log(self, message, level="INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        req_headers = {'Content-Type': 'application/json'}
        if self.token:
            req_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            req_headers.update(headers)

        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=req_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=req_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=req_headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=req_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=req_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}", "ERROR")
                try:
                    error_detail = response.json()
                    self.log(f"   Error details: {error_detail}", "ERROR")
                except:
                    self.log(f"   Response text: {response.text[:200]}", "ERROR")
                
                self.failed_tests.append({
                    "test": name,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "error": response.text[:200]
                })
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Network Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "expected": expected_status,
                "actual": "Network Error",
                "error": str(e)
            })
            return False, {}

    def test_auth_flow(self):
        """Test authentication endpoints"""
        self.log("=== TESTING AUTHENTICATION ===")
        
        # Test login with existing test user
        success, response = self.run_test(
            "Login with test user",
            "POST",
            "auth/login",
            200,
            data={"email": self.test_email, "password": self.test_password}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response.get('user', {}).get('id')
            self.log(f"   Token received, user_id: {self.user_id}")
        else:
            self.log("❌ Login failed - cannot continue with authenticated tests", "ERROR")
            return False

        # Test /auth/me endpoint
        success, user_data = self.run_test(
            "Get current user",
            "GET", 
            "auth/me",
            200
        )
        
        if success:
            self.log(f"   User data: {user_data.get('name')} ({user_data.get('email')})")
            
        return True

    def test_content_generation(self):
        """Test AI content generation"""
        self.log("=== TESTING CONTENT GENERATION ===")
        
        # Generate content
        content_data = {
            "topic": "AI-powered marketing tools for 2025",
            "channel": "linkedin",
            "tone": "professional",
            "product_description": "MarketAI - Marketing automation platform"
        }
        
        success, response = self.run_test(
            "Generate AI content",
            "POST",
            "content/generate", 
            200,
            data=content_data
        )
        
        content_id = None
        if success and 'id' in response:
            content_id = response['id']
            self.log(f"   Content generated with ID: {content_id}")
            
        # List content
        success, content_list = self.run_test(
            "List content",
            "GET",
            "content",
            200
        )
        
        if success:
            self.log(f"   Found {len(content_list)} content items")
            
        # Delete content if created
        if content_id:
            self.run_test(
                "Delete content",
                "DELETE",
                f"content/{content_id}",
                200
            )

    def test_campaigns(self):
        """Test campaign management"""
        self.log("=== TESTING CAMPAIGNS ===")
        
        # Create campaign
        campaign_data = {
            "name": "Test Marketing Campaign",
            "description": "API test campaign",
            "goal": "Increase brand awareness",
            "budget": 1000.0,
            "channels": ["linkedin", "instagram"]
        }
        
        success, response = self.run_test(
            "Create campaign",
            "POST",
            "campaigns",
            200,
            data=campaign_data
        )
        
        campaign_id = None
        if success and 'id' in response:
            campaign_id = response['id']
            self.log(f"   Campaign created with ID: {campaign_id}")
        
        # List campaigns
        success, campaigns = self.run_test(
            "List campaigns",
            "GET",
            "campaigns",
            200
        )
        
        if success:
            self.log(f"   Found {len(campaigns)} campaigns")
        
        # Update campaign status if created
        if campaign_id:
            self.run_test(
                "Update campaign status",
                "PATCH",
                f"campaigns/{campaign_id}/status",
                200,
                data={"status": "active"}
            )
            
            # Update campaign
            self.run_test(
                "Update campaign",
                "PUT", 
                f"campaigns/{campaign_id}",
                200,
                data={"budget": 1500.0}
            )

    def test_analytics(self):
        """Test analytics endpoints"""
        self.log("=== TESTING ANALYTICS ===")
        
        # Get analytics overview
        success, overview = self.run_test(
            "Get analytics overview",
            "GET",
            "analytics/overview", 
            200
        )
        
        if success:
            self.log(f"   Total reach: {overview.get('total_reach', 0)}")
            self.log(f"   Total revenue: ${overview.get('total_revenue', 0)}")
            self.log(f"   ROI: {overview.get('roi', 0)}%")
            
        # Get trends
        success, trends = self.run_test(
            "Get analytics trends",
            "GET",
            "analytics/trends",
            200
        )
        
        if success:
            self.log(f"   Found {len(trends)} trend data points")

    def test_insights(self):
        """Test AI insights"""
        self.log("=== TESTING AI INSIGHTS ===")
        
        # List insights
        success, insights = self.run_test(
            "List insights",
            "GET",
            "insights",
            200
        )
        
        if success:
            self.log(f"   Found {len(insights)} existing insights")
            
        # Generate new insights
        success, new_insights = self.run_test(
            "Generate AI insights",
            "POST", 
            "insights/generate",
            200
        )
        
        if success:
            self.log(f"   Generated {len(new_insights)} new insights")
            
        # Ask AI question
        success, answer = self.run_test(
            "Ask AI question",
            "POST",
            "insights/ask",
            200, 
            data={"question": "What marketing channels are performing best?"}
        )
        
        if success and 'answer' in answer:
            self.log(f"   AI answered: {answer['answer'][:100]}...")

    def test_channels(self):
        """Test channel management"""
        self.log("=== TESTING CHANNELS ===")
        
        # List channels
        success, channels = self.run_test(
            "List channels",
            "GET",
            "channels",
            200
        )
        
        existing_channels = len(channels) if success else 0
        self.log(f"   Found {existing_channels} existing channels")
        
        # Connect new channel
        success, new_channel = self.run_test(
            "Connect Twitter channel",
            "POST",
            "channels/connect",
            200,
            data={"platform": "twitter", "account_name": "@testaccount"}
        )
        
        channel_id = None
        if success and 'id' in new_channel:
            channel_id = new_channel['id']
            self.log(f"   Connected channel with ID: {channel_id}")
        
        # Disconnect channel if created
        if channel_id:
            self.run_test(
                "Disconnect channel", 
                "DELETE",
                f"channels/{channel_id}",
                200
            )

    def test_dashboard(self):
        """Test dashboard endpoints"""
        self.log("=== TESTING DASHBOARD ===")
        
        # Get dashboard summary
        success, summary = self.run_test(
            "Get dashboard summary",
            "GET",
            "dashboard/summary",
            200
        )
        
        if success:
            self.log(f"   Content count: {summary.get('content_count', 0)}")
            self.log(f"   Active campaigns: {summary.get('active_campaigns', 0)}")
            self.log(f"   Connected channels: {summary.get('channels_count', 0)}")

    def test_workspace(self):
        """Test workspace endpoints"""
        self.log("=== TESTING WORKSPACE ===")
        
        # Get workspace
        success, workspace = self.run_test(
            "Get workspace",
            "GET", 
            "workspace",
            200
        )
        
        if success and workspace:
            self.log(f"   Workspace: {workspace.get('name')}")
            self.log(f"   Members: {len(workspace.get('members', []))}")

    def test_payments(self):
        """Test payment endpoints (limited - no actual transactions)"""
        self.log("=== TESTING PAYMENTS ===")
        
        # Get payment history
        success, history = self.run_test(
            "Get payment history",
            "GET",
            "payments/history",
            200
        )
        
        if success:
            self.log(f"   Found {len(history)} payment records")
            
        # Test mobile payment endpoint (should create pending transaction)
        success, mobile_response = self.run_test(
            "Test mobile payment",
            "POST",
            "payments/mobile", 
            200,
            data={
                "plan_id": "pro",
                "phone_number": "+256700123456",
                "provider": "mtn_momo"
            }
        )
        
        if success:
            self.log(f"   Mobile payment initiated: {mobile_response.get('status')}")

    def run_all_tests(self):
        """Run complete test suite"""
        start_time = time.time()
        self.log("🚀 Starting MarketAI API Test Suite")
        self.log(f"Backend URL: {self.base_url}")
        
        # Run authentication first - required for other tests
        if not self.test_auth_flow():
            self.log("❌ Authentication failed - stopping tests", "ERROR")
            return False
            
        # Run all other tests
        self.test_content_generation()
        self.test_campaigns()
        self.test_analytics()
        self.test_insights()
        self.test_channels() 
        self.test_dashboard()
        self.test_workspace()
        self.test_payments()
        
        # Print results
        duration = time.time() - start_time
        self.log("="*50)
        self.log(f"📊 TEST RESULTS ({duration:.1f}s)")
        self.log(f"✅ Passed: {self.tests_passed}/{self.tests_run}")
        self.log(f"❌ Failed: {len(self.failed_tests)}")
        
        if self.failed_tests:
            self.log("\n🔍 FAILED TESTS:")
            for failure in self.failed_tests:
                self.log(f"   • {failure['test']}: {failure['expected']} → {failure['actual']}")
                if failure['error']:
                    self.log(f"     Error: {failure['error']}")
                    
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        self.log(f"\n🎯 Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80  # Consider 80%+ as passing

def main():
    """Main test runner"""
    tester = MarketAIAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())