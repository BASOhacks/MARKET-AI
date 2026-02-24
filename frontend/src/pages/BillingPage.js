import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { paymentsAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CreditCard, CheckCircle, Loader2, Phone, Smartphone, DollarSign, Clock, Zap, Crown, Building2
} from "lucide-react";
import { toast } from "sonner";

const plans = [
  {
    id: "free", name: "Free", price: 0, period: "/month",
    features: ["3 AI generations/day", "2 channels", "Basic analytics", "1 workspace"],
    icon: Zap, color: "text-zinc-400"
  },
  {
    id: "pro", name: "Pro", price: 29, period: "/month",
    features: ["Unlimited AI generations", "All channels", "Advanced analytics", "AI Insights", "Priority support"],
    icon: Crown, color: "text-primary", highlighted: true
  },
  {
    id: "agency", name: "Agency", price: 99, period: "/month",
    features: ["Everything in Pro", "Unlimited workspaces", "Team collaboration", "Client reporting", "White-label options"],
    icon: Building2, color: "text-purple-400"
  },
];

export default function BillingPage() {
  const { user, loadUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pollingStatus, setPollingStatus] = useState(null);
  const [showMobile, setShowMobile] = useState(false);
  const [mobilePlan, setMobilePlan] = useState("");
  const [mobileProvider, setMobileProvider] = useState("mtn_momo");
  const [mobilePhone, setMobilePhone] = useState("");
  const [mobileLoading, setMobileLoading] = useState(false);

  useEffect(() => {
    loadHistory();
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
  }, [searchParams]);

  const loadHistory = async () => {
    try {
      const res = await paymentsAPI.history();
      setHistory(res.data);
    } catch (err) { console.error(err); }
  };

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    if (attempts >= 5) {
      setPollingStatus("timeout");
      return;
    }
    setPollingStatus("checking");
    try {
      const res = await paymentsAPI.status(sessionId);
      if (res.data.payment_status === "paid") {
        setPollingStatus("success");
        toast.success("Payment successful! Your plan has been upgraded.");
        loadUser();
        loadHistory();
        return;
      } else if (res.data.status === "expired") {
        setPollingStatus("expired");
        return;
      }
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
    } catch (err) {
      setPollingStatus("error");
    }
  };

  const handleStripeCheckout = async (planId) => {
    if (planId === "free") return;
    setLoading(true);
    try {
      const res = await paymentsAPI.checkout({
        plan_id: planId,
        origin_url: window.location.origin,
      });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Checkout failed");
    } finally { setLoading(false); }
  };

  const handleMobilePayment = async () => {
    if (!mobilePhone) return toast.error("Please enter a phone number");
    setMobileLoading(true);
    try {
      const res = await paymentsAPI.mobile({
        plan_id: mobilePlan,
        phone_number: mobilePhone,
        provider: mobileProvider,
      });
      toast.success(res.data.message);
      setShowMobile(false);
      loadHistory();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Payment failed");
    } finally { setMobileLoading(false); }
  };

  return (
    <div data-testid="billing-page" className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and payment methods</p>
      </div>

      {/* Payment Status Banner */}
      {pollingStatus === "checking" && (
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-sm">Verifying your payment...</span>
          </CardContent>
        </Card>
      )}
      {pollingStatus === "success" && (
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-sm">Payment successful! Your plan has been upgraded.</span>
          </CardContent>
        </Card>
      )}

      {/* Current Plan */}
      <Card className="bg-card/50 border-white/5">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="text-xl font-bold capitalize mt-1">{user?.plan || "free"}</p>
          </div>
          <Badge className="capitalize text-sm px-4 py-1">{user?.plan || "free"}</Badge>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Outfit' }}>Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = user?.plan === plan.id;
            return (
              <Card
                key={plan.id}
                className={`bg-card/50 card-hover ${
                  plan.highlighted ? 'border-primary/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-white/5'
                }`}
              >
                <CardContent className="p-6">
                  <Icon className={`w-8 h-8 ${plan.color} mb-4`} />
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1 mb-4">
                    <span className="text-3xl font-bold mono">${plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button disabled className="w-full" variant="outline">Current Plan</Button>
                  ) : plan.id === "free" ? (
                    <Button disabled className="w-full" variant="outline">Free Forever</Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleStripeCheckout(plan.id)}
                        disabled={loading}
                        className={`w-full ${plan.highlighted ? 'bg-primary text-white hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/80'}`}
                        data-testid={`checkout-${plan.id}-btn`}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {loading ? "Processing..." : "Pay with Card"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { setMobilePlan(plan.id); setShowMobile(true); }}
                        className="w-full text-xs"
                        data-testid={`mobile-pay-${plan.id}-btn`}
                      >
                        <Smartphone className="w-4 h-4 mr-2" /> Mobile Money
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Mobile Money Dialog */}
      <Dialog open={showMobile} onOpenChange={setShowMobile}>
        <DialogContent className="bg-card border-border/40 max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit' }}>Mobile Money Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={mobileProvider} onValueChange={setMobileProvider}>
                <SelectTrigger className="bg-input/50 border-transparent h-11" data-testid="mobile-provider-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mtn_momo">MTN Mobile Money</SelectItem>
                  <SelectItem value="airtel_money">Airtel Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)}
                placeholder="+256 700 000 000"
                data-testid="mobile-phone-input"
                className="bg-input/50 border-transparent focus:border-primary h-11"
              />
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 text-sm">
              <p className="text-muted-foreground">Plan: <span className="text-foreground font-medium capitalize">{mobilePlan}</span></p>
              <p className="text-muted-foreground">Amount: <span className="text-foreground font-medium">${plans.find(p => p.id === mobilePlan)?.price || 0}</span></p>
            </div>
            <Button onClick={handleMobilePayment} disabled={mobileLoading} className="w-full bg-primary text-white hover:bg-primary/90" data-testid="submit-mobile-payment-btn">
              {mobileLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Phone className="w-4 h-4 mr-2" />}
              {mobileLoading ? "Processing..." : "Send Payment Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment History */}
      <Card className="bg-card/50 border-white/5">
        <CardHeader>
          <CardTitle className="text-base" style={{ fontFamily: 'Outfit' }}>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No payment history</p>
          ) : (
            <div className="space-y-2">
              {history.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/20">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium capitalize">{tx.plan} Plan</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(tx.created_at).toLocaleDateString()}
                        {tx.provider && <span className="capitalize"> via {tx.provider.replace('_', ' ')}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium mono">${tx.amount}</span>
                    <Badge className={`text-xs capitalize ${
                      tx.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                      tx.payment_status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {tx.payment_status}
                    </Badge>
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
