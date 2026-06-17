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

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [frozen, setFrozen] = useState(true);
  const [saved, setSaved] = useState(false);

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

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["app-config"],
    queryFn: () => base44.entities.AppConfig.filter({ key: "global" }),
    enabled: user?.role === "admin" || user?.role === "super_admin",
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
      if (configs.length > 0) {
        return base44.entities.AppConfig.update(configs[0].id, data);
      } else {
        return base44.entities.AppConfig.create(data);
      }
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
        <div className="glass-card p-10 text-center max-w-sm">
          <Lock className="w-10 h-10 text-[#E8A83A] mx-auto mb-4" />
          <p className="font-black text-[#0B2D5B] uppercase tracking-tight">Admin Access Required</p>
          <p className="text-sm text-[#6B6560] mt-2">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8 sm:mb-10">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-[#E8A83A]">Admin Panel</p>
        <h1 className="text-xl sm:text-2xl font-black text-[#0B2D5B] uppercase tracking-tight mt-1">Platform Settings</h1>
        <p className="text-xs sm:text-sm text-[#6B6560] mt-1">Global configuration for ABOS platform behaviour and AI analysis.</p>
      </div>

      {/* ABOS Data Influence Card */}
      <div className="glass-card p-7 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-[#0B2D5B]/10 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-[#0B2D5B]" />
          </div>
          <div>
            <h2 className="font-black text-[#0B2D5B] uppercase tracking-tight text-base">
              Internal Data Influence on Market Analysis
            </h2>
            <p className="text-sm text-[#6B6560] mt-1">
              Controls whether AI-generated market reports and forecasts use internal ABOS listing data as analytical inputs.
            </p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-black/[0.07] bg-white/50 mb-5">
          <div className="flex items-center gap-3">
            {frozen ? (
              <AlertTriangle className="w-5 h-5 text-[#E8A83A]" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
            <div>
              <p className="font-bold text-[#1A1814] text-sm">
                {frozen ? "ABOS Internal Data — EXCLUDED" : "ABOS Internal Data — INCLUDED"}
              </p>
              <p className="text-xs text-[#6B6560] mt-0.5">
                {frozen
                  ? "LLM prompts rely solely on external macro/industry signals."
                  : "LLM prompts incorporate ABOS listing data as analysis input."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={frozen ? "bg-[#E8A83A]/15 text-[#A67C00] border-[#E8A83A]/30" : "bg-green-50 text-green-700 border-green-200"}>
              {frozen ? "Frozen" : "Active"}
            </Badge>
            <Switch
              checked={!frozen}
              onCheckedChange={(v) => setFrozen(!v)}
            />
          </div>
        </div>

        {/* Info box */}
        <div className={`rounded-xl p-4 mb-5 text-sm ${frozen ? "bg-[#E8A83A]/08 border border-[#E8A83A]/20" : "bg-green-50 border border-green-200"}`}>
          {frozen ? (
            <p className="text-[#7A5C00]">
              <strong>When frozen:</strong> All market analyses (reports + forecasts) will instruct the AI to ignore internal ABOS listing counts, prices, and deal data — relying exclusively on external macroeconomic, regulatory, and industry signals. Analyses will still be generated normally.
            </p>
          ) : (
            <p className="text-green-800">
              <strong>When active:</strong> Market analyses will include ABOS internal listing data (active listings, price averages, deal distribution) as supporting context for AI-generated insights.
            </p>
          )}
        </div>

        {/* Message editor */}
        <div className="mb-5">
          <label className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#6B6560] mb-2 block">
            User Notification Message
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter the message users will see on the Market Reports page..."
            className="resize-none min-h-[90px] text-sm"
            maxLength={600}
          />
          <p className="text-[11px] text-[#AAA49C] mt-1.5 text-right">{message.length}/600</p>
        </div>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || isLoading}
          className="w-full font-bold uppercase tracking-wide"
          style={{ background: "linear-gradient(135deg,#0B2D5B,#143C75)" }}
        >
          {saveMutation.isPending ? "Saving..." : saved ? "✓ Saved" : "Save Settings"}
        </Button>
      </div>

      {/* Auto ATI Scoring */}
      <AutoScoringPanel />

      {/* Feature Toggles — Admin & Super Admin */}
      {(user?.role === "admin" || user?.role === "super_admin") && <FeatureTogglePanel />}

      {/* Webhooks */}
      <WebhooksConfig />

      {/* Global Data Sync */}
      <div className="glass-card p-7 mt-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#dc2626]/10 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5 text-[#dc2626]" />
          </div>
          <div>
            <h2 className="font-black text-[#0B2D5B] uppercase tracking-tight text-base">
              Global Data Sync
            </h2>
            <p className="text-sm text-[#6B6560] mt-1">
              One-click full synchronization — FAA registry, ATI scoring, and live traffic ingestion.
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="rounded-xl p-4 mb-5 bg-[#dc2626]/05 border border-[#dc2626]/15">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#dc2626]">This operation may take several minutes</p>
              <p className="text-xs text-[#6B6560] mt-0.5">
                All three steps (FAA sync, ATI scoring, traffic ingestion) run sequentially. Do not close this page until complete.
              </p>
            </div>
          </div>
        </div>

        {/* Progress steps */}
        <div className="space-y-2 mb-5">
          {syncSteps.map((step) => {
            const statusIcon =
              step.status === "running" ? <Loader2 className="w-4 h-4 animate-spin text-[#2563eb]" /> :
              step.status === "success" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
              step.status === "error" ? <XCircle className="w-4 h-4 text-red-500" /> :
              <div className="w-4 h-4 rounded-full border-2 border-[#AAA49C]/30" />;
            return (
              <div key={step.key} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-black/[0.05] bg-white/40">
                {statusIcon}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1A1814]">{step.label}</p>
                  {step.status === "success" && step.result && (
                    <p className="text-[10px] text-[#6B6560] mt-0.5 truncate font-mono">{step.result}</p>
                  )}
                  {step.status === "error" && step.error && (
                    <p className="text-[10px] text-red-500 mt-0.5 truncate">{step.error}</p>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider shrink-0"
                  style={{
                    color: step.status === "success" ? "#16a34a" : step.status === "error" ? "#dc2626" : step.status === "running" ? "#2563eb" : "#AAA49C",
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
          style={{ background: syncing ? "linear-gradient(135deg,#9ca3af,#6b7280)" : "linear-gradient(135deg,#dc2626,#b91c1c)" }}
        >
          {syncing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Syncing All Metrics...</>
          ) : (
            <><RefreshCw className="w-4 h-4" /> Sync All Metrics</>
          )}
        </Button>
      </div>

      {/* Smart Contracts — Coming Soon */}
      <div className="glass-card p-7 opacity-70">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#E8A83A]/15 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[#E8A83A]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-[#0B2D5B] uppercase tracking-tight text-base">
                Smart Contracts
              </h2>
              <Badge className="bg-[#E8A83A]/15 text-[#A67C00] border-[#E8A83A]/30 uppercase text-[10px] tracking-widest font-bold">
                Coming Soon
              </Badge>
            </div>
            <p className="text-sm text-[#6B6560] mt-1">
              Blockchain-based smart contracts for aircraft transactions — automated escrow release, co-ownership agreements, and fractional ownership tokenization.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {["Automated Escrow Release", "Co-Ownership Tokenization", "B2B / B2C Contract Templates"].map((f) => (
            <div key={f} className="rounded-xl border border-dashed border-[#E8A83A]/30 bg-[#E8A83A]/05 p-3 text-center">
              <Zap className="w-4 h-4 text-[#E8A83A] mx-auto mb-1.5" />
              <p className="text-[11px] font-bold text-[#A67C00] uppercase tracking-wide leading-snug">{f}</p>
            </div>
          ))}
        </div>
      </div>

      {/* P4Y Analysis — Coming Soon */}
      <div className="glass-card p-7 mt-6 opacity-70">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#0B2D5B]/10 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-[#0B2D5B]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-[#0B2D5B] uppercase tracking-tight text-base">
                Plane4You (P4Y) Listing Market Analysis
              </h2>
              <Badge className="bg-[#0B2D5B]/10 text-[#0B2D5B] border-[#0B2D5B]/20 uppercase text-[10px] tracking-widest font-bold">
                Coming Soon
              </Badge>
            </div>
            <p className="text-sm text-[#6B6560] mt-1">
              Predictive targeting for P4Y listings — identify fast-selling aircraft, B2B/B2C sales intelligence, and smart pricing recommendations based on real market data.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}