import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, ChevronDown, ChevronUp, X } from "lucide-react";
import MiniGlobe from "@/components/MiniGlobe";

/* ═══════════════════════════════════════
   TOKENS
═══════════════════════════════════════ */
const GOLD = "#D4A017";
const CYAN = "#00c2cb";
const MUTED = "rgba(255,255,255,0.45)";
const WHITE = "#fff";
const GLASS = {
  background: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  border: "1px solid rgba(255,255,255,0.11)",
  borderRadius: "16px",
};

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */
function scoreLeadLocally(lead) {
  let score = 0;
  if (lead.budget) score += 20;
  if (lead.notes?.length > 20) score += 10;
  if (lead.phone) score += 10;
  if (lead.aircraft_preference) score += 20;
  if (lead.source === "referral") score += 20;
  else if (lead.source === "web") score += 10;
  if (lead.name && lead.email) score += 20;
  return Math.min(score, 100);
}

function scoreTier(score) {
  if (score >= 70) return { label: "HOT", color: "#ef4444", bg: "rgba(239,68,68,0.08)" };
  if (score >= 40) return { label: "WARM", color: GOLD, bg: `${GOLD}14` };
  return { label: "COLD", color: "#3b82f6", bg: "rgba(59,130,246,0.08)" };
}

function nextAction(lead, score) {
  if (score >= 70) return { text: "Call today", icon: "📞" };
  if (score >= 40) return { text: "Send proposal", icon: "📧" };
  return { text: "Nurture sequence", icon: "🌱" };
}

const STATUS_COLORS = {
  new:         { bg: "rgba(59,130,246,0.08)",  text: "#3b82f6",  border: "rgba(59,130,246,0.2)",  dot: "#3b82f6" },
  contacted:   { bg: "rgba(212,160,23,0.08)",  text: GOLD,       border: `${GOLD}33`,             dot: GOLD },
  qualified:   { bg: "rgba(34,197,94,0.08)",   text: "#22c55e",  border: "rgba(34,197,94,0.2)",   dot: "#22c55e" },
  negotiating: { bg: "rgba(168,85,247,0.08)",  text: "#a855f7",  border: "rgba(168,85,247,0.2)",  dot: "#a855f7" },
  closed:      { bg: "rgba(255,255,255,0.04)", text: MUTED,      border: "rgba(255,255,255,0.08)", dot: MUTED },
  lost:        { bg: "rgba(239,68,68,0.06)",   text: "#ef4444",  border: "rgba(239,68,68,0.18)",  dot: "#ef4444" },
};

