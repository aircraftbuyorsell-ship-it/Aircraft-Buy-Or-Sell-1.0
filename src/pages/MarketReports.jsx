import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Coins, History, AlertCircle, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import ScopeCard from "@/components/market-reports/ScopeCard";
import ReportView from "@/components/market-reports/ReportView";
import ReportVisualizations from "@/components/market-reports/ReportVisualizations";
import PersonalizationPanel from "@/components/market-reports/PersonalizationPanel";

const SCOPES = ["hourly", "daily", "weekly", "monthly"];

export default function MarketReports() {
  const queryClient = useQueryClient();
  const [activeReport, setActiveReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [cacheNotice, setCacheNotice] = useState(null);
  const [filters, setFilters] = useState({});

  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  // Latest token transaction → current balance
  const { data: balance } = useQuery({
    queryKey: ["token-balance", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const txs = await base44.entities.TokenTransaction.filter(
        { user_email: user.email },
        "-created_date",
        1,
      );
      return txs[0]?.balance_after ?? 0;
    },
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["market-reports", user?.email],
    enabled: !!user?.email,
    queryFn: () =>
      base44.entities.MarketReport.filter({ user_email: user.email }, "-created_date", 25),
  });

  const generateMutation = useMutation({
    mutationFn: async (scope) => {
      setErrorMsg(null);
      setCacheNotice(null);
      const res = await base44.functions.invoke("generateMarketReport", { scope, filters });
      return res.data;
    },
    onSuccess: (data) => {
      setActiveReport(data.report);
      if (data.cached) {
        setCacheNotice(`Showing the latest ${data.report.scope} report from cache — no tokens charged.`);
      }
      queryClient.invalidateQueries({ queryKey: ["market-reports"] });
      queryClient.invalidateQueries({ queryKey: ["token-balance"] });
    },
    onError: (err) => {
      const resp = err?.response?.data;
      if (resp?.error === "Insufficient tokens") {
        setErrorMsg(`You need ${resp.required} tokens but only have ${resp.balance}. Buy more tokens to continue.`);
      } else {
        setErrorMsg(resp?.error || err.message || "Failed to generate report");
      }
    },
  });

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#E8A83A]/15 border border-[#E8A83A]/30 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-[#A67C00]" />
            </div>
            <h1 className="text-2xl font-black text-[#1A1814] tracking-tight">Market Reports</h1>
          </div>
          <p className="text-sm text-[#6B6560] max-w-2xl">
            On-demand synthesized aviation market intelligence. Each report consumes tokens and pulls fresh global + local context.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8A83A]/30 bg-[#E8A83A]/10">
          <Coins className="w-4 h-4 text-[#A67C00]" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#A67C00] font-bold">Balance</p>
            <p className="text-lg font-black text-[#1A1814] leading-tight">{balance ?? "—"} <span className="text-xs font-bold text-[#6B6560]">tokens</span></p>
          </div>
          <Link
            to="/pricing"
            className="ml-3 text-[11px] font-black uppercase tracking-wide text-[#0B2D5B] hover:text-[#143C75] underline underline-offset-2"
          >
            Buy more
          </Link>
        </div>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* Cache hit notice */}
      {cacheNotice && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-800">{cacheNotice}</p>
        </div>
      )}

      {/* Personalization */}
      <PersonalizationPanel filters={filters} onChange={setFilters} />

      {/* Scope cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {SCOPES.map((s) => (
          <ScopeCard
            key={s}
            scope={s}
            balance={balance}
            isLoading={generateMutation.isPending && generateMutation.variables === s}
            disabled={generateMutation.isPending}
            onGenerate={(scope) => generateMutation.mutate(scope)}
          />
        ))}
      </div>

      {/* Active report */}
      {activeReport && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#E8A83A]" />
            <h2 className="text-sm font-black uppercase tracking-wide text-[#1A1814]">Latest Generated</h2>
          </div>
          <ReportVisualizations report={activeReport} />
          <ReportView report={activeReport} />
        </div>
      )}

      {/* History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-[#6B6560]" />
          <h2 className="text-sm font-black uppercase tracking-wide text-[#1A1814]">Report History</h2>
        </div>
        {reportsLoading ? (
          <p className="text-sm text-[#6B6560]">Loading…</p>
        ) : reports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/15 bg-white p-8 text-center">
            <p className="text-sm text-[#6B6560]">No reports yet — generate your first one above.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveReport(r)}
                className={`text-left rounded-xl border bg-white p-4 hover:shadow-md transition-all ${
                  activeReport?.id === r.id ? "border-[#E8A83A] shadow-md" : "border-black/8"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-black text-[#E8A83A]">{r.scope}</span>
                  <span className="text-[10px] text-[#AAA49C]">−{r.token_cost} tk</span>
                </div>
                <p className="font-black text-sm text-[#1A1814] line-clamp-2 mb-1">{r.title}</p>
                <p className="text-[11px] text-[#6B6560]">
                  {format(new Date(r.generated_at || r.created_date), "PPp")}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}