import { X, Landmark } from "lucide-react";
import LeasingCalculatorPanel from "@/components/leasing/LeasingCalculatorPanel";

/**
 * Inline leasing calculator launched from the dashboard Quick Access strip,
 * so users can run the numbers instantly without leaving the dashboard.
 */
export default function LeasingCalculatorModal({ open, onClose }) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[70]" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div className="pointer-events-auto w-full sm:max-w-5xl rounded-t-2xl sm:rounded-2xl shadow-2xl safe-bottom overflow-hidden max-h-[94vh] flex flex-col"
          style={{ background: "#0B0F1A", border: "0.5px solid rgba(255,255,255,0.08)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#3b82f6" }}>
                <Landmark className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: "#f5c242" }}>ABOS Aviation Finance</p>
                <h3 className="text-base font-black uppercase tracking-tight" style={{ color: "rgba(255,255,255,0.95)" }}>Leasing Calculator</h3>
              </div>
            </div>
            <button onClick={onClose} style={{ color: "rgba(255,255,255,0.45)" }} className="hover:opacity-80">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5" style={{ color: "#fff", fontFamily: "Inter, -apple-system, sans-serif" }}>
            <LeasingCalculatorPanel />
          </div>
        </div>
      </div>
    </>
  );
}