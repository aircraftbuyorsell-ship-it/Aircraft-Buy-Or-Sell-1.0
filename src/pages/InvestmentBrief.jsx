import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Brain, TrendingUp, ShieldCheck, Plane, DollarSign, Gauge,
  Zap, FileText, Sparkles, Loader2, ChevronRight, Activity,
  AlertTriangle, CheckCircle2, Cpu
} from "lucide-react";

const PIPELINE_STAGES = [
  { id: "twin", label: "Loading Digital Twin", icon: Plane, color: "#4e8ef7" },
  { id: "omvm", label: "OMVM Valuation", icon: TrendingUp, color: "#f5c242" },
  { id: "engine", label: "Engine TBO", icon: Gauge, color: "#5dcaa5" },
  { id: "opex", label: "OPEX Analysis", icon: Activity, color: "#a855f7" },
  { id: "insurance", label: "Insurance", icon: ShieldCheck, color: "#4e8ef7" },
  { id: "brief", label: "Investment Brief", icon: FileText, color: "#f5c242" },
];

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: "#f5c242" }}>{children}</p>;
}

function ModelBadge({ model }) {
  if (!model || model === "none") return null;
  const label = model.includes("llama") ? "Llama 4" : model.includes("gpt") ? "GPT-4o" : model.includes("claude") ? "Claude" : model.includes("pure_math") ? "Pure Math" : model;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
      style={{ background: "rgba(78,142,247,0.10)", color: "#4e8ef7", border: "0.5px solid rgba(78,142,247,0.25)" }}>
      <Cpu className="w-2.5 h-2.5" /> {label}
    </span>
  );
}

function ConfidenceBadge({ score }) {
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 80 ? "#5dcaa5" : pct >= 60 ? "#f5c242" : "#e24b4a";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
      style={{ background: `${color}15`, color, border: `0.5px solid ${color}40` }}>
      {pct}% confidence
    </span>
  );
}

