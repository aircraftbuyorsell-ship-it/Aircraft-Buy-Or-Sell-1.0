import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, ArrowLeft, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { ATI_DIMENSIONS } from "@/lib/atiDimensions";
import WizardStep from "./WizardStep";
import WizardProgress from "./WizardProgress";
import WizardSummary from "./WizardSummary";

/**
 * Multi-step ATI Wizard. Collects structured inputs + evidence for each
 * of the 8 dimensions, then calls the `orchestrateATIScoring` backend
 * function to compute the final score and persist the passport.
 */
export default function ATIWizard({ open, onClose, listing, onComplete }) {
  const qc = useQueryClient();
  const [stepIndex, setStepIndex] = useState(0); // 0..7 dimensions, 8 = summary
  const [answers, setAnswers] = useState({});
  const [evidence, setEvidence] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isSummary = stepIndex === ATI_DIMENSIONS.length;
  const dim = !isSummary ? ATI_DIMENSIONS[stepIndex] : null;

  const completedKeys = useMemo(() => {
    const set = new Set();
    ATI_DIMENSIONS.forEach((d) => {
      const a = answers[d.key];
      if (a && d.fields.some((f) => a[f.key])) set.add(d.key);
    });
    return set;
  }, [answers]);

  if (!open) return null;

  const setDimAnswers = (key, next) => setAnswers({ ...answers, [key]: next });
  const setDimEvidence = (key, next) => setEvidence({ ...evidence, [key]: next });

  const next = () => setStepIndex(Math.min(stepIndex + 1, ATI_DIMENSIONS.length));
  const back = () => setStepIndex(Math.max(stepIndex - 1, 0));

  const handleGenerate = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("orchestrateATIScoring", {
        listingId: listing.id,
        answers,
        evidence,
      });
      qc.invalidateQueries({ queryKey: ["passport", listing.id] });
      qc.invalidateQueries({ queryKey: ["listing", listing.id] });
      qc.invalidateQueries({ queryKey: ["ati-card", listing.id] });
      onComplete?.(res.data);
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Generation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-stretch md:items-center justify-center p-0 md:p-4 overflow-y-auto">
      <div className="bg-[#F7F4EF] w-full md:max-w-3xl md:rounded-2xl shadow-2xl flex flex-col max-h-screen md:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06] bg-white md:rounded-t-2xl safe-top">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">ATI Score Wizard</p>
            <h1 className="text-lg font-black text-[#1A1814] uppercase tracking-tight">
              {listing?.year} {listing?.make} {listing?.model}
            </h1>
          </div>
          <button onClick={onClose} className="text-[#6B6560] hover:text-[#1A1814]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-5 pt-3 bg-white border-b border-black/[0.06]">
          <WizardProgress
            dimensions={ATI_DIMENSIONS}
            currentIndex={stepIndex}
            onJump={setStepIndex}
            completedKeys={completedKeys}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {isSummary ? (
            <WizardSummary answers={answers} evidence={evidence} />
          ) : (
            <WizardStep
              dimension={dim}
              values={answers[dim.key] || {}}
              onChange={(v) => setDimAnswers(dim.key, v)}
              evidence={evidence[dim.key] || []}
              onEvidenceChange={(v) => setDimEvidence(dim.key, v)}
            />
          )}
          {error && (
            <div className="mt-4 bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] text-[#C0392B] text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-black/[0.06] bg-white md:rounded-b-2xl safe-bottom">
          <button
            onClick={back}
            disabled={stepIndex === 0 || submitting}
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-black text-[#6B6560] hover:text-[#1A1814] disabled:opacity-30 px-3 py-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <p className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold">
            Step {Math.min(stepIndex + 1, ATI_DIMENSIONS.length + 1)} of {ATI_DIMENSIONS.length + 1}
          </p>
          {isSummary ? (
            <button
              onClick={handleGenerate}
              disabled={submitting}
              className="flex items-center gap-1.5 bg-[#E8A83A] hover:bg-[#f5bb4e] disabled:opacity-50 text-[#0B2D5B] text-[11px] uppercase tracking-wider font-black px-4 py-2 rounded-md"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {submitting ? "Scoring…" : "Generate ATI"}
            </button>
          ) : (
            <button
              onClick={next}
              disabled={submitting}
              className="flex items-center gap-1.5 bg-[#0B2D5B] hover:bg-[#143C75] text-white text-[11px] uppercase tracking-wider font-black px-4 py-2 rounded-md"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}