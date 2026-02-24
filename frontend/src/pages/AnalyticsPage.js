import { useState, useEffect } from "react";
import { analyticsAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { DollarSign, Eye, MousePointerClick, TrendingUp, Users, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg p-3 text-xs">
      <p className="text-foreground font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="capitalize">
          {p.name}: {typeof p.value === 'number' && p.name.includes('spend') ? `$${p.value}` : p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ovRes, trRes] = await Promise.all([analyticsAPI.overview(), analyticsAPI.trends()]);
        setOverview(ovRes.data);
        setTrends(trRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const kpis = [
    { label: "Total Revenue", value: `$${(overview?.total_revenue || 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-400" },
    { label: "Total Reach", value: (overview?.total_reach || 0).toLocaleString(), icon: Eye, color: "text-blue-400" },
    { label: "Conversions", value: (overview?.total_conversions || 0).toLocaleString(), icon: MousePointerClick, color: "text-purple-400" },
    { label: "Total Spend", value: `$${(overview?.total_spend || 0).toLocaleString()}`, icon: DollarSign, color: "text-amber-400" },
    { label: "ROI", value: `${overview?.roi || 0}%`, icon: TrendingUp, color: overview?.roi > 0 ? "text-emerald-400" : "text-red-400" },
    { label: "Engagement", value: (overview?.total_engagement || 0).toLocaleString(), icon: Users, color: "text-pink-400" },
  ];

  const channelPieData = (overview?.channels || []).map((c, i) => ({
    name: c.name.replace('_', ' '),
    value: c.revenue,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div data-testid="analytics-page" className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>Analytics</h1>
        <p className="text-muted-foreground mt-1">Track performance across all your marketing channels</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="bg-card/50 border-white/5" data-testid={`analytics-kpi-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}>
              <CardContent className="p-4 text-center">
                <kpi.icon className={`w-5 h-5 mx-auto mb-2 ${kpi.color}`} />
                <p className="text-lg font-bold mono">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="bg-secondary/50 border border-border/40">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="channels">By Channel</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="mt-6">
          <Card className="bg-card/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-base" style={{ fontFamily: 'Outfit' }}>Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends.slice(-14)}>
                    <defs>
                      <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="reach" stroke="#3B82F6" fill="url(#reachGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="engagement" stroke="#10B981" fill="url(#engGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-white/5">
              <CardHeader>
                <CardTitle className="text-base" style={{ fontFamily: 'Outfit' }}>Revenue by Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={channelPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                        {channelPieData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend formatter={(value) => <span className="text-sm text-muted-foreground capitalize">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-white/5">
              <CardHeader>
                <CardTitle className="text-base" style={{ fontFamily: 'Outfit' }}>Channel Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(overview?.channels || []).map((ch, i) => {
                    const roi = ch.spend > 0 ? ((ch.revenue - ch.spend) / ch.spend * 100).toFixed(0) : 0;
                    return (
                      <div key={ch.name} className="p-3 rounded-lg bg-secondary/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium capitalize">{ch.name.replace('_', ' ')}</span>
                          <span className={`text-xs font-medium mono ${roi > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{roi}% ROI</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                          <div><span className="block mono text-foreground">{ch.reach.toLocaleString()}</span>Reach</div>
                          <div><span className="block mono text-foreground">{ch.clicks.toLocaleString()}</span>Clicks</div>
                          <div><span className="block mono text-foreground">${ch.spend.toFixed(0)}</span>Spend</div>
                          <div><span className="block mono text-emerald-400">${ch.revenue.toFixed(0)}</span>Revenue</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <Card className="bg-card/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-base" style={{ fontFamily: 'Outfit' }}>Revenue vs Spend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spend" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
