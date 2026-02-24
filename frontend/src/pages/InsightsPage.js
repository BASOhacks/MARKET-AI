import { useState, useEffect } from "react";
import { insightsAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, Lightbulb, Zap, Trophy, RefreshCw, Send, Loader2, MessageSquare, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const insightConfig = {
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  opportunity: { icon: Lightbulb, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  tip: { icon: Zap, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  win: { icon: Trophy, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
};

export default function InsightsPage() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);

  useEffect(() => { loadInsights(); }, []);

  const loadInsights = async () => {
    try {
      const res = await insightsAPI.list();
      setInsights(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await insightsAPI.generate();
      toast.success("New insights generated!");
      loadInsights();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Generation failed");
    } finally { setGenerating(false); }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAsking(true);
    setAnswer("");
    try {
      const res = await insightsAPI.ask(question);
      setAnswer(res.data.answer);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to get answer");
    } finally { setAsking(false); }
  };

  return (
    <div data-testid="insights-page" className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>AI Insights</h1>
          <p className="text-muted-foreground mt-1">AI-powered analysis of your marketing performance</p>
        </div>
        <Button onClick={handleGenerate} disabled={generating} className="bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(59,130,246,0.4)]" data-testid="generate-insights-btn">
          {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {generating ? "Analyzing..." : "Generate Insights"}
        </Button>
      </div>

      {/* Ask AI */}
      <Card className="bg-card/50 border-white/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
            <MessageSquare className="w-4 h-4 text-primary" /> Ask AI Strategy Advisor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Textarea
              placeholder="Ask about your marketing strategy... e.g. 'Which channel should I invest more in?'"
              value={question} onChange={(e) => setQuestion(e.target.value)}
              className="bg-input/50 border-transparent focus:border-primary flex-1 min-h-[50px] max-h-[100px]"
              data-testid="insights-ask-input"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
            />
            <Button onClick={handleAsk} disabled={asking} className="bg-primary text-white hover:bg-primary/90 self-end" data-testid="insights-ask-btn">
              {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          {answer && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">AI Response</span>
              </div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed" data-testid="insights-ai-answer">
                {answer}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Insights Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : insights.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No insights yet. Click "Generate Insights" to analyze your data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, i) => {
            const config = insightConfig[insight.type] || insightConfig.tip;
            const Icon = config.icon;
            return (
              <motion.div key={insight.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={`bg-card/50 border-white/5 card-hover`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4.5 h-4.5 ${config.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${config.bg} ${config.color} ${config.border} text-xs capitalize`}>{insight.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(insight.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold mb-1">{insight.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                      </div>
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
