import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowRight } from "lucide-react";
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
   CONSTANTS
═══════════════════════════════════════ */
const STAGES = ["new", "contacted", "qualified", "negotiating", "closed", "lost"];
const STAGE_LABELS = { new: "Lead", contacted: "Contacted", qualified: "Qualified", negotiating: "Negotiation", closed: "Closed", lost: "Lost" };
const STAGE_COLORS = {
  new: "#3b82f6", contacted: "#60A5FA", qualified: "#22c55e",
  negotiating: "#a855f7", closed: "#22c55e", lost: "#ef4444",
};

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */
function calcPriority(lead) {
  let s = 0;
  if (lead.budget) s += 30;
  if (lead.aircraft_preference) s += 25;
  if (lead.source === "referral") s += 25;
  if (lead.phone) s += 10;
  if (lead.notes?.length > 20) s += 10;
  return Math.min(s, 100);
}

function priorityColor(score) {
  if (score >= 70) return { dot: "#ef4444", border: "#ef4444", text: "#ef4444" };
  if (score >= 40) return { dot: GOLD, border: GOLD, text: GOLD };
  return { dot: "#3b82f6", border: "#3b82f6", text: "#3b82f6" };
}

/* ═══════════════════════════════════════
   DEAL CARD
═══════════════════════════════════════ */
function DealCard({ lead, onAdvance }) {
  const priority = calcPriority(lead);
  const colors = priorityColor(priority);
  const stageIdx = STAGES.indexOf(lead.status);
  const canAdvance = stageIdx < STAGES.indexOf("closed");

  return (
    <div className="rounded-xl p-3.5 space-y-2" style={{
      background: "rgba(255,255,255,0.06)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: `1px solid ${colors.border}40`,
      borderLeft: `3px solid ${colors.border}`,
    }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colors.dot }} />
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: colors.text }}>
              Priority {priority}/100
            </span>
          </div>
          <p className="font-black text-sm" style={{ color: WHITE }}>{lead.name}</p>
          {lead.budget && <p className="text-[11px]" style={{ color: MUTED }}>{lead.budget}</p>}
          {lead.aircraft_preference && <p className="text-[10px] truncate" style={{ color: MUTED }}>{lead.aircraft_preference}</p>}
        </div>
      </div>
      {canAdvance && (
        <button
          onClick={() => onAdvance(lead, STAGES[stageIdx + 1])}
          className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: MUTED,
          }}>
          Move to {STAGE_LABELS[STAGES[stageIdx + 1]]} <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════ */
export default function DealPipeline() {
  const qc = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["intrazone-leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 200),
  });

  const advanceMut = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Lead.update(id, { status }),
    onSuccess: () => qc.invalidateQueries(["intrazone-leads"]),
  });

  const byStage = STAGES.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).sort((a, b) => calcPriority(b) - calcPriority(a));
    return acc;
  }, {});

  const totalValue = leads
    .filter(l => l.budget)
    .reduce((acc, l) => {
      const m = l.budget.match(/[\d,]+/g);
      if (m) return acc + parseInt(m[m.length - 1]?.replace(/,/g, "") || "0");
      return acc;
    }, 0);

  return (
    <div>
      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Active Deals", value: leads.filter(l => !["closed","lost"].includes(l.status)).length, color: CYAN },
          { label: "In Negotiation", value: byStage.negotiating.length, color: GOLD },
          { label: "Closed Won", value: byStage.closed.length, color: "#22c55e" },
          { label: "Est. Pipeline", value: totalValue > 0 ? `$${(totalValue / 1000).toFixed(0)}K+` : "—", color: MUTED },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={GLASS}>
            <p className="font-black text-xl" style={{ color: s.color === MUTED ? WHITE : s.color }}>{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: MUTED }}>{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <MiniGlobe size={36} label="Loading pipeline…" color={GOLD} />
        </div>
      )}

      {/* Kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {STAGES.map(stage => (
            <div key={stage} className="w-64">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: stage === "lost" ? "#ef4444" : stage === "closed" ? "#22c55e" : MUTED }}>
                    {STAGE_LABELS[stage]}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${STAGE_COLORS[stage]}18`, color: STAGE_COLORS[stage] }}>
                    {byStage[stage].length}
                  </span>
                </div>
              </div>
              <div className="space-y-2.5 min-h-[100px]">
                {byStage[stage].map(lead => (
                  <DealCard key={lead.id} lead={lead} onAdvance={(l, s) => advanceMut.mutate({ id: l.id, status: s })} />
                ))}
                {byStage[stage].length === 0 && (
                  <div className="rounded-xl p-4 text-center" style={{ border: "2px dashed rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-[10px]" style={{ color: MUTED }}>No deals</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}