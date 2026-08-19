import { RotateCcw } from "lucide-react";

/**
 * Shared header for all 4 mega-hub pages.
 * Unified design: subtle gradient card, gold accent, consistent spacing.
 */
export default function HubPageHeader({ icon: Icon, eyebrow, title, subtitle, onReset, tabCount }) {
  return (
    <div className="mb-5">
      <div
        className="relative overflow-hidden rounded-2xl border border-border p-5 md:p-6"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)/0.6) 100%)",
        }}
      >
        {/* Decorative gold glow */}
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #D4A017 0%, transparent 70%)" }}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {Icon && (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 shadow-sm"
                style={{ background: "linear-gradient(135deg,#D4A017,#A67C00)" }}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              {eyebrow && (
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4A017]">
                    {eyebrow}
                  </p>
                  {tabCount != null && (
                    <span className="rounded-full border border-[#D4A017]/20 bg-[#D4A017]/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-[#A67C00]">
                      {tabCount} tools
                    </span>
                  )}
                </div>
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
          <p className="relative mt-2.5 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}