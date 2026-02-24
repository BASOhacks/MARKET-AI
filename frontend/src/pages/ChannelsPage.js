import { useState, useEffect } from "react";
import { channelsAPI } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Radio, Plus, Unlink, CheckCircle, Link2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const platformInfo = {
  instagram: { name: "Instagram", color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  facebook: { name: "Facebook", color: "bg-blue-600/10 text-blue-400 border-blue-600/20" },
  linkedin: { name: "LinkedIn", color: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  twitter: { name: "X / Twitter", color: "bg-zinc-400/10 text-zinc-300 border-zinc-400/20" },
  google_ads: { name: "Google Ads", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  meta_ads: { name: "Meta Ads", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  email: { name: "Email", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  blog: { name: "Blog / SEO", color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  sms: { name: "SMS", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
};

const allPlatforms = Object.keys(platformInfo);

export default function ChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConnect, setShowConnect] = useState(false);
  const [platform, setPlatform] = useState("");
  const [accountName, setAccountName] = useState("");

  useEffect(() => { loadChannels(); }, []);

  const loadChannels = async () => {
    try {
      const res = await channelsAPI.list();
      setChannels(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const connectedPlatforms = channels.map((c) => c.platform);
  const availablePlatforms = allPlatforms.filter((p) => !connectedPlatforms.includes(p));

  const handleConnect = async () => {
    if (!platform) return toast.error("Select a platform");
    try {
      await channelsAPI.connect({ platform, account_name: accountName });
      toast.success(`${platformInfo[platform]?.name || platform} connected!`);
      setShowConnect(false);
      setPlatform("");
      setAccountName("");
      loadChannels();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Connection failed");
    }
  };

  const handleDisconnect = async (id, name) => {
    try {
      await channelsAPI.disconnect(id);
      toast.success(`${name} disconnected`);
      loadChannels();
    } catch (err) { toast.error("Disconnect failed"); }
  };

  return (
    <div data-testid="channels-page" className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>Channels</h1>
          <p className="text-muted-foreground mt-1">Connect and manage your marketing channels</p>
        </div>
        {availablePlatforms.length > 0 && (
          <Dialog open={showConnect} onOpenChange={setShowConnect}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(59,130,246,0.4)]" data-testid="connect-channel-btn">
                <Plus className="w-4 h-4 mr-2" /> Connect Channel
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/40 max-w-sm">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'Outfit' }}>Connect Channel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="bg-input/50 border-transparent h-11" data-testid="channel-platform-select">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlatforms.map((p) => (
                        <SelectItem key={p} value={p}>{platformInfo[p]?.name || p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Account Name (optional)</Label>
                  <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="@youraccount" className="bg-input/50 border-transparent focus:border-primary h-11" />
                </div>
                <Button onClick={handleConnect} className="w-full bg-primary text-white hover:bg-primary/90" data-testid="submit-connect-btn">
                  <Link2 className="w-4 h-4 mr-2" /> Connect
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Connected */}
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Outfit' }}>Connected ({channels.length})</h2>
            {channels.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Radio className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No channels connected. Connect your first channel to start tracking.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {channels.map((ch, i) => {
                  const info = platformInfo[ch.platform] || { name: ch.platform, color: "bg-zinc-500/10 text-zinc-400" };
                  return (
                    <motion.div key={ch.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="bg-card/50 border-white/5 card-hover">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <Badge className={`${info.color} text-xs capitalize`}>{info.name}</Badge>
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          </div>
                          <p className="text-sm font-medium mb-1">{ch.account_name}</p>
                          <p className="text-xs text-muted-foreground mb-4">
                            Connected {new Date(ch.created_at).toLocaleDateString()}
                          </p>
                          <Button
                            variant="outline" size="sm"
                            onClick={() => handleDisconnect(ch.id, info.name)}
                            className="text-xs text-destructive border-destructive/20 hover:bg-destructive/10"
                          >
                            <Unlink className="w-3 h-3 mr-1" /> Disconnect
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available */}
          {availablePlatforms.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Outfit' }}>Available Channels</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availablePlatforms.map((p) => {
                  const info = platformInfo[p];
                  return (
                    <Card key={p} className="bg-card/30 border-white/3 border-dashed">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div>
                          <Badge className={`${info.color} text-xs capitalize`}>{info.name}</Badge>
                          <p className="text-xs text-muted-foreground mt-2">Not connected</p>
                        </div>
                        <Button
                          variant="outline" size="sm"
                          onClick={() => { setPlatform(p); setShowConnect(true); }}
                          className="text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Connect
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
