import HomePageHeader from "@/components/homepage/HomePageHeader";
import GlobeShowcase from "@/components/homepage/GlobeShowcase";
import AircraftIntelligenceHero from "@/components/homepage/AircraftIntelligenceHero";
import DotGridTransition from "@/components/homepage/DotGridTransition";
import GlobalSignalsSection from "@/components/homepage/GlobalSignalsSection";
import DarkIntelligenceSection from "@/components/homepage/DarkIntelligenceSection";
import TrustByDesignSection from "@/components/homepage/TrustByDesignSection";
import LightReturnTransition from "@/components/homepage/LightReturnTransition";
import DeveloperLightSection from "@/components/homepage/DeveloperLightSection";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <HomePageHeader />
      <GlobeShowcase />
      <AircraftIntelligenceHero />
      <DotGridTransition />
      <GlobalSignalsSection />
      <DarkIntelligenceSection />
      <TrustByDesignSection />
      <LightReturnTransition />
      <DeveloperLightSection />
    </main>
  );
}