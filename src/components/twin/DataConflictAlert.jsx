import { AlertTriangle } from "lucide-react";

export default function DataConflictAlert({ fields = [] }) {
  return (
    <div
      className="rounded-xl px-4 sm:px-5 py-4 flex items-start gap-3"
      style={{ background: "rgba(245,194,66,0.07)", border: "1px solid rgba(245,194,66,0.35)" }}
    >
      <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: "#f5c242" }} />
      <div>
        <p className="text-[12px] font-black uppercase tracking-[0.1em]" style={{ color: "#f5c242" }}>
          Unverified Data — Expert Review Recommended
        </p>
        <p className="text-[11px] mt-1 text-muted-foreground leading-relaxed">
          Independent data sources disagree on this aircraft's identity records.
          We recommend an Expert CrossCheck before relying on this report.
        </p>
        {fields.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {fields.map((f) => (
              <span key={f} className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(245,194,66,0.10)", color: "#f5c242", border: "0.5px solid rgba(245,194,66,0.25)" }}>
                {f}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}