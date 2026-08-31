import { Zap, Coins } from "lucide-react";

const CATEGORY_LABELS = {
  data: "Data", analytics: "Analytics", ai: "AI", compliance: "Compliance",
  valuation: "Valuation", communication: "Communication", other: "General",
};

export default function FeaturedToolRow({ tool, index, onRun }) {
  return (
    <div className="flex items-center gap-4 px-4 md:px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors">
      <span className="text-[10px] font-mono font-bold tabular-nums text-muted-foreground w-8 shrink-0">
        {String(index + 1).padStart(3, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13px] font-bold tracking-tight truncate">{tool.name}</p>
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border border-gold-official/25 bg-gold-bg text-gold-official uppercase tracking-wider">
            {CATEGORY_LABELS[tool.category] || "General"}
          </span>
        </div>
        {tool.description && (
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{tool.description}</p>
        )}
      </div>
      <div className="hidden sm:flex items-center gap-1 shrink-0 text-muted-foreground">
        <Coins className="w-3 h-3 text-gold-official" />
        <span className="text-[11px] font-semibold tabular-nums">{tool.token_cost} tokens</span>
      </div>
      <button onClick={() => onRun(tool)}
        className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold bg-gold-official text-white hover:opacity-90 transition-opacity cursor-pointer touch-target-compact">
        <Zap className="w-3 h-3" /> Run
      </button>
    </div>
  );
}