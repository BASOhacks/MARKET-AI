import { useState, useEffect } from "react";
import { scheduleAPI, contentAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, Plus, Trash2, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const statusColors = {
  pending: "bg-amber-500/10 text-amber-400",
  processing: "bg-blue-500/10 text-blue-400",
  published: "bg-emerald-500/10 text-emerald-400",
  failed: "bg-red-500/10 text-red-400",
};

const channelOptions = [
  "instagram", "linkedin", "twitter", "facebook", "google_ads", "meta_ads", "email", "blog", "sms"
];

export default function CalendarPage() {
  const [schedules, setSchedules] = useState([]);
  const [contents, setContents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [form, setForm] = useState({ content_id: "", channel: "instagram", time: "09:00" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [schedRes, contRes] = await Promise.all([scheduleAPI.list(), contentAPI.list()]);
      setSchedules(schedRes.data);
      setContents(contRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSchedule = async () => {
    if (!form.content_id) return toast.error("Select content to schedule");
    const scheduled_at = `${format(selectedDate, 'yyyy-MM-dd')}T${form.time}:00`;
    try {
      await scheduleAPI.create({ content_id: form.content_id, channel: form.channel, scheduled_at });
      toast.success("Post scheduled!");
      setShowSchedule(false);
      setForm({ content_id: "", channel: "instagram", time: "09:00" });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Scheduling failed");
    }
  };

  const handleCancel = async (id) => {
    try {
      await scheduleAPI.cancel(id);
      toast.success("Schedule cancelled");
      loadData();
    } catch (err) { toast.error("Cancel failed"); }
  };

  const schedulesForDate = schedules.filter(
    (s) => s.scheduled_at?.startsWith(format(selectedDate, 'yyyy-MM-dd'))
  );

  const scheduleDates = schedules.map((s) => new Date(s.scheduled_at));

  return (
    <div data-testid="calendar-page" className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>Content Calendar</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage your content across channels</p>
        </div>
        <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(59,130,246,0.4)]" data-testid="schedule-post-btn">
              <Plus className="w-4 h-4 mr-2" /> Schedule Post
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border/40 max-w-md">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Outfit' }}>Schedule Content</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Content *</Label>
                <Select value={form.content_id} onValueChange={(v) => setForm({ ...form, content_id: v })}>
                  <SelectTrigger className="bg-input/50 border-transparent h-11" data-testid="schedule-content-select">
                    <SelectValue placeholder="Select content" />
                  </SelectTrigger>
                  <SelectContent>
                    {contents.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                  <SelectTrigger className="bg-input/50 border-transparent h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {channelOptions.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date: {format(selectedDate, 'MMM dd, yyyy')}</Label>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="bg-input/50 border-transparent focus:border-primary h-11" />
              </div>
              <Button onClick={handleSchedule} className="w-full bg-primary text-white hover:bg-primary/90" data-testid="submit-schedule-btn">
                Schedule Post
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="bg-card/50 border-white/5 lg:col-span-1">
          <CardContent className="p-4 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              modifiers={{ scheduled: scheduleDates }}
              modifiersStyles={{ scheduled: { fontWeight: 'bold', color: 'hsl(217 91% 60%)' } }}
              className="rounded-lg"
              data-testid="schedule-calendar"
            />
          </CardContent>
        </Card>

        {/* Schedule for selected date */}
        <Card className="bg-card/50 border-white/5 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base" style={{ fontFamily: 'Outfit' }}>
              {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : schedulesForDate.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarDays className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No posts scheduled for this date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {schedulesForDate.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{s.content_title || "Content"}</span>
                          <Badge variant="outline" className="text-xs capitalize">{s.channel.replace('_', ' ')}</Badge>
                          <Badge className={`${statusColors[s.status]} text-xs capitalize`}>{s.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(s.scheduled_at), 'h:mm a')}
                          {s.content_body && ` — ${s.content_body}`}
                        </p>
                      </div>
                    </div>
                    {s.status === "pending" && (
                      <Button variant="ghost" size="icon" onClick={() => handleCancel(s.id)} className="text-destructive h-8 w-8">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Upcoming */}
      <Card className="bg-card/50 border-white/5">
        <CardHeader>
          <CardTitle className="text-base" style={{ fontFamily: 'Outfit' }}>All Scheduled Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No scheduled posts</p>
          ) : (
            <div className="space-y-2">
              {schedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/20">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">{s.content_title || "Content"}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs capitalize">{s.channel.replace('_', ' ')}</Badge>
                        <span className="text-xs text-muted-foreground">{format(new Date(s.scheduled_at), 'MMM dd, h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${statusColors[s.status]} text-xs capitalize`}>{s.status}</Badge>
                    {s.status === "pending" && (
                      <Button variant="ghost" size="icon" onClick={() => handleCancel(s.id)} className="text-destructive h-7 w-7">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
