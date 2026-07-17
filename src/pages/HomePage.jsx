import HomePageHeader from "@/components/homepage/HomePageHeader";
import GlobeShowcase from "@/components/homepage/GlobeShowcase";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <HomePageHeader />
      <GlobeShowcase />
    </main>
  );
}