import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  FileText, Download, Printer, Share2, ChevronDown, ChevronUp, ShieldCheck, Check,
} from "lucide-react";
import MiniGlobe from "@/components/MiniGlobe";
import { cleanAircraftMake } from "@/lib/cleanAircraftMake";
import { atiBand } from "@/theme/atiPremium";
import { DIMS, genCode, buildReportCode, exportDocx } from "@/lib/exportAtiReport";
import HeroHeader from "@/components/intelligence/HeroHeader";
import ActionBar from "@/components/intelligence/ActionBar";
import EmptyState from "@/components/intelligence/EmptyState";
import DimensionAnalyticsRow from "@/components/report/DimensionAnalyticsRow";
import { useEntitlementGate } from "@/hooks/useEntitlementGate";
import EntitlementGateModal from "@/components/monetization/EntitlementGateModal";
import { saveReport, recordUsage } from "@/lib/entitlements";

const TABS = ["Overview", "Identity", "Dimensions", "Market", "Risk"];
const readParam = (key) => new URLSearchParams(window.location.search).get(key) || "";

function buildInitialReportInput() {
  if (readParam("aircraft_data")) return readParam("aircraft_data");
  return [
    [readParam("year"), readParam("make"), readParam("model")].filter(Boolean).join(" "),
    readParam("registration") && `Registration: ${readParam("registration")}`,
    readParam("serial") && `Serial number: ${readParam("serial")}`,
    readParam("total_time") && `Airframe Total Time: ${readParam("total_time")} hrs`,
    readParam("engine_hours") && `Engine SMOH: ${readParam("engine_hours")} hrs`,
    readParam("tbo") && `TBO: ${readParam("tbo")} hrs`,
    readParam("engine_mfr") && `Engine: ${readParam("engine_mfr")} ${readParam("engine_model")}`.trim(),
    readParam("avionics") && `Avionics: ${readParam("avionics")}`,
    readParam("asking_price") && `Asking Price: $${readParam("asking_price")}`,
  ].filter(Boolean).join("\n");
}

function BulletList({ items, colorCls = "text-emerald-500" }) {
  if (!items?.length) return <p className="text-xs text-muted-foreground">None identified.</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 items-start">
          <span className={`shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${colorCls} bg-current opacity-70`} />
          <span className="text-xs text-foreground/80 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function AINotice() {
  return (
    <div className="rounded-lg border border-gold-official/25 bg-gold-bg p-3.5 flex gap-2.5 items-start">
      <ShieldCheck className="w-4 h-4 text-gold-official shrink-0 mt-0.5" />
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        <strong className="text-gold-official font-bold">AI notice:</strong>{" "}
        The ATI Score and OMVM valuation estimate are generated using artificial intelligence tools based on available data
        (FAA registry, NTSB database, market comparables). These outputs are for informational purposes only and do not
        replace a professional technical inspection or formal appraisal. Any final purchase or sale decision should include
        an independent pre-buy inspection.{" "}
        <Link to="/legal/ai-transparency" className="text-gold-official hover:underline">Full AI disclosure (EU AI Act Art. 50) →</Link>
      </p>
    </div>
  );
}

