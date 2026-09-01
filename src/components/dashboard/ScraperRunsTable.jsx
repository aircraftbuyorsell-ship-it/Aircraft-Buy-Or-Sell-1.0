import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const statusStyle = {
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  running: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  failed: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function ScraperRunsTable({ runs, loading }) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4">
        Recent Scraper Runs
      </h2>
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full bg-slate-700 rounded" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <p className="text-slate-500 text-sm py-6 text-center">No scraper runs found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-700/60">
                <th className="text-left py-2 pr-4">Platform</th>
                <th className="text-right py-2 pr-4">Pages</th>
                <th className="text-right py-2 pr-4">Found</th>
                <th className="text-right py-2 pr-4">New</th>
                <th className="text-right py-2 pr-4">Updated</th>
                <th className="text-right py-2 pr-4">Errors</th>
                <th className="text-left py-2 pr-4">Status</th>
                <th className="text-left py-2">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 pr-4 font-medium text-slate-200">{r.platform || "—"}</td>
                  <td className="py-3 pr-4 text-right text-slate-400">{r.pages_crawled ?? 0}</td>
                  <td className="py-3 pr-4 text-right text-slate-400">{r.listings_found ?? 0}</td>
                  <td className="py-3 pr-4 text-right text-emerald-400 font-medium">{r.listings_new ?? 0}</td>
                  <td className="py-3 pr-4 text-right text-sky-400">{r.listings_updated ?? 0}</td>
                  <td className="py-3 pr-4 text-right text-red-400">{r.errors ?? 0}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium ${statusStyle[r.status] || statusStyle.running}`}>
                      {r.status || "—"}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500 text-xs">
                    {r.created_date ? format(new Date(r.created_date), "MMM d, HH:mm") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}