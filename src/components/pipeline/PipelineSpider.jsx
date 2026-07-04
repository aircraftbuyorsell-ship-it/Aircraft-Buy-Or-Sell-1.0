import PipelineStep from "./PipelineStep";

// The "Spider" — vertical chain of pipeline steps
// Each step connects to the next via a vertical line
export default function PipelineSpider({ pipeline, onAction, busyStepId }) {
  const steps = pipeline.steps || [];

  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] p-5"
      style={{ background: "rgba(255,255,255,0.02)" }}>

      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(245,194,66,0.1)" }}>
          <span className="text-[10px] font-black text-[#f5c242]">AI</span>
        </div>
        <span className="text-[11px] uppercase tracking-[0.15em] font-black text-[rgba(255,255,255,0.5)]">
          Sales Workflow Pipeline
        </span>
      </div>

      {steps.length === 0 ? (
        <p className="text-[12px] text-[rgba(255,255,255,0.35)] text-center py-8">No steps defined.</p>
      ) : (
        <div className="space-y-0">
          {steps.map((step, idx) => (
            <PipelineStep
              key={step.id}
              step={step}
              index={idx}
              isLast={idx === steps.length - 1}
              onAction={onAction}
              busy={busyStepId === step.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}