function SkillResultCard({ skillId, skillResponse }) {
  if (!skillResponse) return null;
  const { result, confidence, evidence, model_used, ok } = skillResponse;
  if (!ok) {
    return (
      <div className="rounded-xl p-4 border border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-xs font-bold text-red-400">{skillId}</span>
        </div>
        <p className="text-xs text-white/50">{skillResponse.error || "Skill execution failed"}</p>
      </div>
    );
  }
  const displayName = skillId.replace("abos.skill.", "").replace(".v1", "").replace(/_/g, " ");
  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" style={{ color: "#f5c242" }} />
          <span className="text-xs font-black uppercase tracking-wider text-white/80">{displayName}</span>
        </div>
        <div className="flex items-center gap-2">
          <ModelBadge model={model_used} />
          <ConfidenceBadge score={confidence} />
        </div>
      </div>
      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
        {Object.entries(result || {})
          .filter(([, v]) => typeof v === "number" || typeof v === "string")
          .slice(0, 6)
          .map(([key, val]) => (
            <div key={key} className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.02)" }}>
              <p className="text-[9px] uppercase tracking-wider text-white/40">{key.replace(/_/g, " ")}</p>
              <p className="text-sm font-bold text-white/90">
                {typeof val === "number" ? val.toLocaleString() : val}
              </p>
            </div>
          ))}
      </div>
      {/* Evidence chips */}
      {evidence && evidence.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {evidence.map((ev, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: "rgba(78,142,247,0.08)", color: "rgba(255,255,255,0.55)", border: "0.5px solid rgba(78,142,247,0.15)" }}>
              {ev}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function BriefNarrative({ brief }) {
  if (!brief) return null;
  const isObj = typeof brief === "object" && !Array.isArray(brief);
  if (!isObj) {
    return (
      <div className="rounded-xl p-5" style={{ background: "linear-gradient(135deg, rgba(245,194,66,0.06), rgba(168,85,247,0.04))", border: "0.5px solid rgba(245,194,66,0.20)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#f5c242]" />
          <span className="text-xs font-black uppercase tracking-wider text-[#f5c242]">AI Investment Brief</span>
          <ModelBadge model="meta/llama-4-maverick" />
        </div>
        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{String(brief)}</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl p-5" style={{ background: "linear-gradient(135deg, rgba(245,194,66,0.06), rgba(168,85,247,0.04))", border: "0.5px solid rgba(245,194,66,0.20)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#f5c242]" />
        <span className="text-xs font-black uppercase tracking-wider text-[#f5c242]">AI Investment Brief</span>
      </div>
      {brief.brief_summary && (
        <p className="text-sm text-white/80 leading-relaxed mb-3">{brief.brief_summary}</p>
      )}
      {brief.strengths && Array.isArray(brief.strengths) && brief.strengths.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-wider font-bold text-[#5dcaa5] mb-1">Strengths</p>
          <ul className="space-y-1">
            {brief.strengths.map((s, i) => (
              <li key={i} className="text-xs text-white/70 flex items-start gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-[#5dcaa5] shrink-0 mt-0.5" /> {s}
              </li>
            ))}
          </ul>
        </div>
      )}
      {brief.risks && Array.isArray(brief.risks) && brief.risks.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-wider font-bold text-[#e24b4a] mb-1">Risks</p>
          <ul className="space-y-1">
            {brief.risks.map((r, i) => (
              <li key={i} className="text-xs text-white/70 flex items-start gap-1.5">
                <AlertTriangle className="w-3 h-3 text-[#e24b4a] shrink-0 mt-0.5" /> {r}
              </li>
            ))}
          </ul>
        </div>
      )}
      {brief.recommendation && (
        <div className="rounded-lg p-3 mb-2" style={{ background: "rgba(78,142,247,0.08)", border: "0.5px solid rgba(78,142,247,0.20)" }}>
          <p className="text-[10px] uppercase tracking-wider font-bold text-[#4e8ef7] mb-0.5">Recommendation</p>
          <p className="text-sm text-white/85">{brief.recommendation}</p>
        </div>
      )}
      {brief.confidence_assessment && (
        <p className="text-[11px] text-white/45 italic">{brief.confidence_assessment}</p>
      )}
    </div>
  );
}

export default function InvestmentBrief() {
  const [registration, setRegistration] = useState("");
  const [annualHours, setAnnualHours] = useState(200);
  const [leaseRevenue, setLeaseRevenue] = useState(0);
  const [jurisdiction, setJurisdiction] = useState("CZ");
  const [usageType, setUsageType] = useState("rental");
  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(-1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const abortRef = useRef(false);

  const runAnalysis = useCallback(async () => {
    if (!registration.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    abortRef.current = false;

    // Animate pipeline stages
    for (let i = 0; i < PIPELINE_STAGES.length; i++) {
      if (abortRef.current) break;
      setCurrentStage(i);
      await new Promise(r => setTimeout(r, 400));
    }

    try {
      const response = await base44.functions.invoke("invokeSkill", {
        skill_id: "abos.skill.investment_health.v1",
        inputs: {
          registration: registration.trim().toUpperCase(),
          annual_hours: annualHours,
          lease_revenue: leaseRevenue,
          jurisdiction,
          usage_type: usageType,
        },
      });
      setResult(response.data);
    } catch (e) {
      setError(e.message || "Failed to run investment analysis");
    } finally {
      setLoading(false);
      setCurrentStage(-1);
    }
  }, [registration, annualHours, leaseRevenue, jurisdiction, usageType]);

  const healthScore = result?.result?.investment_health_score;
  const liveStatus = result?.result?.live_status;
  const dealRadarEligible = result?.result?.deal_radar_eligible;
  const skillResults = result?.result?.skill_results || {};
  const aiBrief = result?.result?.ai_brief;
  const twinContext = result?.result?.twin_context;

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "transparent" }}>
      <div className="max-w-5xl mx-auto">
        <GoldLabel>Aviation Investment OS · Skill Pipeline v1</GoldLabel>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-1 uppercase flex items-center gap-2" style={{ color: "rgba(255,255,255,0.90)" }}>
          <Brain className="w-7 h-7 text-[#f5c242]" /> Investment Brief
        </h1>
        <p className="text-sm mt-1 max-w-3xl" style={{ color: "rgba(255,255,255,0.60)" }}>
          Hybrid AI pipeline: Digital Twin → OMVM → Engine TBO → OPEX → Insurance → Investment Brief.
          Powered by Llama 4 Maverick (narrative) + GPT o3 (tool calling) + pure math (deterministic).
        </p>

        {/* Free-form chat CTA */}
        <div className="mt-5 rounded-2xl p-4 flex items-center justify-between gap-3" style={{ background: "linear-gradient(135deg, rgba(245,194,66,0.06), rgba(168,85,247,0.04))", border: "0.5px solid rgba(245,194,66,0.18)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(245,194,66,0.12)" }}>
              <Brain className="w-4.5 h-4.5 text-[#f5c242]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white/90">Ask the Finance Advisor</p>
              <p className="text-[11px] text-white/50">Free-form chat — the agent orchestrates Skills and answers in natural language</p>
            </div>
          </div>
          <Link to="/finance-advisor" className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-opacity hover:opacity-90"
            style={{ background: "#f5c242", color: "#04060a" }}>
            <ChevronRight className="w-3.5 h-3.5" /> Open Chat
          </Link>
        </div>

        {/* Input panel */}
        <div className="mt-6 rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold text-white/60 block mb-1">Registration</label>
              <input
                value={registration}
                onChange={e => setRegistration(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && runAnalysis()}
                placeholder="N12345"
                className="w-full px-3 py-2.5 rounded-xl text-sm font-mono font-bold"
                style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: "white" }}
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold text-white/60 block mb-1">Annual Hours</label>
              <input type="number" value={annualHours} onChange={e => setAnnualHours(+e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: "white" }} />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold text-white/60 block mb-1">Lease Revenue $/yr</label>
              <input type="number" value={leaseRevenue} onChange={e => setLeaseRevenue(+e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: "white" }} />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold text-white/60 block mb-1">Jurisdiction</label>
              <select value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: "white" }}>
                <option value="CZ" className="bg-[#0B0F1A]">Czech Republic</option>
                <option value="US" className="bg-[#0B0F1A]">United States</option>
                <option value="EU" className="bg-[#0B0F1A]">EU (generic)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select value={usageType} onChange={e => setUsageType(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-bold"
              style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: "white" }}>
              <option value="rental" className="bg-[#0B0F1A]">Rental (full deductibility)</option>
              <option value="school" className="bg-[#0B0F1A]">Flight School (85%)</option>
              <option value="business" className="bg-[#0B0F1A]">Business (70%)</option>
              <option value="private" className="bg-[#0B0F1A]">Private (no deduction)</option>
            </select>
            <button
              onClick={runAnalysis}
              disabled={loading || !registration.trim()}
              className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
              style={{ background: "#f5c242", color: "#04060a" }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {loading ? "Analyzing..." : "Run Analysis"}
            </button>
          </div>
        </div>

        {/* Pipeline progress */}
        {loading && (
          <div className="mt-5 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              {PIPELINE_STAGES.map((stage, i) => {
                const Icon = stage.icon;
                const isDone = currentStage > i;
                const isActive = currentStage === i;
                return (
                  <div key={stage.id} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                        style={{
                          background: isDone ? `${stage.color}20` : isActive ? stage.color : "rgba(255,255,255,0.05)",
                          border: `0.5px solid ${isActive || isDone ? stage.color : "rgba(255,255,255,0.10)"}`,
                        }}>
                        {isDone ? <CheckCircle2 className="w-4 h-4" style={{ color: stage.color }} /> :
                         isActive ? <Loader2 className="w-4 h-4 animate-spin text-white" /> :
                         <Icon className="w-3.5 h-3.5 text-white/40" />}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: isActive ? stage.color : isDone ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.35)" }}>
                        {stage.label}
                      </span>
                    </div>
                    {i < PIPELINE_STAGES.length - 1 && <ChevronRight className="w-3 h-3 text-white/20" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-xl p-4 flex items-start gap-2" style={{ background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.25)" }}>
            <AlertTriangle className="w-4 h-4 text-[#e24b4a] shrink-0 mt-0.5" />
            <p className="text-sm text-[#e24b4a]">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-5 space-y-4">
            {/* Health Score Hero */}
            <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6"
              style={{ background: "linear-gradient(135deg, rgba(245,194,66,0.10), rgba(78,142,247,0.06))", border: "0.5px solid rgba(245,194,66,0.25)" }}>
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={healthScore >= 70 ? "#5dcaa5" : healthScore >= 50 ? "#f5c242" : "#e24b4a"} strokeWidth="8"
                    strokeDasharray={`${(healthScore / 100) * 264} 264`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black" style={{ color: "rgba(255,255,255,0.90)" }}>{healthScore}</span>
                  <span className="text-[9px] uppercase tracking-wider text-white/40">/ 100</span>
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <GoldLabel>Investment Health Score</GoldLabel>
                <h2 className="text-xl font-black mt-1" style={{ color: "rgba(255,255,255,0.90)" }}>
                  {twinContext?.registration} — {healthScore >= 70 ? "Strong Opportunity" : healthScore >= 50 ? "Moderate Interest" : "High Risk"}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2 justify-center sm:justify-start">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                    style={{ background: liveStatus === "active" ? "rgba(93,202,165,0.12)" : "rgba(226,75,74,0.12)", color: liveStatus === "active" ? "#5dcaa5" : "#e24b4a" }}>
                    <Activity className="w-3 h-3" /> {liveStatus || "unknown"}
                  </span>
                  {dealRadarEligible && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style={{ background: "rgba(245,194,66,0.12)", color: "#f5c242" }}>
                      <Zap className="w-3 h-3" /> Deal Radar Eligible
                    </span>
                  )}
                  <ModelBadge model={result.model_used} />
                </div>
              </div>
            </div>

            {/* Twin Context Summary */}
            {twinContext && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "ATI Score", value: twinContext.ati_total ? `${twinContext.ati_total}/120` : "N/A", icon: ShieldCheck, color: "#4e8ef7" },
                  { label: "OMVM Value", value: twinContext.omvm_value ? `$${twinContext.omvm_value.toLocaleString()}` : "N/A", icon: DollarSign, color: "#f5c242" },
                  { label: "Engine Remaining", value: twinContext.engine_remaining_pct != null ? `${twinContext.engine_remaining_pct}%` : "N/A", icon: Gauge, color: "#5dcaa5" },
                  { label: "Deal Label", value: twinContext.deal_label || "N/A", icon: TrendingUp, color: "#a855f7" },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3 h-3" style={{ color: item.color }} />
                        <p className="text-[9px] uppercase tracking-wider text-white/40">{item.label}</p>
                      </div>
                      <p className="text-sm font-black text-white/90">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* AI Brief */}
            <BriefNarrative brief={aiBrief} />

            {/* Skill Results */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#f5c242] mb-3">Skill Pipeline Results</p>
              <div className="space-y-3">
                {Object.entries(skillResults).map(([skillId, skillResponse]) => (
                  <SkillResultCard key={skillId} skillId={skillId} skillResponse={skillResponse} />
                ))}
                {Object.keys(skillResults).length === 0 && (
                  <p className="text-sm text-white/40 italic">No dependent skills were executed — provide annual_hours and lease_revenue for full analysis.</p>
                )}
              </div>
            </div>

            {/* Evidence */}
            {result.evidence && result.evidence.length > 0 && (
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] uppercase tracking-wider font-bold text-white/50 mb-2">Evidence Chain</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.evidence.map((ev, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(78,142,247,0.06)", color: "rgba(255,255,255,0.50)", border: "0.5px solid rgba(78,142,247,0.12)" }}>
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cross-links */}
            <div className="flex flex-wrap gap-3">
              <Link to={`/twin/${twinContext?.registration}`} className="text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-opacity hover:opacity-90"
                style={{ background: "rgba(78,142,247,0.10)", border: "0.5px solid rgba(78,142,247,0.25)", color: "#4e8ef7" }}>
                <Plane className="w-3.5 h-3.5" /> Digital Twin
              </Link>
              <Link to="/opex-calculator" className="text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-opacity hover:opacity-90"
                style={{ background: "rgba(168,85,247,0.10)", border: "0.5px solid rgba(168,85,247,0.25)", color: "#a855f7" }}>
                <Activity className="w-3.5 h-3.5" /> OPEX Calculator
              </Link>
              <Link to="/skills" className="text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-opacity hover:opacity-90"
                style={{ background: "rgba(245,194,66,0.10)", border: "0.5px solid rgba(245,194,66,0.25)", color: "#f5c242" }}>
                <Brain className="w-3.5 h-3.5" /> Skill Registry
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}