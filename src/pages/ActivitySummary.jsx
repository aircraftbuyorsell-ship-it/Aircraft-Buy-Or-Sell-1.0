import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Clock, TrendingUp, Search, FileBarChart, ArrowRight, Activity, Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const fmtMoney = (v) => (v == null ? "—" : `$${Number(v).toLocaleString()}`);

const DEAL_LABEL_STYLE = {
  "hot deal":   { bg: "rgba(34,197,94,0.10)",  bdr: "rgba(34,197,94,0.30)",  color: "#16a34a" },
  "good deal":  { bg: "rgba(245,194,66,0.10)", bdr: "rgba(245,194,66,0.30)", color: "#D4A017" },
  "fair":       { bg: "rgba(148,163,184,0.10)", bdr: "rgba(148,163,184,0.30)", color: "#64748b" },
  overpriced:   { bg: "rgba(239,68,68,0.10)",  bdr: "rgba(239,68,68,0.30)",  color: "#dc2626" },
};

function StatTile({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl p-4 bg-card border border-border">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}14`, border: `0.5px solid ${accent}33` }}>
          <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function eventLabel(type) {
  if (type === "listing_view") return "Viewed listing";
  if (type === "ati_generate_attempt") return "ATI score attempt";
  if (type === "import_attempt") return "Imported listing";
  if (type === "page_view") return "Page view";
  if (type === "pricing_view") return "Viewed pricing";
  return type?.replace(/_/g, " ");
}

function eventDetail(ev) {
  const p = ev.payload || {};
  if (ev.type === "listing_view") return p.registration || p.make_model || p.listing_id || "Aircraft";
  if (ev.type === "ati_generate_attempt") return p.registration || p.aircraft || "Aircraft";
  if (ev.type === "import_attempt") return p.source || p.registration || "Import";
  if (ev.type === "page_view") return p.page || "Page";
  return Object.keys(p).length ? Object.values(p).join(" · ") : "—";
}

export default function ActivitySummary() {
  const { data: user } = useQuery({
    queryKey: ["auth-me-activity"],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 60000,
  });

  const { data: passports = [], isLoading: passportsLoading } = useQuery({
    queryKey: ["activity-passports", user?.id],
    queryFn: () =>
      base44.entities.ATIPassport.filter(
        { triggered_by: user.id },
        "-twin_initialized_at",
        10
      ),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const { data: behavior, isLoading: behaviorLoading } = useQuery({
    queryKey: ["activity-behavior", user?.email],
    queryFn: async () => {
      const rows = await base44.entities.UserBehavior.filter(
        { user_email: user.email },
        "-updated_date",
        1
      );
      return rows?.[0] || null;
    },
    enabled: !!user?.email,
    staleTime: 30000,
  });

  const events = (behavior?.events || [])
    .filter((e) => ["listing_view", "ati_generate_attempt", "import_attempt", "page_view"].includes(e.type))
    .slice(-12)
    .reverse();

  const avgDeal = passports.filter((p) => p.deal_score != null).length
    ? (passports.reduce((s, p) => s + (p.deal_score || 0), 0) / passports.filter((p) => p.deal_score != null).length).toFixed(1)
    : "—";

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 text-foreground">
      <div className="mx-auto max-w-[1100px] space-y-6">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
            style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)" }}>
            <Activity className="h-3 w-3 text-[#D4A017]" />
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D4A017]">My Activity</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>
            Your searches & valuations
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            One place to pick up where you left off — recent aircraft searches and valuation history.
          </p>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile icon={FileBarChart} label="Valuations" value={passports.length} accent="#D4A017" />
          <StatTile icon={TrendingUp} label="Avg deal score" value={avgDeal} accent="#22c55e" />
          <StatTile icon={Search} label="Recent searches" value={events.length} accent="#3b82f6" />
          <StatTile icon={Clock} label="Last active" value={behavior?.last_active ? fmtDate(behavior.last_active) : "—"} accent="#a855f7" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Valuation history */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FileBarChart className="h-4 w-4 text-[#D4A017]" />
                <h2 className="text-sm font-bold text-foreground">Valuation history</h2>
              </div>
              <Link to="/valuation-studio" className="text-xs font-bold text-[#D4A017] hover:underline inline-flex items-center gap-1">
                New valuation <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {passportsLoading && (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">Loading valuations…</div>
              )}
              {!passportsLoading && passports.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm text-muted-foreground mb-3">No valuations yet.</p>
                  <Link to="/valuation-studio" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#D4A017]">
                    <Zap className="h-4 w-4" /> Run your first valuation
                  </Link>
                </div>
              )}
              {passports.map((p) => {
                const dl = p.deal_label ? DEAL_LABEL_STYLE[p.deal_label] || DEAL_LABEL_STYLE.fair : null;
                return (
                  <Link
                    key={p.id}
                    to={`/twin/${encodeURIComponent(p.registration || "")}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/40 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{p.registration || "—"}</span>
                        {dl && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide"
                            style={{ background: dl.bg, border: `0.5px solid ${dl.bdr}`, color: dl.color }}>
                            {p.deal_label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-foreground mt-0.5 truncate">
                        {p.score_label || "Valued aircraft"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{fmtDate(p.twin_initialized_at || p.created_date)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-foreground">{fmtMoney(p.omvm_value)}</p>
                      {p.deal_score != null && (
                        <p className="text-[11px] text-muted-foreground">deal {p.deal_score}/10</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent searches */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-[#3b82f6]" />
                <h2 className="text-sm font-bold text-foreground">Recent searches</h2>
              </div>
              <Link to="/listings" className="text-xs font-bold text-[#3b82f6] hover:underline inline-flex items-center gap-1">
                Browse <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {behaviorLoading && (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">Loading activity…</div>
              )}
              {!behaviorLoading && events.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm text-muted-foreground mb-3">No recent searches.</p>
                  <Link to="/n-lookup" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#3b82f6]">
                    <Search className="h-4 w-4" /> Look up an aircraft
                  </Link>
                </div>
              )}
              {events.map((ev, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{eventDetail(ev)}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{eventLabel(ev.type)}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0">{fmtDate(ev.at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}