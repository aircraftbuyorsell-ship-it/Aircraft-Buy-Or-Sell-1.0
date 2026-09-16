import { AlertTriangle, FileText } from "lucide-react";

export default function AdvisorInsufficientData({ missing }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-center gap-2 text-amber-800">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="text-sm font-black">Insufficient public data — cannot score</h3>
      </div>
      <p className="mt-2 text-xs leading-5 text-amber-700/80">
        This aircraft's identity cannot be confirmed from public registry sources alone. No ATI score is shown because scoring absence would be misleading. Request the owner-provided records below to generate a real assessment.
      </p>
      {missing?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {missing.map((m) => (
            <span key={m} className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-white px-2.5 py-1 text-[10px] font-semibold text-amber-800">
              <FileText className="h-3 w-3" />
              {m}
            </span>
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-xl bg-[#c99635] px-4 py-2 text-xs font-bold text-white">Request owner records</button>
        <a href="https://www.faa.gov/" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-amber-300/60 bg-white px-4 py-2 text-xs font-bold text-amber-800">Check FAA Registry ↗</a>
      </div>
    </div>
  );
}