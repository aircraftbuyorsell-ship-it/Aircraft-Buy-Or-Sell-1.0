import {
  Shield, Search, CheckCircle, ShieldCheck, Award, BadgeCheck,
  Radar, Map,
} from "lucide-react";
import HubTabs, { lazyPage } from "@/components/hub/HubTabs";
import HubPageHeader from "@/components/hub/HubPageHeader";

const VerificationAssistant = lazyPage(() => import("@/pages/VerificationAssistant"));
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
  { key: "registry", label: "Verification Assistant", icon: ShieldCheck, Component: VerificationAssistant },
  { key: "registry-lookup", label: "Registry Lookup", icon: Search, Component: NLookup },
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
    <div data-verification-assistant="true" data-verification-engine="shared" data-verification-sources="supabase,base44,github,live-traffic,service-intelligence,dealers">
      <div className="mb-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">ABOS Verification Assistant</p>
            <p className="mt-1 text-sm text-muted-foreground">One shared Verification Engine across Registry, Identity, Ownership, Activity, Service, Documents and ATI.</p>
          </div>
          <span className="rounded-full border border-border px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Shared Aircraft Digital Twin</span>
        </div>
      </div>
      <div className="px-4 py-6 md:px-8 md:py-8">
        <HubPageHeader
          icon={Shield}
          eyebrow="Verify"
          title="Aircraft & Identity Verification"
          subtitle="Start one verification workflow. The same evidence graph can be consumed by ATI, valuation, market intelligence, service intelligence and ABOS Assistant."
          tabCount={TABS.length}
        />
        <HubTabs tabs={TABS} defaultTab="registry" />
      </div>
    </div>
  );
}
