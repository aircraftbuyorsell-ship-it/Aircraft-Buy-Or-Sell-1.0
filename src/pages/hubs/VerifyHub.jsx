import {
  Shield, Search, CheckCircle, ShieldCheck, Award, BadgeCheck,
  Radar, Map,
} from "lucide-react";
import HubTabs, { lazyPage } from "@/components/hub/HubTabs";
import HubPageHeader from "@/components/hub/HubPageHeader";

const NLookup = lazyPage(() => import("@/pages/NLookup"));
const PreBuyInspection = lazyPage(() => import("@/pages/PreBuyInspection"));
const ATIPassport = lazyPage(() => import("@/pages/ATIPassport"));
const ATIStandard = lazyPage(() => import("@/pages/ATIStandard"));
const ATIVerify = lazyPage(() => import("@/pages/ATIVerify"));
const Experts = lazyPage(() => import("@/pages/Experts"));
const DigitalTwin = lazyPage(() => import("@/pages/DigitalTwin"));
const TrafficMap = lazyPage(() => import("@/pages/TrafficMap"));
const FAAMap = lazyPage(() => import("@/pages/FAAMap"));

const TABS = [
  { key: "registry", label: "Registry Lookup", icon: Search, Component: NLookup },
  { key: "faa-map", label: "FAA Registry Map", icon: Map, Component: FAAMap },
  { key: "traffic", label: "Live Traffic", icon: Radar, Component: TrafficMap },
  { key: "twin", label: "Digital Twin", icon: Shield, Component: DigitalTwin },
  { key: "passport", label: "ATI Passport", icon: ShieldCheck, Component: ATIPassport },
  { key: "prebuy", label: "Pre-Buy Inspection", icon: CheckCircle, Component: PreBuyInspection },
  { key: "ati-standard", label: "ATI Standard", icon: Award, Component: ATIStandard },
  { key: "ati-verify", label: "Verification Center", icon: ShieldCheck, Component: ATIVerify },
  { key: "experts", label: "Verified Experts", icon: BadgeCheck, Component: Experts },
];

export default function VerifyHub() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <HubPageHeader
        icon={Shield}
        eyebrow="Verify"
        title="Aircraft & Identity Verification"
        subtitle="Track live traffic, look up registrations, inspect digital twins, run pre-buy inspections, and connect with certified aviation experts."
        tabCount={TABS.length}
      />
      <HubTabs tabs={TABS} defaultTab="registry" />
    </div>
  );
}