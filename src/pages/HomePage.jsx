import HomePageHeader from "@/components/homepage/HomePageHeader";
import GlobeShowcase from "@/components/homepage/GlobeShowcase";
import DotGridTransition from "@/components/homepage/DotGridTransition";
import DarkIntelligenceSection from "@/components/homepage/DarkIntelligenceSection";
import TrustByDesignSection from "@/components/homepage/TrustByDesignSection";
import LightReturnTransition from "@/components/homepage/LightReturnTransition";
import DeveloperLightSection from "@/components/homepage/DeveloperLightSection";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <HomePageHeader />
      <GlobeShowcase />
      <DotGridTransition />
      <DarkIntelligenceSection />
      <TrustByDesignSection />
      <LightReturnTransition />
      <DeveloperLightSection />
    </main>
  );
}