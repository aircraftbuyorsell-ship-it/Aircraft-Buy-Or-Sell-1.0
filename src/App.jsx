import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
// Add page imports here
import Layout from "./components/Layout";
import IntraZoneLayout from "./components/intrazone/IntraZoneLayout";
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

import CookiePolicy from "./pages/CookiePolicy";
import GDPRCompliance from "./pages/GDPRCompliance";
import AffiliateAgreement from "./pages/AffiliateAgreement";
import EscrowAgreement from "./pages/EscrowAgreement";
import PrivacyPolicyComplete from "./pages/PrivacyPolicyComplete";
import Compare from "./pages/Compare";
import AdminListings from "./pages/AdminListings";
import FeatureRequests from "./pages/FeatureRequests";
import ATIQuickScore from "./pages/ATIQuickScore";
import ATIFullReport from "./pages/ATIFullReport";
import SkyBoss from "./pages/SkyBoss";
import WeeklyBriefing from "./pages/WeeklyBriefing";
import ATIStandard from "./pages/ATIStandard";
import SoarStartupHub from "./pages/SoarStartupHub";
import AviationStartupHub from "./pages/AviationStartupHub";
import ATIVerify from "./pages/ATIVerify";
import ATIVerifySession from "./pages/ATIVerifySession";
import SupabaseSync from "./pages/SupabaseSync";
import FAAMap from "./pages/FAAMap";
import IntraZoneDemo from "./pages/IntraZoneDemo";
import GDPRConsentBanner from "./components/GDPRConsentBanner";
import DSAPolicy from "./pages/DSAPolicy";
import AITransparency from "./pages/AITransparency";
import FunnelDashboard from "./pages/FunnelDashboard";
import FunnelCanvas from "./pages/FunnelCanvas";
import SearchConsoleDashboard from "./pages/SearchConsoleDashboard";
import DealIntelligence from "./pages/DealIntelligence";
import ATICenter from "./pages/ATICenter";
import StartupHub from "./pages/StartupHub";
import GrowthCenter from "./pages/GrowthCenter";
import LeasingCalculator from "./pages/LeasingCalculator";
import InsuranceCalculator from "./pages/InsuranceCalculator";
import AvionicsUpgradeCalculator from "./pages/AvionicsUpgradeCalculator";
import ExteriorRefurbishmentCalculator from "./pages/ExteriorRefurbishmentCalculator";
import InteriorRefurbishmentCalculator from "./pages/InteriorRefurbishmentCalculator";
import UpgradeComparison from "./pages/UpgradeComparison";
import AircraftDetailingCalculator from "./pages/AircraftDetailingCalculator";
import CrossBorderBridge from "./pages/CrossBorderBridge";
import ServiceIntelligence from "./pages/ServiceIntelligence";
import ExpertDashboard from "./pages/ExpertDashboard";
import NLookup from "./pages/NLookup";
import DigitalTwin from "./pages/DigitalTwin";
import IntegrationKit from "./pages/IntegrationKit";
import Experts from "./pages/Experts";
import SalesPipeline from "./pages/SalesPipeline";
import Workflows from "./pages/Workflows";
import Skills from "./pages/Skills";
import IPNotice from "./pages/IPNotice";
import SolutionsBuyers from "./pages/solutions/SolutionsBuyers";
import SolutionsSellers from "./pages/solutions/SolutionsSellers";
import SolutionsBrokers from "./pages/solutions/SolutionsBrokers";
import SolutionsLenders from "./pages/solutions/SolutionsLenders";
import CoreAPI from "./pages/CoreAPI";
import OAuthAuthorize from "./pages/OAuthAuthorize";
import OAuthConsent from "./pages/OAuthConsent";
import InvestmentBrief from "./pages/InvestmentBrief";
import FinanceAdvisorChat from "./pages/FinanceAdvisorChat";
import FractionalCalculators from "./pages/FractionalCalculators";
import RegistryComparator from "./pages/RegistryComparator";
import CalculatorsHub from "./pages/CalculatorsHub";
import AbosWallet from "./pages/AbosWallet";
import BillOfSaleAutofill from "./pages/BillOfSaleAutofill";
import AircraftAlerts from "./pages/AircraftAlerts";
import Plans from "./pages/Plans";

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
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyComplete />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/gdpr-compliance" element={<GDPRCompliance />} />
        <Route path="/affiliate-agreement" element={<AffiliateAgreement />} />
        <Route path="/escrow-agreement" element={<EscrowAgreement />} />
        <Route path="/max-chat" element={<MaxChat />} />
        <Route path="/pre-buy-inspection" element={<PreBuyInspection />} />
        <Route path="/admin/data-cleanup" element={<AdminDataCleanup />} />
        <Route path="/community" element={<Community />} />
        <Route path="/market-reports" element={<MarketReports />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/developers" element={<Developers />} />
        <Route path="/admin/marketplace" element={<AdminMarketplace />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/developer-earnings" element={<DeveloperEarnings />} />
        <Route path="/subscription" element={<SubscriptionManagement />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/admin/listings" element={<AdminListings />} />
        <Route path="/feature-requests" element={<FeatureRequests />} />
        <Route path="/ati-quick-score" element={<ATIQuickScore />} />
        <Route path="/ati-full-report" element={<ATIFullReport />} />
        <Route path="/skyboss" element={<SkyBoss />} />
        <Route path="/weekly-briefing" element={<WeeklyBriefing />} />
        <Route path="/ati-standard" element={<ATIStandard />} />
        <Route path="/soar" element={<SoarStartupHub />} />
        <Route path="/startup-hub" element={<AviationStartupHub />} />
        <Route path="/ati-verify" element={<ATIVerify />} />
        <Route path="/ati-verify/:sessionId" element={<ATIVerifySession />} />
        <Route path="/admin/supabase-sync" element={<SupabaseSync />} />
        <Route path="/faa-map" element={<FAAMap />} />
        <Route path="/demo" element={<IntraZoneDemo />} />
        <Route path="/legal/dsa" element={<DSAPolicy />} />
        <Route path="/legal/ai-transparency" element={<AITransparency />} />
        <Route path="/legal/ip-notice" element={<IPNotice />} />
        <Route path="/funnels" element={<FunnelDashboard />} />
        <Route path="/search-console" element={<SearchConsoleDashboard />} />
        <Route path="/deal-intelligence" element={<DealIntelligence />} />
        <Route path="/ati-center" element={<ATICenter />} />
        <Route path="/startup-center" element={<StartupHub />} />
        <Route path="/growth-center" element={<GrowthCenter />} />
        <Route path="/leasing-calculator" element={<LeasingCalculator />} />
        <Route path="/insurance-calculator" element={<InsuranceCalculator />} />
        <Route path="/avionics-upgrade-calculator" element={<AvionicsUpgradeCalculator />} />
        <Route path="/exterior-refurbishment-calculator" element={<ExteriorRefurbishmentCalculator />} />
        <Route path="/interior-refurbishment-calculator" element={<InteriorRefurbishmentCalculator />} />
        <Route path="/upgrade-comparison" element={<UpgradeComparison />} />
        <Route path="/aircraft-detailing-calculator" element={<AircraftDetailingCalculator />} />
        <Route path="/cross-border-bridge" element={<CrossBorderBridge />} />
        <Route path="/service-intelligence" element={<ServiceIntelligence />} />
        <Route path="/expert-dashboard" element={<ExpertDashboard />} />
        <Route path="/n-lookup" element={<NLookup />} />
        <Route path="/twin/:registration" element={<DigitalTwin />} />
        <Route path="/integration-kit" element={<IntegrationKit />} />
        <Route path="/experts" element={<Experts />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/sales-pipeline" element={<SalesPipeline />} />
        <Route path="/sales-pipeline/:registration" element={<SalesPipeline />} />
        <Route path="/workflows" element={<Workflows />} />
        <Route path="/solutions/buyers" element={<SolutionsBuyers />} />
        <Route path="/solutions/sellers" element={<SolutionsSellers />} />
        <Route path="/solutions/brokers" element={<SolutionsBrokers />} />
        <Route path="/solutions/lenders" element={<SolutionsLenders />} />
        <Route path="/developers/core-api" element={<CoreAPI />} />
        <Route path="/oauth-authorize" element={<OAuthAuthorize />} />
        <Route path="/investment-brief" element={<InvestmentBrief />} />
        <Route path="/finance-advisor" element={<FinanceAdvisorChat />} />
        <Route path="/fractional-calculators" element={<FractionalCalculators />} />
        <Route path="/registry-comparator" element={<RegistryComparator />} />
        <Route path="/calculators" element={<CalculatorsHub />} />
        <Route path="/wallet" element={<AbosWallet />} />
        <Route path="/bill-of-sale" element={<BillOfSaleAutofill />} />
        <Route path="/aircraft-alerts" element={<AircraftAlerts />} />
        <Route path="/plans" element={<Plans />} />
      </Route>
      <Route element={<IntraZoneLayout />}>
        <Route path="/intrazone" element={<IntraZone />} />
      </Route>
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      <Route path="/oauth/callback" element={<OAuthConsent />} />
      <Route path="/funnels/:id/canvas" element={<FunnelCanvas />} />
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