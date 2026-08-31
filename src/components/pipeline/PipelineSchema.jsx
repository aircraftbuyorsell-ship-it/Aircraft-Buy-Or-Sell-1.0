import React from "react";
import {
  Upload, Sparkles, UserCheck, PenTool, ShieldCheck,
  FileText, TrendingUp, Scale, CheckCircle, Flag, DollarSign,
} from "lucide-react";

// Visual schema of the Sales Pipeline "spider" —
// vertical timeline layout: gold spine, phase nodes, actor-colored step rows.

const ACTOR_META = {
  user:   { label: "You — upload / provide", color: "#a78bfa", icon: Upload },
  ai:     { label: "AI — processed automatically", color: "#f5c242", icon: Sparkles },
  expert: { label: "Certified expert", color: "#4e8ef7", icon: UserCheck },
  sign:   { label: "Digital signature", color: "#5dcaa5", icon: PenTool },
};

const SCHEMA = [
  {
    phase: "Data & Documentation",
    steps: [
      { actor: "ai",   icon: ShieldCheck, label: "Digital Twin", detail: "Registry + ADS-B + engine specs — automatically from the N-number" },
      { actor: "user", icon: Upload,      label: "Document Upload", detail: "Logbooks, airworthiness, registration, W&B — photo or PDF" },
    ],
  },
  {
    phase: "AI Verification",
    steps: [
      { actor: "ai", icon: FileText,    label: "Logbook Review", detail: "Record completeness, gaps in history, hour consistency checks" },
      { actor: "ai", icon: ShieldCheck, label: "Damage History", detail: "Form 337, NTSB, accidents and repairs — cross-checked" },
      { actor: "ai", icon: CheckCircle, label: "AD / SB / STC", detail: "Compliance check of directives and bulletins, overdue items" },
    ],
  },
  {
    phase: "Valuation",
    steps: [
      { actor: "ai", icon: TrendingUp, label: "ATI Scoring + Valuation", detail: "8 transparency dimensions + market estimate from comparables" },
    ],
  },
  {
    phase: "Contract & Signature",
    steps: [
      { actor: "ai",   icon: Scale,   label: "Contract Generation", detail: "Agent fills the official template (FAA / EASA / CAA) from Twin data" },
      { actor: "sign", icon: PenTool, label: "Digital Signature", detail: "E-signature by all parties with audit trail — no printing or scanning" },
    ],
  },
  {
    phase: "Inspection & Closing",
    steps: [
      { actor: "expert", icon: UserCheck,  label: "Pre-buy Inspection", detail: "Certified A&P / IA from the expert network — booked in one click" },
      { actor: "user",   icon: DollarSign, label: "Escrow Payment", detail: "Stripe or USDC — funds held in escrow until handover" },
      { actor: "sign",   icon: Flag,       label: "Transfer & Closing", detail: "Bill of Sale, registration change, final signatures" },
    ],
  },
];

export default function PipelineSchema() {
  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] p-5"
      style={{ background: "rgba(255,255,255,0.02)" }}>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {Object.entries(ACTOR_META).map(([key, meta]) => (
          <div key={key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: `${meta.color}0D`, border: `0.5px solid ${meta.color}30` }}>
            <meta.icon className="w-3 h-3" style={{ color: meta.color }} />
            <span className="text-[10px] font-semibold" style={{ color: meta.color }}>{meta.label}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative pl-8">
        {/* Spine */}
        <div className="absolute left-[13px] top-2 bottom-2 w-px"
          style={{ background: "linear-gradient(to bottom, rgba(245,194,66,0.5), rgba(245,194,66,0.08))" }} />

        <div className="space-y-6">
          {SCHEMA.map((phase, pi) => (
            <div key={pi} className="relative">
              {/* Phase node on the spine */}
              <div className="absolute -left-8 top-0 w-[27px] flex justify-center">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{
                    background: "rgba(245,194,66,0.12)",
                    border: "1px solid rgba(245,194,66,0.45)",
                    color: "#f5c242",
                  }}>
                  {pi + 1}
                </div>
              </div>

              <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[rgba(255,255,255,0.55)] mb-2 leading-6">
                {phase.phase}
              </p>

              {/* Step rows */}
              <div className="space-y-1.5">
                {phase.steps.map((step, si) => {
                  const actor = ACTOR_META[step.actor];
                  return (
                    <div key={si} className="flex items-start gap-3 rounded-lg px-3 py-2"
                      style={{
                        background: "rgba(255,255,255,0.025)",
                        borderLeft: `2px solid ${actor.color}`,
                      }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${actor.color}14` }}>
                        <step.icon className="w-3.5 h-3.5" style={{ color: actor.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-[rgba(255,255,255,0.88)] leading-tight">
                          {step.label}
                        </p>
                        <p className="text-[10px] text-[rgba(255,255,255,0.45)] leading-relaxed mt-0.5">
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}