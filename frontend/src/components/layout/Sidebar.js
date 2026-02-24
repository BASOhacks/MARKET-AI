import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Sparkles, Target, CalendarDays,
  BarChart3, Lightbulb, Radio, Settings, CreditCard, LogOut, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/content", icon: Sparkles, label: "AI Content" },
  { to: "/campaigns", icon: Target, label: "Campaigns" },
  { to: "/calendar", icon: CalendarDays, label: "Calendar" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/insights", icon: Lightbulb, label: "AI Insights" },
  { to: "/channels", icon: Radio, label: "Channels" },
];

const bottomItems = [
  { to: "/billing", icon: CreditCard, label: "Billing" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside data-testid="sidebar-nav" className="fixed left-0 top-0 h-full w-64 bg-background/95 backdrop-blur-xl border-r border-border/40 z-50 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            MarketAI
          </span>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink key={to} to={to} data-testid={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200
                ${isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span>{label}</span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border/40 py-4 px-3 space-y-1">
        {bottomItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink key={to} to={to} data-testid={`nav-${label.toLowerCase()}`}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200
                ${isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span>{label}</span>
              </div>
            </NavLink>
          );
        })}
        {/* User */}
        <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-lg bg-secondary/30 border border-border/30">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.plan || "free"} plan</p>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive" data-testid="logout-btn">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
};
