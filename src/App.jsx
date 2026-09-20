import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import React, { lazy, Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AdvisorEntry, CanonicalVerifyRedirect, PathRegistrationRedirect } from '@/routing/VerifyRedirects';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import CompanyRoute from '@/components/auth/CompanyRoute';
// Add page imports here
import Layout from "./components/Layout";
import IntraZoneLayout from "./components/intrazone/IntraZoneLayout";
import Dashboard from "./pages/Dashboard";
import Listings from "./pages/Listings";

// Secondary pages — lazy-loaded for smaller initial bundle
const ATIPassport = lazy(() => import("./pages/ATIPassport"));
const DealRadar = lazy(() => import("./pages/DealRadar"));
const MyAccount = lazy(() => import("./pages/MyAccount"));
const Leads = lazy(() => import("./pages/Leads"));
const Analytics = lazy(() => import("./pages/Analytics"));
const OpexCalculator = lazy(() => import("./pages/OpexCalculator"));
const ValuationStudio = lazy(() => import("./pages/ValuationStudio"));
const OmvmValuationPage = lazy(() => import("./pages/OmvmValuationPage"));
const Pricing = lazy(() => import("./pages/Pricing"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ATICard = lazy(() => import("./pages/ATICard"));
const MaxChat = lazy(() => import("./pages/MaxChat"));
const PreBuyInspection = lazy(() => import("./pages/PreBuyInspection"));
const AdminDataCleanup = lazy(() => import("./pages/AdminDataCleanup"));
const IntraZone = lazy(() => import("./pages/IntraZone"));
const Community = lazy(() => import("./pages/Community"));
const MarketReports = lazy(() => import("./pages/MarketReports"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Developers = lazy(() => import("./pages/Developers"));
const AdminMarketplace = lazy(() => import("./pages/AdminMarketplace"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const DeveloperEarnings = lazy(() => import("./pages/DeveloperEarnings"));
const SubscriptionManagement = lazy(() => import("./pages/SubscriptionManagement"));
const PartnerPortal = lazy(() => import("./pages/PartnerPortal"));
const InstallWizard = lazy(() => import("./pages/InstallWizard"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const GDPRCompliance = lazy(() => import("./pages/GDPRCompliance"));
const AffiliateAgreement = lazy(() => import("./pages/AffiliateAgreement"));
const AffiliateDashboard = lazy(() => import("./pages/AffiliateDashboard"));
const EscrowAgreement = lazy(() => import("./pages/EscrowAgreement"));
const PrivacyPolicyComplete = lazy(() => import("./pages/PrivacyPolicyComplete"));
const Compare = lazy(() => import("./pages/Compare"));
const AdminListings = lazy(() => import("./pages/AdminListings"));
const FeatureRequests = lazy(() => import("./pages/FeatureRequests"));
const ATIQuickScore = lazy(() => import("./pages/ATIQuickScore"));
const ATIFullReport = lazy(() => import("./pages/ATIFullReport"));
const WeeklyBriefing = lazy(() => import("./pages/WeeklyBriefing"));
const ATIStandard = lazy(() => import("./pages/ATIStandard"));
const SoarStartupHub = lazy(() => import("./pages/SoarStartupHub"));
const AviationStartupHub = lazy(() => import("./pages/AviationStartupHub"));
const ATIVerify = lazy(() => import("./pages/ATIVerify"));
const ATIVerifySession = lazy(() => import("./pages/ATIVerifySession"));
const SupabaseSync = lazy(() => import("./pages/SupabaseSync"));
const IntraZoneDemo = lazy(() => import("./pages/IntraZoneDemo"));
import GDPRConsentBanner from "./components/GDPRConsentBanner";
const DSAPolicy = lazy(() => import("./pages/DSAPolicy"));
const AITransparency = lazy(() => import("./pages/AITransparency"));
const FunnelDashboard = lazy(() => import("./pages/FunnelDashboard"));
const FunnelCanvas = lazy(() => import("./pages/FunnelCanvas"));
const SearchConsoleDashboard = lazy(() => import("./pages/SearchConsoleDashboard"));
const DealIntelligence = lazy(() => import("./pages/DealIntelligence"));
const ATICenter = lazy(() => import("./pages/ATICenter"));
const StartupHub = lazy(() => import("./pages/StartupHub"));
const GrowthCenter = lazy(() => import("./pages/GrowthCenter"));
const LeasingCalculator = lazy(() => import("./pages/LeasingCalculator"));
const InsuranceCalculator = lazy(() => import("./pages/InsuranceCalculator"));
const AvionicsUpgradeCalculator = lazy(() => import("./pages/AvionicsUpgradeCalculator"));
const ExteriorRefurbishmentCalculator = lazy(() => import("./pages/ExteriorRefurbishmentCalculator"));
const InteriorRefurbishmentCalculator = lazy(() => import("./pages/InteriorRefurbishmentCalculator"));
const UpgradeComparison = lazy(() => import("./pages/UpgradeComparison"));
const AircraftDetailingCalculator = lazy(() => import("./pages/AircraftDetailingCalculator"));
const CrossBorderBridge = lazy(() => import("./pages/CrossBorderBridge"));
const ServiceIntelligence = lazy(() => import("./pages/ServiceIntelligence"));
const ExpertDashboard = lazy(() => import("./pages/ExpertDashboard"));
const NLookup = lazy(() => import("./pages/NLookup"));
const DigitalTwin = lazy(() => import("./pages/DigitalTwin"));
const IntegrationKit = lazy(() => import("./pages/IntegrationKit"));
const Experts = lazy(() => import("./pages/Experts"));
const SalesPipeline = lazy(() => import("./pages/SalesPipeline"));
const Workflows = lazy(() => import("./pages/Workflows"));
const Skills = lazy(() => import("./pages/Skills"));
const IPNotice = lazy(() => import("./pages/IPNotice"));
const SolutionsBuyers = lazy(() => import("./pages/solutions/SolutionsBuyers"));
const SolutionsSellers = lazy(() => import("./pages/solutions/SolutionsSellers"));
const SolutionsBrokers = lazy(() => import("./pages/solutions/SolutionsBrokers"));
const SolutionsLenders = lazy(() => import("./pages/solutions/SolutionsLenders"));
const CoreAPI = lazy(() => import("./pages/CoreAPI"));
const OAuthAuthorize = lazy(() => import("./pages/OAuthAuthorize"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const InvestmentBrief = lazy(() => import("./pages/InvestmentBrief"));
const FinanceAdvisorChat = lazy(() => import("./pages/FinanceAdvisorChat"));
const StElmoChat = lazy(() => import("./pages/StElmoChat"));
const FractionalCalculators = lazy(() => import("./pages/FractionalCalculators"));
const RegistryComparator = lazy(() => import("./pages/RegistryComparator"));
const CalculatorsHub = lazy(() => import("./pages/CalculatorsHub"));
const AbosWallet = lazy(() => import("./pages/AbosWallet"));
const BillOfSaleAutofill = lazy(() => import("./pages/BillOfSaleAutofill"));
const AircraftAlerts = lazy(() => import("./pages/AircraftAlerts"));
const Plans = lazy(() => import("./pages/Plans"));
const AgentConnect = lazy(() => import("./pages/AgentConnect"));
const ActivitySummary = lazy(() => import("./pages/ActivitySummary"));
const Billing = lazy(() => import("./pages/Billing"));
const MyReports = lazy(() => import("./pages/MyReports"));
const AdminMonetization = lazy(() => import("./pages/AdminMonetization"));
const WalkthroughScript = lazy(() => import("./pages/WalkthroughScript"));
const MarketspaceHub = lazy(() => import("./pages/hubs/MarketspaceHub"));
const IntelligenceHub = lazy(() => import("./pages/hubs/IntelligenceHub"));
const VerifyHub = lazy(() => import("./pages/hubs/VerifyHub"));
const ApiHub = lazy(() => import("./pages/hubs/ApiHub"));
const SkylarkConfigurator = lazy(() => import("./pages/SkylarkConfigurator"));
const AdminMarketing = lazy(() => import("./pages/AdminMarketing"));
const AircraftIntelligenceGlobe = lazy(() => import("./pages/AircraftIntelligenceGlobe"));
const About = lazy(() => import("./pages/About"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Faq = lazy(() => import("./pages/Faq"));
const CompanyAccessRequired = lazy(() => import("./pages/CompanyAccessRequired"));
// ABOS Intelligence Layer — decision products (SCREEN / ASSESS / COMMIT)
const ScreenPage = lazy(() => import("./pages/decision/Screen"));
const AssessPage = lazy(() => import("./pages/decision/Assess"));
const CommitPage = lazy(() => import("./pages/decision/Commit"));
const AircraftIntelligencePage = lazy(() => import("./pages/decision/AircraftIntelligence"));
const DueDiligenceReport = lazy(() => import("./pages/decision/Report"));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#F7F4EF] dark:bg-[#0B0C10]">
    <div className="w-8 h-8 border-4 border-[#E8A83A]/30 border-t-[#E8A83A] rounded-full animate-spin"></div>
  </div>
);

const ALLOWED_SKYLARK_EMAIL_DOMAINS = ["@aircraftbuyorsell.com", "@airvisions.cz"];

function SkylarkAccessDenied({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-[#f7f4ef] text-[#111827] flex items-center justify-center p-6">
      <section className="max-w-xl w-full rounded-3xl bg-white border border-black/10 p-8 md:p-12 text-center shadow-xl">
        <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-[#18201f] text-white flex items-center justify-center font-black">ABOS</div>
        <p className="text-xs uppercase tracking-[.2em] font-bold text-[#8b6a20]">LANDA Aircraft · Skylark MVP</p>
        <h1 className="text-3xl font-black mt-3">Partner demo access</h1>
        <p className="mt-4 text-black/60">
          This MVP demo is available to authenticated Aircraft Buy Or Sell and AirVisions partner accounts.
        </p>
        <p className="mt-3 text-sm text-black/45 break-all">Signed in as {user?.email || "unknown user"}</p>
        <button onClick={onLogout} className="mt-7 rounded-2xl border border-black/10 px-5 py-3 font-bold hover:bg-black/5">
          Sign out
        </button>
      </section>
    </div>
  );
}

const AuthenticatedApp = () => {
  const { user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, logout } = useAuth();
  const pathname = window.location.pathname;

  if (pathname === "/skylark-configurator") {
    if (isLoadingPublicSettings || isLoadingAuth) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#F7F4EF]">
          <div className="w-8 h-8 border-4 border-[#E8A83A]/30 border-t-[#E8A83A] rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!isAuthenticated || !user) {
      navigateToLogin();
      return null;
    }

    const email = String(user.email || "").trim().toLowerCase();
    const isAllowed = ALLOWED_SKYLARK_EMAIL_DOMAINS.some(domain => email.endsWith(domain));

    if (!isAllowed) {
      return <SkylarkAccessDenied user={user} onLogout={() => logout(false)} />;
    }

    return <Suspense fallback={<PageLoader />}><SkylarkConfigurator /></Suspense>;
  }

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
    <Suspense fallback={<PageLoader />}>
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
        <Route path="/traffic" element={<AircraftIntelligenceGlobe />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/opex-calculator" element={<OpexCalculator />} />
        <Route path="/valuation-studio" element={<ValuationStudio />} />
        <Route path="/omvm-valuation" element={<OmvmValuationPage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyComplete />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/gdpr-compliance" element={<GDPRCompliance />} />
        <Route path="/affiliate-agreement" element={<AffiliateAgreement />} />
        <Route path="/affiliate-dashboard" element={<AffiliateDashboard />} />
        <Route path="/escrow-agreement" element={<EscrowAgreement />} />
        <Route path="/max-chat" element={<MaxChat />} />
        <Route path="/pre-buy-inspection" element={<PreBuyInspection />} />
        <Route path="/admin/data-cleanup" element={<CompanyRoute><AdminDataCleanup /></CompanyRoute>} />
        <Route path="/community" element={<Community />} />
        <Route path="/market-reports" element={<MarketReports />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/developers" element={<Developers />} />
        <Route path="/admin/marketplace" element={<CompanyRoute><AdminMarketplace /></CompanyRoute>} />
        <Route path="/admin/settings" element={<CompanyRoute><AdminSettings /></CompanyRoute>} />
        <Route path="/admin/marketing" element={<CompanyRoute><AdminMarketing /></CompanyRoute>} />
        <Route path="/developer-earnings" element={<DeveloperEarnings />} />
        <Route path="/subscription" element={<SubscriptionManagement />} />
        <Route path="/partner-portal" element={<PartnerPortal />} />
        <Route path="/install" element={<InstallWizard />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/admin/listings" element={<CompanyRoute><AdminListings /></CompanyRoute>} />
        <Route path="/feature-requests" element={<FeatureRequests />} />
        <Route path="/ati-quick-score" element={<ATIQuickScore />} />
        <Route path="/ati-full-report" element={<ATIFullReport />} />
        <Route path="/skyboss" element={<Navigate to="/traffic" replace />} />
        <Route path="/weekly-briefing" element={<WeeklyBriefing />} />
        <Route path="/ati-standard" element={<ATIStandard />} />
        <Route path="/soar" element={<SoarStartupHub />} />
        <Route path="/startup-hub" element={<AviationStartupHub />} />
        <Route path="/ati-verify" element={<ATIVerify />} />
        <Route path="/ati-verify/:sessionId" element={<ATIVerifySession />} />
        <Route path="/admin/supabase-sync" element={<CompanyRoute><SupabaseSync /></CompanyRoute>} />
        <Route path="/faa-map" element={<Navigate to="/traffic" replace />} />
        <Route path="/demo" element={<CompanyRoute><IntraZoneDemo /></CompanyRoute>} />
        <Route path="/legal/dsa" element={<DSAPolicy />} />
        <Route path="/legal/ai-transparency" element={<AITransparency />} />
        <Route path="/legal/ip-notice" element={<IPNotice />} />
        <Route path="/funnels" element={<CompanyRoute><FunnelDashboard /></CompanyRoute>} />
        <Route path="/search-console" element={<CompanyRoute><SearchConsoleDashboard /></CompanyRoute>} />
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
        <Route path="/advisor" element={<AdvisorEntry><FinanceAdvisorChat /></AdvisorEntry>} />
        <Route path="/finance-advisor" element={<AdvisorEntry><FinanceAdvisorChat /></AdvisorEntry>} />
        <Route path="/st-elmo" element={<StElmoChat />} />
        <Route path="/fractional-calculators" element={<FractionalCalculators />} />
        <Route path="/registry-comparator" element={<RegistryComparator />} />
        <Route path="/calculators" element={<CalculatorsHub />} />
        <Route path="/wallet" element={<AbosWallet />} />
        <Route path="/bill-of-sale" element={<BillOfSaleAutofill />} />
        <Route path="/aircraft-alerts" element={<AircraftAlerts />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/connect" element={<AgentConnect />} />
        <Route path="/activity" element={<ActivitySummary />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/my-reports" element={<MyReports />} />
        <Route path="/admin/monetization" element={<CompanyRoute><AdminMonetization /></CompanyRoute>} />
        <Route path="/walkthrough-script" element={<CompanyRoute><WalkthroughScript /></CompanyRoute>} />
        <Route path="/marketspace" element={<MarketspaceHub />} />
        <Route path="/intelligence" element={<IntelligenceHub />} />
        {/* Canonical aircraft verification (§6). Screen IS /verify; the tool hub moves aside. */}
        <Route path="/verify" element={<ScreenPage />} />
        <Route path="/verify/tools" element={<VerifyHub />} />
        <Route path="/verify/:registration" element={<PathRegistrationRedirect />} />
        <Route path="/api" element={<ApiHub />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/company-access-required" element={<CompanyAccessRequired />} />
        <Route path="/screen" element={<CanonicalVerifyRedirect />} />
        <Route path="/assess" element={<AssessPage />} />
        <Route path="/commit" element={<CommitPage />} />
        <Route path="/aircraft/:registration" element={<AircraftIntelligencePage />} />
        <Route path="/aircraft" element={<AircraftIntelligencePage />} />
        <Route path="/due-diligence" element={<DueDiligenceReport />} />
        <Route path="/report" element={<ATIFullReport />} />
      </Route>
      <Route element={<IntraZoneLayout />}>
        <Route path="/intrazone" element={<CompanyRoute><IntraZone /></CompanyRoute>} />
      </Route>
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      <Route path="/oauth/callback" element={<OAuthConsent />} />
      <Route path="/funnels/:id/canvas" element={<CompanyRoute><FunnelCanvas /></CompanyRoute>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
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