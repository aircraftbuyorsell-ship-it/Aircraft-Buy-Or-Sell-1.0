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
      className={`block mx-3 mb-2 rounded-lg border transition-all ${isLow
        ? "bg-[rgba(212,160,23,0.08)] border-[#D4A017]/30 hover:bg-[rgba(212,160,23,0.12)]"
        : "bg-white/5 border-white/5 hover:bg-white/10"}`}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Zap className={`w-3 h-3 ${isLow ? "text-[#D4A017]" : "text-[#8A8780]"}`} />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8A8780]">
              {tierMeta?.name || "Free"}
            </span>
          </div>
          {tier === "enterprise" ? (
            <span className="text-[9px] text-[#D4A017] font-bold">∞</span>
          ) : null}
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-lg font-black ${isLow ? "text-[#D4A017]" : "text-white"}`}>
            {tier === "enterprise" ? "Unlimited" : credits.toLocaleString()}
          </span>
          {tier !== "enterprise" && (
            <span className="text-[10px] text-[#4A4845] font-medium">credits</span>
          )}
        </div>
        {isLow && tier !== "enterprise" && (
          <p className="text-[9px] text-[#D4A017] font-semibold mt-0.5">Top up →</p>
        )}
      </div>
    </Link>
  );
}