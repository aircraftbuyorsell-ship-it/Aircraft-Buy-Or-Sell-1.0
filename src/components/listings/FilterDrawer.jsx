import { useState, useEffect } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";

export default function FilterDrawer({ open, onClose, onApply, makes, makeFilter, minATI, regRegion }) {
  const [localMake, setLocalMake] = useState(makeFilter);
  const [localATI, setLocalATI] = useState(minATI);
  const [localReg, setLocalReg] = useState(regRegion);

  // Sync local state from parent whenever the drawer opens
  useEffect(() => {
    if (open) {
      setLocalMake(makeFilter);
      setLocalATI(minATI);
      setLocalReg(regRegion);
    }
  }, [open, makeFilter, minATI, regRegion]);

  const activeCount = (localMake ? 1 : 0) + (localATI > 0 ? 1 : 0) + (localReg !== "all" ? 1 : 0);

  const handleApply = () => {
    onApply({ makeFilter: localMake, minATI: localATI, regRegion: localReg });
  };

  const handleClear = () => {
    setLocalMake("");
    setLocalATI(0);
    setLocalReg("all");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 transition-transform duration-300 ease-out flex flex-col"
        style={{
          width: "100%",
          maxWidth: "360px",
          background: "#0d1117",
          borderLeft: "0.5px solid rgba(255,255,255,0.08)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          boxShadow: "-12px 0 48px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-4 h-4" style={{ color: "#f5c242" }} />
            <span className="text-sm font-bold text-white">Filters</span>
            {activeCount > 0 && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "#f5c242", color: "#04060a" }}
              >
                {activeCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}
            aria-label="Close filters"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Registration */}
          <div>
            <label
              className="text-[10px] uppercase tracking-wider font-semibold block mb-1.5"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Registration
            </label>
            <select
              value={localReg}
              onChange={(e) => setLocalReg(e.target.value)}
              className="w-full rounded-lg text-[13px] h-9 px-3 outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                color: "#fff",
              }}
            >
              <option value="all">All registrations</option>
              <option value="faa">🇺🇸 FAA (N-Reg)</option>
              <option value="easa">🇪🇺 EASA (EU)</option>
            </select>
          </div>

          {/* Manufacturer */}
          <div>
            <label
              className="text-[10px] uppercase tracking-wider font-semibold block mb-1.5"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Manufacturer
            </label>
            <BottomSheetSelect
              label="Filter by make"
              value={localMake}
              onChange={setLocalMake}
              options={[{ value: "", label: "All manufacturers" }, ...makes.map((m) => ({ value: m, label: m }))]}
              placeholder="All manufacturers"
              className="w-full"
            />
          </div>

          {/* ATI Score */}
          <div>
            <label
              className="text-[10px] uppercase tracking-wider font-semibold block mb-1.5"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Min ATI Score: <span style={{ color: "#f5c242", fontWeight: 700 }}>{localATI}</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={localATI}
              onChange={(e) => setLocalATI(+e.target.value)}
              className="w-full accent-[#f5c242] touch-target-compact"
            />
          </div>

          {/* Clear */}
          {activeCount > 0 && (
            <button
              onClick={handleClear}
              className="text-[11px] font-semibold hover:underline"
              style={{ color: "#e24b4a" }}
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4" style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={handleApply}
            className="w-full py-2.5 rounded-lg text-[13px] font-bold transition-all hover:brightness-105"
            style={{ background: "#f5c242", color: "#04060a" }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}