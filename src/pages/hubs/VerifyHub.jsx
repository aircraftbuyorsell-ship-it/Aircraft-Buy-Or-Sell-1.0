import {
  Shield, Search, CheckCircle, ShieldCheck, Award, BadgeCheck, Plane,
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

const TABS = [
  { key: "registry", label: "Registry Lookup", icon: Search, Component: NLookup },
  { key: "twin", label: "Digital Twin", icon: Plane, Component: DigitalTwin },
  { key: "passport", label: "ATI Passport", icon: Shield, Component: ATIPassport },
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
        title="Aircraft & Document Verification"
        subtitle="Look up registrations, inspect digital twins, run pre-buy inspections, verify documentation, and connect with certified aviation experts."
      />
      <HubTabs tabs={TABS} defaultTab="registry" />
    </div>
  );
}