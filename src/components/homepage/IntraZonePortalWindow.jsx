import { Link } from "react-router-dom";
import { CircleCheck, Plane } from "lucide-react";

// Near-black glass "portal" window — must stay darker than the surrounding transition gradient.
export default function IntraZonePortalWindow() {
  return (
    <div
      className="mx-auto w-full max-w-4xl rounded-2xl border border-white/10 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8"
      style={{ background: "rgba(10,14,22,0.96)" }}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">IntraZone · Aircraft Intelligence Workspace</span>
        <span className="hidden rounded-full border border-white/10 px-2.5 py-1 text-[9px] uppercase tracking-widest text-white/40 sm:block">Live preview</span>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[11px] text-white/80">
        <Plane size={14} className="text-[#F5C842]" />
        <strong className="text-white">N721AB</strong>
        <span className="text-white/50">·</span>
        <span>Phenom 300E</span>
        <span className="text-white/50">·</span>
        <span className="text-white/60">Opportunity AB-1042</span>
        <span className="ml-auto rounded-full border border-[#F5C842]/30 bg-[#F5C842]/10 px-2.5 py-0.5 font-bold text-[#F5C842]">ATI 84</span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
        {["ATI Assessment", "Registry Evidence", "Market Valuation", "Ownership Context", "Documents", "Workflow", "Integrations", "Reports"].map((label) => (
          <div key={label} className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-white/65">
            <CircleCheck size={11} className="shrink-0 text-emerald-400/70" /> {label}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/demo" className="rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-[11px] font-semibold text-white/85 hover:bg-white/10">Open Interactive Demo</Link>
        <Link to="/intrazone" className="rounded-lg bg-[#F5C842] px-5 py-2.5 text-[11px] font-bold text-[#0b111a] hover:opacity-90">Enter Workspace</Link>
      </div>
    </div>
  );
}