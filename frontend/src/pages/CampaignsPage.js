import { useState, useEffect } from "react";
import { campaignAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Plus, Play, Pause, Archive, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const statusColors = {
  draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  paused: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  archived: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", goal: "", budget: "", start_date: "", end_date: "", channels: [] });

  useEffect(() => { loadCampaigns(); }, []);

  const loadCampaigns = async () => {
    try {
      const res = await campaignAPI.list();
      setCampaigns(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error("Campaign name is required");
    try {
      await campaignAPI.create({
        ...form,
        budget: parseFloat(form.budget) || 0,
      });
      toast.success("Campaign created!");
      setShowCreate(false);
      setForm({ name: "", description: "", goal: "", budget: "", start_date: "", end_date: "", channels: [] });
      loadCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await campaignAPI.updateStatus(id, status);
      toast.success(`Campaign ${status}`);
      loadCampaigns();
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  return (
    <div data-testid="campaigns-page" className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>Campaigns</h1>
          <p className="text-muted-foreground mt-1">Plan, launch, and track your marketing campaigns</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(59,130,246,0.4)]" data-testid="create-campaign-btn">
              <Plus className="w-4 h-4 mr-2" /> New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border/40 max-w-md">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Outfit' }}>Create Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Campaign Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Q1 Brand Awareness" data-testid="campaign-name-input" className="bg-input/50 border-transparent focus:border-primary h-11" />
              </div>
              <div className="space-y-2">
                <Label>Goal</Label>
                <Input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="e.g. Increase signups by 30%" className="bg-input/50 border-transparent focus:border-primary h-11" />
              </div>
              <div className="space-y-2">
                <Label>Budget ($)</Label>
                <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="5000" className="bg-input/50 border-transparent focus:border-primary h-11" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="bg-input/50 border-transparent focus:border-primary h-11" />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="bg-input/50 border-transparent focus:border-primary h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Campaign details..." className="bg-input/50 border-transparent focus:border-primary" />
              </div>
              <Button onClick={handleCreate} className="w-full bg-primary text-white hover:bg-primary/90" data-testid="submit-campaign-btn">
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No campaigns yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign, i) => {
            const budgetUsed = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;
            return (
              <motion.div key={campaign.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="bg-card/50 border-white/5 card-hover" data-testid={`campaign-card-${campaign.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-base">{campaign.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{campaign.description || campaign.goal || "No description"}</p>
                      </div>
                      <Badge className={`${statusColors[campaign.status]} text-xs capitalize`}>{campaign.status}</Badge>
                    </div>

                    {campaign.budget > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> Budget
                          </span>
                          <span className="mono">${campaign.spent.toFixed(0)} / ${campaign.budget.toFixed(0)}</span>
                        </div>
                        <Progress value={budgetUsed} className="h-1.5" />
                      </div>
                    )}

                    {(campaign.start_date || campaign.end_date) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
                        <Calendar className="w-3 h-3" />
                        {campaign.start_date || "?"} - {campaign.end_date || "?"}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {campaign.status === "draft" && (
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(campaign.id, "active")} className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                          <Play className="w-3 h-3 mr-1" /> Launch
                        </Button>
                      )}
                      {campaign.status === "active" && (
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(campaign.id, "paused")} className="text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                          <Pause className="w-3 h-3 mr-1" /> Pause
                        </Button>
                      )}
                      {campaign.status === "paused" && (
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(campaign.id, "active")} className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                          <Play className="w-3 h-3 mr-1" /> Resume
                        </Button>
                      )}
                      {["draft", "paused", "completed"].includes(campaign.status) && (
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(campaign.id, "archived")} className="text-xs text-muted-foreground">
                          <Archive className="w-3 h-3 mr-1" /> Archive
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
