import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
// Add page imports here
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Listings from "./pages/Listings";
import ATIPassport from "./pages/ATIPassport";
import DealRadar from "./pages/DealRadar";
import MyAccount from "./pages/MyAccount";
import Leads from "./pages/Leads";
import Escrow from "./pages/Escrow";
import LiveTraffic from "./pages/LiveTraffic";
import Analytics from "./pages/Analytics";
import OpexCalculator from "./pages/OpexCalculator";
import Pricing from "./pages/Pricing";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ATICard from "./pages/ATICard";
import MaxChat from "./pages/MaxChat";
import PreBuyInspection from "./pages/PreBuyInspection";

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F7F4EF]">
        <div className="w-8 h-8 border-4 border-[#E8A83A]/30 border-t-[#E8A83A] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/ati-passport/:listingId" element={<ATIPassport />} />
        <Route path="/ati-passport" element={<Navigate to="/listings" replace />} />
        <Route path="/ati-card/:cardCode" element={<ATICard />} />
        <Route path="/deal-radar" element={<DealRadar />} />
        <Route path="/my-account" element={<MyAccount />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/escrow" element={<Escrow />} />
        <Route path="/live-traffic" element={<LiveTraffic />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/opex-calculator" element={<OpexCalculator />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/max-chat" element={<MaxChat />} />
        <Route path="/pre-buy-inspection" element={<PreBuyInspection />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
          <Toaster />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;