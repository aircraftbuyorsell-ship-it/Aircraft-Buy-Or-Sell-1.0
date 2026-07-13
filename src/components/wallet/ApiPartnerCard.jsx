import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Key, Activity, Zap, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const PLAN_LABELS = {
  free: { label: "Free", color: "#8b8b8b", limits: "20/min · 500/day" },
  pro: { label: "Pro", color: "#f5c242", limits: "300/min · 20k/day" },
  enterprise: { label: "Enterprise", color: "#4e8ef7", limits: "Custom" },
};

export default function ApiPartnerCard({ user }) {
  const { data: keys = [], isLoading } = useQuery({
    queryKey: ["wallet-api-keys"],
    queryFn: () =>
      base44.entities.ApiKey.filter(
        { owner_email: user?.email, status: "active" },
        "-created_date",
        10
      ),
    enabled: !!user?.email,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["wallet-api-logs"],
    queryFn: () =>
      base44.entities.ApiRequestLog.filter(
        { owner_email: user?.email },
        "-created_date",
        50
      ),
    enabled: !!user?.email,
  });

  const totalRequests = keys.reduce((sum, k) => sum + (k.request_count || 0), 0);
  const todayRequests = logs.filter(
    (l) => new Date(l.created_date) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(78,142,247,0.12)", border: "0.5px solid rgba(78,142,247,0.25)" }}
          >
            <Key className="w-4 h-4" style={{ color: "#4e8ef7" }} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "rgba(255,255,255,0.40)" }}>
              API Partner Usage
            </p>
            <p className="text-lg font-black" style={{ color: "#4e8ef7" }}>
              {totalRequests.toLocaleString()} <span className="text-xs font-normal" style={{ color: "rgba(255,255,255,0.40)" }}>total calls</span>
            </p>
          </div>
        </div>
        <Link
          to="/developers/core-api"
          className="text-xs font-bold px-3 py-2 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: "rgba(78,142,247,0.10)", color: "#4e8ef7", border: "0.5px solid rgba(78,142,247,0.20)" }}
        >
          API Docs
        </Link>
      </div>

      {/* Usage stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-3" style={{ background: "rgba(78,142,247,0.06)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="w-3 h-3" style={{ color: "#4e8ef7" }} />
            <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "rgba(255,255,255,0.40)" }}>Last 24h</p>
          </div>
          <p className="text-sm font-black" style={{ color: "#4e8ef7" }}>{todayRequests}</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3 h-3" style={{ color: "rgba(255,255,255,0.40)" }} />
            <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "rgba(255,255,255,0.40)" }}>Active Keys</p>
          </div>
          <p className="text-sm font-black" style={{ color: "rgba(255,255,255,0.80)" }}>{keys.length}</p>
        </div>
      </div>

      {/* API Keys list */}
      <p className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: "rgba(255,255,255,0.40)" }}>
        Your API Keys
      </p>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>No API keys yet</p>
          <Link to="/developers/core-api" className="text-xs font-bold mt-1 inline-block" style={{ color: "#4e8ef7" }}>
            Generate your first key →
          </Link>
        </div>
      ) : (
        <div className="space-y-1.5">
          {keys.map((key) => {
            const plan = PLAN_LABELS[key.plan] || PLAN_LABELS.free;
            return (
              <div
                key={key.id}
                className="px-3 py-2.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs font-bold truncate" style={{ color: "rgba(255,255,255,0.80)" }}>
                    {key.name}
                  </p>
                  <span
                    className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: `${plan.color}15`, color: plan.color }}
                  >
                    {plan.label}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.40)" }}>
                    {key.key_prefix}…
                  </code>
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.50)" }}>
                    {key.request_count || 0} calls
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-2.5 h-2.5" style={{ color: "rgba(255,255,255,0.30)" }} />
                  <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.30)" }}>{plan.limits}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}