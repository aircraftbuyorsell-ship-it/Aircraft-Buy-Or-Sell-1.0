import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Plus, Search, Video, FileText,
  CheckCircle2, AlertTriangle, Clock, ChevronRight, Download
} from "lucide-react";
import NewSessionModal from "@/components/ati-verify/NewSessionModal";

function StatusBadge({ status }) {
  const config = {
    draft: { bg: "rgba(100,116,139,0.12)", color: "#94a3b8", label: "Draft" },
    invited: { bg: "rgba(59,130,246,0.1)", color: "#60a5fa", label: "Invited" },
    in_progress: { bg: "rgba(234,179,8,0.12)", color: "#facc15", label: "In Progress" },
    completed: { bg: "rgba(34,197,94,0.1)", color: "#4ade80", label: "Completed" },
    rejected: { bg: "rgba(239,68,68,0.1)", color: "#f87171", label: "Rejected" },
    expired: { bg: "rgba(100,116,139,0.1)", color: "#64748b", label: "Expired" },
  };
  const c = config[status] || config.draft;
  return (
    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border"
      style={{ color: c.color, backgroundColor: c.bg, borderColor: `${c.color}30` }}>
      {c.label}
    </span>
  );
}

function VfyBadge({ status }) {
  if (!status) return null;
  const config = {
    verified: { bg: "rgba(34,197,94,0.1)", color: "#4ade80", icon: CheckCircle2, label: "Verified" },
    review_required: { bg: "rgba(234,179,8,0.12)", color: "#facc15", icon: AlertTriangle, label: "Review Required" },
    rejected: { bg: "rgba(239,68,68,0.1)", color: "#f87171", icon: AlertTriangle, label: "Rejected" },
  };
  const c = config[status];
  if (!c) return null;
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border"
      style={{ color: c.color, backgroundColor: c.bg, borderColor: `${c.color}30` }}>
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

  return (
    <div className="min-h-screen bg-[#0c0f1a] text-white">
      {/* Header */}
      <div className="bg-[#0f1324] border-b border-white/[0.06] sticky top-0 z-10">
        <div className="px-4 md:px-8 py-4 max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[10px] tracking-[0.2em] font-black text-[#60a5fa] uppercase">ATI Verify</p>
            <h1 className="text-xl font-bold mt-0.5">Remote Verification Dashboard</h1>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm px-4 py-2.5 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> New Session
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Sessions", value: total, icon: FileText, color: "#60a5fa" },
            { label: "Verified", value: verified, icon: CheckCircle2, color: "#4ade80" },
            { label: "Pending", value: pending, icon: Clock, color: "#facc15" },
            { label: "Needs Review", value: review, icon: AlertTriangle, color: "#f87171" },
          ].map(s => (
            <div key={s.label} className="bg-[#11162b] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
                <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">{s.label}</p>
              </div>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            placeholder="Search by session ID, registration, or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#11162b] border border-white/[0.08] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#2563eb]/40 transition-colors"
          />
        </div>

        {/* Sessions table */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-[#11162b] rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ShieldCheck className="w-12 h-12 mx-auto text-white/10 mb-4" />
            <p className="text-white/30 text-sm">No verification sessions yet.</p>
            <button onClick={() => setShowNew(true)} className="text-[#60a5fa] text-sm font-bold mt-2 hover:underline">
              Create your first session
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(s => (
              <Link key={s.id} to={`/ati-verify/${s.id}`}>
                <div className="bg-[#11162b] border border-white/[0.06] rounded-xl px-5 py-4 hover:border-[#2563eb]/30 hover:bg-[#141a33] transition-all flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#1a1f3a] border border-white/[0.08] flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4 text-[#60a5fa]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{s.session_code}</p>
                      <p className="text-[11px] text-white/40 truncate">
                        {s.seller_name || "—"} · {s.aircraft_registration || "—"} · {s.aircraft_type || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={s.status} />
                    <VfyBadge status={s.verification_status} />
                    <ChevronRight className="w-4 h-4 text-white/20" />
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