import { Loader2, Plane, Search } from "lucide-react";
import { useState } from "react";

export default function ListingPicker({ listings, selectedId, onSelect, loading }) {
  const [query, setQuery] = useState("");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-white/30" />
      </div>
    );
  }

  const filtered = query
    ? listings.filter((l) => {
        const hay = `${l.make} ${l.model} ${l.registration || ""} ${l.year || ""}`.toLowerCase();
        return hay.includes(query.toLowerCase());
      })
    : listings;

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search listings..."
          className="w-full pl-9 pr-3 py-2 rounded-lg text-xs outline-none"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "0.5px solid rgba(255,255,255,0.10)",
            color: "white",
          }}
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-[11px] text-white/35 text-center py-4">No listings found.</p>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {filtered.map((l) => {
            const isSelected = selectedId === l.id;
            const label = [l.year, l.make, l.model].filter(Boolean).join(" ");
            return (
              <button
                key={l.id}
                onClick={() => onSelect(l)}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg transition-colors text-left ${
                  isSelected ? "bg-white/8" : "hover:bg-white/4"
                }`}
                style={{
                  border: isSelected
                    ? "0.5px solid rgba(245,194,66,0.30)"
                    : "0.5px solid rgba(255,255,255,0.06)",
                }}
              >
                {l.photo_url ? (
                  <img src={l.photo_url} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: "rgba(245,194,66,0.08)" }}
                  >
                    <Plane className="w-3.5 h-3.5 text-[#f5c242]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white/80 truncate">{label}</p>
                  <p className="text-[9px] text-white/35">
                    {l.registration || "No reg"} · {l.asking_price ? `${l.currency || "USD"} ${Number(l.asking_price).toLocaleString()}` : "Price on req"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}