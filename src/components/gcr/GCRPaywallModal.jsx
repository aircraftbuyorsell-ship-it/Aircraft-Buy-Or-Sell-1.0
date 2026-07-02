import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Lock, CreditCard, Zap, X } from "lucide-react";

const PRICE_EUR = 39;

export default function GCRPaywallModal({ registration, userEmail, onClose, onUnlocked }) {
  const [loading, setLoading] = useState(null); // 'stripe' | 'credit' | null
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const handleStripe = async () => {
    setLoading("stripe");
    setError(null);
    try {
      const baseUrl = window.location.href.split("?")[0];
      const returnUrl = `${baseUrl}?gcr_modal=true&registration=${encodeURIComponent(registration)}`;
      const res = await base44.functions.invoke("gcrCheckout", { registration, returnUrl });
      const data = res.data || res;
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        setError("Failed to create checkout session.");
      }
    } catch (e) {
      setError(e.message || "Stripe checkout failed.");
    } finally {
      setLoading(null);
    }
  };

  const handleCredit = async () => {
    setLoading("credit");
    setError(null);
    try {
      // Deduct credit: create TokenTransaction + update UserBehavior
      await base44.entities.TokenTransaction.create({
        user_email: userEmail,
        type: "gcr_unlock",
        amount: -1,
        feature: "gcr_unlock",
        metadata: { registration },
      });

      // Invalidate unlock cache so useGCRUnlock refetches
      queryClient.invalidateQueries({ queryKey: ["gcr-unlock", registration, userEmail] });
      onUnlocked?.();
    } catch (e) {
      setError(e.message || "Credit deduction failed.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "rgba(4,6,10,0.98)",
          border: "0.5px solid rgba(245,194,66,0.25)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10"
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.40)", cursor: "pointer" }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "rgba(245,194,66,0.08)", border: "0.5px solid rgba(245,194,66,0.20)" }}
          >
            <ShieldCheck size={28} style={{ color: "#f5c242" }} />
          </div>
          <p className="text-[9px] uppercase tracking-[0.25em] font-black text-[#f5c242] mb-2">
            Global Compliance Report
          </p>
          <h2 className="text-white text-xl font-black mb-2">Unlock Full Report</h2>
          <p className="text-[12px] text-[rgba(255,255,255,0.50)] leading-relaxed max-w-xs mx-auto">
            Triple-check validation: Registry + Visual Evidence + Flight Traffic History.
            Information you won't find in any public registry.
          </p>
          <p className="text-[11px] font-mono text-[rgba(255,255,255,0.35)] mt-2">
            {registration}
          </p>
        </div>

        {/* Pricing */}
        <div className="px-8 pb-6 space-y-3">
          {/* Stripe option */}
          <button
            onClick={handleStripe}
            disabled={loading !== null}
            className="w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all"
            style={{
              background: loading === "stripe" ? "rgba(245,194,66,0.05)" : "rgba(245,194,66,0.08)",
              border: "0.5px solid rgba(245,194,66,0.25)",
              cursor: loading ? "default" : "pointer",
              opacity: loading && loading !== "stripe" ? 0.5 : 1,
            }}
          >
            <div className="flex items-center gap-3">
              <CreditCard size={18} style={{ color: "#f5c242" }} />
              <div className="text-left">
                <p className="text-[13px] font-black text-[#f5c242]">Buy with Stripe</p>
                <p className="text-[10px] text-[rgba(255,255,255,0.40)]">One-time payment · 30-day access</p>
              </div>
            </div>
            <span className="text-lg font-black text-white">€{PRICE_EUR}</span>
          </button>

          {/* Credit option */}
          <button
            onClick={handleCredit}
            disabled={loading !== null}
            className="w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all"
            style={{
              background: loading === "credit" ? "rgba(78,142,247,0.05)" : "rgba(78,142,247,0.06)",
              border: "0.5px solid rgba(78,142,247,0.20)",
              cursor: loading ? "default" : "pointer",
              opacity: loading && loading !== "credit" ? 0.5 : 1,
            }}
          >
            <div className="flex items-center gap-3">
              <Zap size={18} style={{ color: "#4e8ef7" }} />
              <div className="text-left">
                <p className="text-[13px] font-black text-[#4e8ef7]">Use 1 Credit</p>
                <p className="text-[10px] text-[rgba(255,255,255,0.40)]">For Pro & Enterprise members</p>
              </div>
            </div>
            <span className="text-sm font-bold text-[rgba(255,255,255,0.60)]">1 token</span>
          </button>

          {error && (
            <p className="text-[11px] text-[#ef4444] text-center pt-1">{error}</p>
          )}

          <div className="flex items-center justify-center gap-1.5 pt-2">
            <Lock size={11} style={{ color: "rgba(255,255,255,0.25)" }} />
            <p className="text-[10px] text-[rgba(255,255,255,0.30)]">
              Secure payment · Instant access · 30-day re-access included
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}