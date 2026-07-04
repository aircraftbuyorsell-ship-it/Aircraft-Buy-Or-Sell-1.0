import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Zap, Crown, ArrowRight } from "lucide-react";

// Free plan: 100 starter credits · ABOS Pro: €350/month unlimited pipelines
export default function PipelinePlanBanner() {
  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: lastTx } = useQuery({
    queryKey: ["token-balance", user?.email],
    queryFn: () => base44.entities.TokenTransaction.filter({ user_email: user.email }, "-created_date", 1),
    enabled: !!user?.email,
  });

  if (!user) return null;

  const tier = user.subscription_tier || user.tier || "free_explorer";
  const isPro = tier === "pro" || tier === "enterprise" || user.role === "admin";
  const balance = lastTx?.[0]?.balance_after ?? 100;

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 rounded-xl px-4 py-3"
      style={{
        background: isPro ? "rgba(212,160,23,0.06)" : "rgba(255,255,255,0.03)",
        border: "0.5px solid rgba(212,160,23,0.25)",
      }}>
      <div className="flex items-center gap-2.5 min-w-0">
        {isPro ? (
          <>
            <Crown className="w-4 h-4 shrink-0" style={{ color: "#D4A017" }} />
            <span className="text-[12px] font-black" style={{ color: "#D4A017" }}>ABOS Pro</span>
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              Unlimited sales pipelines
            </span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 shrink-0" style={{ color: "#D4A017" }} />
            <span className="text-[12px] font-bold text-white">
              Free plan · <span style={{ color: "#D4A017" }}>{Math.max(balance, 0)} credits</span>
            </span>
            <span className="hidden sm:inline text-[11px]" style={{ color: "rgba(255,255,255,0.40)" }}>
              100 starter credits included
            </span>
          </>
        )}
      </div>

      {!isPro && (
        <Link to="/pricing"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-transform hover:scale-[1.02] shrink-0"
          style={{ background: "#D4A017", color: "#04060a" }}>
          <Crown className="w-3.5 h-3.5" />
          ABOS Pro — €350/mo
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}