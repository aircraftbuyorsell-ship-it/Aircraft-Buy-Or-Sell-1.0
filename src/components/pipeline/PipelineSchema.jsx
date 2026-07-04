import React from "react";
import {
  Upload, Sparkles, UserCheck, PenTool, ShieldCheck,
  FileText, TrendingUp, Scale, CheckCircle, Flag, DollarSign, ArrowDown,
} from "lucide-react";

// Visual schema of the Sales Pipeline "spider" —
// steps grouped by WHO acts: user uploads, AI processes, expert verifies, signatures.

const ACTOR_META = {
  user:   { label: "Vy — nahrajete / doplníte", color: "#a78bfa", icon: Upload },
  ai:     { label: "AI — zpracuje automaticky", color: "#f5c242", icon: Sparkles },
  expert: { label: "Certifikovaný expert", color: "#4e8ef7", icon: UserCheck },
  sign:   { label: "Digitální podpis", color: "#5dcaa5", icon: PenTool },
};

const SCHEMA = [
  {
    phase: "1 · Data & Dokumentace",
    steps: [
      { actor: "ai",   icon: ShieldCheck, label: "Digital Twin", detail: "Registry + ADS-B + specifikace motoru — automaticky z N-čísla" },
      { actor: "user", icon: Upload,      label: "Nahrání dokumentace", detail: "Logbooky, airworthiness, registrace, W&B — foto nebo PDF" },
    ],
  },
  {
    phase: "2 · AI Ověření",
    steps: [
      { actor: "ai", icon: FileText,    label: "Logbook Review", detail: "Kontrola úplnosti záznamů, mezer v historii, konzistence hodin" },
      { actor: "ai", icon: ShieldCheck, label: "Damage History", detail: "Form 337, NTSB, nehody a opravy — křížová kontrola" },
      { actor: "ai", icon: CheckCircle, label: "AD / SB / STC", detail: "Compliance check směrnic a bulletinů, propadlé položky" },
    ],
  },
  {
    phase: "3 · Ocenění",
    steps: [
      { actor: "ai", icon: TrendingUp, label: "ATI Scoring + Valuace", detail: "8 dimenzí transparentnosti + tržní odhad z komparativ" },
    ],
  },
  {
    phase: "4 · Smlouva & Podpis",
    steps: [
      { actor: "ai",   icon: Scale,   label: "Generování smlouvy", detail: "Agent vyplní oficiální šablonu (FAA / EASA / CAA) z dat Twin" },
      { actor: "sign", icon: PenTool, label: "Digitální podpis", detail: "E-podpis všech stran s auditní stopou — bez tisku a skenování" },
    ],
  },
  {
    phase: "5 · Inspekce & Uzavření",
    steps: [
      { actor: "expert", icon: UserCheck,  label: "Pre-buy prohlídka", detail: "Certifikovaný A&P / IA z expertní sítě — objednání jedním klikem" },
      { actor: "user",   icon: DollarSign, label: "Escrow platba", detail: "Stripe nebo USDC — prostředky v úschově do předání" },
      { actor: "sign",   icon: Flag,       label: "Převod & uzavření", detail: "Bill of Sale, změna registrace, finální podpisy" },
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

      {/* Phases */}
      <div className="space-y-1">
        {SCHEMA.map((phase, pi) => (
          <React.Fragment key={pi}>
            <div className="relative">
              {/* Phase label */}
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[rgba(255,255,255,0.35)] mb-2">
                {phase.phase}
              </p>

              {/* Steps grid */}
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(phase.steps.length, 3)}, minmax(0, 1fr))` }}>
                {phase.steps.map((step, si) => {
                  const actor = ACTOR_META[step.actor];
                  return (
                    <div key={si} className="rounded-xl p-3 border"
                      style={{ background: `${actor.color}08`, borderColor: `${actor.color}25` }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${actor.color}15` }}>
                          <step.icon className="w-3.5 h-3.5" style={{ color: actor.color }} />
                        </div>
                        <span className="text-[12px] font-bold text-[rgba(255,255,255,0.88)] leading-tight">{step.label}</span>
                      </div>
                      <p className="text-[10px] text-[rgba(255,255,255,0.45)] leading-relaxed">{step.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connector arrow between phases */}
            {pi < SCHEMA.length - 1 && (
              <div className="flex justify-center py-1.5">
                <ArrowDown className="w-4 h-4 text-[rgba(255,255,255,0.20)]" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}