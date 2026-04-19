import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { MediaPlayerProvider } from '@/lib/MediaPlayerContext';
import GlobalMediaPlayer from '@/components/media/GlobalMediaPlayer';
import MusicWelcomePrompt from '@/components/media/MusicWelcomePrompt';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
// Add page imports here
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Listings from "./pages/Listings";
import ATIPassport from "./pages/ATIPassport";
import DealRadar from "./pages/DealRadar";
import MyAccount from "./pages/MyAccount";
import Leads from "./pages/Leads";
import MyBranding from "./pages/MyBranding";
import VerifiedUsers from "./pages/VerifiedUsers";
import Pricing from "./pages/Pricing";
import VerificationCenter from "./pages/VerificationCenter";
import OpexCalculator from "./pages/OpexCalculator";
import ServiceFinder from "./pages/ServiceFinder";
import Escrow from "./pages/Escrow";
import LiveTraffic from "./pages/LiveTraffic";
import Rewards from "./pages/Rewards";
import Alerts from "./pages/Alerts";
import RockRadio from "./pages/RockRadio";
import Analytics from "./pages/Analytics";
import CardRegistry from "./pages/CardRegistry";
import PublicCard from "./pages/PublicCard";
import ReferralCapture from "./components/ReferralCapture";
import CountdownOffer from "./components/marketing/CountdownOffer";
import { useBranding } from "@/lib/useBranding";

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  useBranding(); // Apply premium personalization if enabled

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/ati-passport/:listingId" element={<ATIPassport />} />
        <Route path="/ati-passport" element={<Navigate to="/listings" replace />} />
        <Route path="/deal-radar" element={<DealRadar />} />
        <Route path="/my-account" element={<MyAccount />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/my-branding" element={<MyBranding />} />
        <Route path="/verified-users" element={<VerifiedUsers />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/verification-center" element={<VerificationCenter />} />
        <Route path="/opex-calculator" element={<OpexCalculator />} />
        <Route path="/service-finder" element={<ServiceFinder />} />
        <Route path="/escrow" element={<Escrow />} />
        <Route path="/live-traffic" element={<LiveTraffic />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/radio" element={<RockRadio />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/cards" element={<CardRegistry />} />
      </Route>
      {/* Public shareable card — no layout, outside main app shell */}
      <Route path="/c/:code" element={<PublicCard />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <MediaPlayerProvider>
          <Router>
            <AuthenticatedApp />
            <ReferralCapture />
            <CountdownOffer />
            <GlobalMediaPlayer />
            <MusicWelcomePrompt />
          </Router>
          <Toaster />
        </MediaPlayerProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App