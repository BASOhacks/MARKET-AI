import { useState, useEffect } from "react";
import { contentAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Trash2, Loader2, FileText, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const channels = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "X / Twitter" },
  { value: "facebook", label: "Facebook" },
  { value: "google_ads", label: "Google Ads" },
  { value: "meta_ads", label: "Meta Ads" },
  { value: "email", label: "Email" },
  { value: "blog", label: "SEO Blog" },
  { value: "sms", label: "SMS" },
];

const tones = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "witty", label: "Witty" },
  { value: "inspirational", label: "Inspirational" },
  { value: "urgent", label: "Urgent" },
  { value: "friendly", label: "Friendly" },
  { value: "authoritative", label: "Authoritative" },
];

export default function ContentGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [channel, setChannel] = useState("instagram");
  const [tone, setTone] = useState("professional");
  const [productDesc, setProductDesc] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [contentLib, setContentLib] = useState([]);
  const [loadingLib, setLoadingLib] = useState(true);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      const res = await contentAPI.list();
      setContentLib(res.data);
    } catch (err) { console.error(err); }
    finally { setLoadingLib(false); }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return toast.error("Please enter a topic");
    setGenerating(true);
    setGeneratedContent(null);
    try {
      const res = await contentAPI.generate({ topic, channel, tone, product_description: productDesc || undefined });
      setGeneratedContent(res.data);
      toast.success("Content generated!");
      loadLibrary();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleDelete = async (id) => {
    try {
      await contentAPI.delete(id);
      setContentLib((prev) => prev.filter((c) => c.id !== id));
      toast.success("Content deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  return (
    <div data-testid="content-generator-page" className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>AI Content Generator</h1>
        <p className="text-muted-foreground mt-1">Generate platform-native marketing content in seconds</p>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="bg-secondary/50 border border-border/40">
          <TabsTrigger value="generate" data-testid="tab-generate">Generate</TabsTrigger>
          <TabsTrigger value="library" data-testid="tab-library">Library ({contentLib.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <Card className="bg-card/50 border-white/5">
              <CardHeader>
                <CardTitle className="text-base" style={{ fontFamily: 'Outfit' }}>Content Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Topic / Subject *</Label>
                  <Input
                    placeholder="e.g. Summer sale on running shoes"
                    value={topic} onChange={(e) => setTopic(e.target.value)}
                    data-testid="content-topic-input"
                    className="bg-input/50 border-transparent focus:border-primary h-11"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Channel</Label>
                    <Select value={channel} onValueChange={setChannel}>
                      <SelectTrigger className="bg-input/50 border-transparent h-11" data-testid="content-channel-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {channels.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="bg-input/50 border-transparent h-11" data-testid="content-tone-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tones.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Product Description (optional)</Label>
                  <Textarea
                    placeholder="Describe your product or service..."
                    value={productDesc} onChange={(e) => setProductDesc(e.target.value)}
                    data-testid="content-product-input"
                    className="bg-input/50 border-transparent focus:border-primary min-h-[80px]"
                  />
                </div>
                <Button
                  onClick={handleGenerate} disabled={generating}
                  className="w-full bg-primary text-white hover:bg-primary/90 h-11 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                  data-testid="generate-content-btn"
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Generate Content</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Output */}
            <Card className="bg-card/50 border-white/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base" style={{ fontFamily: 'Outfit' }}>Generated Content</CardTitle>
                {generatedContent && (
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(generatedContent.body)} className="text-primary" data-testid="copy-content-btn">
                    <Copy className="w-4 h-4 mr-1" /> Copy
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {generating ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">AI is crafting your content...</p>
                  </div>
                ) : generatedContent ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="capitalize">{generatedContent.channel}</Badge>
                      <Badge variant="outline" className="capitalize">{generatedContent.tone}</Badge>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/30 border border-border/30 max-h-[400px] overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed" data-testid="generated-content-output">
                        {generatedContent.body}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <Sparkles className="w-8 h-8 mb-3 opacity-30" />
                    <p className="text-sm">Your AI-generated content will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="library" className="mt-6">
          {loadingLib ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : contentLib.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No content yet. Generate your first piece!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contentLib.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="bg-card/50 border-white/5 card-hover">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-semibold">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">{item.channel}</Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleCopy(item.body)} className="h-8 w-8">
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3">{item.body}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
