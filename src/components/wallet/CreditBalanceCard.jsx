import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Coins, TrendingUp, TrendingDown, ArrowRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function CreditBalanceCard({ user }) {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["wallet-credits"],
    queryFn: () =>
      base44.entities.TokenTransaction.filter(
        { user_email: user?.email },
        "-created_date",
        20
      ),
    enabled: !!user?.email,
  });

  const balance = transactions.length > 0 ? (transactions[0].balance_after ?? 0) : 0;
  const purchased = transactions
    .filter((t) => t.type === "purchase" || t.type === "bonus")
    .reduce((sum, t) => sum + t.amount, 0);
  const consumed = transactions
    .filter((t) => t.type === "consumption" || t.type === "gcr_unlock")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(245,194,66,0.12)", border: "0.5px solid rgba(245,194,66,0.25)" }}
          >
            <Coins className="w-4 h-4" style={{ color: "#f5c242" }} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "rgba(255,255,255,0.40)" }}>
              ABOS Credit Balance
            </p>
            <p className="text-2xl font-black" style={{ color: "#f5c242" }}>
              {balance.toLocaleString()} <span className="text-xs font-normal" style={{ color: "rgba(255,255,255,0.40)" }}>credits</span>
            </p>
          </div>
        </div>
        <Link
          to="/pricing"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-opacity hover:opacity-90"
          style={{ background: "#f5c242", color: "#04060a" }}
        >
          <Plus className="w-3 h-3" /> Buy Credits
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-3" style={{ background: "rgba(93,202,165,0.06)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3 h-3" style={{ color: "#5dcaa5" }} />
            <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "rgba(255,255,255,0.40)" }}>Purchased</p>
          </div>
          <p className="text-sm font-black" style={{ color: "#5dcaa5" }}>+{purchased.toLocaleString()}</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: "rgba(226,75,74,0.06)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3 h-3" style={{ color: "#e24b4a" }} />
            <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "rgba(255,255,255,0.40)" }}>Consumed</p>
          </div>
          <p className="text-sm font-black" style={{ color: "#e24b4a" }}>-{consumed.toLocaleString()}</p>
        </div>
      </div>

      {/* Recent transactions */}
      <p className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: "rgba(255,255,255,0.40)" }}>
        Recent Transactions
      </p>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>No transactions yet</p>
          <Link to="/pricing" className="text-xs font-bold mt-1 inline-flex items-center gap-1" style={{ color: "#f5c242" }}>
            Get your first credits <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {transactions.slice(0, 10).map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate" style={{ color: "rgba(255,255,255,0.80)" }}>
                  {tx.pack || tx.feature || tx.type}
                </p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {new Date(tx.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
              <span
                className="text-sm font-black shrink-0"
                style={{ color: tx.amount >= 0 ? "#5dcaa5" : "#e24b4a" }}
              >
                {tx.amount >= 0 ? "+" : ""}{tx.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}