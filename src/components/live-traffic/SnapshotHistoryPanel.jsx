import { useState } from "react";
import { History, Clock, ChevronDown, ChevronUp, Table2, Radar } from "lucide-react";

export default function SnapshotHistoryPanel({ snapshots, onLoad }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("table");

  if (!snapshots.length) return null;

  return (
    <div className="max-w-7xl mx-auto mt-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 text-sm font-black text-[#0B2D5B] dark:text-white uppercase tracking-wider hover:text-[#E8A83A] transition"
        >
          <History className="w-4 h-4" />
          Historical Snapshots ({snapshots.length})
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {open && (
          <div className="flex items-center gap-1 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-1.5 py-1">
            <button onClick={() => setView("table")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${view === "table" ? "bg-[#0B2D5B] text-white" : "text-[#6B6560] dark:text-white/40 hover:text-[#0B2D5B] dark:hover:text-white"}`}>
              <Table2 className="w-3 h-3" /> Table
            </button>
            <button onClick={() => setView("cards")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${view === "cards" ? "bg-[#0B2D5B] text-white" : "text-[#6B6560] dark:text-white/40 hover:text-[#0B2D5B] dark:hover:text-white"}`}>
              <Clock className="w-3 h-3" /> Cards
            </button>
          </div>
        )}
      </div>

      {open && view === "table" && (
        <div className="mt-3 bg-white dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F7F4EF] dark:bg-white/[0.04] border-b border-black/[0.06] dark:border-white/[0.06]">
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#6B6560] dark:text-white/40">Region</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#6B6560] dark:text-white/40">Aircraft Count</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#6B6560] dark:text-white/40">Captured At</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#6B6560] dark:text-white/40">Refreshed By</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s, i) => (
                <tr key={s.id}
                  className={`border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-[#FFF9EE] dark:hover:bg-white/[0.04] transition-colors ${i % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-[#FAFAF8] dark:bg-white/[0.02]"}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#E8A83A]" />
                      <span className="font-bold text-[#1A1814] dark:text-white">{s.region_label || s.region_key}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-black text-[#0B2D5B] dark:text-white">{s.total_raw ?? "?"}</span>
                    <span className="text-[#AAA49C] dark:text-white/30 text-xs ml-1">aircraft</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[#6B6560] dark:text-white/40">
                      <Clock className="w-3.5 h-3.5 text-[#AAA49C] dark:text-white/25" />
                      <span className="text-[12px]">
                        {s.refreshed_at ? new Date(s.refreshed_at).toLocaleString("cs-CZ", { dateStyle: "short", timeStyle: "short" }) : "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[#AAA49C] dark:text-white/25 font-mono">{s.refreshed_by || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onLoad(s)}
                      className="flex items-center gap-1.5 ml-auto text-[11px] font-bold text-[#0B2D5B] dark:text-white bg-[#F0EDE6] dark:bg-white/10 hover:bg-[#E8A83A] hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Radar className="w-3 h-3" /> Load
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && view === "cards" && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {snapshots.map((s) => (
            <button
              key={s.id}
              onClick={() => { onLoad(s); setOpen(false); }}
              className="text-left rounded-2xl border border-black/[0.07] dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-4 py-3 hover:border-[#E8A83A] hover:shadow-md transition"
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-[#E8A83A]">{s.region_label || s.region_key}</p>
              <p className="text-sm font-bold text-[#1A1814] dark:text-white mt-0.5">{s.total_raw ?? "?"} aircraft</p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-[#6B6560] dark:text-white/40">
                <Clock className="w-3 h-3" />
                {s.refreshed_at ? new Date(s.refreshed_at).toLocaleString() : "Unknown time"}
              </div>
              {s.refreshed_by && <p className="text-[10px] text-[#AAA49C] dark:text-white/25 mt-0.5">{s.refreshed_by}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}