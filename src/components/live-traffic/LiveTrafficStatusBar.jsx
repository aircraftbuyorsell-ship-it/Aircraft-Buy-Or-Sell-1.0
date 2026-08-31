import { AlertCircle, Crosshair, Plane, Satellite } from "lucide-react";

export default function LiveTrafficStatusBar({ loading, aircraftCount, dataTime, flyTarget, error }) {
  return (
    <div className="flex flex-col gap-2 border-b border-[#7a6248]/30 bg-[#1c1008] px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <Plane className="h-4 w-4 text-[#c8862e]" />
        <span className="text-sm font-black text-[#f5e8ce]">
          {loading ? "Fetching traffic snapshot…" : `${aircraftCount} aircraft tracked`}
        </span>
        {aircraftCount > 0 && !loading && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#7a6248]">
            <Satellite className="h-3 w-3" /> snapshot {dataTime?.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        {flyTarget && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4a030]/35 bg-[#d4a030]/10 px-2.5 py-1 text-[11px] font-black text-[#e8c060]">
            <Crosshair className="h-3 w-3" /> {flyTarget.faa?.n_number || flyTarget.callsign || flyTarget.icao24}
          </span>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#c84828]">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </div>
      )}
    </div>
  );
}