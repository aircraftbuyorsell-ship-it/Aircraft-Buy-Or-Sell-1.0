import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DollarSign, Clock, CheckCircle2, Link2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function RevenueBalanceCard({ user }) {
  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["wallet-commissions"],
    queryFn: () =>
      base44.entities.CommissionLedger.filter(
        { payee_email: user?.email },
        "-created_date",
        20
      ),
    enabled: !!user?.email,
  });

  const { data: links = [] } = useQuery({
    queryKey: ["wallet-affiliate-links"],
    queryFn: () =>
      base44.entities.AffiliateLink.filter(
        { owner_email: user?.email, is_active: true },
        "-created_date",
        10
      ),
    enabled: !!user?.email,
  });

  const pending = commissions
    .filter((c) => c.status === "pending" || c.status === "allocated" || c.status === "batched")
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  const paid = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalEarned = pending + paid;

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(93,202,165,0.12)", border: "0.5px solid rgba(93,202,165,0.25)" }}
          >
            <DollarSign className="w-4 h-4" style={{ color: "#5dcaa5" }} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "rgba(255,255,255,0.40)" }}>
              Affiliate Revenue
            </p>
            <p className="text-2xl font-black" style={{ color: "#5dcaa5" }}>
              €{totalEarned.toFixed(2)}
            </p>
          </div>
        </div>
        <Link
          to="/my-account"
          className="text-xs font-bold px-3 py-2 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: "rgba(93,202,165,0.10)", color: "#5dcaa5", border: "0.5px solid rgba(93,202,165,0.20)" }}
        >
          Manage Links
        </Link>
      </div>

      {/* Pending vs Paid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-3" style={{ background: "rgba(245,194,66,0.06)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3" style={{ color: "#f5c242" }} />
            <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "rgba(255,255,255,0.40)" }}>Pending</p>
          </div>
          <p className="text-sm font-black" style={{ color: "#f5c242" }}>€{pending.toFixed(2)}</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: "rgba(93,202,165,0.06)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3 h-3" style={{ color: "#5dcaa5" }} />
            <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "rgba(255,255,255,0.40)" }}>Paid Out</p>
          </div>
          <p className="text-sm font-black" style={{ color: "#5dcaa5" }}>€{paid.toFixed(2)}</p>
        </div>
      </div>

      {/* Active affiliate links */}
      {links.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: "rgba(255,255,255,0.40)" }}>
            Your Affiliate Links
          </p>
          <div className="space-y-1.5">
            {links.slice(0, 5).map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Link2 className="w-3 h-3 shrink-0" style={{ color: "rgba(255,255,255,0.40)" }} />
                  <span className="text-xs font-semibold truncate" style={{ color: "rgba(255,255,255,0.80)" }}>
                    /{link.slug}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.40)" }}>
                    {link.click_count || 0} clicks
                  </span>
                  <span className="text-[10px] font-bold" style={{ color: "#5dcaa5" }}>
                    {link.conversion_count || 0} conv
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent commissions */}
      <p className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: "rgba(255,255,255,0.40)" }}>
        Recent Commissions
      </p>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
          ))}
        </div>
      ) : commissions.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>No commissions yet</p>
          <Link to="/my-account" className="text-xs font-bold mt-1 inline-flex items-center gap-1" style={{ color: "#5dcaa5" }}>
            Create your first link <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {commissions.slice(0, 8).map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate" style={{ color: "rgba(255,255,255,0.80)" }}>
                  {c.role || "commission"}
                </p>
                <p className="text-[10px] capitalize" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {c.status}
                </p>
              </div>
              <span className="text-sm font-black shrink-0" style={{ color: "#5dcaa5" }}>
                +€{(c.amount || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}