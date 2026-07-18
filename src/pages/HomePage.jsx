import HomePageHeader from "@/components/homepage/HomePageHeader";
import GlobeShowcase from "@/components/homepage/GlobeShowcase";
import TrustIndicators from "@/components/homepage/TrustIndicators";
import AircraftIntelligenceHero from "@/components/homepage/AircraftIntelligenceHero";
import QuickActionsSection from "@/components/homepage/QuickActionsSection";
import ConnectedProductsSection from "@/components/homepage/ConnectedProductsSection";
import MarketspaceSection from "@/components/homepage/MarketspaceSection";
import DotGridTransition from "@/components/homepage/DotGridTransition";
import DarkIntelligenceSection from "@/components/homepage/DarkIntelligenceSection";
import TrustByDesignSection from "@/components/homepage/TrustByDesignSection";
import LightReturnTransition from "@/components/homepage/LightReturnTransition";
import DeveloperLightSection from "@/components/homepage/DeveloperLightSection";
import GovernedAutomationSection from "@/components/homepage/GovernedAutomationSection";
import GovernanceLayerSection from "@/components/homepage/GovernanceLayerSection";
import ProfessionalServicesSection from "@/components/homepage/ProfessionalServicesSection";
import WhyTrustABOS from "@/components/homepage/WhyTrustABOS";
import FinalCTASection from "@/components/homepage/FinalCTASection";
import HomepageFooter from "@/components/homepage/HomepageFooter";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfaf7] text-foreground">
      {/* 01 · Sticky navigation */}
      <HomePageHeader />
      {/* 02 · Hero 01 — Aviation Intelligence Platform (HeroGlobe) */}
      <GlobeShowcase />
      {/* 03 · Trust indicators */}
      <TrustIndicators />
      {/* 04 · Hero 02 — See the aircraft behind the listing */}
      <AircraftIntelligenceHero />
      {/* 05 · Quick actions */}
      <QuickActionsSection />
      {/* 06 · Three connected products */}
      <ConnectedProductsSection />
      {/* 07 · Marketspace — live AircraftListing data */}
      <MarketspaceSection />
      {/* 08–09 · Intelligence transition + IntraZone dark portal */}
      <DotGridTransition />
      {/* 10 · Aircraft Intelligence (dark) */}
      <DarkIntelligenceSection />
      {/* 11 · Trust by Design (dark) */}
      <TrustByDesignSection />
      {/* 12 · Return to light transition */}
      <LightReturnTransition />
      {/* 13 · Platform & developer layer */}
      <DeveloperLightSection />
      {/* 14 · Governed automation teaser (APL / ADL) */}
      <GovernedAutomationSection />
      {/* 15 · Governance layer */}
      <GovernanceLayerSection />
      {/* 16 · Professional services */}
      <ProfessionalServicesSection />
      {/* 17 · Why trust ABOS */}
      <WhyTrustABOS />
      {/* 18 · Final CTA */}
      <FinalCTASection />
      {/* 19 · Footer */}
      <HomepageFooter />
    </main>
  );
}