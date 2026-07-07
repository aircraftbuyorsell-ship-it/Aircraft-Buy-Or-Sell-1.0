import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Plus, Search, Video, FileText,
  CheckCircle2, AlertTriangle, Clock, ChevronRight
} from "lucide-react";
import NewSessionModal from "@/components/ati-verify/NewSessionModal";

function StatusBadge({ status }) {
  const config = {
    draft: { cls: "text-slate-500 bg-slate-500/10 border-slate-500/25", label: "Draft" },
    invited: { cls: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/25", label: "Invited" },
    in_progress: { cls: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25", label: "In Progress" },
    completed: { cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25", label: "Completed" },
    rejected: { cls: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/25", label: "Rejected" },
    expired: { cls: "text-slate-500 bg-slate-500/10 border-slate-500/25", label: "Expired" },
  };
  const c = config[status] || config.draft;
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${c.cls}`}>
      {c.label}
    </span>
  );
}

function VfyBadge({ status }) {
  if (!status) return null;
  const config = {
    verified: { cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25", icon: CheckCircle2, label: "Verified" },
    review_required: { cls: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25", icon: AlertTriangle, label: "Review Required" },
    rejected: { cls: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/25", icon: AlertTriangle, label: "Rejected" },
  };
  const c = config[status];
  if (!c) return null;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${c.cls}`}>
      <Icon className="w-3 h-3" /> {c.label}
    </span>
  );
}

export default function ATIVerify() {
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["ati-verify-sessions"],
    queryFn: () => base44.entities.ATIVerifySession.list("-created_date", 100),
  });

  const filtered = sessions.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.session_code || "").toLowerCase().includes(q) ||
      (s.aircraft_registration || "").toLowerCase().includes(q) ||
      (s.seller_name || "").toLowerCase().includes(q) ||
      (s.broker_name || "").toLowerCase().includes(q)
    );
  });

  const total = sessions.length;
  const verified = sessions.filter(s => s.verification_status === "verified").length;
  const pending = sessions.filter(s => s.status === "invited" || s.status === "in_progress").length;
  const review = sessions.filter(s => s.verification_status === "review_required").length;

  const stats = [
    { label: "Total Sessions", value: total, icon: FileText, accent: "text-foreground" },
    { label: "Verified", value: verified, icon: CheckCircle2, accent: "text-emerald-600 dark:text-emerald-400" },
    { label: "Pending", value: pending, icon: Clock, accent: "text-amber-600 dark:text-amber-400" },
    { label: "Needs Review", value: review, icon: AlertTriangle, accent: "text-red-600 dark:text-red-400" },
  ];

  return (
    <div className="min-h-screen dot-grid bg-canvas text-foreground">
      {/* Official header band */}
      <div className="border-b border-border sticky top-0 z-20 glass-navbar">
        <div className="px-4 md:px-8 py-4 max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-gold-official/30 bg-gold-bg shrink-0">
              <ShieldCheck className="w-5 h-5 text-gold-official" />
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] font-bold text-gold-official uppercase">ATI Verify™</p>
              <h1 className="text-xl font-bold mt-0.5 tracking-tight">Remote Verification Dashboard</h1>
            </div>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 font-bold text-sm px-4 py-2.5 rounded-lg bg-gold-official text-white hover:opacity-90 transition-opacity cursor-pointer">
            <Plus className="w-4 h-4" /> New Session
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-6">
        {/* Stats — official record modules */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <s.icon className={`w-4 h-4 ${s.accent}`} />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
              <p className={`text-2xl font-black tabular-nums ${s.accent}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg py-3 pl-10 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold-official/40"
            placeholder="Search by session ID, registration, or name…"
            aria-label="Search verification sessions"
          />
        </div>

        {/* Sessions register */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse bg-muted" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card text-center py-16">
            <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm">No verification sessions yet.</p>
            <button onClick={() => setShowNew(true)} className="text-gold-official text-sm font-bold mt-2 hover:underline cursor-pointer">
              Create your first session
            </button>
          </div>
        ) : (
          <div className="glass-card overflow-hidden divide-y divide-border">
            {filtered.map(s => (
              <Link key={s.id} to={`/ati-verify/${s.id}`} className="block">
                <div className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-muted/60 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-gold-official/25 bg-gold-bg">
                      <Video className="w-4 h-4 text-gold-official" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{s.session_code}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {s.seller_name || "—"} · {s.aircraft_registration || "—"} · {s.aircraft_type || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={s.status} />
                    <VfyBadge status={s.verification_status} />
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <NewSessionModal open={showNew} onClose={() => { setShowNew(false); queryClient.invalidateQueries({ queryKey: ["ati-verify-sessions"] }); }} />
    </div>
  );
}