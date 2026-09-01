import { AlertCircle, RefreshCw, Search, X, RadioTower } from "lucide-react";

export default function LiveTrafficHeader({
  region,
  regions,
  loading,
  aircraftCount,
  searchQuery,
  searchError,
  onSearchChange,
  onSearch,
  onClearSearch,
  onRegionChange,
  onRefresh,
}) {
  return (
    <section className="relative overflow-hidden border-b border-[#7a6248]/30 bg-[#241508] px-4 py-6 md:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(232,192,96,0.22),transparent_34%),linear-gradient(135deg,rgba(10,6,2,0.92),rgba(36,21,8,0.96))]" />
      <div className="relative z-10 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-[9px] font-black uppercase tracking-[0.25em] text-[#c8862e]">
              OpenSky Network · ADS-B · Cached Live Snapshot
            </p>
            <h1 className="text-3xl font-black uppercase tracking-[0.12em] text-[#f5e8ce] md:text-4xl">
              Live Aircraft Map
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#ede0c4]/65">
              Region-aware traffic intelligence with ABOS listing enrichment, ATI scores, and pricing signals.
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c8862e] px-5 py-3 text-sm font-black text-[#0a0602] shadow-[0_18px_45px_rgba(200,134,46,0.22)] transition hover:bg-[#e8c060] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading…" : "Refresh Feed"}
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-2xl border border-[#7a6248]/35 bg-[#1c1008]/80 p-3 shadow-2xl backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <RadioTower className="h-4 w-4 text-[#d4a030]" />
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ede0c4]/70">Region Bounding Box</p>
              </div>
              <span className="rounded-full border border-[#c8862e]/35 px-2.5 py-1 text-[10px] font-bold text-[#e8c060]">
                {aircraftCount} aircraft
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
              {regions.map((item) => {
                const active = region.label === item.label;
                return (
                  <button
                    key={item.label}
                    onClick={() => onRegionChange(item)}
                    className={`rounded-xl border px-3 py-2.5 text-left transition ${active ? "border-[#c8862e] bg-[#c8862e]/85 text-[#0a0602]" : "border-[#7a6248]/30 bg-[#140b04]/70 text-[#ede0c4]/70 hover:border-[#c8862e]/60 hover:text-[#f5e8ce]"}`}
                  >
                    <p className="text-[11px] font-black uppercase tracking-tight">{item.label}</p>
                    <p className={`mt-1 text-[9px] font-mono ${active ? "text-[#0a0602]/70" : "text-[#7a6248]"}`}>
                      {item.bbox.lamin}/{item.bbox.lomin} → {item.bbox.lamax}/{item.bbox.lomax}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-[#7a6248]/35 bg-[#1c1008]/80 p-3 shadow-2xl backdrop-blur-xl">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#ede0c4]/70">Aircraft Search</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a6248]" />
                <input
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSearch()}
                  placeholder="N-number, callsign, ICAO24, make/model"
                  className="w-full rounded-xl border border-[#7a6248]/35 bg-[#140b04]/85 py-3 pl-9 pr-9 font-mono text-[13px] text-[#f5e8ce] outline-none transition placeholder:font-sans placeholder:text-[#7a6248] focus:border-[#c8862e]"
                />
                {searchQuery && (
                  <button onClick={onClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6248] hover:text-[#ede0c4]">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={onSearch}
                disabled={!searchQuery.trim() || aircraftCount === 0}
                className="rounded-xl border border-[#c8862e]/40 bg-[#241508] px-4 text-[12px] font-black text-[#e8c060] transition hover:bg-[#c8862e]/15 disabled:opacity-40"
              >
                Find
              </button>
            </div>
            {searchError && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#c84828]">
                <AlertCircle className="h-3 w-3" /> {searchError}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}