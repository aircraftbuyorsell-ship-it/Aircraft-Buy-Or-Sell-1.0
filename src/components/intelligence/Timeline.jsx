import { Check } from "lucide-react";

/**
 * ABOS Intelligence — process timeline.
 * steps: [{ label, icon: Icon, state: "done"|"active"|"pending" }]
 * Horizontal on desktop, vertical on mobile.
 */
export default function Timeline({ steps = [] }) {
  return (
    <ol className="flex flex-col md:flex-row md:items-start gap-4 md:gap-0">
      {steps.map((step, i) => {
        const done = step.state === "done";
        const active = step.state === "active";
        const Icon = done ? Check : step.icon;
        return (
          <li key={step.label} className="flex md:flex-col md:flex-1 items-center md:items-center gap-3 md:gap-2 relative">
            {/* connector */}
            {i < steps.length - 1 && (
              <span aria-hidden className="hidden md:block absolute top-5 left-1/2 w-full h-px bg-border" />
            )}
            <span className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors
              ${done ? "bg-gold-official border-gold-official text-white"
                : active ? "border-gold-official bg-gold-bg text-gold-official"
                : "border-border bg-card text-muted-foreground"}`}>
              {Icon ? <Icon className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
            </span>
            <span className={`text-[11px] font-semibold md:text-center leading-tight ${active || done ? "text-foreground" : "text-muted-foreground"}`}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}