import { Shield, ShieldCheck } from "lucide-react";
import HubTabs, { lazyPage } from "@/components/hub/HubTabs";
import HubPageHeader from "@/components/hub/HubPageHeader";

const VerificationAssistant = lazyPage(() => import("@/pages/VerificationAssistant"));
const TABS = [
  { key: "registry", label: "Verification Assistant", icon: ShieldCheck, Component: VerificationAssistant },
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
          tabCount={1}
        />
        <HubTabs tabs={TABS} defaultTab="registry" />
      </div>
    </div>
  );
}
