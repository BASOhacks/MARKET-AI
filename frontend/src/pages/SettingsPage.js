import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { workspaceAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Users, Shield, User } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await workspaceAPI.get();
        setWorkspace(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const roleColors = {
    owner: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    member: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    viewer: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };

  return (
    <div data-testid="settings-page" className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and workspace</p>
      </div>

      {/* Profile */}
      <Card className="bg-card/50 border-white/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
            <User className="w-4 h-4 text-primary" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-semibold text-lg">{user?.name || "User"}</p>
              <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
              <Badge className="mt-1 capitalize">{user?.plan || "free"} plan</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workspace */}
      <Card className="bg-card/50 border-white/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
            <Settings className="w-4 h-4 text-primary" /> Workspace
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : workspace ? (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs">Workspace Name</Label>
                <p className="text-sm font-medium mt-1">{workspace.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Created</Label>
                <p className="text-sm font-medium mt-1">{new Date(workspace.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No workspace found</p>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card className="bg-card/50 border-white/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
            <Users className="w-4 h-4 text-primary" /> Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workspace?.members?.length > 0 ? (
            <div className="space-y-3">
              {workspace.members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                      {m.user_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.user_name}</p>
                      <p className="text-xs text-muted-foreground">{m.user_email}</p>
                    </div>
                  </div>
                  <Badge className={`${roleColors[m.role] || roleColors.viewer} text-xs capitalize`}>{m.role}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No team members</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
