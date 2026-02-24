import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error("Please fill in all fields");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Account created! Welcome to MarketAI");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
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
            Start making smarter
            <br />marketing decisions
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
            Join thousands of businesses using AI to understand their marketing performance and take action.
          </p>
          <div className="mt-8 space-y-3">
            {["AI-powered content generation", "Unified analytics dashboard", "Actionable daily insights"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {item}
              </div>
            ))}
          </div>
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

          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Outfit' }}>Create your account</h1>
          <p className="text-muted-foreground mb-8">Start your free marketing AI journey</p>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="signup-form">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name" placeholder="John Doe" value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="signup-name-input"
                className="bg-input/50 border-transparent focus:border-primary h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email" type="email" placeholder="you@company.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="signup-email-input"
                className="bg-input/50 border-transparent focus:border-primary h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password" type="password" placeholder="Min. 6 characters" value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="signup-password-input"
                className="bg-input/50 border-transparent focus:border-primary h-11"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary text-white hover:bg-primary/90 h-11 shadow-[0_0_15px_rgba(59,130,246,0.4)]" data-testid="signup-submit-btn">
              {loading ? "Creating account..." : "Create Account"} {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline" data-testid="signup-login-link">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