/* ═══════════════════════════════════════
   LEAD CARD
═══════════════════════════════════════ */
function LeadCard({ lead }) {
  const [expanded, setExpanded] = useState(false);
  const score = scoreLeadLocally(lead);
  const tier = scoreTier(score);
  const sc = STATUS_COLORS[lead.status] || STATUS_COLORS.new;
  const action = nextAction(lead, score);

  return (
    <div className="rounded-xl overflow-hidden" style={GLASS}>
      {/* Color accent border */}
      <div className="h-1" style={{ background: tier.color }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
                style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                {lead.status?.toUpperCase()}
              </span>
            </div>
            <h3 className="font-black text-sm truncate" style={{ color: WHITE }}>{lead.name}</h3>
            <p className="text-[11px] truncate" style={{ color: MUTED }}>{lead.email}</p>
          </div>
          {/* Score ring */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2"
              style={{ background: tier.bg, borderColor: tier.color }}>
              <span className="font-black text-sm" style={{ color: tier.color }}>{score}</span>
            </div>
            <span className="text-[8px] font-black tracking-wider" style={{ color: tier.color }}>{tier.label}</span>
          </div>
        </div>

        {/* Chips */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {lead.budget && (
            <div className="rounded-lg px-2.5 py-1.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>Budget</p>
              <p className="text-[11px] font-bold" style={{ color: WHITE }}>{lead.budget}</p>
            </div>
          )}
          {lead.aircraft_preference && (
            <div className="rounded-lg px-2.5 py-1.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>Interest</p>
              <p className="text-[11px] font-bold truncate" style={{ color: WHITE }}>{lead.aircraft_preference}</p>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[11px] font-bold" style={{ color: tier.color }}>
            {action.icon} {action.text}
          </p>
          <button onClick={() => setExpanded(v => !v)} style={{ color: MUTED }}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-3 space-y-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}>
          {[
            ["Source", lead.source || "—"],
            ["Phone", lead.phone || "—"],
            ["Notes", lead.notes || "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2 text-[11px]">
              <span className="font-bold w-14 shrink-0" style={{ color: MUTED }}>{k}</span>
              <span className="break-words" style={{ color: WHITE }}>{v}</span>
            </div>
          ))}
          <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: MUTED }}>Score breakdown</p>
            {[
              ["Budget stated", !!lead.budget, 20],
              ["Has preferences", !!lead.aircraft_preference, 20],
              ["Source quality", lead.source === "referral", 20],
              ["Contact complete", !!(lead.name && lead.email), 20],
              ["Notes provided", lead.notes?.length > 20, 10],
              ["Phone provided", !!lead.phone, 10],
            ].map(([label, ok, pts]) => (
              <div key={label} className="flex items-center justify-between text-[10px] mb-1">
                <span style={{ color: MUTED }}>{label}</span>
                <span className="font-bold" style={{ color: ok ? "#22c55e" : MUTED }}>{ok ? `+${pts}` : "0"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   ADD LEAD DRAWER (slide-in from right)
═══════════════════════════════════════ */
function AddLeadDrawer({ onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", budget: "", aircraft_preference: "", source: "web", notes: "", status: "new"
  });
  const mut = useMutation({
    mutationFn: d => base44.entities.Lead.create(d),
    onSuccess: () => { qc.invalidateQueries(["intrazone-leads"]); onClose(); },
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
        onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-y-auto animate-slide-in-right"
        style={{
          background: "rgba(10,22,40,0.98)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.4)",
        }}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-black" style={{ color: GOLD }}>New Lead</p>
              <h2 className="text-lg font-black" style={{ color: WHITE }}>Add Lead</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: MUTED }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {[
              { k: "name", label: "Full Name *", type: "text" },
              { k: "email", label: "Email *", type: "email" },
              { k: "phone", label: "Phone", type: "text" },
              { k: "budget", label: "Budget Range", type: "text", placeholder: "$300K–$500K" },
              { k: "aircraft_preference", label: "Aircraft Interest", type: "text", placeholder: "SEP, IFR, Cirrus SR22..." },
            ].map(({ k, label, type, placeholder }) => (
              <div key={k}>
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: MUTED }}>{label}</label>
                <input type={type} value={form[k]} onChange={set(k)} placeholder={placeholder}
                  className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none transition-colors"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: WHITE }}
                  onFocus={e => { e.target.style.borderColor = `${GOLD}60`; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.14)"; }} />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: MUTED }}>Source</label>
                <select value={form.source} onChange={set("source")}
                  className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: WHITE }}>
                  {["web","referral","partner","cold","email","phone"].map(s => <option key={s} value={s} style={{ color: "#000" }}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: MUTED }}>Status</label>
                <select value={form.status} onChange={set("status")}
                  className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: WHITE }}>
                  {["new","contacted","qualified","negotiating","closed","lost"].map(s => <option key={s} value={s} style={{ color: "#000" }}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: MUTED }}>Notes</label>
              <textarea value={form.notes} onChange={set("notes")} rows={3}
                className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: WHITE }}
                onFocus={e => { e.target.style.borderColor = `${GOLD}60`; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.14)"; }} />
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: MUTED }}>
              Cancel
            </button>
            <button
              onClick={() => mut.mutate(form)}
              disabled={!form.name || !form.email || mut.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
              style={{ background: `linear-gradient(135deg,${GOLD},#f48120)`, color: "#0a1628" }}>
              {mut.isPending ? "Saving…" : "Add Lead"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════ */
export default function LeadEngine() {
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["intrazone-leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 100),
  });

  const filtered = filter === "all" ? leads : leads.filter(l => l.status === filter);
  const scored = [...filtered].sort((a, b) => scoreLeadLocally(b) - scoreLeadLocally(a));

  const hot = leads.filter(l => scoreLeadLocally(l) >= 70).length;
  const warm = leads.filter(l => { const s = scoreLeadLocally(l); return s >= 40 && s < 70; }).length;

  return (
    <div>
      {showAdd && <AddLeadDrawer onClose={() => setShowAdd(false)} />}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total Leads", value: leads.length, color: CYAN },
          { label: "HOT (≥70)", value: hot, color: "#ef4444" },
          { label: "WARM (40–69)", value: warm, color: GOLD },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={GLASS}>
            <p className="font-black text-xl" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: MUTED }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions + Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold"
          style={{ background: `linear-gradient(135deg,${GOLD},#f48120)`, color: "#0a1628" }}>
          <Plus className="w-3.5 h-3.5" /> Add Lead
        </button>
        <div className="flex gap-1 flex-wrap">
          {["all","new","contacted","qualified","negotiating","closed","lost"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
              style={{
                color: filter === f ? WHITE : MUTED,
                background: filter === f ? `${GOLD}20` : "rgba(255,255,255,0.04)",
                border: filter === f ? `1px solid ${GOLD}40` : "1px solid rgba(255,255,255,0.08)",
              }}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <MiniGlobe size={36} label="Loading leads…" color={GOLD} />
        </div>
      )}
      {!isLoading && scored.length === 0 && (
        <div className="text-center py-12 rounded-xl" style={GLASS}>
          <p className="text-3xl mb-2">📋</p>
          <p className="font-bold" style={{ color: WHITE }}>No leads yet</p>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Add your first lead to start scoring</p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {scored.map(lead => <LeadCard key={lead.id} lead={lead} />)}
      </div>
    </div>
  );
}