import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";

const val = (rows, key, fallback) => {
  const row = (rows || []).find((r) => r.key === key);
  return row ? row.value : fallback;
};

export default function AiSafetyDefaultsCard() {
  const [state, setState] = useState({ loading: true, error: null, gov: null });

  useEffect(() => {
    let mounted = true;
    base44.functions
      .invoke("setupDatabase", {})
      .then((res) => {
        if (!mounted) return;
        setState({ loading: false, error: null, gov: res.data?.governance || null });
      })
      .catch((err) => {
        if (!mounted) return;
        setState({ loading: false, error: err?.message || "Failed to initialize AI governance layer", gov: null });
      });
    return () => { mounted = false; };
  }, []);

  const cfg = state.gov?.ai_config;
  const flags = state.gov?.feature_toggles || [];
  const enabledFlags = flags.filter((f) => f.is_enabled).length;
  const maxVersion = Math.max(1, ...(cfg || []).map((r) => Number(r.version) || 1));

  return (
    <div className="glass-card" style={{ border: "1px solid rgba(212,160,23,0.45)", padding: "14px 18px" }}>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--gold-bg)" }}>
          {state.loading
            ? <RefreshCw className="w-4 h-4 animate-spin" style={{ color: "#D4A017" }} />
            : state.error
              ? <AlertTriangle className="w-4 h-4 text-[#e24b4a]" />
              : <ShieldCheck className="w-4 h-4" style={{ color: "#D4A017" }} />}
        </div>
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.18em] font-bold m-0" style={{ color: "#D4A017" }}>
            AI Governance Layer {state.error ? "— Unavailable" : `Active · config v${maxVersion}`}
          </p>
          {state.loading ? (
            <p className="text-[12px] m-0 mt-0.5 opacity-60">Verifying ai_config, feature_toggles, change log…</p>
          ) : state.error ? (
            <p className="text-[12px] m-0 mt-0.5 text-[#e24b4a]">{state.error}</p>
          ) : (
            <p className="text-[12px] font-semibold m-0 mt-0.5">
              Confidence: {Math.round((Number(val(cfg, "confidence_threshold", 0.75)) || 0.75) * 100)}%
              {" · "}Daily cap: {val(cfg, "daily_ai_steps_cap", 10)} steps
              {" · "}Human approval above: ${Number(val(cfg, "require_human_approval_above_usd", 500000)).toLocaleString()}
              {" · "}Flags: {enabledFlags}/{flags.length} enabled
            </p>
          )}
        </div>
      </div>
    </div>
  );
}