import { useState, useEffect } from "react";
import { listMyReports } from "@/lib/entitlements";
import { getProduct, formatEur } from "@/lib/products";
import { FileBarChart, Loader2, ShieldCheck, TrendingUp, BadgeCheck, Download, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const ICONS = { ATI_SCORE: ShieldCheck, ATI_FULL_REPORT: FileBarChart, VALUATION_STUDIO: TrendingUp, VERIFICATION_PACK: BadgeCheck };

export default function MyReports() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    listMyReports()
      .then((res) => setReports(res.reports || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black">My Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Reports you've purchased. Re-open any time — no double charging.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <FileBarChart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold">No reports yet</p>
            <p className="text-xs text-muted-foreground mt-1">Purchase an ATI Score, Full Report, Valuation or Verification Pack to see it here.</p>
            <Link to="/pricing" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => {
              const product = getProduct(r.product_key);
              const Icon = ICONS[r.product_key] || FileBarChart;
              return (
                <div key={r.id} className="rounded-2xl border bg-card p-4 flex items-center gap-4 flex-wrap">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{r.aircraft_label || r.aircraft_registration}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {product?.name || r.product_key} · {r.aircraft_registration} · {r.status === "ready" ? "Ready" : r.status}
                      {r.confidence && ` · ${r.confidence}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(r.created_date || r.source_timestamp).toLocaleString()} · {r.provider || "abos_omvm"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.pdf_url && (
                      <a href={r.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-border hover:bg-muted">
                        <Download className="w-3.5 h-3.5" /> PDF
                      </a>
                    )}
                    <Link to={`/twin/${r.aircraft_registration}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600">
                      Open <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}