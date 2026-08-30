import { useState } from "react";
import { runMarketspaceAssistant, marketspaceSummary } from "@/lib/marketspaceAssistant";
import { Plane, Search, BarChart3, Scale, Users, GitBranch, Bell, Globe, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const ACTIONS = [
  { key: "discover", title: "Discover", description: "Find aircraft, filter the market and build a shortlist.", icon: Search, href: "/listings" },
  { key: "evaluate", title: "Evaluate", description: "Check Deal Radar, OMVM, ATI and market position.", icon: BarChart3, href: "/deal-radar" },
  { key: "compare", title: "Compare", description: "Compare aircraft side by side using shared aircraft data.", icon: Scale, href: "/compare" },
  { key: "sell", title: "Sell", description: "Prepare an aircraft for market and position the listing.", icon: Plane, href: "/listings" },
  { key: "buyers", title: "Find Buyers", description: "Find qualified buyer matches and manage leads.", icon: Users, href: "/leads" },
  { key: "deal", title: "Execute Deal", description: "Move a buyer and aircraft into the transaction pipeline.", icon: GitBranch, href: "/sales-pipeline" },
  { key: "signals", title: "Market Signals", description: "Monitor new listings, price changes and market opportunities.", icon: Bell, href: "/aircraft-alerts" },
  { key: "cross-border", title: "Cross-Border", description: "Coordinate international aircraft transactions.", icon: Globe, href: "/cross-border-bridge" },
];

export default function MarketspaceAssistant() {
  const [prompt, setPrompt] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    if (!prompt.trim() || loading) return;
    setSubmitted(prompt.trim());
    setLoading(true);
    try {
      const next = await runMarketspaceAssistant(prompt);
      setResult(next);
      window.dispatchEvent(new CustomEvent('abos:marketspace-context', { detail: next }));
    } catch (error) {
      setResult({ error: error?.message || 'Marketspace workflow unavailable' });
    } finally { setLoading(false); }
  };

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      <div className="p-6 md:p-8 bg-gradient-to-br from-card to-muted/20">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 shrink-0 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-gold" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-gold">Marketspace Assistant</p>
            <h2 className="mt-1 text-2xl md:text-3xl font-black tracking-tight">What do you want to do with the aircraft market?</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">One market workflow for discovering aircraft, evaluating opportunities, finding buyers and moving transactions forward.</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 flex flex-col sm:flex-row gap-2">
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. Find me a Cessna 172 under $180,000 with ATI above 80" className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold/50" />
          <button type="submit" disabled={loading} className="rounded-xl px-5 py-3 bg-foreground text-background font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? "Working…" : "Ask Assistant"}</button>
        </form>
        {submitted && <div className="mt-3 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 text-sm"><span className="font-bold">Request:</span> {submitted}</div>}
        {result && !result.error && <div className="mt-4 rounded-2xl border border-border bg-background/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] uppercase tracking-widest font-bold text-gold">Workflow active</p><p className="mt-1 text-sm font-black">{marketspaceSummary(result)}</p></div><span className="rounded-full border border-border px-3 py-1 text-[10px] uppercase font-bold">{result.intent}</span></div>
          {result.aircraft?.length > 0 && <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{result.aircraft.slice(0,6).map((a) => <Link key={a.id} to={`/aircraft/${a.id}`} className="rounded-xl border border-border p-3 hover:border-gold/40 transition"><div className="flex justify-between gap-2"><span className="font-bold text-xs">{a.year ? `${a.year} ` : ''}{a.make || ''} {a.model || ''}</span><span className="font-mono text-[10px] text-muted-foreground">{a.registration || '—'}</span></div><div className="mt-2 flex gap-3 text-[10px] text-muted-foreground"><span>{a.asking_price ? `$${Number(a.asking_price).toLocaleString()}` : 'Price —'}</span>{a.ati_score != null && <span>ATI {a.ati_score}</span>}{a.deal_score != null && <span>Deal {Number(a.deal_score).toFixed(1)}</span>}</div></Link>)}</div>}
          {result.digitalTwin?.found && <div className="mt-4 rounded-xl border border-border bg-background/60 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-widest font-bold text-gold">Shared Aircraft Digital Twin</p><p className="mt-1 text-sm font-black">{result.digitalTwin.registration} · {result.digitalTwin.year || '—'} {result.digitalTwin.make || ''} {result.digitalTwin.model || ''}</p></div><Link className="text-xs font-bold hover:text-gold" to={`/twin/${result.digitalTwin.registration}`}>Open Twin →</Link></div><div className="mt-2 text-[10px] text-muted-foreground">Registry: {result.digitalTwin.registration_status || 'Unknown'} · Serial: {result.digitalTwin.serial_number_masked || 'protected'} · ATI: {result.digitalTwin.ati_score_locked ? 'protected' : result.digitalTwin.score_label || '—'}</div><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('abos:assistant-handoff', { detail: { registration: result.digitalTwin.registration, handoff: { prompt: `Analyse ${result.digitalTwin.registration} using the current Marketspace and Digital Twin context.` } } }))} className="mt-3 text-[10px] font-black uppercase tracking-wider text-gold hover:underline">Continue in ABOS Assistant →</button></div>}
          {result.premiumLocked && <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4"><p className="text-[10px] uppercase tracking-widest font-bold text-gold">Premium capability locked</p><p className="mt-1 text-sm font-bold">Deal Analysis includes OMVM + Deal Score for this aircraft.</p><Link to={`/pricing?product=DEAL_ANALYSIS&registration=${encodeURIComponent(result.requestedRegistration || '')}`} className="mt-3 inline-flex rounded-lg bg-foreground px-3 py-2 text-xs font-bold text-background">Unlock Deal Analysis — $99</Link></div>}
          {result.transaction && <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-widest font-bold text-gold">Transaction Pipeline</p><p className="mt-1 text-sm font-black">{result.transaction.registration}</p></div><span className="text-xs font-bold">{result.transaction.progressPct}%</span></div><div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, Math.max(0, result.transaction.progressPct))}%` }} /></div><div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground"><span>{result.transaction.status}</span><Link className="font-bold text-foreground hover:text-gold" to={`/sales-pipeline/${result.transaction.registration}`}>{result.transaction.existingPipelineId ? "Open Transaction Pipeline →" : "Start Transaction Pipeline →"}</Link></div></div>}
          <div className="mt-4 flex flex-wrap gap-2">{(result.nextActions || []).map(action => <span key={action} className="rounded-lg bg-muted px-2.5 py-1.5 text-[10px] font-semibold">{action}</span>)}</div>
        </div>}
        {result?.error && <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{result.error}</div>}
      </div>

      <div className="p-5 md:p-7 border-t border-border">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ACTIONS.map(({ title, description, icon: Icon, href }) => (
            <Link key={title} to={href} className="group rounded-2xl border border-border bg-background/60 p-4 hover:border-gold/40 hover:bg-gold/5 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="h-9 w-9 rounded-xl border border-border bg-card flex items-center justify-center"><Icon className="h-4 w-4 text-gold" /></div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
              </div>
              <h3 className="mt-4 text-sm font-black">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
            </Link>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-gold/20 bg-gold/5 p-4 text-xs leading-5 text-muted-foreground"><span className="font-bold text-foreground">Shared aircraft state.</span> Listings, Deal Radar, Compare, Leads, Deal Room, Market Signals and Cross-Border remain available as capabilities. They should consume the same Aircraft Digital Twin, verification evidence, ATI and valuation data rather than creating duplicate aircraft records.</div>
      </div>
    </div>
  );
}
