import { Plane, GitBranch, Radar, Scale, Landmark, Users, Globe, Bell, Users2 } from "lucide-react";
import HubTabs, { lazyPage } from "@/components/hub/HubTabs";
import HubPageHeader from "@/components/hub/HubPageHeader";

const Listings = lazyPage(() => import("@/pages/Listings"));
const SalesPipeline = lazyPage(() => import("@/pages/SalesPipeline"));
const DealRadar = lazyPage(() => import("@/pages/DealRadar"));
const Compare = lazyPage(() => import("@/pages/Compare"));
const Escrow = lazyPage(() => import("@/pages/Escrow"));
const Leads = lazyPage(() => import("@/pages/Leads"));
const Community = lazyPage(() => import("@/pages/Community"));
const AircraftAlerts = lazyPage(() => import("@/pages/AircraftAlerts"));
const CrossBorderBridge = lazyPage(() => import("@/pages/CrossBorderBridge"));

const TABS = [
  { key: "listings", label: "Listings", icon: Plane, Component: Listings },
  { key: "pipeline", label: "Sales Pipeline", icon: GitBranch, Component: SalesPipeline },
  { key: "radar", label: "Deal Radar", icon: Radar, Component: DealRadar },
  { key: "compare", label: "Compare", icon: Scale, Component: Compare },
  { key: "escrow", label: "Escrow", icon: Landmark, Component: Escrow },
  { key: "leads", label: "Leads", icon: Users, Component: Leads },
  { key: "alerts", label: "Aircraft Alerts", icon: Bell, Component: AircraftAlerts },
  { key: "cross-border", label: "Cross-Border", icon: Globe, Component: CrossBorderBridge },
  { key: "community", label: "Community", icon: Users2, Component: Community },
];

export default function MarketspaceHub() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <HubPageHeader
        icon={Plane}
        eyebrow="Marketspace"
        title="Aircraft Trading Hub"
        subtitle="Browse listings, manage deals through the sales pipeline, handle escrow, track leads, and match buyers with sellers."
      />
      <HubTabs tabs={TABS} defaultTab="listings" />
    </div>
  );
}