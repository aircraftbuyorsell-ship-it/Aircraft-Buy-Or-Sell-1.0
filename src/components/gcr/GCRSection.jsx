import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useGCRUnlock, useGCRFullReport } from "@/hooks/useGCR";
import ComplianceBadge from "./ComplianceBadge";
import GCRFullReport from "./GCRFullReport";
import GCRPaywallModal from "./GCRPaywallModal";
import { ShieldCheck, Lock, Unlock, Loader2 } from "lucide-react";

export default function GCRSection({ registration, listing }) {
  const [showPaywall, setShowPaywall] = useState(false);
  const [stripeConfirming, setStripeConfirming] = useState(false);

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["gcr-section-user"],
    queryFn: () => base44.auth.me(),
    staleTime: 300000,
  });

  // Check if already unlocked (30-day de-dup)
  const { data: unlockStatus } = useGCRUnlock(registration, user?.email);
  const isUnlocked = unlockStatus?.unlocked || false;

  // Fetch full report only if unlocked
  const { data: fullReport, isLoading: reportLoading } = useGCRFullReport(registration, isUnlocked);

  // Handle Stripe redirect: URL has gcr_unlocked=REGISTRATION & stripe_session=ID
  useEffect(() => {
    if (!registration || !user?.email) return;
    const params = new URLSearchParams(window.location.search);
    const gcrUnlocked = params.get("gcr_unlocked");
    const stripeSession = params.get("stripe_session");

    if (gcrUnlocked === registration && stripeSession) {
      setStripeConfirming(true);
      base44.functions
        .invoke("gcrConfirmUnlock", { stripe_session_id: stripeSession, registration })
        .then(() => {
          // Clean URL
          const cleanUrl = window.location.pathname + window.location.search
            .replace(/[&?]gcr_unlocked=[^&]*/g, "")
            .replace(/[&?]stripe_session=[^&]*/g, "")
            .replace(/[&?]success=[^&]*/g, "")
            .replace(/[&?]gcr_modal=[^&]*/g, "")
            .replace(/[&?]registration=[^&]*/g, "");
          window.history.replaceState({}, "", cleanUrl);
        })
        .catch((e) => console.error("GCR unlock confirm failed:", e))
        .finally(() => setStripeConfirming(false));
    }
  }, [registration, user?.email]);

  if (!registration) return null;

  return (
    <div className="space-y-3">
      {/* Section header + badge */}
      <div
        className="flex items-center justify-between px-5 py-3 rounded-xl"
        style={{
          background: "rgba(4,6,10,0.40)",
          border: "0.5px solid rgba(245,194,66,0.12)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={15} style={{ color: "#f5c242" }} />
          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[rgba(255,255,255,0.70)]">
            Global Compliance Report
          </span>
        </div>
        <ComplianceBadge registration={registration} size="lg" />
      </div>

      {/* Content area */}
      {stripeConfirming ? (
        <div className="flex items-center justify-center py-12 rounded-xl" style={{ background: "rgba(4,6,10,0.40)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
          <Loader2 size={20} className="animate-spin" style={{ color: "#f5c242" }} />
          <span className="text-[12px] text-[rgba(255,255,255,0.50)] ml-2">Confirming payment…</span>
        </div>
      ) : isUnlocked ? (
        reportLoading ? (
          <div className="flex items-center justify-center py-12 rounded-xl" style={{ background: "rgba(4,6,10,0.40)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
            <Loader2 size={20} className="animate-spin" style={{ color: "#f5c242" }} />
            <span className="text-[12px] text-[rgba(255,255,255,0.50)] ml-2">Computing triple-check report…</span>
          </div>
        ) : fullReport ? (
          <GCRFullReport report={fullReport} registration={registration} userEmail={user?.email} />
        ) : null
      ) : (
        <div
          className="flex flex-col items-center justify-center py-8 px-6 rounded-xl text-center"
          style={{
            background: "rgba(4,6,10,0.40)",
            border: "0.5px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ background: "rgba(245,194,66,0.06)", border: "0.5px solid rgba(245,194,66,0.15)" }}
          >
            <Lock size={22} style={{ color: "#f5c242" }} />
          </div>
          <p className="text-[13px] font-black text-[rgba(255,255,255,0.80)] mb-1">
            Unlock Full Compliance Report
          </p>
          <p className="text-[11px] text-[rgba(255,255,255,0.40)] max-w-sm mb-4">
            Registry validity + visual evidence + flight traffic history. Triple-check validation you won't find in any public registry.
          </p>
          <button
            onClick={() => setShowPaywall(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-[12px] font-black transition-all"
            style={{
              background: "#f5c242",
              color: "#04060a",
            }}
          >
            <Unlock size={14} />
            Unlock Full Report
          </button>
        </div>
      )}

      {/* Paywall modal */}
      {showPaywall && (
        <GCRPaywallModal
          registration={registration}
          userEmail={user?.email}
          onClose={() => setShowPaywall(false)}
          onUnlocked={() => setShowPaywall(false)}
        />
      )}
    </div>
  );
}