import { Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useBehavior } from "@/lib/useBehavior";
import { toCredits, TIERS } from "@/lib/pricing";

export default function TokenBalance() {
  const { behavior, tokens, tier } = useBehavior();
  if (!behavior) return null;

  const credits = toCredits(tokens);
  const tierMeta = TIERS[tier];
  const isLow = credits < 25;

  return (
    <Link
      to="/pricing"
      className={`block mx-3 mb-2 rounded-md border transition-all ${isLow
        ? "bg-[rgba(232,168,58,0.12)] border-[#E8A83A]/50 hover:bg-[rgba(232,168,58,0.18)]"
        : "bg-[#0B2D5B]/40 border-[#E8A83A]/20 hover:bg-[#0B2D5B]/60 hover:border-[#E8A83A]/40"}`}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Zap className={`w-3 h-3 ${isLow ? "text-[#E8A83A]" : "text-[#E8A83A]"}`} />
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#E8A83A]">
              {tierMeta?.name || "Free"}
            </span>
          </div>
          {tier === "enterprise" ? (
            <span className="text-[9px] text-[#E8A83A] font-black">∞</span>
          ) : null}
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-lg font-black ${isLow ? "text-[#E8A83A]" : "text-white"}`}>
            {tier === "enterprise" ? "Unlimited" : credits.toLocaleString()}
          </span>
          {tier !== "enterprise" && (
            <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider">credits</span>
          )}
        </div>
        {isLow && tier !== "enterprise" && (
          <p className="text-[9px] text-[#E8A83A] font-black uppercase tracking-wider mt-0.5">Top up →</p>
        )}
      </div>
    </Link>
  );
}