import { RotateCcw } from "lucide-react";

/**
 * Shared header for all 4 mega-hub pages.
 */
export default function HubPageHeader({ icon: Icon, eyebrow, title, subtitle, onReset }) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0"
              style={{ background: "linear-gradient(135deg,#D4A017,#A67C00)" }}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            {eyebrow && (
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4A017]">
                {eyebrow}
              </p>
            )}
            <h1 className="text-xl font-black tracking-tight text-foreground md:text-2xl">
              {title}
            </h1>
          </div>
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground transition hover:bg-muted/60"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        )}
      </div>
      {subtitle && (
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}