import { Check } from "lucide-react";

const STEPS = ["Choose your goal", "Review aircraft intelligence", "Save or compare"];

export default function JourneyProgress({ intent, aircraftViewed, onReset }) {
  if (!intent) return null;
  const completed = [true, aircraftViewed, false];
  return (
    <aside className="mx-auto w-full max-w-[1400px] px-4 pb-8 sm:px-8" aria-label="Getting started progress">
      <div className="flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {STEPS.map((step, index) => (
            <div key={step} className="flex min-w-max items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${completed[index] ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>
                {completed[index] ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className="text-xs font-semibold text-foreground">{step}</span>
              {index < STEPS.length - 1 && <span className="mx-1 h-px w-5 bg-border" />}
            </div>
          ))}
        </div>
        <button type="button" onClick={onReset} className="min-h-11 text-left text-xs font-bold text-navy hover:underline dark:text-primary">Change goal</button>
      </div>
    </aside>
  );
}