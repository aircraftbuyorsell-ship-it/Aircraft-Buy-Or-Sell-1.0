import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, Circle, FileCheck2, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const MODULES = [
  ['registry', 'Registry Verification', 'FAA / registry source, registration, status and aircraft identity'],
  ['identity', 'Identity / Serial', 'S/N, registration ↔ identity and conflict detection'],
  ['ownership', 'Ownership Verification', 'Available ownership records and seller consistency'],
  ['activity', 'Activity Verification', 'Live / historical activity and anomalies'],
  ['service', 'Service / Maintenance', 'Service records, AD intelligence and maintenance evidence'],
  ['documents', 'Document Verification', 'OCR-ready document evidence and cross-checks'],
];

export default function VerificationAssistant() {
  const [query, setQuery] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQuery(p.get('registration') || p.get('serial') || '');
  }, []);

  const run = async (value = query) => {
    const registration = value.trim();
    if (!registration) return;
    setRunning(true); setError(null); setResult(null);
    try {
      const res = await base44.functions.invoke('verificationEngine', { registration, entry: 'verify' });
      if (res?.data?.error) throw new Error(res.data.error);
      setResult(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Verification failed.');
    } finally { setRunning(false); }
  };

  const overall = useMemo(() => result?.verification_confidence ?? null, [result]);

  return (
    <div className="min-h-[70vh] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.2em] text-gold">
                <ShieldCheck className="h-3.5 w-3.5" /> Verification Assistant
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">Verify the aircraft, not just the registration.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">One shared Verification Engine orchestrates registry, identity, ownership, activity, service and document evidence into one verification graph and ATI input set.</p>
            </div>
            <div className="rounded-2xl border border-border bg-background px-4 py-3 text-right">
              <div className="text-[9px] font-black uppercase tracking-[.18em] text-muted-foreground">Shared state</div>
              <div className="mt-1 text-sm font-bold">Aircraft Digital Twin</div>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); run(); }} className="mt-7 flex flex-col gap-3 sm:flex-row">
            <input value={query} onChange={(e) => setQuery(e.target.value.toUpperCase())} placeholder="N123AB or serial number" className="h-14 flex-1 rounded-2xl border border-border bg-background px-5 text-base font-bold outline-none focus:border-gold" />
            <button disabled={running || !query.trim()} className="h-14 rounded-2xl bg-gold px-7 text-sm font-black text-black disabled:opacity-50">
              {running ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</span> : 'Start Verification'}
            </button>
          </form>

          {error && <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{error}</div>}

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {MODULES.map(([key, title, desc], i) => {
              const m = result?.modules?.[key];
              const verified = !!m?.verified;
              const conflict = key === 'identity' && m?.registration_match === false;
              return (
                <div key={key} className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{running && !result ? <Loader2 className="h-5 w-5 animate-spin text-gold" /> : conflict ? <AlertTriangle className="h-5 w-5 text-red-400" /> : verified ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <Circle className="h-5 w-5 text-muted-foreground" />}</div>
                    <div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><div className="font-bold">{i + 1}. {title}</div>{m && <span className="font-mono text-xs text-muted-foreground">{Math.round(m.confidence || 0)}%</span>}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{desc}</p></div>
                  </div>
                </div>
              );
            })}
          </div>

          {result && (
            <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-gold"><FileCheck2 className="h-4 w-4" /> Evidence trail</div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <Metric label="Verification Confidence" value={`${Math.round(overall)}%`} />
                  <Metric label="ATI input score" value={`${result.ati_score}/120`} />
                  <Metric label="Conflicts" value={String(result.conflicts || 0)} />
                </div>
                <div className="mt-4 text-xs text-muted-foreground">Session: <span className="font-mono">{result.verification_session_id || 'local-only'}</span></div>
              </div>
              <div className="rounded-2xl border border-gold/25 bg-gold/5 p-5 md:w-80">
                <div className="flex items-center gap-2 text-sm font-black"><Sparkles className="h-4 w-4 text-gold" /> Continue with ABOS Assistant</div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">The conversational assistant can consume this same aircraft context instead of starting a second verification.</p>
                <button onClick={() => window.dispatchEvent(new CustomEvent('abos:assistant-handoff', { detail: result }))} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-xs font-black">Investigate / Analyse <ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) { return <div className="rounded-xl border border-border bg-card px-3 py-3"><div className="text-lg font-black">{value}</div><div className="mt-1 text-[9px] font-black uppercase tracking-wider text-muted-foreground">{label}</div></div>; }
