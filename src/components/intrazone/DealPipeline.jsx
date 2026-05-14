import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Plus, ArrowRight } from "lucide-react";

const STAGES = ["new", "contacted", "qualified", "negotiating", "closed", "lost"];
const STAGE_LABELS = { new: "Lead", contacted: "Contacted", qualified: "Qualified", negotiating: "Negotiation", closed: "Closed", lost: "Lost" };

function priorityColor(score) {
  if (score >= 70) return { dot: "bg-red-500", border: "border-l-red-500", text: "text-red-600" };
  if (score >= 40) return { dot: "bg-amber-400", border: "border-l-amber-400", text: "text-amber-600" };
  return { dot: "bg-blue-400", border: "border-l-blue-400", text: "text-blue-600" };
}

function calcPriority(lead) {
  let s = 0;
  if (lead.budget) s += 30;
  if (lead.aircraft_preference) s += 25;
  if (lead.source === "referral") s += 25;
  if (lead.phone) s += 10;
  if (lead.notes?.length > 20) s += 10;
  return Math.min(s, 100);
}

function DealCard({ lead, onAdvance }) {
  const priority = calcPriority(lead);
  const colors = priorityColor(priority);
  const stageIdx = STAGES.indexOf(lead.status);
  const canAdvance = stageIdx < STAGES.indexOf("closed");

  return (
    <div className={`bg-white rounded-xl border border-l-4 ${colors.border} border-black/[0.07] p-3.5 space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`w-2 h-2 rounded-full ${colors.dot} shrink-0`} />
            <span className={`text-[10px] font-black uppercase tracking-wider ${colors.text}`}>Priority {priority}/100</span>
          </div>
          <p className="font-black text-[#1A1814] text-sm">{lead.name}</p>
          {lead.budget && <p className="text-[11px] text-[#6B6560]">{lead.budget}</p>}
          {lead.aircraft_preference && <p className="text-[10px] text-[#AAA49C] truncate">{lead.aircraft_preference}</p>}
        </div>
      </div>
      {canAdvance && (
        <button
          onClick={() => onAdvance(lead, STAGES[stageIdx + 1])}
          className="w-full flex items-center justify-center gap-1 py-1.5 bg-[#F7F4EF] hover:bg-[#E8A83A]/10 border border-black/[0.07] rounded-lg text-[10px] font-bold text-[#0B2D5B] transition-colors"
        >
          Move to {STAGE_LABELS[STAGES[stageIdx + 1]]} <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

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
      if (m) return acc + parseInt(m[0].replace(/,/g, ""));
      return acc;
    }, 0);

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Active Deals", value: leads.filter(l => !["closed","lost"].includes(l.status)).length },
          { label: "In Negotiation", value: byStage.negotiating.length },
          { label: "Closed Won", value: byStage.closed.length },
          { label: "Est. Pipeline", value: totalValue > 0 ? `$${(totalValue / 1000).toFixed(0)}K+` : "—" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-black/[0.07] p-4 text-center">
            <p className="font-black text-[#0B2D5B] text-xl">{s.value}</p>
            <p className="text-[10px] text-[#AAA49C] font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading && <p className="text-sm text-[#6B6560] text-center py-10">Loading pipeline…</p>}

      {/* Kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {STAGES.map(stage => (
            <div key={stage} className="w-64">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#6B6560]">{STAGE_LABELS[stage]}</span>
                  <span className="bg-[#F7F4EF] text-[#6B6560] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{byStage[stage].length}</span>
                </div>
              </div>
              <div className="space-y-2.5 min-h-[100px]">
                {byStage[stage].map(lead => (
                  <DealCard key={lead.id} lead={lead} onAdvance={(l, s) => advanceMut.mutate({ id: l.id, status: s })} />
                ))}
                {byStage[stage].length === 0 && (
                  <div className="border-2 border-dashed border-black/[0.07] rounded-xl p-4 text-center">
                    <p className="text-[10px] text-[#AAA49C]">No deals</p>
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