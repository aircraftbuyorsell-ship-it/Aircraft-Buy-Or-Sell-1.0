import { CheckCircle, MinusCircle } from "lucide-react";

/**
 * Modular federated-provider block: shows data when available,
 * or a graceful "Data unavailable" state — never an empty block.
 */
export default function TwinProviderBlock({ title, status, rows = [], emptyText }) {
  const ok = status === "ok";
  return (
    <div className="rounded-xl px-5 py-4"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `0.5px solid ${ok ? "rgba(93,202,165,0.2)" : "rgba(255,255,255,0.08)"}`,
      }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] uppercase tracking-[0.15em] font-black text-[rgba(255,255,255,0.7)]">
          {title}
        </p>
        {ok ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-[#5dcaa5]">
            <CheckCircle className="w-3 h-3" /> Verified
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold text-[rgba(255,255,255,0.35)]">
            <MinusCircle className="w-3 h-3" /> Data unavailable
          </span>
        )}
      </div>
      {ok ? (
        <div className="space-y-1.5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between text-[13px]">
              <span className="text-[rgba(255,255,255,0.45)]">{label}</span>
              <span className="text-[rgba(255,255,255,0.88)] font-semibold">{value ?? "—"}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-[rgba(255,255,255,0.4)] italic">{emptyText}</p>
      )}
    </div>
  );
}