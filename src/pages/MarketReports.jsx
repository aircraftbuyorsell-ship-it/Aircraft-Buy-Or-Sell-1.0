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

  const { data: balance } = useQuery({
    queryKey: ["token-balance", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const txs = await base44.entities.TokenTransaction.filter(
        { user_email: user.email },
        "-created_date",
        1
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
    <div
      style={{
        minHeight: "100vh",
        background: "transparent",
        color: "#fff",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(212,160,23,0.10)",
                  border: "0.5px solid rgba(212,160,23,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp size={18} style={{ color: "#D4A017" }} />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>
                Market Reports
              </h1>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.45)",
                maxWidth: 560,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              On-demand synthesized aviation market intelligence. Each report
              consumes tokens and pulls fresh global + local context.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 10,
              border: "0.5px solid rgba(212,160,23,0.25)",
              background: "rgba(212,160,23,0.08)",
            }}
          >
            <Coins size={16} style={{ color: "#D4A017" }} />
            <div>
              <p
                style={{
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#D4A017",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Balance
              </p>
              <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                {balance ?? "—"}{" "}
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>tokens</span>
              </p>
            </div>
            <Link
              to="/pricing"
              style={{
                marginLeft: 8,
                fontSize: 11,
                fontWeight: 600,
                color: "#D4A017",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              Buy more
            </Link>
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div
            style={{
              marginBottom: 20,
              borderRadius: 10,
              border: "0.5px solid rgba(226,75,74,0.3)",
              background: "rgba(226,75,74,0.08)",
              padding: "12px 16px",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <AlertCircle size={16} style={{ color: "#e24b4a", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: "#e24b4a", margin: 0 }}>{errorMsg}</p>
          </div>
        )}

        {/* Cache hit notice */}
        {cacheNotice && (
          <div
            style={{
              marginBottom: 20,
              borderRadius: 10,
              border: "0.5px solid rgba(93,202,165,0.3)",
              background: "rgba(93,202,165,0.08)",
              padding: "12px 16px",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <Sparkles size={16} style={{ color: "#5dcaa5", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: "#5dcaa5", margin: 0 }}>{cacheNotice}</p>
          </div>
        )}

        {/* Personalization */}
        <div style={{ marginBottom: 24 }}>
          <PersonalizationPanel filters={filters} onChange={setFilters} />
        </div>

        {/* Scope cards */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          style={{ marginBottom: 32 }}
        >
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
          <div style={{ marginBottom: 32 }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4" style={{ color: "#D4A017" }} />
              <h2
                className="text-sm font-black uppercase tracking-wide"
                style={{ color: "#fff" }}
              >
                Latest Generated
              </h2>
            </div>
            <ReportVisualizations report={activeReport} />
            <ReportView report={activeReport} />
          </div>
        )}

        {/* History */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4" style={{ color: "rgba(255,255,255,0.45)" }} />
            <h2
              className="text-sm font-black uppercase tracking-wide"
              style={{ color: "#fff" }}
            >
              Report History
            </h2>
          </div>
          {reportsLoading ? (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Loading…</p>
          ) : reports.length === 0 ? (
            <div
              style={{
                borderRadius: 12,
                border: "0.5px dashed rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.02)",
                padding: 32,
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>
                No reports yet — generate your first one above.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setActiveReport(r)}
                  className="text-left rounded-xl p-4 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border:
                      activeReport?.id === r.id
                        ? "0.5px solid #f5c242"
                        : "0.5px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[10px] uppercase tracking-wider font-black"
                      style={{ color: "#D4A017" }}
                    >
                      {r.scope}
                    </span>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                      −{r.token_cost} tk
                    </span>
                  </div>
                  <p className="font-black text-sm text-white line-clamp-2 mb-1">{r.title}</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {format(new Date(r.generated_at || r.created_date), "PPp")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}