import PlatformHeader from "@/components/homepage/PlatformHeader";
import GlobeShowcase from "@/components/homepage/GlobeShowcase";
import TrustIndicators from "@/components/homepage/TrustIndicators";
import AircraftIntelligenceHero from "@/components/homepage/AircraftIntelligenceHero";
import QuickActionsSection from "@/components/homepage/QuickActionsSection";
import ConnectedProductsSection from "@/components/homepage/ConnectedProductsSection";
import MarketspaceSection from "@/components/homepage/MarketspaceSection";
import IntelligenceTransition from "@/components/homepage/IntelligenceTransition";
import IntraZonePreview from "@/components/homepage/IntraZonePreview";
import AircraftIntelligenceSection from "@/components/homepage/AircraftIntelligenceSection";
import TrustByDesignSection from "@/components/homepage/TrustByDesignSection";
import LightModeTransition from "@/components/homepage/LightModeTransition";
import DeveloperPlatformSection from "@/components/homepage/DeveloperPlatformSection";
import GovernedAutomationSection from "@/components/homepage/GovernedAutomationSection";
import GovernanceLayerSection from "@/components/homepage/GovernanceLayerSection";
import ProfessionalServicesSection from "@/components/homepage/ProfessionalServicesSection";
import WhyTrustABOS from "@/components/homepage/WhyTrustABOS";
import FinalCTASection from "@/components/homepage/FinalCTASection";
import HomepageFooter from "@/components/homepage/HomepageFooter";
import { useHeroAircraft } from "@/hooks/useHeroAircraft";

export default function HomePage() {
  // Single source for the session-selected aircraft — passed to sections 04 & 09.
  // GlobeShowcase (02) calls the same hook internally; react-query dedupes the fetch
  // and the deterministic pick ensures all three show the same aircraft.
  const { aircraft } = useHeroAircraft();

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <PlatformHeader />
      <GlobeShowcase />
      <TrustIndicators />
      <AircraftIntelligenceHero aircraft={aircraft} />
      <QuickActionsSection />
      <ConnectedProductsSection />
      <MarketspaceSection />
      <IntelligenceTransition />
      <IntraZonePreview aircraft={aircraft} />
      <AircraftIntelligenceSection />
      <TrustByDesignSection />
      <LightModeTransition />
      <DeveloperPlatformSection />
      <GovernedAutomationSection />
      <GovernanceLayerSection />
      <ProfessionalServicesSection />
      <WhyTrustABOS />
      <FinalCTASection />
      <HomepageFooter />
    </main>
  );
}