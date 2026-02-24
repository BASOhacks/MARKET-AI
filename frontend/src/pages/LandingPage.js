import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Zap, ArrowRight, BarChart3, Sparkles, Target, CalendarDays,
  Radio, Lightbulb, CheckCircle, ChevronRight
} from "lucide-react";

const features = [
  {
    icon: Radio,
    title: "Connect All Channels",
    desc: "Link Instagram, Facebook, LinkedIn, Google Ads, and more in seconds.",
  },
  {
    icon: Sparkles,
    title: "AI Content Generation",
    desc: "Generate platform-native content for any channel with one click.",
  },
  {
    icon: BarChart3,
    title: "Unified Analytics",
    desc: "See reach, engagement, clicks, conversions, and ROI in one view.",
  },
  {
    icon: Lightbulb,
    title: "AI-Powered Insights",
    desc: "Daily alerts on what's working, what's failing, and what to do next.",
  },
  {
    icon: Target,
    title: "Campaign Management",
    desc: "Plan, launch, and track campaigns with real-time budget monitoring.",
  },
  {
    icon: CalendarDays,
    title: "Smart Scheduling",
    desc: "Schedule posts across all channels from a unified calendar view.",
  },
];

const plans = [
  { name: "Free", price: "$0", period: "/month", features: ["3 AI generations/day", "2 channels", "Basic analytics", "1 workspace"], cta: "Get Started" },
  { name: "Pro", price: "$29", period: "/month", features: ["Unlimited AI generations", "All channels", "Advanced analytics", "AI Insights", "Priority support"], cta: "Start Free Trial", highlighted: true },
  { name: "Agency", price: "$99", period: "/month", features: ["Everything in Pro", "Unlimited workspaces", "Team collaboration", "Client reporting", "White-label options"], cta: "Contact Sales" },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>MarketAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")} data-testid="landing-login-btn" className="text-muted-foreground hover:text-foreground">
              Log in
            </Button>
            <Button onClick={() => navigate("/signup")} data-testid="landing-signup-btn" className="bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(59,130,246,0.4)]">
              Get Started <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="hero-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-primary/30 bg-primary/5 text-sm text-primary">
              <Sparkles className="w-3.5 h-3.5" /> AI-Powered Marketing Intelligence
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Your marketing channels.
              <br />
              <span className="gradient-text">One AI command center.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Connect your marketing channels. AI tells you what's working, what's failing, and what to do next — daily. Stop guessing, start growing.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" onClick={() => navigate("/signup")} data-testid="hero-cta-btn" className="bg-primary text-white hover:bg-primary/90 shadow-[0_0_20px_rgba(59,130,246,0.5)] px-8 py-6 text-base">
                Start Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-6 text-base border-border/60">
                See How It Works
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="border-y border-border/40 bg-card/30 py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-center gap-12 text-muted-foreground text-sm">
          <span className="mono">2,400+ marketers</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span className="mono">1M+ content pieces generated</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span className="mono">4.8x avg ROAS improvement</span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium tracking-wide uppercase text-primary mb-3">Everything You Need</p>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Replace your entire marketing stack
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl bg-card/50 border border-white/5 card-hover"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-6 bg-card/20 border-y border-border/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium tracking-wide uppercase text-primary mb-3">Simple Process</p>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Three steps to smarter marketing
            </h2>
          </div>
          <div className="space-y-8">
            {[
              { step: "01", title: "Connect your channels", desc: "Link your social media, ad platforms, and email tools in one click." },
              { step: "02", title: "AI analyzes everything", desc: "Our AI reviews your data daily to find patterns, problems, and opportunities." },
              { step: "03", title: "Execute with confidence", desc: "Get clear action items, generate content, and schedule posts — all from one place." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex items-start gap-6 p-6 rounded-xl bg-card/50 border border-white/5"
              >
                <span className="mono text-3xl font-bold text-primary/40">{item.step}</span>
                <div>
                  <h3 className="text-xl font-semibold mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium tracking-wide uppercase text-primary mb-3">Pricing</p>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Start free, scale as you grow
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`p-8 rounded-xl border ${
                  plan.highlighted
                    ? 'border-primary/50 bg-primary/5 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                    : 'border-white/5 bg-card/50'
                } card-hover`}
              >
                {plan.highlighted && (
                  <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">Most Popular</span>
                )}
                <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.highlighted ? 'bg-primary text-white hover:bg-primary/90' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}
                  onClick={() => navigate("/signup")}
                  data-testid={`pricing-${plan.name.toLowerCase()}-btn`}
                >
                  {plan.cta} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-border/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Ready to take control of your marketing?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of businesses using AI to make smarter marketing decisions every day.
          </p>
          <Button size="lg" onClick={() => navigate("/signup")} className="bg-primary text-white hover:bg-primary/90 shadow-[0_0_20px_rgba(59,130,246,0.5)] px-10 py-6 text-base">
            Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span>MarketAI</span>
          </div>
          <span>2025 MarketAI. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
