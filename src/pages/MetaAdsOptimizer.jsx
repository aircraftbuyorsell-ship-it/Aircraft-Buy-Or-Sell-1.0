import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Megaphone, Loader2, Play, Eye, Zap, AlertTriangle, CheckCircle2,
} from "lucide-react";
import AccountSelector from "@/components/meta-ads/AccountSelector";
import AdsetTable from "@/components/meta-ads/AdsetTable";
import OptimizationRules from "@/components/meta-ads/OptimizationRules";
import AdjustmentLog from "@/components/meta-ads/AdjustmentLog";

export default function MetaAdsOptimizer() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [adsets, setAdsets] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingAdsets, setLoadingAdsets] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [running, setRunning] = useState(false);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [error, setError] = useState("");
  const [rules, setRules] = useState({
    targetCpl: 50,
    increasePct: 20,
    decreasePct: 15,
    minBudget: 5,
    maxBudget: 500,
    lookbackDays: 7,
  });

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
        await fetchAccounts();
        await fetchLogs();
      }
      setLoadingAccounts(false);
    });
  }, []);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    setError("");
    try {
      const res = await base44.functions.invoke("metaAdsBudgetOptimizer", { action: "list_accounts" });
      const accts = res.data.accounts || [];
      setAccounts(accts);
      if (accts.length > 0 && !selectedAccountId) setSelectedAccountId(accts[0].account_id);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load ad accounts");
    }
    setLoadingAccounts(false);
  };

  const fetchAdsets = useCallback(async () => {
    if (!selectedAccountId) return;
    setLoadingAdsets(true);
    setAdjustments([]);
    setHasPreviewed(false);
    setError("");
    try {
      const res = await base44.functions.invoke("metaAdsBudgetOptimizer", {
        action: "list_adsets",
        accountId: selectedAccountId,
        lookbackDays: Number(rules.lookbackDays),
      });
      setAdsets(res.data.adsets || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load ad sets");
      setAdsets([]);
    }
    setLoadingAdsets(false);
  }, [selectedAccountId, rules.lookbackDays]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await base44.functions.invoke("metaAdsBudgetOptimizer", { action: "log" });
      setLogs(res.data.logs || []);
    } catch {
      setLogs([]);
    }
    setLoadingLogs(false);
  };

  useEffect(() => {
    if (selectedAccountId) fetchAdsets();
  }, [selectedAccountId, fetchAdsets]);

  const runOptimization = async (dryRun) => {
    setRunning(true);
    setError("");
    try {
      const res = await base44.functions.invoke("metaAdsBudgetOptimizer", {
        action: "optimize",
        accountId: selectedAccountId,
        targetCpl: Number(rules.targetCpl),
        increasePct: Number(rules.increasePct),
        decreasePct: Number(rules.decreasePct),
        minBudget: Number(rules.minBudget),
        maxBudget: Number(rules.maxBudget),
        lookbackDays: Number(rules.lookbackDays),
        dryRun,
      });
      const result = (res.data.results || [])[0] || {};
      setAdjustments(result.adjustments || []);
      setHasPreviewed(true);
      if (!dryRun) await fetchLogs();
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Optimization failed");
    }
    setRunning(false);
  };

  if (loadingAccounts) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-5 h-5 animate-spin text-[#f5c242]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <Megaphone className="w-10 h-10 text-[#1877f2] mb-3" />
        <h2 className="text-lg font-bold text-white/90 mb-2">Sign in required</h2>
        <p className="text-sm text-white/50 mb-4 max-w-sm">
          Sign in to manage Meta Ads budget optimization.
        </p>
        <button
          onClick={() => base44.auth.redirectToLogin()}
          className="px-4 py-2 rounded-lg text-sm font-bold"
          style={{ background: "#1877f2", color: "#fff" }}
        >
          Sign in
        </button>
      </div>
    );
  }

  const increaseCount = adjustments.filter((a) => a.action === "increase").length;
  const decreaseCount = adjustments.filter((a) => a.action === "decrease").length;
  const holdCount = adjustments.filter((a) => a.action === "hold").length;

  return (
    <div className="min-h-screen" style={{ background: "transparent", color: "rgba(255,255,255,0.90)" }}>
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(24,119,242,0.10)", border: "0.5px solid rgba(24,119,242,0.22)" }}
          >
            <Zap size={20} style={{ color: "#1877f2" }} />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#1877f2]">Meta Ads Automation</p>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white/90">Budget Optimizer</h1>
          </div>
        </div>
        <p className="text-[13px] text-white/50 max-w-2xl">
          Automatically adjust ad set daily budgets based on aircraft lead conversion performance.
          High-converting ad sets get budget increases; underperformers get trimmed — capped by your rules.
          Runs daily at 09:00 via automation.
        </p>
      </div>

      {error && (
        <div className="px-4 md:px-8 pb-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-red-300"
            style={{ background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.20)" }}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
          </div>
        </div>
      )}

      <div className="px-4 md:px-8 pb-10 grid lg:grid-cols-[1fr_320px] gap-5">
        {/* Left: ad sets + actions */}
        <div className="space-y-4">
          {/* Account + ad sets */}
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between mb-3 gap-3">
              <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 shrink-0">Ad Account</p>
              <div className="flex-1 max-w-xs">
                <AccountSelector
                  accounts={accounts}
                  selectedAccountId={selectedAccountId}
                  onSelect={setSelectedAccountId}
                  loading={loadingAccounts}
                />
              </div>
            </div>
            <AdsetTable adsets={adsets} adjustments={adjustments} loading={loadingAdsets} hasPreviewed={hasPreviewed} />
          </div>

          {/* Summary + action buttons */}
          {hasPreviewed && adjustments.length > 0 && (
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-4 mb-3">
                <SummaryPill label="Increase" count={increaseCount} color="#5dcaa5" />
                <SummaryPill label="Decrease" count={decreaseCount} color="#e24b4a" />
                <SummaryPill label="Hold" count={holdCount} color="#888" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => runOptimization(false)}
                  disabled={running}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-30"
                  style={{ background: "#1877f2", color: "#fff" }}
                >
                  {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Apply Adjustments
                </button>
                <button
                  onClick={() => runOptimization(true)}
                  disabled={running}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors hover:bg-white/5 disabled:opacity-30"
                  style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.70)" }}
                >
                  <Eye className="w-4 h-4" /> Re-preview
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: rules + log */}
        <div className="space-y-4">
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-3">Optimization Rules</p>
            <OptimizationRules rules={rules} onChange={setRules} />
            <button
              onClick={() => runOptimization(true)}
              disabled={running || !selectedAccountId}
              className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-30"
              style={{ background: "#f5c242", color: "#04060a" }}
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Preview Adjustments
            </button>
          </div>

          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}
          >
            <AdjustmentLog logs={logs} loading={loadingLogs} onRefresh={fetchLogs} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryPill({ label, count, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-[11px] font-bold text-white/70">{count}</span>
      <span className="text-[10px] text-white/40">{label}</span>
    </div>
  );
}