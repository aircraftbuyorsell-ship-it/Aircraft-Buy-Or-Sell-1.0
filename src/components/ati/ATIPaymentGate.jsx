import { X, Sparkles, Lock, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { TOKEN_COSTS, toCredits } from "@/lib/pricing";

export default function ATIPaymentGate({ listing, onClose, onUnlock }) {
  const cost = TOKEN_COSTS.ati_passport_full;
  const creditsNeeded = toCredits(cost);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Gradient top bar */}
        <div className="h-2 bg-gradient-to-r from-[#0B2D5B] via-[#E8A83A] to-[#0B2D5B]" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#AAA49C] hover:text-[#0B2D5B] z-10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-7 py-8">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0B2D5B] to-[#143C75] flex items-center justify-center">
              <Lock className="w-8 h-8 text-[#E8A83A]" strokeWidth={1.5} />
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-center text-2xl font-black text-[#1A1814] leading-tight mb-2">
            Unlock Full Report
          </h2>
          <p className="text-center text-[13px] text-[#6B6560] mb-5 leading-relaxed">
            The complete ATI Score Card with 8-dimension risk analysis, OMVM valuation, and PDF export for {listing.year} {listing.make} {listing.model}.
          </p>

          {/* Aircraft card preview */}
          <div className="bg-[#F7F4EF] border border-black/[0.07] rounded-xl p-4 mb-5">
            <p className="text-[9px] text-[#AAA49C] uppercase tracking-wider font-bold mb-2">This Aircraft</p>
            <p className="text-sm font-black text-[#1A1814]">{listing.year} {listing.make} {listing.model}</p>
            {listing.registration && (
              <p className="text-[11px] text-[#6B6560] font-mono mt-1">{listing.registration}</p>
            )}
            {listing.asking_price && (
              <p className="text-[11px] text-[#AAA49C] mt-2">Asking: ${listing.asking_price.toLocaleString()}</p>
            )}
          </div>

          {/* What you get */}
          <div className="bg-[rgba(15,122,86,0.05)] rounded-xl p-4 mb-6 border border-[rgba(15,122,86,0.15)]">
            <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#0F7A56] mb-3">You'll Unlock</p>
            <ul className="space-y-2.5">
              {[
                "8 dimension risk scoring (0–120 total)",
                "Engine condition & remaining life analysis",
                "Real market valuation (OMVM) estimate",
                "PDF export for lenders & partners",
                "AI-powered deal assessment",
                "Missing data identification",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[12px] text-[#0F7A56]">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cost & CTA */}
          <div className="bg-gradient-to-r from-[#0B2D5B] to-[#143C75] rounded-2xl p-5 mb-5 text-white">
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#E8A83A]">One-time cost</p>
              <div className="text-right">
                <p className="text-3xl font-black leading-none">{creditsNeeded}</p>
                <p className="text-[10px] text-white/60 mt-0.5">credits</p>
              </div>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#E8A83A] to-[#F5C842]" style={{ width: "100%" }} />
            </div>
          </div>

          {/* Primary CTA */}
          <Link
            to="/pricing"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full bg-[#0B2D5B] hover:bg-[#143C75] text-white font-black text-sm py-3.5 rounded-xl transition-colors mb-3"
          >
            <Sparkles className="w-4 h-4" />
            Get Credits
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Secondary CTA if they somehow have enough tokens */}
          <button
            onClick={onUnlock}
            className="w-full border-2 border-[#0B2D5B] text-[#0B2D5B] font-bold text-sm py-2.5 rounded-xl hover:bg-[#0B2D5B] hover:text-white transition-colors"
          >
            Try anyway
          </button>

          {/* Social proof */}
          <div className="mt-5 text-center">
            <p className="text-[10px] text-[#AAA49C] mb-2">⭐ Trusted by 2,400+ dealers</p>
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-white"
                  style={{
                    backgroundColor: ["#0B2D5B", "#E8A83A", "#0F7A56"][i - 1],
                    marginLeft: i > 1 ? "-8px" : 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}