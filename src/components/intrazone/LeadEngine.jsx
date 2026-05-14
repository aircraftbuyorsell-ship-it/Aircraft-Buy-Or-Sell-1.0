import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Phone, Mail, Plus, Flame, TrendingUp, Minus, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_COLORS = {
  new:         { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",  dot: "bg-blue-500" },
  contacted:   { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200", dot: "bg-amber-500" },
  qualified:   { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200", dot: "bg-green-500" },
  negotiating: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200",dot: "bg-purple-500" },
  closed:      { bg: "bg-gray-50",   text: "text-gray-600",   border: "border-gray-200",  dot: "bg-gray-400" },
  lost:        { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",   dot: "bg-red-400" },
};

function scoreLeadLocally(lead) {
  let score = 0;
  if (lead.budget)               score += 20;
  if (lead.notes?.length > 20)   score += 10;
  if (lead.phone)                score += 10;
  if (lead.aircraft_preference)  score += 20;
  if (lead.source === "referral") score += 20;
  else if (lead.source === "web") score += 10;
  if (lead.name && lead.email)   score += 20;
  return Math.min(score, 100);
}

function scoreTier(score) {
  if (score >= 70) return { label: "HOT", color: "#C0392B", bg: "rgba(192,57,43,0.08)" };
  if (score >= 40) return { label: "WARM", color: "#D4A017", bg: "rgba(212,160,23,0.08)" };
  return { label: "COLD", color: "#185FA5", bg: "rgba(24,95,165,0.08)" };
}

function nextAction(lead, score) {
  if (score >= 70) return "📞 Call today";
  if (score >= 40) return "📧 Send proposal";
  return "🌱 Nurture sequence";
}

function LeadCard({ lead }) {
  const [expanded, setExpanded] = useState(false);
  const score = scoreLeadLocally(lead);
  const tier = scoreTier(score);
  const sc = STATUS_COLORS[lead.status] || STATUS_COLORS.new;

  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {lead.status?.toUpperCase()}
              </span>
            </div>
            <h3 className="font-black text-[#1A1814] text-sm truncate">{lead.name}</h3>
            <p className="text-[11px] text-[#6B6560] truncate">{lead.email}</p>
          </div>
          {/* Score ring */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2" style={{ background: tier.bg, borderColor: tier.color }}>
              <span className="font-black text-sm" style={{ color: tier.color }}>{score}</span>
            </div>
            <span className="text-[8px] font-black tracking-wider" style={{ color: tier.color }}>{tier.label}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {lead.budget && (
            <div className="bg-[#F7F4EF] rounded-lg px-2.5 py-1.5">
              <p className="text-[8px] font-bold text-[#AAA49C] uppercase tracking-wider">Budget</p>
              <p className="text-[11px] font-bold text-[#1A1814]">{lead.budget}</p>
            </div>
          )}
          {lead.aircraft_preference && (
            <div className="bg-[#F7F4EF] rounded-lg px-2.5 py-1.5">
              <p className="text-[8px] font-bold text-[#AAA49C] uppercase tracking-wider">Interest</p>
              <p className="text-[11px] font-bold text-[#1A1814] truncate">{lead.aircraft_preference}</p>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[11px] font-bold text-[#0B2D5B]">{nextAction(lead, score)}</p>
          <button onClick={() => setExpanded(v => !v)} className="text-[#AAA49C] hover:text-[#6B6560]">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-black/[0.06] px-4 py-3 bg-[#F7F4EF] space-y-1.5">
          {[
            ["Source",    lead.source || "—"],
            ["Phone",     lead.phone || "—"],
            ["Notes",     lead.notes || "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2 text-[11px]">
              <span className="text-[#AAA49C] font-bold w-14 shrink-0">{k}</span>
              <span className="text-[#1A1814] break-words">{v}</span>
            </div>
          ))}
          {/* Score breakdown */}
          <div className="mt-2 pt-2 border-t border-black/[0.07]">
            <p className="text-[9px] font-bold text-[#AAA49C] uppercase tracking-wider mb-1.5">Score breakdown</p>
            {[
              ["Budget stated",    !!lead.budget, 20],
              ["Has preferences",  !!lead.aircraft_preference, 20],
              ["Source quality",   lead.source === "referral", 20],
              ["Contact complete", !!(lead.name && lead.email), 20],
              ["Notes provided",   lead.notes?.length > 20, 10],
              ["Phone provided",   !!lead.phone, 10],
            ].map(([label, ok, pts]) => (
              <div key={label} className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-[#6B6560]">{label}</span>
                <span className={`font-bold ${ok ? "text-[#0F7A56]" : "text-[#AAA49C]"}`}>{ok ? `+${pts}` : "0"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddLeadModal({ onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", phone: "", budget: "", aircraft_preference: "", source: "web", notes: "", status: "new" });
  const mut = useMutation({
    mutationFn: d => base44.entities.Lead.create(d),
    onSuccess: () => { qc.invalidateQueries(["intrazone-leads"]); onClose(); },
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="font-black text-[#0B2D5B] text-lg mb-4">New Lead</h2>
        <div className="space-y-3">
          {[
            { k: "name", label: "Full Name *", type: "text" },
            { k: "email", label: "Email *", type: "email" },
            { k: "phone", label: "Phone", type: "text" },
            { k: "budget", label: "Budget Range", type: "text", placeholder: "$300K–$500K" },
            { k: "aircraft_preference", label: "Aircraft Interest", type: "text", placeholder: "SEP, IFR, Cirrus SR22..." },
          ].map(({ k, label, type, placeholder }) => (
            <div key={k}>
              <label className="text-[10px] font-bold text-[#6B6560] uppercase tracking-wider">{label}</label>
              <input type={type} value={form[k]} onChange={set(k)} placeholder={placeholder}
                className="w-full mt-0.5 px-3 py-2 border border-black/[0.1] rounded-lg text-sm focus:outline-none focus:border-[#0B2D5B]" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#6B6560] uppercase tracking-wider">Source</label>
              <select value={form.source} onChange={set("source")} className="w-full mt-0.5 px-3 py-2 border border-black/[0.1] rounded-lg text-sm focus:outline-none">
                {["web","referral","partner","cold","email","phone"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#6B6560] uppercase tracking-wider">Status</label>
              <select value={form.status} onChange={set("status")} className="w-full mt-0.5 px-3 py-2 border border-black/[0.1] rounded-lg text-sm focus:outline-none">
                {["new","contacted","qualified","negotiating","closed","lost"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#6B6560] uppercase tracking-wider">Notes</label>
            <textarea value={form.notes} onChange={set("notes")} rows={2}
              className="w-full mt-0.5 px-3 py-2 border border-black/[0.1] rounded-lg text-sm focus:outline-none resize-none" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-black/[0.1] rounded-xl text-sm font-bold text-[#6B6560]">Cancel</button>
          <button
            onClick={() => mut.mutate(form)}
            disabled={!form.name || !form.email || mut.isPending}
            className="flex-1 py-2.5 bg-[#0B2D5B] text-white rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {mut.isPending ? "Saving…" : "Add Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} />}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total Leads", value: leads.length, icon: "👥" },
          { label: "HOT (≥70)", value: hot, icon: "🔴" },
          { label: "WARM (40–69)", value: warm, icon: "🟡" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-black/[0.07] p-4 text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="font-black text-[#0B2D5B] text-xl">{s.value}</p>
            <p className="text-[10px] text-[#AAA49C] font-bold uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0B2D5B] text-white rounded-xl text-[12px] font-bold">
          <Plus className="w-3.5 h-3.5" /> Add Lead
        </button>
        <div className="flex gap-1 flex-wrap">
          {["all","new","contacted","qualified","negotiating","closed","lost"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${filter === f ? "bg-[#0B2D5B] text-white border-[#0B2D5B]" : "bg-white text-[#6B6560] border-black/[0.1] hover:border-[#0B2D5B]"}`}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-sm text-[#6B6560] text-center py-10">Loading leads…</p>}
      {!isLoading && scored.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-black/[0.07]">
          <p className="text-3xl mb-2">📋</p>
          <p className="font-bold text-[#1A1814]">No leads yet</p>
          <p className="text-sm text-[#6B6560] mt-1">Add your first lead to start scoring</p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {scored.map(lead => <LeadCard key={lead.id} lead={lead} />)}
      </div>
    </div>
  );
}