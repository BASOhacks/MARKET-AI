import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardAPI, analyticsAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3, FileText, Target, CalendarDays, Radio, Lightbulb,
  TrendingUp, TrendingDown, DollarSign, Users, MousePointerClick, Eye,
  ArrowRight, Sparkles, AlertTriangle, Trophy, Zap
} from "lucide-react";
import { motion } from "framer-motion";

const insightIcons = { warning: AlertTriangle, opportunity: Lightbulb, tip: Zap, win: Trophy };
const insightColors = { warning: "text-yellow-500", opportunity: "text-purple-400", tip: "text-blue-400", win: "text-emerald-400" };

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, anaRes] = await Promise.all([
          dashboardAPI.summary(),
          analyticsAPI.overview()
        ]);
        setSummary(sumRes.data);
        setAnalytics(anaRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const kpis = [
    { label: "Total Revenue", value: `$${(analytics?.total_revenue || 0).toLocaleString()}`, icon: DollarSign, change: "+12.5%", up: true },
    { label: "Total Reach", value: (analytics?.total_reach || 0).toLocaleString(), icon: Eye, change: "+8.2%", up: true },
    { label: "Conversions", value: (analytics?.total_conversions || 0).toLocaleString(), icon: MousePointerClick, change: "+5.1%", up: true },
    { label: "ROI", value: `${analytics?.roi || 0}%`, icon: TrendingUp, change: analytics?.roi > 0 ? "Positive" : "Negative", up: analytics?.roi > 0 },
  ];

  const quickActions = [
    { label: "Generate Content", icon: Sparkles, to: "/content", color: "bg-primary/10 text-primary" },
    { label: "View Analytics", icon: BarChart3, to: "/analytics", color: "bg-emerald-500/10 text-emerald-400" },
    { label: "New Campaign", icon: Target, to: "/campaigns", color: "bg-purple-500/10 text-purple-400" },
    { label: "Schedule Post", icon: CalendarDays, to: "/calendar", color: "bg-amber-500/10 text-amber-400" },
  ];

  return (
    <div data-testid="dashboard-page" className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your marketing command center at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="bg-card/50 border-white/5 card-hover" data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <kpi.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className={`text-xs font-medium mono ${kpi.up ? 'text-emerald-400' : 'text-red-400'}`}>
                    {kpi.up ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                    {kpi.change}
                  </span>
                </div>
                <p className="text-2xl font-bold mono">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Outfit' }}>Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              onClick={() => navigate(action.to)}
              data-testid={`quick-action-${action.label.toLowerCase().replace(/\s/g, '-')}`}
              className="h-auto py-4 px-4 flex flex-col items-center gap-2 bg-card/30 border-white/5 hover:border-primary/40"
            >
              <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stats Summary */}
        <Card className="bg-card/50 border-white/5">
          <CardHeader>
            <CardTitle className="text-base font-semibold" style={{ fontFamily: 'Outfit' }}>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Content Created", value: summary?.content_count || 0, icon: FileText },
              { label: "Active Campaigns", value: summary?.active_campaigns || 0, icon: Target },
              { label: "Scheduled Posts", value: summary?.scheduled_count || 0, icon: CalendarDays },
              { label: "Connected Channels", value: summary?.channels_count || 0, icon: Radio },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-sm font-semibold mono">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Insights */}
        <Card className="bg-card/50 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold" style={{ fontFamily: 'Outfit' }}>Recent Insights</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/insights")} className="text-primary text-xs">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {(summary?.recent_insights || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No insights yet. Connect channels to get started.</p>
            ) : (
              summary.recent_insights.slice(0, 4).map((insight) => {
                const Icon = insightIcons[insight.type] || Lightbulb;
                const color = insightColors[insight.type] || "text-blue-400";
                return (
                  <div key={insight.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                    <div>
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{insight.description}</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      {analytics?.channels?.length > 0 && (
        <Card className="bg-card/50 border-white/5">
          <CardHeader>
            <CardTitle className="text-base font-semibold" style={{ fontFamily: 'Outfit' }}>Channel Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Channel</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Reach</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Engagement</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Clicks</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Revenue</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.channels.map((ch) => {
                    const roi = ch.spend > 0 ? ((ch.revenue - ch.spend) / ch.spend * 100).toFixed(0) : 0;
                    return (
                      <tr key={ch.name} className="border-b border-border/20 hover:bg-secondary/20">
                        <td className="py-3 px-2 capitalize font-medium">{ch.name.replace('_', ' ')}</td>
                        <td className="py-3 px-2 text-right mono">{ch.reach.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right mono">{ch.engagement.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right mono">{ch.clicks.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right mono text-emerald-400">${ch.revenue.toLocaleString()}</td>
                        <td className={`py-3 px-2 text-right mono ${roi > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{roi}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
