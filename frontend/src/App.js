import { useAuth } from "@/contexts/AuthContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import "@/App.css";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import DashboardPage from "@/pages/DashboardPage";
import ContentGeneratorPage from "@/pages/ContentGeneratorPage";
import CampaignsPage from "@/pages/CampaignsPage";
import CalendarPage from "@/pages/CalendarPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import InsightsPage from "@/pages/InsightsPage";
import ChannelsPage from "@/pages/ChannelsPage";
import SettingsPage from "@/pages/SettingsPage";
import BillingPage from "@/pages/BillingPage";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignupPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/content" element={<ProtectedRoute><DashboardLayout><ContentGeneratorPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/campaigns" element={<ProtectedRoute><DashboardLayout><CampaignsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><DashboardLayout><CalendarPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><DashboardLayout><AnalyticsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/insights" element={<ProtectedRoute><DashboardLayout><InsightsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/channels" element={<ProtectedRoute><DashboardLayout><ChannelsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><DashboardLayout><SettingsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><DashboardLayout><BillingPage /></DashboardLayout></ProtectedRoute>} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
