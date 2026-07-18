import HomePageHeader from "@/components/homepage/HomePageHeader";
import HeroPlatformSection from "@/components/homepage/HeroPlatformSection";
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

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1a1a1a]">
      <HomePageHeader />
      <HeroPlatformSection />
      <TrustIndicators />
      <AircraftIntelligenceHero />
      <QuickActionsSection />
      <ConnectedProductsSection />
      <MarketspaceSection />
      <IntelligenceTransition />
      <IntraZonePreview />
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