export default function ATIFullReport() {
  const { gate, requireAccess, closeGate, startCheckout } = useEntitlementGate();
  const [input, setInput] = useState(buildInitialReportInput);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [reportCode, setReportCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [regExtracted, setRegExtracted] = useState(() => readParam("registration"));
  const [tab, setTab] = useState("Overview");
  const [copied, setCopied] = useState(false);

  const { data: listings = [] } = useQuery({
    queryKey: ["listings-active"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }),
  });

  function prefillFromListing(l) {
    const make = cleanAircraftMake(l.make);
    const lines = [
      `${l.year || ""} ${make} ${l.model || ""}`.trim(),
      l.registration ? `Registration: ${l.registration}` : "",
      l.total_time != null ? `Airframe Total Time: ${l.total_time} hrs` : "",
      l.engine_hours != null ? `Engine SMOH: ${l.engine_hours} hrs` : "",
      l.tbo != null ? `TBO: ${l.tbo} hrs` : "",
      l.last_annual ? `Last Annual: ${l.last_annual}` : "",
      l.avionics ? `Avionics: ${l.avionics}` : "",
      l.asking_price != null ? `Asking Price: $${l.asking_price.toLocaleString()}` : "",
      l.ai_summary ? `Additional notes: ${l.ai_summary}` : "",
    ].filter(Boolean);
    setInput(lines.join("\n"));
    setRegExtracted(l.registration || "");
    setShowPicker(false);
    setResult(null);
    setReportCode(null);
  }

  async function handleGenerate() {
    if (!input.trim()) return;
    if (!(await requireAccess("ATI_FULL_REPORT", (regExtracted || "").toUpperCase()))) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const response = await base44.functions.invoke("atiFullReportScore", {
        aircraft_data: input,
        registration: regExtracted || undefined,
      });
      const res = response.data || response;
      const flatResult = {
        total: res.total,
        identity_rows: res.identity_rows,
        omvm_low: res.omvm_low,
        omvm_high: res.omvm_high,
        asking_price: res.asking_price,
        summary: res.summary,
        strengths: res.strengths,
        risks: res.risks,
        recommendations: res.recommendations,
        registration_extracted: res.registration_extracted,
        dimensions: res.dimensions,
        ...res.dimension_scores,
        reasons: Object.fromEntries(
          Object.entries(res.dimensions || {}).map(([k, v]) => [k, v.justification])
        ),
      };

      const make = readParam("make");
      const model = readParam("model");
      const year = Number(readParam("year"));
      if (make && model && year) {
        try {
          const omvmResponse = await base44.functions.invoke("omvmV5Score", {
            make,
            model,
            year,
            total_time: Number(readParam("total_time")) || undefined,
            engine_hours: Number(readParam("engine_hours")) || undefined,
            tbo: Number(readParam("tbo")) || undefined,
            avionics: readParam("avionics"),
            asking_price: Number(readParam("asking_price")) || undefined,
          });
          const omvmValue = omvmResponse.data?.omvm_value;
          if (omvmValue) {
            flatResult.omvm_low = Math.round(omvmValue * 0.9 / 1000) * 1000;
            flatResult.omvm_high = Math.round(omvmValue * 1.1 / 1000) * 1000;
          }
        } catch (_) {}
      }

      const reg = regExtracted || res.registration_extracted || "NREG";
      setResult(flatResult);
      setTab("Overview");
      // Persist the purchased report (re-access without re-charge) + usage record.
      // The report code is built from the shared deal_code returned here, so it stays
      // identical to the Listing ID / ATI Score ID for this same aircraft.
      try {
        const saved = await saveReport({
          product_key: "ATI_FULL_REPORT",
          aircraft_registration: (reg || "").toUpperCase(),
          report_type: "ati_full_report",
          result_data: flatResult,
          confidence: "caution",
        });
        setReportCode(buildReportCode(reg, res.total, saved.deal_code));
        await recordUsage({ product_key: "ATI_FULL_REPORT", aircraft_registration: (reg || "").toUpperCase() });
      } catch (_) {
        setReportCode(genCode(reg, res.total)); // backend unavailable — fall back to a standalone code
      }
    } catch (e) {
      if ([401, 403].includes(e?.response?.status || e?.status)) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      setError(e?.response?.data?.error || e.message || "Report generation failed. Please try again.");
    }
    setLoading(false);
  }

  async function handleShare() {
    await navigator.clipboard.writeText(`ATI Report ${reportCode} — Score ${result.total}/120 · ${window.location.href}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const verdict = result ? atiBand(result.total) : null;
  const dealScore = result ? ((result.total / 120) * 10).toFixed(1) : null;
  const omvmMid = result ? Math.round((result.omvm_low + result.omvm_high) / 2) : null;
  const priceDiff = result?.asking_price && omvmMid
    ? (((omvmMid - result.asking_price) / omvmMid) * 100).toFixed(1)
    : null;
  const dimsScored = result ? DIMS.filter(d => result[d.key] != null).length : 0;
  const confidence = result ? Math.round((dimsScored / DIMS.length) * 100) : null;

  const canGenerate = !!input.trim() && !loading;

  return (
    <div className="min-h-screen dot-grid bg-canvas text-foreground">
      <HeroHeader
        eyebrow="ABOS Intelligence · Flagship Report"
        icon={FileText}
        title="ATI"
        titleAccent="Full Report"
        subtitle="Professional aircraft appraisal — 8-dimension transparency scoring, market valuation, risk analysis and export."
      />

      <div className="px-4 md:px-8 pb-12 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
        {/* ── Input panel ── */}
        <div className="glass-card p-5 lg:sticky lg:top-20">
          <h2 className="text-sm font-bold mb-3">Aircraft Data</h2>
          {listings.length > 0 && (
            <div className="mb-3">
              <button onClick={() => setShowPicker(v => !v)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3.5 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-gold-official/40 transition-colors cursor-pointer">
                Load from saved listing {showPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showPicker && (
                <div className="mt-2 rounded-lg border border-border overflow-hidden max-h-56 overflow-y-auto bg-card">
                  {listings.map(l => (
                    <button key={l.id} onClick={() => prefillFromListing(l)}
                      className="flex w-full items-center justify-between px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/60 transition-colors text-left cursor-pointer">
                      <span className="text-xs font-medium">{l.year} {cleanAircraftMake(l.make)} {l.model}</span>
                      <span className="text-[10px] text-muted-foreground font-mono tracking-wider">{l.registration || "—"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Paste full aircraft details for a professional appraisal report…\n\nInclude:\n- Make, model, year, registration\n- Airframe TT, engine SMOH, TBO\n- Avionics, modifications, STCs\n- Maintenance history, AD compliance\n- Storage, annual status\n- Asking price\n- Seller notes, condition description`}
            rows={16}
            className="w-full rounded-lg p-3.5 text-[13px] leading-relaxed resize-y outline-none focus-visible:ring-2 focus-visible:ring-gold-official/40"
          />
          <button onClick={handleGenerate} disabled={!canGenerate}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold bg-gold-official text-white hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-default">
            <FileText className="w-4 h-4" />
            {loading ? "Scoring 8 dimensions via LLM…" : "Generate ATI Full Report"}
          </button>
          {error && (
            <p className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* ── Report output ── */}
        <div>
          {!result && !loading && (
            <EmptyState icon={FileText} title="Your professional ATI report will appear here"
              sub="Paste aircraft details on the left and generate the flagship 8-dimension report." />
          )}

          {loading && (
            <div className="glass-card py-16 text-center">
              <MiniGlobe size={40} label="Generating professional ATI report…" color="#D4A017" />
            </div>
          )}

          {result && verdict && (
            <div className="space-y-4">
              {/* Score header */}
              <div className="glass-card overflow-hidden">
                <div className="h-0.5 bg-gold-official" aria-hidden />
                <div className="p-5">
                  <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-gold-official mb-3">
                    ATI Report · Powered by ABOS Aircraft Buy Or Sell
                  </p>
                  <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-4xl font-black tabular-nums leading-none" style={{ color: verdict.color }}>
                        {result.total}<span className="text-sm text-muted-foreground font-normal">/120</span>
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[9px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full border"
                          style={{ background: verdict.bg, borderColor: verdict.bdr, color: verdict.color }}>
                          {verdict.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Deal Score: <strong className="text-foreground">{dealScore}/10</strong></span>
                        <span className="text-[10px] text-muted-foreground">Confidence: <strong className="text-foreground">{confidence}%</strong></span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-right">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Market Value</p>
                        <p className="text-sm font-bold tabular-nums">{omvmMid ? `$${omvmMid.toLocaleString()}` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Report Code</p>
                        <p className="text-[11px] font-bold font-mono tracking-wider text-gold-official">{reportCode}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(result.total / 120) * 100}%`, background: verdict.color }} />
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto border-t border-border" role="tablist">
                  {TABS.map(t => (
                    <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                      className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer touch-target-compact
                        ${tab === t ? "border-gold-official text-gold-official" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                      {t}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="p-5">
                  {tab === "Overview" && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Executive Summary</p>
                        <p className="text-[13px] text-foreground/85 leading-relaxed">{result.summary}</p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400 mb-2">Key Strengths</p>
                          <BulletList items={result.strengths} colorCls="text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-red-600 dark:text-red-400 mb-2">Risk Factors</p>
                          <BulletList items={result.risks} colorCls="text-red-500" />
                        </div>
                      </div>
                      <AINotice />
                    </div>
                  )}

                  {tab === "Identity" && (
                    result.identity_rows?.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-x-6">
                        {result.identity_rows.map(r => (
                          <div key={r.label} className="flex justify-between gap-2 py-2 border-b border-border">
                            <span className="text-[11px] text-muted-foreground shrink-0">{r.label}</span>
                            <span className="text-[11px] font-bold text-right truncate">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-muted-foreground">No identity data extracted.</p>
                  )}

                  {tab === "Dimensions" && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">
                        8 Dimensions · LLM-Scored · 15 pts each
                      </p>
                      {DIMS.map(d => {
                        const dimData = result.dimensions?.[d.key];
                        return (
                          <DimensionAnalyticsRow key={d.key} label={d.label} score={result[d.key] || 0}
                            reason={result.reasons?.[d.key]} strengths={dimData?.strengths}
                            risks={dimData?.risks} missing={dimData?.missing} />
                        );
                      })}
                    </div>
                  )}

                  {tab === "Market" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">OMVM Range</p>
                          <p className="text-xs font-bold">{result.omvm_low != null ? `$${result.omvm_low.toLocaleString()} – $${result.omvm_high.toLocaleString()}` : "—"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Midpoint</p>
                          <p className="text-sm font-black tabular-nums">{omvmMid ? `$${omvmMid.toLocaleString()}` : "—"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">vs Market</p>
                          {priceDiff ? (
                            <p className={`text-sm font-black ${parseFloat(priceDiff) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                              {parseFloat(priceDiff) >= 0 ? "▼" : "▲"} {Math.abs(parseFloat(priceDiff))}%
                            </p>
                          ) : <p className="text-sm text-muted-foreground">—</p>}
                        </div>
                      </div>
                      {result.asking_price != null && (
                        <p className="text-[11px] text-muted-foreground">Asking price: <strong className="text-foreground">${result.asking_price.toLocaleString()}</strong></p>
                      )}
                      <AINotice />
                    </div>
                  )}

                  {tab === "Risk" && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-red-600 dark:text-red-400 mb-2">Risk Factors</p>
                        <BulletList items={result.risks} colorCls="text-red-500" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gold-official mb-2">Recommendations</p>
                        <BulletList items={result.recommendations} colorCls="text-gold-official" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <ActionBar actions={[
                { label: "Download .docx", icon: Download, primary: true, onClick: () => exportDocx(result, reportCode) },
                { label: "Print", icon: Printer, onClick: () => window.print() },
                { label: copied ? "Copied!" : "Share", icon: copied ? Check : Share2, onClick: handleShare },
              ]} />
            </div>
          )}
        </div>
      </div>

      <EntitlementGateModal gate={gate} onClose={closeGate} onCheckout={startCheckout} />
    </div>
  );
}