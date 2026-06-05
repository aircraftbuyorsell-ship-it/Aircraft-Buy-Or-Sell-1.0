import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, X, Plus, ArrowLeft, ShieldCheck, Plane, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import CompareTable from "@/components/compare/CompareTable";
import AircraftPickerModal from "@/components/compare/AircraftPickerModal";

export default function Compare() {
  const [selected, setSelected] = useState([]); // max 3 listings
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings-public"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active", visibility: "public" }, "-ati_score", 100),
  });

  const addAircraft = (listing) => {
    if (selected.length >= 3) return;
    if (selected.find(l => l.id === listing.id)) return;
    setSelected(prev => [...prev, listing]);
    setPickerOpen(false);
  };

  const removeAircraft = (id) => setSelected(prev => prev.filter(l => l.id !== id));

  return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      {/* Header */}
      <div className="px-4 md:px-8 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <Link to="/listings" className="flex items-center gap-1 text-[10px] text-[#00f5ff] font-bold uppercase tracking-wider hover:opacity-70 transition-opacity">
            <ArrowLeft className="w-3.5 h-3.5" /> Listings
          </Link>
        </div>
        <div className="flex items-end justify-between flex-wrap gap-4 mt-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#00f5ff] font-black">ATI · Side by Side</p>
            <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight leading-none mt-0.5"
              style={{ textShadow: "0 0 40px rgba(0,245,255,0.20)" }}>
              Aircraft Comparison
            </h1>
            <p className="text-white/40 text-[12px] mt-1.5">Select 2–3 aircraft to compare specs, ATI score and price.</p>
          </div>
          {selected.length < 3 && (
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wide transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg,rgba(0,245,255,0.18),rgba(0,245,255,0.06))",
                border: "1px solid rgba(0,245,255,0.40)",
                color: "#00f5ff",
                boxShadow: "0 0 24px rgba(0,245,255,0.10)",
              }}
            >
              <Plus className="w-4 h-4" />
              Add Aircraft {selected.length > 0 && `(${selected.length}/3)`}
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {selected.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.18)" }}>
            <Plane className="w-7 h-7 text-[#00f5ff]" />
          </div>
          <h2 className="text-lg font-black text-white mb-2">No aircraft selected</h2>
          <p className="text-white/40 text-sm mb-6 max-w-sm">
            Add 2 to 3 aircraft from your listings to compare their ATI scores, specs and pricing side by side.
          </p>
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wide transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg,rgba(0,245,255,0.18),rgba(0,245,255,0.06))",
              border: "1px solid rgba(0,245,255,0.40)",
              color: "#00f5ff",
            }}
          >
            <Plus className="w-4 h-4" /> Select First Aircraft
          </button>
        </div>
      )}

      {/* Compare table */}
      {selected.length > 0 && (
        <div className="px-4 md:px-8 pb-12">
          <CompareTable
            listings={selected}
            onRemove={removeAircraft}
            onAdd={selected.length < 3 ? () => setPickerOpen(true) : null}
          />
        </div>
      )}

      {/* Aircraft picker modal */}
      <AircraftPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        listings={listings}
        isLoading={isLoading}
        selectedIds={selected.map(l => l.id)}
        onSelect={addAircraft}
      />
    </div>
  );
}