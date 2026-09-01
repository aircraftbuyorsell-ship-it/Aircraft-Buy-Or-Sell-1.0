import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Database, FileText, Zap, CheckCircle2, AlertTriangle, Lock, Crown, RefreshCw, Loader2, XCircle } from "lucide-react";
import WebhooksConfig from "@/components/settings/WebhooksConfig";
import AutoScoringPanel from "@/components/settings/AutoScoringPanel";
import FeatureTogglePanel from "@/components/settings/FeatureTogglePanel";
import { isAdminRole } from "@/utils/roles";

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [frozen, setFrozen] = useState(true);
  const [saved, setSaved] = useState(false);

  // ── AppConfig dedupe state ──
  // Cleans up leftover duplicate key:"global" (and other) AppConfig rows left
  // behind by the historical Save-mutation race condition. Dry-run first,
  // then confirm. See base44/functions/dedupeAppConfig for details.
  const [dedupeReport, setDedupeReport] = useState(null);
  const [dedupeLoading, setDedupeLoading] = useState(false);

  const runDedupeCheck = async () => {
    setDedupeLoading(true);
    try {
      const res = await base44.functions.invoke("dedupeAppConfig", {});
      setDedupeReport(res.data);
    } catch (err) {
      setDedupeReport({ error: err.message || "Check failed" });
    }
    setDedupeLoading(false);
  };

  const runDedupeConfirm = async () => {
    setDedupeLoading(true);
    try {
      const res = await base44.functions.invoke("dedupeAppConfig", { confirm: true });
      setDedupeReport(res.data);
      queryClient.invalidateQueries({ queryKey: ["app-config"] });
    } catch (err) {
      setDedupeReport({ error: err.message || "Delete failed" });
    }
    setDedupeLoading(false);
  };

  // ── FAA LADD list sync state ──
  const [laddMonth, setLaddMonth] = useState("");
  const [laddEntries, setLaddEntries] = useState("");
  const [laddReport, setLaddReport] = useState(null);
  const [laddLoading, setLaddLoading] = useState(false);

  const runLaddCheck = async () => {
    setLaddLoading(true);
    try {
      const res = await base44.functions.invoke("syncLaddList", { list_month: laddMonth, entries: laddEntries });
      setLaddReport(res.data);
    } catch (err) {
      setLaddReport({ error: err.response?.data?.error || err.message || "Check failed" });
    }
    setLaddLoading(false);
  };

  const runLaddConfirm = async () => {
    setLaddLoading(true);
    try {
      const res = await base44.functions.invoke("syncLaddList", { list_month: laddMonth, entries: laddEntries, confirm: true });
      setLaddReport(res.data);
    } catch (err) {
      setLaddReport({ error: err.response?.data?.error || err.message || "Import failed" });
    }
    setLaddLoading(false);
  };

  // ── Global Data Sync state ──
  const [syncing, setSyncing] = useState(false);
  const [syncSteps, setSyncSteps] = useState([
    { key: "faa", label: "FAA Registry Sync", status: "idle", result: null, error: null },
    { key: "ati", label: "ATI Scoring (batch 20)", status: "idle", result: null, error: null },
    { key: "traffic", label: "Traffic Ingestion", status: "idle", result: null, error: null },
  ]);

  const runGlobalSync = async () => {
    setSyncing(true);
    setSyncSteps((prev) => prev.map((s) => ({ ...s, status: "idle", result: null, error: null })));

    const steps = [
      { key: "faa", fn: () => base44.functions.invoke("syncFaaFromSupabase", { mode: "registry_summary" }) },
      { key: "ati", fn: () => base44.functions.invoke("autoScoreFAA", { batch_size: 20, offset: 0 }) },
      { key: "traffic", fn: () => base44.functions.invoke("ingestLiveTraffic", {}) },
    ];

    for (const step of steps) {
      setSyncSteps((prev) => prev.map((s) => s.key === step.key ? { ...s, status: "running" } : s));
      try {
        const res = await step.fn();
        const data = res.data || {};
        const result = typeof data === "object" ? JSON.stringify(data).slice(0, 200) : String(data).slice(0, 200);
        setSyncSteps((prev) => prev.map((s) => s.key === step.key ? { ...s, status: "success", result } : s));
      } catch (err) {
        setSyncSteps((prev) => prev.map((s) => s.key === step.key ? { ...s, status: "error", error: err.message?.slice(0, 200) || "Unknown error" } : s));
      }
    }

    setSyncing(false);
  };

  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: configs = [], isLoading, isSuccess } = useQuery({
    queryKey: ["app-config"],
    // Must match the sort used by generateMarketReport / generateMarketForecast
    // ("-created_date", 1) or the admin panel reads and writes a different row
    // than the engines. Duplicate key:"global" rows exist in prod.
    queryFn: () => base44.entities.AppConfig.filter({ key: "global" }, "-created_date", 1),
    enabled: isAdminRole(user),
  });

  useEffect(() => {
    if (configs.length > 0) {
      setFrozen(configs[0].freezeAbosDataInfluence ?? true);
      setMessage(configs[0].abosDataFreezeMessage ?? "");
    }
  }, [configs]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        key: "global",
        freezeAbosDataInfluence: frozen,
        abosDataFreezeMessage: message,
      };
      if (configs.length === 0) {
        // Never create here. `configs` defaults to [] on a failed/pending read,
        // and a create on that path is what produced the duplicate key:"global"
        // rows. The row is seeded by migration; if it's missing, fail loudly.
        throw new Error(
          "AppConfig key:\"global\" not loaded \u2014 refusing to write. Reload and retry."
        );
      }
      return base44.entities.AppConfig.update(configs[0].id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-config"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-2xl p-10 text-center max-w-sm" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
          <Lock className="w-10 h-10 text-[#f5c242] mx-auto mb-4" />
          <p className="font-black text-[rgba(255,255,255,0.90)] uppercase tracking-tight">Admin Access Required</p>
          <p className="text-sm text-[rgba(255,255,255,0.60)] mt-2">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8 sm:mb-10">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-[#f5c242]">Admin Panel</p>
        <h1 className="text-xl sm:text-2xl font-black text-[rgba(255,255,255,0.90)] uppercase tracking-tight mt-1">Platform Settings</h1>
        <p className="text-xs sm:text-sm text-[rgba(255,255,255,0.60)] mt-1">Global configuration for ABOS platform behaviour and AI analysis.</p>
      </div>

      {/* ABOS Data Influence Card */}
      <div className="rounded-2xl p-7 mb-6" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-[#4e8ef7]/10 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-[rgba(255,255,255,0.90)]" />
          </div>
          <div>
            <h2 className="font-black text-[rgba(255,255,255,0.90)] uppercase tracking-tight text-base">
              Internal Data Influence on Market Analysis
            </h2>
            <p className="text-sm text-[rgba(255,255,255,0.60)] mt-1">
              Controls whether AI-generated market reports and forecasts use internal ABOS listing data as analytical inputs.
            </p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] mb-5">
          <div className="flex items-center gap-3">
            {frozen ? (
              <AlertTriangle className="w-5 h-5 text-[#f5c242]" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#5dcaa5]" />
            )}
            <div>
              <p className="font-bold text-[rgba(255,255,255,0.90)] text-sm">
                {frozen ? "ABOS Internal Data — EXCLUDED" : "ABOS Internal Data — INCLUDED"}
              </p>
              <p className="text-xs text-[rgba(255,255,255,0.60)] mt-0.5">
                {frozen
                  ? "LLM prompts rely solely on external macro/industry signals."
                  : "LLM prompts incorporate ABOS listing data as analysis input."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={frozen ? "bg-[#f5c242]/15 text-[#f5c242] border-[#f5c242]/30" : "bg-[rgba(93,202,165,0.06)] text-[#5dcaa5] border-[rgba(93,202,165,0.20)]"}>
              {frozen ? "Frozen" : "Active"}
            </Badge>
            <Switch
              checked={!frozen}
              onCheckedChange={(v) => setFrozen(!v)}
            />
          </div>
        </div>

        {/* Info box */}
        <div className={`rounded-xl p-4 mb-5 text-sm ${frozen ? "bg-[#f5c242]/08 border border-[#f5c242]/20" : "bg-[rgba(93,202,165,0.06)] border border-[rgba(93,202,165,0.20)]"}`}>
          {frozen ? (
            <p className="text-[#f5c242]">
              <strong>When frozen:</strong> All market analyses (reports + forecasts) will instruct the AI to ignore internal ABOS listing counts, prices, and deal data — relying exclusively on external macroeconomic, regulatory, and industry signals. Analyses will still be generated normally.
            </p>
          ) : (
            <p className="text-[#5dcaa5]">
              <strong>When active:</strong> Market analyses will include ABOS internal listing data (active listings, price averages, deal distribution) as supporting context for AI-generated insights.
            </p>
          )}
        </div>

        {/* Message editor */}
        <div className="mb-5">
          <label className="text-[11px] uppercase tracking-[0.15em] font-bold text-[rgba(255,255,255,0.60)] mb-2 block">
            User Notification Message
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter the message users will see on the Market Reports page..."
            className="resize-none min-h-[90px] text-sm"
            maxLength={600}
          />
          <p className="text-[11px] text-[rgba(255,255,255,0.35)] mt-1.5 text-right">{message.length}/600</p>
        </div>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || isLoading || !isSuccess}
          className="w-full font-bold uppercase tracking-wide"
          style={{ background: "linear-gradient(135deg,#4e8ef7,#143C75)" }}
        >
          {saveMutation.isPending ? "Saving..." : saved ? "✓ Saved" : "Save Settings"}
        </Button>
      </div>

      {/* Auto ATI Scoring */}
      <AutoScoringPanel />

      {/* Feature Toggles — Admin & Super Admin */}
      {isAdminRole(user) && <FeatureTogglePanel />}

      {/* Webhooks */}
      <WebhooksConfig />

      {/* Global Data Sync */}
      <div className="rounded-2xl p-7 mt-6" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#e24b4a]/10 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5 text-[#e24b4a]" />
          </div>
          <div>
            <h2 className="font-black text-[rgba(255,255,255,0.90)] uppercase tracking-tight text-base">
              Global Data Sync
            </h2>
            <p className="text-sm text-[rgba(255,255,255,0.60)] mt-1">
              One-click full synchronization — FAA registry, ATI scoring, and live traffic ingestion.
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="rounded-xl p-4 mb-5 bg-[#e24b4a]/05 border border-[#e24b4a]/15">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#e24b4a] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#e24b4a]">This operation may take several minutes</p>
              <p className="text-xs text-[rgba(255,255,255,0.60)] mt-0.5">
                All three steps (FAA sync, ATI scoring, traffic ingestion) run sequentially. Do not close this page until complete.
              </p>
            </div>
          </div>
        </div>

        {/* Progress steps */}
        <div className="space-y-2 mb-5">
          {syncSteps.map((step) => {
            const statusIcon =
              step.status === "running" ? <Loader2 className="w-4 h-4 animate-spin text-[#4e8ef7]" /> :
              step.status === "success" ? <CheckCircle2 className="w-4 h-4 text-[#5dcaa5]" /> :
              step.status === "error" ? <XCircle className="w-4 h-4 text-red-500" /> :
              <div className="w-4 h-4 rounded-full border-2 border-[#AAA49C]/30" />;
            return (
              <div key={step.key} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]">
                {statusIcon}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[rgba(255,255,255,0.90)]">{step.label}</p>
                  {step.status === "success" && step.result && (
                    <p className="text-[10px] text-[rgba(255,255,255,0.60)] mt-0.5 truncate font-mono">{step.result}</p>
                  )}
                  {step.status === "error" && step.error && (
                    <p className="text-[10px] text-red-500 mt-0.5 truncate">{step.error}</p>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider shrink-0"
                  style={{
                    color: step.status === "success" ? "#5dcaa5" : step.status === "error" ? "#e24b4a" : step.status === "running" ? "#4e8ef7" : "#AAA49C",
                  }}>
                  {step.status === "success" ? "Done" : step.status === "error" ? "Failed" : step.status === "running" ? "Running" : "—"}
                </span>
              </div>
            );
          })}
        </div>

        <Button
          onClick={runGlobalSync}
          disabled={syncing}
          className="w-full font-bold uppercase tracking-wide text-white"
          style={{ background: syncing ? "linear-gradient(135deg,#9ca3af,#6b7280)" : "linear-gradient(135deg,#e24b4a,#b91c1c)" }}
        >
          {syncing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Syncing All Metrics...</>
          ) : (
            <><RefreshCw className="w-4 h-4" /> Sync All Metrics</>
          )}
        </Button>
      </div>

      {/* Database Maintenance — AppConfig dedupe */}
      <div className="rounded-2xl p-7 mt-6" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#f5c242]/10 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-[#f5c242]" />
          </div>
          <div>
            <h2 className="font-black text-[rgba(255,255,255,0.90)] uppercase tracking-tight text-base">
              Database Maintenance
            </h2>
            <p className="text-sm text-[rgba(255,255,255,0.60)] mt-1">
              Clean up duplicate AppConfig rows left over from a historical Save-mutation race condition. Keeps the most recently edited row per key.
            </p>
          </div>
        </div>

        {dedupeReport && (
          <div className={`rounded-xl p-4 mb-5 text-sm ${dedupeReport.error ? "bg-[#e24b4a]/08 border border-[#e24b4a]/20 text-[#e24b4a]" : "bg-[rgba(93,202,165,0.06)] border border-[rgba(93,202,165,0.20)] text-[#5dcaa5]"}`}>
            {dedupeReport.error ? (
              <p>{dedupeReport.error}</p>
            ) : (
              <>
                <p className="font-bold">{dedupeReport.message || (dedupeReport.dryRun === false ? `Deleted ${dedupeReport.deleted} duplicate row(s).` : "")}</p>
                {dedupeReport.report?.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-[rgba(255,255,255,0.70)]">
                    {dedupeReport.report.map((r) => (
                      <li key={r.key}>
                        <strong>{r.key}</strong>: {r.totalRows} rows found — keeping 1, {r.deleting.length} {dedupeReport.dryRun === false ? "deleted" : "would be deleted"}
                      </li>
                    ))}
                  </ul>
                )}
                {dedupeReport.errors?.length > 0 && (
                  <p className="mt-2 text-xs text-[#e24b4a]">{dedupeReport.errors.length} row(s) failed to delete — see logs.</p>
                )}
              </>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={runDedupeCheck}
            disabled={dedupeLoading}
            variant="outline"
            className="flex-1 font-bold uppercase tracking-wide"
          >
            {dedupeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Check for Duplicates
          </Button>
          {dedupeReport && !dedupeReport.error && dedupeReport.dryRun && dedupeReport.report?.length > 0 && (
            <Button
              onClick={runDedupeConfirm}
              disabled={dedupeLoading}
              className="flex-1 font-bold uppercase tracking-wide text-white"
              style={{ background: "linear-gradient(135deg,#e24b4a,#b91c1c)" }}
            >
              Confirm Delete
            </Button>
          )}
        </div>
      </div>

      {/* FAA LADD (Limiting Aircraft Data Displayed) Compliance */}
      <div className="rounded-2xl p-7 mt-6" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#4e8ef7]/10 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-[#4e8ef7]" />
          </div>
          <div>
            <h2 className="font-black text-[rgba(255,255,255,0.90)] uppercase tracking-tight text-base">
              FAA LADD Compliance
            </h2>
            <p className="text-sm text-[rgba(255,255,255,0.60)] mt-1">
              Import the monthly IndustryLADD list from the FAA ADX portal (adx.faa.gov — requires a signed Data Access User Agreement). Blocked registrations are withheld from registry lookups and the live traffic map.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3 mb-4">
          <div>
            <label className="text-[11px] uppercase tracking-[0.15em] font-bold text-[rgba(255,255,255,0.60)] mb-2 block">
              List Month
            </label>
            <input
              value={laddMonth}
              onChange={(e) => setLaddMonth(e.target.value)}
              placeholder="2026-08"
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono"
              style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: "white" }}
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.15em] font-bold text-[rgba(255,255,255,0.60)] mb-2 block">
              IndustryLADD Entries (N-numbers, one per line or comma-separated)
            </label>
            <Textarea
              value={laddEntries}
              onChange={(e) => setLaddEntries(e.target.value)}
              placeholder={"N12345\nN6789A\n..."}
              className="resize-none min-h-[90px] text-sm font-mono"
            />
          </div>
        </div>

        {laddReport && (
          <div className={`rounded-xl p-4 mb-5 text-sm ${laddReport.error ? "bg-[#e24b4a]/08 border border-[#e24b4a]/20 text-[#e24b4a]" : "bg-[rgba(93,202,165,0.06)] border border-[rgba(93,202,165,0.20)] text-[#5dcaa5]"}`}>
            {laddReport.error ? (
              <p>{laddReport.error}</p>
            ) : (
              <>
                <p className="font-bold">{laddReport.message || `Imported: ${laddReport.created} new, ${laddReport.refreshed} refreshed, ${laddReport.deactivated} deactivated.`}</p>
              </>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={runLaddCheck}
            disabled={laddLoading || !laddMonth || !laddEntries}
            variant="outline"
            className="flex-1 font-bold uppercase tracking-wide"
          >
            {laddLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Check Import
          </Button>
          {laddReport && !laddReport.error && laddReport.dryRun && (
            <Button
              onClick={runLaddConfirm}
              disabled={laddLoading}
              className="flex-1 font-bold uppercase tracking-wide text-white"
              style={{ background: "linear-gradient(135deg,#4e8ef7,#143C75)" }}
            >
              Confirm Import
            </Button>
          )}
        </div>
      </div>

      {/* Smart Contracts — Coming Soon */}
      <div className="rounded-2xl p-7 opacity-70" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#f5c242]/15 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[#f5c242]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-[rgba(255,255,255,0.90)] uppercase tracking-tight text-base">
                Smart Contracts
              </h2>
              <Badge className="bg-[#f5c242]/15 text-[#f5c242] border-[#f5c242]/30 uppercase text-[10px] tracking-widest font-bold">
                Coming Soon
              </Badge>
            </div>
            <p className="text-sm text-[rgba(255,255,255,0.60)] mt-1">
              Blockchain-based smart contracts for aircraft transactions — automated escrow release, co-ownership agreements, and fractional ownership tokenization.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {["Automated Escrow Release", "Co-Ownership Tokenization", "B2B / B2C Contract Templates"].map((f) => (
            <div key={f} className="rounded-xl border border-dashed border-[#f5c242]/30 bg-[#f5c242]/05 p-3 text-center">
              <Zap className="w-4 h-4 text-[#f5c242] mx-auto mb-1.5" />
              <p className="text-[11px] font-bold text-[#f5c242] uppercase tracking-wide leading-snug">{f}</p>
            </div>
          ))}
        </div>
      </div>

      {/* P4Y Analysis — Coming Soon */}
      <div className="rounded-2xl p-7 mt-6 opacity-70" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#4e8ef7]/10 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-[rgba(255,255,255,0.90)]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-[rgba(255,255,255,0.90)] uppercase tracking-tight text-base">
                Plane4You (P4Y) Listing Market Analysis
              </h2>
              <Badge className="bg-[#4e8ef7]/10 text-[rgba(255,255,255,0.90)] border-[#4e8ef7]/20 uppercase text-[10px] tracking-widest font-bold">
                Coming Soon
              </Badge>
            </div>
            <p className="text-sm text-[rgba(255,255,255,0.60)] mt-1">
              Predictive targeting for P4Y listings — identify fast-selling aircraft, B2B/B2C sales intelligence, and smart pricing recommendations based on real market data.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}