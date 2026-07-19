import { Loader2, History, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import moment from "moment";

export default function AdjustmentLog({ logs, loading, onRefresh }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 flex items-center gap-1.5">
          <History className="w-3 h-3" /> Adjustment History
        </p>
        <button onClick={onRefresh} className="text-[10px] text-white/40 hover:text-white/70">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-white/30" />
        </div>
      ) : logs.length === 0 ? (
        <p className="text-[11px] text-white/35 text-center py-6">No budget adjustments logged yet.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {logs.map((log) => {
            const isIncrease = log.outputs?.action === "increase";
            const isDecrease = log.outputs?.action === "decrease";
            const color = isIncrease ? "#5dcaa5" : isDecrease ? "#e24b4a" : "#888";
            const Icon = isIncrease ? TrendingUp : isDecrease ? TrendingDown : Loader2;
            return (
              <div
                key={log.id}
                className="p-2.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-start gap-2">
                  <Icon className="w-3 h-3 mt-0.5 shrink-0" style={{ color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-white/80 truncate">{log.subject_label}</p>
                    <p className="text-[10px] text-white/40 leading-snug">{log.reasoning}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-white/30">
                        {moment(log.created_date).format("MMM D, HH:mm")}
                      </span>
                      <span className="text-[9px] font-bold" style={{ color }}>
                        {log.outputs?.change_pct > 0 ? "+" : ""}{log.outputs?.change_pct}%
                      </span>
                      <span className="text-[9px] text-white/40">
                        ${log.inputs?.old_budget} → ${log.outputs?.new_budget}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}