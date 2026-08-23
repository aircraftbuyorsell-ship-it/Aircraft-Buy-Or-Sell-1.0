import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Wallet, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import CreditBalanceCard from "@/components/wallet/CreditBalanceCard";
import RevenueBalanceCard from "@/components/wallet/RevenueBalanceCard";
import ApiPartnerCard from "@/components/wallet/ApiPartnerCard";
import SpecialOffersPanel from "@/components/wallet/SpecialOffersPanel";

export default function AbosWallet() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["wallet-auth-me"],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "transparent" }}>
        <div className="w-8 h-8 border-4 border-[#f5c242]/30 border-t-[#f5c242] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "transparent" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                to="/"
                className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ color: "rgba(255,255,255,0.40)" }}
              >
                <ArrowLeft className="w-3 h-3" /> Dashboard
              </Link>
            </div>
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: "#f5c242" }}>
              ABOS Wallet
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-1" style={{ color: "rgba(255,255,255,0.90)" }}>
              Credit & Revenue Overview
            </h1>
            <p className="text-sm mt-1 max-w-2xl" style={{ color: "rgba(255,255,255,0.55)" }}>
              Manage your ABOS Credits, affiliate revenue, API partner usage, and exclusive offers — all in one place.
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl shrink-0"
            style={{ background: "rgba(245,194,66,0.08)", border: "0.5px solid rgba(245,194,66,0.20)" }}
          >
            <Wallet className="w-4 h-4" style={{ color: "#f5c242" }} />
            <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.80)" }}>
              {user?.email || "Guest"}
            </span>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-2 gap-4">
          <CreditBalanceCard user={user} />
          <RevenueBalanceCard user={user} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mt-4">
          <ApiPartnerCard user={user} />
          <SpecialOffersPanel user={user} />
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid sm:grid-cols-3 gap-3">
          <Link
            to="/pricing"
            className="rounded-xl p-4 flex items-center gap-3 transition-all hover:scale-[1.02]"
            style={{ background: "rgba(245,194,66,0.06)", border: "0.5px solid rgba(245,194,66,0.15)" }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,194,66,0.12)" }}>
              <Wallet className="w-4 h-4" style={{ color: "#f5c242" }} />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.90)" }}>Buy Credits</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.50)" }}>Bundle & save up to 47%</p>
            </div>
          </Link>
          <Link
            to="/developers/core-api"
            className="rounded-xl p-4 flex items-center gap-3 transition-all hover:scale-[1.02]"
            style={{ background: "rgba(78,142,247,0.06)", border: "0.5px solid rgba(78,142,247,0.15)" }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(78,142,247,0.12)" }}>
              <Wallet className="w-4 h-4" style={{ color: "#4e8ef7" }} />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.90)" }}>API Keys</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.50)" }}>Manage developer access</p>
            </div>
          </Link>
          <Link
            to="/subscription"
            className="rounded-xl p-4 flex items-center gap-3 transition-all hover:scale-[1.02]"
            style={{ background: "rgba(93,202,165,0.06)", border: "0.5px solid rgba(93,202,165,0.15)" }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(93,202,165,0.12)" }}>
              <Wallet className="w-4 h-4" style={{ color: "#5dcaa5" }} />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.90)" }}>Subscription</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.50)" }}>Manage your plan</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}