import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckSquare, X, ChevronDown, Loader2, ShieldCheck, Tag } from "lucide-react";

const STATUS_OPTIONS = ["active", "sold", "draft"];
const ATI_PRESETS = [
  { label: "EXCEPTIONAL (108)", value: 108 },
  { label: "STRONG BUY (93)", value: 93 },
  { label: "FAIR (78)", value: 78 },
  { label: "CAUTION (63)", value: 63 },
  { label: "RED FLAGS (45)", value: 45 },
  { label: "Clear ATI", value: null },
];

export default function BulkActionsBar({ selectedIds, onClear, allIds, onSelectAll }) {
  const queryClient = useQueryClient();
  const [showStatus, setShowStatus] = useState(false);
  const [showATI, setShowATI] = useState(false);

  const bulkMutation = useMutation({
    mutationFn: async ({ field, value }) => {
      await Promise.all(
        selectedIds.map(id => base44.entities.AircraftListing.update(id, { [field]: value }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings-public"] });
      onClear();
      setShowStatus(false);
      setShowATI(false);
    },
  });

  const count = selectedIds.length;
  const allSelected = count === allIds.length && allIds.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-[#0B2D5B] rounded-xl shadow-lg mb-3">
      {/* Select all / count */}
      <button
        onClick={allSelected ? onClear : onSelectAll}
        className="flex items-center gap-1.5 text-white/80 hover:text-white text-[11px] font-semibold transition-colors"
      >
        <CheckSquare className="w-4 h-4" />
        {allSelected ? "Deselect all" : `Select all (${allIds.length})`}
      </button>

      <div className="w-px h-4 bg-white/20" />

      <span className="text-[#E8A83A] text-[12px] font-black">
        {count} selected
      </span>

      <div className="flex-1" />

      {/* Change Status */}
      <div className="relative">
        <button
          onClick={() => { setShowStatus(v => !v); setShowATI(false); }}
          disabled={bulkMutation.isPending}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg border border-white/20 transition-colors"
        >
          <Tag className="w-3.5 h-3.5" />
          Set Status
          <ChevronDown className="w-3 h-3" />
        </button>
        {showStatus && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-black/[0.08] rounded-xl shadow-xl overflow-hidden min-w-[140px]">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => bulkMutation.mutate({ field: "status", value: s })}
                className="w-full text-left px-4 py-2.5 text-[12px] font-semibold text-[#1A1814] hover:bg-[#F7F4EF] capitalize transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Assign ATI */}
      <div className="relative">
        <button
          onClick={() => { setShowATI(v => !v); setShowStatus(false); }}
          disabled={bulkMutation.isPending}
          className="flex items-center gap-1.5 bg-[#E8A83A]/20 hover:bg-[#E8A83A]/30 text-[#E8A83A] text-[11px] font-bold px-3 py-1.5 rounded-lg border border-[#E8A83A]/40 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Set ATI Score
          <ChevronDown className="w-3 h-3" />
        </button>
        {showATI && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-black/[0.08] rounded-xl shadow-xl overflow-hidden min-w-[180px]">
            {ATI_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => bulkMutation.mutate({ field: "ati_score", value: p.value })}
                className="w-full text-left px-4 py-2.5 text-[12px] font-semibold text-[#1A1814] hover:bg-[#F7F4EF] transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {bulkMutation.isPending && (
        <Loader2 className="w-4 h-4 text-white animate-spin" />
      )}

      {/* Clear selection */}
      <button
        onClick={onClear}
        className="flex items-center gap-1 text-white/50 hover:text-white text-[11px] transition-colors"
      >
        <X className="w-3.5 h-3.5" />
        Clear
      </button>
    </div>
  );
}