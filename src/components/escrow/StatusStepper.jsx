import { Check } from "lucide-react";
import { ESCROW_STATUS, STATUS_FLOW } from "@/lib/escrow";

export default function StatusStepper({ currentStatus }) {
  const currentOrder = ESCROW_STATUS[currentStatus]?.order ?? 0;
  const isTerminal = currentStatus === "cancelled" || currentStatus === "disputed";

  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-5">
      <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A] mb-4">
        Transaction Progress
      </p>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STATUS_FLOW.map((s, i) => {
          const cfg = ESCROW_STATUS[s];
          const done = cfg.order < currentOrder;
          const active = cfg.order === currentOrder;
          return (
            <div key={s} className="flex items-center gap-1 shrink-0">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                    active ? "scale-110 shadow-md" : ""
                  }`}
                  style={{
                    backgroundColor: done || active ? cfg.color : "white",
                    borderColor: done || active ? cfg.color : "#E5E2DC",
                  }}
                >
                  {done ? (
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  ) : (
                    <span className={`text-[10px] font-black ${active ? "text-white" : "text-[#AAA49C]"}`}>
                      {i + 1}
                    </span>
                  )}
                </div>
                <span
                  className="text-[9px] uppercase tracking-wider font-semibold text-center max-w-[70px] leading-tight"
                  style={{ color: done || active ? cfg.color : "#AAA49C" }}
                >
                  {cfg.label}
                </span>
              </div>
              {i < STATUS_FLOW.length - 1 && (
                <div
                  className="w-6 md:w-10 h-0.5 mt-[-18px]"
                  style={{ backgroundColor: done ? cfg.color : "#E5E2DC" }}
                />
              )}
            </div>
          );
        })}
      </div>
      {isTerminal && (
        <div className="mt-4 text-center">
          <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: ESCROW_STATUS[currentStatus].color }}>
            ⚠ Transaction {ESCROW_STATUS[currentStatus].label}
          </span>
        </div>
      )}
    </div>
  );
}