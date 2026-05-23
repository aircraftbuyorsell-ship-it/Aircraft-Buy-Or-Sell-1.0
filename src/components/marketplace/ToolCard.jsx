import { Coins, Zap, Tag } from "lucide-react";

const CATEGORY_COLORS = {
  data:          "bg-blue-50 text-blue-700",
  analytics:     "bg-purple-50 text-purple-700",
  ai:            "bg-[#E8A83A]/15 text-[#A67C00]",
  compliance:    "bg-red-50 text-red-700",
  valuation:     "bg-green-50 text-green-700",
  communication: "bg-indigo-50 text-indigo-700",
  other:         "bg-gray-50 text-gray-600",
};

export default function ToolCard({ tool, balance, onInvoke }) {
  const insufficient = balance < tool.token_cost;
  const catStyle = CATEGORY_COLORS[tool.category] || CATEGORY_COLORS.other;

  return (
    <div className="rounded-2xl border border-black/8 bg-white p-5 flex flex-col hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        {tool.logo_url ? (
          <img src={tool.logo_url} alt={tool.name} className="w-10 h-10 rounded-xl object-cover border border-black/8" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-[#E8A83A]/15 border border-[#E8A83A]/30 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-[#A67C00]" />
          </div>
        )}
        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${catStyle}`}>
          {tool.category || "other"}
        </span>
      </div>

      <h3 className="font-black text-[#1A1814] text-base mb-1 tracking-tight">{tool.name}</h3>
      <p className="text-xs text-[#6B6560] leading-relaxed mb-3 flex-1 line-clamp-3">{tool.description}</p>

      {/* Tags */}
      {tool.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tool.tags.slice(0, 4).map((tag, i) => (
            <span key={i} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#F7F4EF] text-[#6B6560]">
              <Tag className="w-2.5 h-2.5" />{tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats + action */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-black/5">
        <div className="flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-[#A67C00]" />
          <span className="text-sm font-black text-[#1A1814]">{tool.token_cost}</span>
          <span className="text-xs text-[#6B6560]">tokens/call</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#AAA49C]">{(tool.invocation_count || 0).toLocaleString()} calls</span>
          <button
            onClick={onInvoke}
            disabled={insufficient}
            className={`h-8 px-4 rounded-xl text-xs font-black uppercase tracking-wide transition-colors ${
              insufficient
                ? "bg-[#F7F4EF] text-[#AAA49C] border border-black/5 cursor-not-allowed"
                : "bg-[#0B2D5B] hover:bg-[#143C75] text-white"
            }`}
          >
            {insufficient ? "Low balance" : "Use"}
          </button>
        </div>
      </div>
    </div>
  );
}