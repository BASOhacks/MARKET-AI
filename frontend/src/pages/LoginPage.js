import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill in all fields");
    if (!/\S+@\S+\.\S+/.test(email)) return toast.error("Please enter a valid email");
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-border/40">
        <div className="absolute inset-0 bg-card/50" />
        <div className="hero-glow top-1/3 left-1/3" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>MarketAI</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-4 leading-tight" style={{ fontFamily: 'Outfit' }}>
            Your AI Marketing
            <br />Command Center
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
            Connect channels, generate content, and get AI-powered insights that tell you exactly what to do next.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>MarketAI</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Outfit' }}>Welcome back</h1>
          <p className="text-muted-foreground mb-8">Log in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email" type="email" placeholder="you@company.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email-input"
                className="bg-input/50 border-transparent focus:border-primary h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password" type="password" placeholder="Enter your password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="login-password-input"
                className="bg-input/50 border-transparent focus:border-primary h-11"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary text-white hover:bg-primary/90 h-11 shadow-[0_0_15px_rgba(59,130,246,0.4)]" data-testid="login-submit-btn">
              {loading ? "Logging in..." : "Log in"} {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline" data-testid="login-signup-link">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}