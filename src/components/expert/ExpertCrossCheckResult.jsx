import { useCompletedCrossCheck } from "@/hooks/useExpert";
import { BadgeCheck, AlertTriangle, Quote } from "lucide-react";

export default function ExpertCrossCheckResult({ registration }) {
  const { data: crosscheck } = useCompletedCrossCheck(registration);

  if (!crosscheck) return null;

  const isConfirmed = crosscheck.verdict === "confirmed";
  const color = isConfirmed ? "#22c55e" : "#ef4444";
  const Icon = isConfirmed ? BadgeCheck : AlertTriangle;

  return (
    <div
      className="px-6 py-5"
      style={{
        borderTop: "0.5px solid rgba(245,194,66,0.12)",
        background: isConfirmed ? "rgba(34,197,94,0.03)" : "rgba(239,68,68,0.03)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon size={15} style={{ color }} />
        <p className="text-[10px] uppercase tracking-[0.12em] font-black" style={{ color }}>
          Expert CrossCheck — {isConfirmed ? "Verified by Professional" : "Discrepancy Detected"}
        </p>
      </div>

      <div className="flex items-start gap-4">
        {/* Stamp */}
        <div
          className="shrink-0 flex flex-col items-center justify-center px-4 py-3 rounded-xl"
          style={{
            background: `${color}08`,
            border: `1px solid ${color}30`,
          }}
        >
          <Icon size={28} style={{ color }} />
          <p className="text-[9px] uppercase tracking-wider font-black mt-1.5" style={{ color }}>
            {isConfirmed ? "Confirmed" : "Disputed"}
          </p>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black text-[rgba(255,255,255,0.90)] mb-1">
            {crosscheck.expert_name || "Certified Expert"}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {(crosscheck.expert_certifications || []).map(c => (
              <span
                key={c}
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(245,194,66,0.08)", color: "#f5c242", border: "0.5px solid rgba(245,194,66,0.15)" }}
              >
                {c}
              </span>
            ))}
            {crosscheck.completed_at && (
              <span className="text-[9px] text-[rgba(255,255,255,0.30)]">
                · {new Date(crosscheck.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
          {crosscheck.expert_comment && (
            <div className="flex gap-1.5 mt-2">
              <Quote size={11} className="shrink-0 mt-0.5" style={{ color: "rgba(255,255,255,0.20)" }} />
              <p className="text-[11px] text-[rgba(255,255,255,0.60)] leading-relaxed italic">
                {crosscheck.expert_comment}
              </p>
            </div>
          )}
          {isConfirmed && (
            <p className="text-[10px] text-[#22c55e] font-semibold mt-2">
              ✓ This GCR report has been independently verified by a certified aviation professional.
            </p>
          )}
          {!isConfirmed && crosscheck.disputed_fields?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {crosscheck.disputed_fields.map(f => (
                <span
                  key={f}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "0.5px solid rgba(239,68,68,0.15)" }}
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}