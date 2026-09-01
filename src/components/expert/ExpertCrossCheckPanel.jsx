import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { useExpertCrossCheck, useExpertBids } from "@/hooks/useExpert";
import ExpertBidCard from "./ExpertBidCard";
import {
  UserCheck, Loader2, Clock, BadgeCheck, Zap, ChevronRight
} from "lucide-react";

const STATUS_STEPS = [
  { key: "open", label: "Posted", icon: Zap },
  { key: "in_progress", label: "Expert Reviewing", icon: Clock },
  { key: "completed", label: "Completed", icon: BadgeCheck },
];

function StatusStepper({ currentStatus }) {
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === currentStatus);
  return (
    <div className="flex items-center gap-1.5">
      {STATUS_STEPS.map((step, i) => {
        const isDone = i < currentIdx;
        const isActive = i === currentIdx;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-center gap-1.5 flex-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
              style={{
                background: isActive || isDone ? "rgba(245,194,66,0.15)" : "rgba(255,255,255,0.04)",
                border: isActive ? "0.5px solid rgba(245,194,66,0.40)" : isDone ? "0.5px solid rgba(245,194,66,0.20)" : "0.5px solid rgba(255,255,255,0.06)",
              }}
            >
              <Icon size={12} style={{ color: isActive || isDone ? "#f5c242" : "rgba(255,255,255,0.30)" }} />
            </div>
            <span
              className="text-[9px] font-bold"
              style={{ color: isActive ? "#f5c242" : isDone ? "rgba(245,194,66,0.60)" : "rgba(255,255,255,0.25)" }}
            >
              {step.label}
            </span>
            {i < STATUS_STEPS.length - 1 && (
              <div className="flex-1 h-px" style={{ background: isDone ? "rgba(245,194,66,0.20)" : "rgba(255,255,255,0.06)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ExpertCrossCheckPanel({ registration, listing, userEmail }) {
  const [requesting, setRequesting] = useState(false);
  const [accepting, setAccepting] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const qc = useQueryClient();

  const { data: crosscheck } = useExpertCrossCheck(registration, userEmail);
  const { data: bids = [] } = useExpertBids(crosscheck?.id);

  // Handle Stripe redirect: expert_paid=CROSSCHECK_ID & stripe_session=ID
  useEffect(() => {
    if (!registration) return;
    const params = new URLSearchParams(window.location.search);
    const expertPaid = params.get("expert_paid");
    const stripeSession = params.get("stripe_session");

    if (expertPaid && stripeSession) {
      setConfirming(true);
      base44.functions
        .invoke("expertCheckout", { mode: "confirm", stripe_session_id: stripeSession })
        .then(() => {
          const cleanUrl = window.location.pathname + window.location.search
            .replace(/[&?]expert_paid=[^&]*/g, "")
            .replace(/[&?]stripe_session=[^&]*/g, "")
            .replace(/[&?]expert_canceled=[^&]*/g, "");
          window.history.replaceState({}, "", cleanUrl);
          qc.invalidateQueries({ queryKey: ["expert-crosscheck"] });
          qc.invalidateQueries({ queryKey: ["expert-bids"] });
        })
        .catch(e => console.error("Expert checkout confirm failed:", e))
        .finally(() => setConfirming(false));
    }
  }, [registration]);

  const handleRequest = async () => {
    setRequesting(true);
    try {
      const me = await base44.auth.me();
      const aircraftInfo = [
        listing?.year, listing?.make, listing?.model
      ].filter(Boolean).join(" ");

      await base44.entities.ExpertCrossCheck.create({
        registration,
        listing_id: listing?.id || null,
        requester_email: me.email,
        requester_name: me.full_name || "",
        aircraft_info: aircraftInfo || registration,
        status: "open",
      });

      // Notify all approved experts
      base44.functions.invoke("expertNotify", {
        type: "new_crosscheck",
        registration,
        aircraft_info: aircraftInfo || registration,
      }).catch(() => {});

      qc.invalidateQueries({ queryKey: ["expert-crosscheck"] });
    } catch (e) {
      console.error("Failed to create crosscheck:", e);
    } finally {
      setRequesting(false);
    }
  };

  const handleAccept = async (bid) => {
    setAccepting(bid.id);
    try {
      const returnUrl = window.location.pathname + window.location.search;
      const res = await base44.functions.invoke("expertCheckout", {
        mode: "create",
        crosscheck_id: crosscheck.id,
        expert_bid_id: bid.id,
        return_url: returnUrl,
      });
      const data = res.data || res;
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      }
    } catch (e) {
      console.error("Checkout failed:", e);
    } finally {
      setAccepting(null);
    }
  };

  if (confirming) {
    return (
      <div
        className="flex items-center justify-center py-8 rounded-xl"
        style={{ background: "rgba(4,6,10,0.50)", border: "0.5px solid rgba(245,194,66,0.12)" }}
      >
        <Loader2 size={18} className="animate-spin" style={{ color: "#f5c242" }} />
        <span className="text-[12px] text-[rgba(255,255,255,0.50)] ml-2">Confirming expert payment…</span>
      </div>
    );
  }

  // No crosscheck yet — show request button
  if (!crosscheck) {
    return (
      <div
        className="flex flex-col items-center justify-center py-6 px-5 rounded-xl text-center"
        style={{ background: "rgba(4,6,10,0.50)", border: "0.5px solid rgba(245,194,66,0.12)" }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
          style={{ background: "rgba(245,194,66,0.06)", border: "0.5px solid rgba(245,194,66,0.15)" }}
        >
          <UserCheck size={20} style={{ color: "#f5c242" }} />
        </div>
        <p className="text-[12px] font-black text-[rgba(255,255,255,0.80)] mb-1">
          Expert CrossCheck
        </p>
        <p className="text-[10px] text-[rgba(255,255,255,0.40)] max-w-sm mb-4 leading-relaxed">
          Have this GCR report independently validated by a certified aviation professional (A&P, IA, EASA Part-66). Adds a verified trust stamp for banks, insurers, and investors.
        </p>
        <button
          onClick={handleRequest}
          disabled={requesting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black transition-all disabled:opacity-40"
          style={{ background: "#f5c242", color: "#04060a" }}
        >
          {requesting ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
          Request Expert CrossCheck
        </button>
      </div>
    );
  }

  // Crosscheck exists
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "rgba(4,6,10,0.50)", border: "0.5px solid rgba(245,194,66,0.15)" }}
    >
      {/* Header + Stepper */}
      <div className="px-5 py-4" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-3">
          <UserCheck size={14} style={{ color: "#f5c242" }} />
          <p className="text-[10px] uppercase tracking-[0.12em] font-black text-[#f5c242]">
            Expert CrossCheck
          </p>
        </div>
        <StatusStepper currentStatus={crosscheck.status} />
      </div>

      {/* Status-specific content */}
      <div className="px-5 py-4">
        {crosscheck.status === "open" && (
          <div>
            <p className="text-[11px] text-[rgba(255,255,255,0.50)] mb-3">
              {bids.length > 0
                ? `${bids.length} expert${bids.length > 1 ? "s" : ""} submitted bids:`
                : "Waiting for certified experts to submit bids. You'll be notified by email."}
            </p>
            {bids.length > 0 && (
              <div className="space-y-2.5">
                {bids.map(bid => (
                  <ExpertBidCard
                    key={bid.id}
                    bid={bid}
                    onAccept={handleAccept}
                    accepting={accepting === bid.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {crosscheck.status === "in_progress" && (
          <div className="flex items-center gap-3 py-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(245,194,66,0.10)", border: "0.5px solid rgba(245,194,66,0.20)" }}
            >
              <Clock size={16} style={{ color: "#f5c242" }} />
            </div>
            <div>
              <p className="text-[12px] font-black text-[rgba(255,255,255,0.80)]">
                {crosscheck.expert_name || "Expert"} is reviewing
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {(crosscheck.expert_certifications || []).map(c => (
                  <span
                    key={c}
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(245,194,66,0.08)", color: "#f5c242", border: "0.5px solid rgba(245,194,66,0.15)" }}
                  >
                    {c}
                  </span>
                ))}
                <span className="text-[10px] text-[rgba(255,255,255,0.30)]">
                  · €{crosscheck.price_paid_eur} paid
                </span>
              </div>
            </div>
          </div>
        )}

        {crosscheck.status === "completed" && (
          <div className="flex items-center gap-2 text-[11px] text-[rgba(255,255,255,0.50)]">
            <BadgeCheck size={14} style={{ color: crosscheck.verdict === "confirmed" ? "#22c55e" : "#ef4444" }} />
            Verdict submitted — see result below.
            <ChevronRight size={12} />
          </div>
        )}

        {crosscheck.status === "cancelled" && (
          <p className="text-[11px] text-[rgba(255,255,255,0.40)] italic">Request cancelled.</p>
        )}
      </div>
    </div>
  );
}