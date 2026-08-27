import { Check, Circle, Loader2, X } from "lucide-react";

const SKILL_LABELS = {
  invokeSkillOpex: "OPEX", invokeSkillInsurance: "Insurance", invokeSkillLeasing: "Leasing",
  invokeSkillTaxBenefit: "Tax", invokeSkillLeaseRate: "Lease Rate", invokeSkillRebuildRoi: "Rebuild ROI",
  invokeSkillInvestmentHealth: "Investment Health", invokeSkillEngineOverhaul: "Engine Overhaul",
  invokeSkillMroSchedule: "MRO Schedule", invokeSkill: "Analysis Skill",
  opex: "OPEX", insurance: "Insurance", leasing: "Leasing", tax_benefit: "Tax",
  lease_rate: "Lease Rate", rebuild_roi: "Rebuild ROI", investment_health: "Investment Health",
  engine_overhaul: "Engine Overhaul", mro_schedule: "MRO Schedule"
};

function getStatus(call) {
  let results = call.results;
  try { if (typeof results === "string") results = JSON.parse(results); } catch { /* keep raw */ }
  if (["failed", "error"].includes(call.status) || results?.success === false || /error|failed/i.test(String(results || ""))) return "failed";
  if (["pending", "running", "in_progress"].includes(call.status)) return "running";
  return "done";
}

export default function SkillPipelineChips({ toolCalls = [], visible = false }) {
  const calls = toolCalls.filter(call => SKILL_LABELS[call.name] || call.name?.startsWith("invokeSkill"));
  if (!visible && !calls.length) return null;
  const pipeline = calls.length ? calls : [{ name: "Digital Twin", status: "running" }];
  return <div className="rounded-2xl border border-border bg-card p-3 shadow-sm overflow-x-auto">
    <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" /> Skill orchestration
    </div>
    <div className="flex min-w-max items-center gap-1.5">
      {pipeline.map((call, index) => {
        const status = getStatus(call);
        let args = call.arguments_string;
        try { if (typeof args === "string") args = JSON.parse(args); } catch { /* keep raw */ }
        const skillName = args?.skill_id || args?.skill || call.name;
        const label = SKILL_LABELS[skillName] || SKILL_LABELS[call.name] || call.display_projection?.label || skillName;
        const styles = status === "running" ? "border-gold/70 bg-gold-bg text-gold animate-pulse" : status === "failed" ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
        const Icon = status === "running" ? Loader2 : status === "failed" ? X : status === "done" ? Check : Circle;
        return <div key={`${call.name}-${index}`} className="flex items-center gap-1.5">
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-2 font-mono text-[10px] font-bold ${styles}`}>
            <Icon className={`h-3 w-3 ${status === "running" ? "animate-spin" : ""}`} />{label}
          </div>
          {index < pipeline.length - 1 && <span className="finance-flow-line w-7" aria-hidden="true">→</span>}
        </div>;
      })}
    </div>
  </div>;
}