import { Plane, Users2, Sparkles } from "lucide-react";
import HubTabs, { lazyPage } from "@/components/hub/HubTabs";
import HubPageHeader from "@/components/hub/HubPageHeader";

const Community = lazyPage(() => import("@/pages/Community"));
const MarketspaceAssistant = lazyPage(() => import("@/pages/MarketspaceAssistant"));

const TABS = [
  { key: "assistant", label: "Marketspace Assistant", icon: Sparkles, Component: MarketspaceAssistant },
  { key: "community", label: "Community", icon: Users2, Component: Community },
];

export default function MarketspaceHub() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <HubPageHeader
        icon={Plane}
        eyebrow="Marketspace"
        title="Aircraft Trading Hub"
        subtitle="Find aircraft, evaluate opportunities, verify aircraft, match buyers and sellers, and move transactions forward from one market workflow."
        tabCount={TABS.length}
      />
      <HubTabs tabs={TABS} defaultTab="assistant" />
    </div>
  );
}