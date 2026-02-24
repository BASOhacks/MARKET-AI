# MarketAI - PRD

## Problem Statement
AI-powered Marketing Command Center for small businesses, content creators, and marketing agencies. Connects marketing channels, uses AI to analyze performance, identify what's working/failing, and generate actionable recommendations.

## Architecture
- **Backend**: FastAPI + MongoDB + emergentintegrations (Gemini AI + Stripe)
- **Frontend**: React + Tailwind CSS + Shadcn UI + Recharts + Framer Motion
- **Auth**: JWT (email/password)
- **AI**: Google Gemini (via emergentintegrations) for content generation and insights
- **Payments**: Stripe (via emergentintegrations), MTN MoMo + Airtel Money (mock endpoints)

## User Personas
1. Small business owners who market online
2. Content creators/solopreneurs
3. Marketing agencies managing multiple clients

## Core Requirements
- Multi-channel marketing dashboard
- AI content generation for 9+ channels
- Campaign management with budget tracking
- Content scheduling calendar
- Unified analytics with charts
- AI insights (warnings, opportunities, tips, wins)
- Ask AI strategy advisor
- Channel connection management
- Workspace/team management with RBAC
- Subscription billing (Stripe + mobile money)

## What's Been Implemented (Feb 24, 2026)
- [x] Landing page with hero, features, pricing, CTA
- [x] JWT authentication (register/login)
- [x] Dashboard with KPIs, quick actions, overview, insights
- [x] AI Content Generator (Gemini) - 9 channels, 7 tones
- [x] Campaign CRUD with budget tracking and status management
- [x] Content Calendar with date picker and scheduling
- [x] Analytics dashboard with Recharts (trends, channel breakdown, revenue)
- [x] AI Insights panel with generate + ask AI
- [x] Channel management (connect/disconnect with seeded analytics)
- [x] Settings page (profile, workspace, team members)
- [x] Billing page (Stripe checkout, mobile money, payment history)
- [x] Sidebar navigation with all routes
- [x] Dark professional SaaS theme (Outfit + Manrope fonts)
- [x] Demo data seeding on registration

## Mocked Integrations
- MTN MoMo payment (API structure ready, needs merchant credentials)
- Airtel Money payment (API structure ready, needs merchant credentials)
- Channel OAuth connections (simulated, ready for real OAuth)
- Analytics data (seeded with realistic demo data)

## Prioritized Backlog
### P0 (Critical)
- Real OAuth integration for Meta, Google, LinkedIn channels
- Real analytics data sync from connected platforms
- Email verification on registration

### P1 (High)
- Content editing and version history
- Multi-workspace switching
- Team member invitation system
- Automated post publishing to connected channels
- Real MTN MoMo + Airtel Money integration with merchant credentials

### P2 (Medium)
- A/B testing for content
- Custom reporting and exports
- White-label for agencies
- Notification system (email + in-app)
- Advanced AI: auto-generate weekly action plans

## Next Tasks
1. Implement real OAuth for channel connections
2. Add email verification
3. Build content editor with rich text
4. Implement actual post publishing via channel APIs
5. Add webhook handlers for MTN MoMo/Airtel Money
