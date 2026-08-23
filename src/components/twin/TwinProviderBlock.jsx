import { CheckCircle, MinusCircle } from "lucide-react";

/**
 * Modular federated-provider block: shows data when available,
 * or a graceful "Data unavailable" state — never an empty block.
 * Uses semantic Tailwind tokens for automatic light/dark mode support.
 */
export default function TwinProviderBlock({ title, status, rows = [], emptyText }) {
  const ok = status === "ok";
  return (
    <div className="rounded-xl px-4 sm:px-5 py-4 bg-card border border-border">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] uppercase tracking-[0.15em] font-black text-muted-foreground">
          {title}
        </p>
        {ok ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-[#5dcaa5]">
            <CheckCircle className="w-3 h-3" /> Verified
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/50">
            <MinusCircle className="w-3 h-3" /> Data unavailable
          </span>
        )}
      </div>
      {ok ? (
        <div className="space-y-1.5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2 text-[12px] sm:text-[13px]">
              <span className="text-muted-foreground">{label}</span>
              <span className="text-foreground font-semibold sm:text-right break-words">{value ?? "—"}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-muted-foreground/60 italic">{emptyText}</p>
      )}
    </div>
  );
}