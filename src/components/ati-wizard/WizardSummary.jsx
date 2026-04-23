import { CheckCircle2, AlertCircle } from "lucide-react";
import { ATI_DIMENSIONS } from "@/lib/atiDimensions";

export default function WizardSummary({ answers, evidence }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Final Review</p>
        <h2 className="text-xl md:text-2xl font-black text-[#1A1814] uppercase tracking-tight mt-1">Review & Generate Score</h2>
        <p className="text-sm text-[#6B6560] mt-1">Check your inputs. Missing fields will lower the AI's confidence.</p>
      </div>

      <div className="space-y-2">
        {ATI_DIMENSIONS.map((d) => {
          const ans = answers[d.key] || {};
          const filled = d.fields.filter((f) => ans[f.key] != null && ans[f.key] !== "").length;
          const total = d.fields.length;
          const evidenceCount = (evidence[d.key] || []).length;
          const complete = filled === total;
          return (
            <div key={d.key} className="flex items-center gap-3 p-3 bg-white border border-black/[0.06] rounded-lg">
              {complete ? (
                <CheckCircle2 className="w-4 h-4 text-[#0F7A56] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#E8A83A] shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1A1814]">{d.label}</p>
                <p className="text-[11px] text-[#6B6560]">
                  {filled}/{total} fields · {evidenceCount} evidence file{evidenceCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}