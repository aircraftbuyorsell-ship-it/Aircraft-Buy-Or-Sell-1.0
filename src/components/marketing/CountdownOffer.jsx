import { useEffect, useState } from "react";
import { X, Zap, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useBehavior, useShouldShowOffer } from "@/lib/useBehavior";

function formatRemaining(ms) {
  if (ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

export default function CountdownOffer() {
  const { behavior, track } = useBehavior();
  const { show, discount, expiresAt } = useShouldShowOffer();
  const [dismissed, setDismissed] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [persistedOffer, setPersistedOffer] = useState(null);

  // Persist the offer once decided so the countdown is stable
  useEffect(() => {
    if (!show || !behavior?.id) return;
    const active = behavior.active_offer;
    const stillValid = active?.expires_at && new Date(active.expires_at) > new Date();
    if (stillValid) {
      setPersistedOffer(active);
      return;
    }
    const offer = {
      code: `ABOS${discount}`,
      discount_pct: discount,
      expires_at: expiresAt,
    };
    base44.entities.UserBehavior.update(behavior.id, {
      active_offer: offer,
      last_offer_shown_at: new Date().toISOString(),
    });
    setPersistedOffer(offer);
    track("offer_view", { discount });
  }, [show, behavior?.id]);

  // Countdown tick
  useEffect(() => {
    const exp = persistedOffer?.expires_at || behavior?.active_offer?.expires_at;
    if (!exp) return;
    const tick = () => setRemaining(new Date(exp) - new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [persistedOffer, behavior?.active_offer?.expires_at]);

  const activeOffer = persistedOffer || behavior?.active_offer;
  const valid = activeOffer && new Date(activeOffer.expires_at) > new Date();

  if (dismissed || !valid || !behavior || behavior.tier !== "free_explorer") return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (behavior?.id) {
      base44.entities.UserBehavior.update(behavior.id, {
        last_offer_dismissed_at: new Date().toISOString(),
      });
    }
    track("offer_dismiss");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="relative bg-gradient-to-br from-[#1A1814] to-[#111113] rounded-2xl shadow-2xl border border-[#D4A017]/30 overflow-hidden">
        {/* Gold accent */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4A017] to-transparent" />

        <button onClick={handleDismiss} className="absolute top-2 right-2 text-[#8A8780] hover:text-white z-10 p-1">
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-[#D4A017]" />
            <p className="text-[9px] uppercase tracking-[0.15em] font-bold text-[#D4A017]">Limited-time offer</p>
          </div>

          <h3 className="text-white font-black text-base leading-tight">
            {activeOffer.discount_pct}% OFF your first token pack
          </h3>
          <p className="text-[#8A8780] text-[11px] mt-0.5">
            Personal offer based on your activity
          </p>

          {/* Countdown */}
          <div className="mt-3 flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5 w-fit">
            <Clock className="w-3 h-3 text-[#D4A017]" />
            <span className="font-mono text-[12px] text-white font-bold tracking-wider">
              {formatRemaining(remaining)}
            </span>
          </div>

          <Link
            to={`/pricing?code=${activeOffer.code}`}
            onClick={() => track("offer_click")}
            className="mt-3 flex items-center justify-center gap-1.5 bg-[#D4A017] hover:bg-[#F5C842] text-[#1A1814] font-bold text-xs py-2.5 rounded-lg transition-colors"
          >
            Claim {activeOffer.discount_pct}% discount
          </Link>
          <p className="text-[9px] text-center text-[#4A4845] mt-1.5">
            Code: <span className="font-mono text-[#D4A017]">{activeOffer.code}</span> · One-time use
          </p>
        </div>
      </div>
    </div>
  );
}