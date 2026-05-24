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
import TrafficMap from "./pages/TrafficMap";
import Analytics from "./pages/Analytics";
import OpexCalculator from "./pages/OpexCalculator";
import Valuation from "./pages/Valuation";
import Pricing from "./pages/Pricing";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ATICard from "./pages/ATICard";
import MaxChat from "./pages/MaxChat";
import PreBuyInspection from "./pages/PreBuyInspection";
import AdminDataCleanup from "./pages/AdminDataCleanup";
import IntraZone from "./pages/IntraZone";
import Community from "./pages/Community";
import MarketReports from "./pages/MarketReports";
import Marketplace from "./pages/Marketplace";
import Developers from "./pages/Developers";
import AdminMarketplace from "./pages/AdminMarketplace";
import AdminSettings from "./pages/AdminSettings";
import DeveloperEarnings from "./pages/DeveloperEarnings";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import GDPRConsentBanner from "./components/GDPRConsentBanner";
import CookiePolicy from "./pages/CookiePolicy";
import GDPRCompliance from "./pages/GDPRCompliance";
import AffiliateAgreement from "./pages/AffiliateAgreement";
import EscrowAgreement from "./pages/EscrowAgreement";
import PrivacyPolicyComplete from "./pages/PrivacyPolicyComplete";

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
        <Route path="/traffic" element={<TrafficMap />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/opex-calculator" element={<OpexCalculator />} />
        <Route path="/valuation" element={<Valuation />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyComplete />} />
        <Route path="/privacy" element={<PrivacyPolicyComplete />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/gdpr-compliance" element={<GDPRCompliance />} />
        <Route path="/affiliate-agreement" element={<AffiliateAgreement />} />
        <Route path="/escrow-agreement" element={<EscrowAgreement />} />
        <Route path="/max-chat" element={<MaxChat />} />
        <Route path="/pre-buy-inspection" element={<PreBuyInspection />} />
        <Route path="/admin/data-cleanup" element={<AdminDataCleanup />} />
        <Route path="/intrazone" element={<IntraZone />} />
        <Route path="/community" element={<Community />} />
        <Route path="/market-reports" element={<MarketReports />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/developers" element={<Developers />} />
        <Route path="/admin/marketplace" element={<AdminMarketplace />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/developer-earnings" element={<DeveloperEarnings />} />
        <Route path="/subscription" element={<SubscriptionManagement />} />
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
          <GDPRConsentBanner />
          <Toaster />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;