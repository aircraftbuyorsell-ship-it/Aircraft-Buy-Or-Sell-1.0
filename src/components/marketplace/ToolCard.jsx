import { Coins, Zap, Tag } from "lucide-react";
import { useTheme } from "@/lib/useTheme";

const CAT_LIGHT = {
  data: "bg-blue-50 text-blue-700",
  analytics: "bg-purple-50 text-purple-700",
  ai: "bg-amber-50 text-amber-700",
  compliance: "bg-red-50 text-red-700",
  valuation: "bg-green-50 text-green-700",
  communication: "bg-indigo-50 text-indigo-700",
  other: "bg-gray-50 text-gray-600",
};
const CAT_DARK = {
  data: "bg-blue-900/30 text-blue-300",
  analytics: "bg-purple-900/30 text-purple-300",
  ai: "bg-amber-900/30 text-amber-300",
  compliance: "bg-red-900/30 text-red-300",
  valuation: "bg-green-900/30 text-green-300",
  communication: "bg-indigo-900/30 text-indigo-300",
  other: "bg-gray-800/50 text-gray-400",
};

export default function ToolCard({ tool, balance, onInvoke, isDark: isDarkProp }) {
  const isDarkHook = useTheme();
  const isDark = isDarkProp !== undefined ? isDarkProp : isDarkHook;
  const insufficient = balance < tool.token_cost;
  const catStyle = isDark
    ? (CAT_DARK[tool.category] || CAT_DARK.other)
    : (CAT_LIGHT[tool.category] || CAT_LIGHT.other);

  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#ffffff" : "#1A1814";
  const textMuted = isDark ? "rgba(255,255,255,0.40)" : "#6B6560";
  const tagBg = isDark ? "rgba(255,255,255,0.08)" : "#F7F4EF";
  const divider = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";

  return (
    <div className="rounded-2xl p-5 flex flex-col hover:shadow-md transition-shadow border"
      style={{ background: cardBg, borderColor: cardBorder }}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        {tool.logo_url ? (
          <img src={tool.logo_url} alt={tool.name} className="w-10 h-10 rounded-xl object-cover" style={{ border: `1px solid ${cardBorder}` }} />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-[#E8A83A]/15 border border-[#E8A83A]/30 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-[#A67C00]" />
          </div>
        )}
        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${catStyle}`}>
          {tool.category || "other"}
        </span>
      </div>

      <h3 className="font-black text-base mb-1 tracking-tight" style={{ color: textPrimary }}>{tool.name}</h3>
      <p className="text-xs leading-relaxed mb-3 flex-1 line-clamp-3" style={{ color: textMuted }}>{tool.description}</p>

      {/* Tags */}
      {tool.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tool.tags.slice(0, 4).map((tag, i) => (
            <span key={i} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ background: tagBg, color: textMuted }}>
              <Tag className="w-2.5 h-2.5" />{tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats + action */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t" style={{ borderColor: divider }}>
        <div className="flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-[#A67C00]" />
          <span className="text-sm font-black" style={{ color: textPrimary }}>{tool.token_cost}</span>
          <span className="text-xs" style={{ color: textMuted }}>tokens/call</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px]" style={{ color: isDark ? "rgba(255,255,255,0.30)" : "#AAA49C" }}>{(tool.invocation_count || 0).toLocaleString()} calls</span>
          <button
            onClick={onInvoke}
            disabled={insufficient}
            className="h-8 px-4 rounded-xl text-xs font-black uppercase tracking-wide transition-colors"
            style={insufficient
              ? { background: isDark ? "rgba(255,255,255,0.06)" : "#F7F4EF", color: isDark ? "rgba(255,255,255,0.25)" : "#AAA49C", cursor: "not-allowed" }
              : { background: "#0B2D5B", color: "#ffffff" }}
          >
            {insufficient ? "Low balance" : "Use"}
          </button>
        </div>
      </div>
    </div>
  );
}