import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckSquare, X, ChevronDown, Loader2, ShieldCheck, Tag } from "lucide-react";
import { useTheme } from "@/lib/useTheme";

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
  const isDark = useTheme();
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

  const dropdownStyle = isDark
    ? { background: "#1a2040", border: "1px solid rgba(255,255,255,0.12)" }
    : { background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)" };
  const dropdownItemHoverBg = isDark ? "rgba(255,255,255,0.08)" : "#F7F4EF";
  const dropdownTextColor = isDark ? "rgba(255,255,255,0.85)" : "#1A1814";

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg mb-3 border"
      style={isDark ? {
        background: "linear-gradient(135deg, #0B2D5B 0%, #102040 100%)",
        borderColor: "rgba(255,255,255,0.10)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.25)"
      } : {
        background: "linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%)",
        borderColor: "rgba(0,0,0,0.10)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
      }}>
      {/* Select all / count */}
      <button
        onClick={allSelected ? onClear : onSelectAll}
        className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
        style={{ color: isDark ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.55)" }}
      >
        <CheckSquare className="w-4 h-4" />
        {allSelected ? "Deselect all" : `Select all (${allIds.length})`}
      </button>

      <div className="w-px h-4" style={{ background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }} />

      <span className="text-[12px] font-black tracking-tight" style={{ color: isDark ? "#F5C842" : "#D4911A" }}>
        {count} selected
      </span>

      <div className="flex-1" />

      {/* Change Status */}
      <div className="relative">
        <button
          onClick={() => { setShowStatus(v => !v); setShowATI(false); }}
          disabled={bulkMutation.isPending}
          className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors"
          style={isDark
            ? { background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.85)" }
            : { background: "rgba(0,0,0,0.05)", borderColor: "rgba(0,0,0,0.15)", color: "rgba(0,0,0,0.70)" }
          }
          onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.10)"}
          onMouseLeave={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}
        >
          <Tag className="w-3.5 h-3.5" />
          Set Status
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
        {showStatus && (
          <div className="absolute right-0 top-full mt-1.5 z-50 rounded-xl overflow-hidden min-w-[140px] shadow-2xl"
            style={dropdownStyle}>
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => bulkMutation.mutate({ field: "status", value: s })}
                className="w-full text-left px-4 py-2.5 text-[12px] font-semibold capitalize transition-colors"
                style={{ color: dropdownTextColor }}
                onMouseEnter={e => e.currentTarget.style.background = dropdownItemHoverBg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
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
          className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors"
          style={{ background: "rgba(245,200,66,0.15)", borderColor: "rgba(245,200,66,0.45)", color: isDark ? "#F5C842" : "#A67C00" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(245,200,66,0.25)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(245,200,66,0.15)"}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Set ATI Score
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>
        {showATI && (
          <div className="absolute right-0 top-full mt-1.5 z-50 rounded-xl overflow-hidden min-w-[180px] shadow-2xl"
            style={dropdownStyle}>
            {ATI_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => bulkMutation.mutate({ field: "ati_score", value: p.value })}
                className="w-full text-left px-4 py-2.5 text-[12px] font-semibold transition-colors"
                style={{ color: dropdownTextColor }}
                onMouseEnter={e => e.currentTarget.style.background = dropdownItemHoverBg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {bulkMutation.isPending && (
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: isDark ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.50)" }} />
      )}

      {/* Clear selection */}
      <button
        onClick={onClear}
        className="flex items-center gap-1 text-[11px] transition-colors"
        style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}
        onMouseEnter={e => e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.70)"}
        onMouseLeave={e => e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)"}
      >
        <X className="w-3.5 h-3.5" />
        Clear
      </button>
    </div>
  );
}