import { useState, useEffect } from "react";
import { X, Plane } from "lucide-react";
import PlatformTour from "@/components/PlatformTour";

const TOUR_KEY = "abos_tour_completed_v3";

export default function ABOSTour() {
  const [visible, setVisible] = useState(false);

  // Auto-open on first visit
  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for manual re-open via custom event (fired from Layout)
  useEffect(() => {
    const handler = () => { localStorage.removeItem(TOUR_KEY); setVisible(true); };
    window.addEventListener("abos-tour-open", handler);
    return () => window.removeEventListener("abos-tour-open", handler);
  }, []);

  const close = () => { localStorage.setItem(TOUR_KEY, "1"); setVisible(false); };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-3xl rounded-3xl overflow-hidden relative"
        style={{
          background: "#0B1220",
          border: "1px solid rgba(232,168,58,0.18)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}>
        {/* dot grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }} />

        <div className="relative z-10 p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(232,168,58,0.12)", border: "1px solid rgba(232,168,58,0.3)" }}>
                <Plane className="w-4 h-4" style={{ color: "#E8A83A" }} />
              </div>
              <div>
                <p className="text-[13px] font-black tracking-tight leading-none text-white">ABOS MarketSpace</p>
                <p className="text-[9px] mt-1 uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.35)" }}>Platform Tour</p>
              </div>
            </div>
            <button onClick={close}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <PlatformTour />

          <div className="flex justify-center mt-6">
            <button onClick={close}
              className="text-[11px] font-semibold underline transition-opacity hover:opacity-70"
              style={{ color: "rgba(255,255,255,0.35)" }}>
              Skip tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}