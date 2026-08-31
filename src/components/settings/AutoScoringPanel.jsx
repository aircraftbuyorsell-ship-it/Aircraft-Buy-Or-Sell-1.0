import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Radar, Database, Play, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp, Info } from "lucide-react";

function ResultBox({ result, label }) {
  const [open, setOpen] = useState(false);
  if (!result) return null;
  const ok = result.ok !== false && !result.error;

  return (
    <div className={`rounded-xl border p-4 text-sm ${ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold">
          {ok ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
          <span className={ok ? "text-green-800" : "text-red-700"}>{label} — {ok ? "Success" : "Error"}</span>
        </div>
        <button onClick={() => setOpen(v => !v)} className="text-[#6B6560] hover:text-[#0B2D5B]">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {ok && (
        <div className="flex flex-wrap gap-3 mt-3 text-xs">
          {result.processed != null && <span className="font-bold text-[#0B2D5B]">{result.processed} processed</span>}
          {result.candidates_processed != null && <span className="font-bold text-[#0B2D5B]">{result.candidates_processed} processed</span>}
          {result.created != null && <span className="text-green-700 font-bold">+{result.created} created</span>}
          {result.updated != null && <span className="text-blue-700 font-bold">↻ {result.updated} updated</span>}
          {result.skipped != null && <span className="text-[#AAA49C]">{result.skipped} skipped</span>}
          {result.has_more && (
            <Badge className="bg-[#E8A83A]/15 text-[#A67C00] border-[#E8A83A]/30 text-[10px]">More available</Badge>
          )}
        </div>
      )}

      {result.error && <p className="text-red-700 text-xs mt-2 font-mono">{result.error}</p>}

      {open && result.sample?.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#AAA49C] mb-1.5">Sample results</p>
          {result.sample.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-1.5 border border-black/05">
              <span className="font-mono font-bold text-[#0B2D5B]">{s.n_number || s.reg}</span>
              <span className={`font-bold ${s.action === 'created' ? 'text-green-600' : 'text-blue-600'}`}>{s.action}</span>
              <span className="text-[#6B6560]">ATI <strong>{s.ati}</strong>/120</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AutoScoringPanel() {
  const [faaRunning, setFaaRunning] = useState(false);
  const [trafficRunning, setTrafficRunning] = useState(false);
  const [faaResult, setFaaResult] = useState(null);
  const [trafficResult, setTrafficResult] = useState(null);
  const [faaBatchSize, setFaaBatchSize] = useState(50);
  const [faaOffset, setFaaOffset] = useState(0);
  const [trafficLimit, setTrafficLimit] = useState(100);

  const { data: faaCount } = useQuery({
    queryKey: ["faa-count"],
    queryFn: () => base44.entities.FAAAircraft.list('-created_date', 1).then(r => r),
    select: () => null,
  });

  const { data: listingCount } = useQuery({
    queryKey: ["listing-count-scored"],
    queryFn: () => base44.entities.AircraftListing.list('-created_date', 1),
    select: () => null,
  });

  const { data: latestSnap } = useQuery({
    queryKey: ["latest-snapshot"],
    queryFn: () => base44.entities.TrafficSnapshot.list('-refreshed_at', 1).then(r => r[0]),
  });

  const runFAA = async () => {
    setFaaRunning(true);
    setFaaResult(null);
    try {
      const res = await base44.functions.invoke("autoScoreFAA", {
        batch_size: faaBatchSize,
        offset: faaOffset,
      });
      setFaaResult(res.data);
      if (res.data?.next_offset) setFaaOffset(res.data.next_offset);
    } catch (e) {
      setFaaResult({ ok: false, error: e.message });
    } finally {
      setFaaRunning(false);
    }
  };

  const runTraffic = async () => {
    setTrafficRunning(true);
    setTrafficResult(null);
    try {
      const res = await base44.functions.invoke("autoScoreTraffic", { limit: trafficLimit });
      setTrafficResult(res.data);
    } catch (e) {
      setTrafficResult({ ok: false, error: e.message });
    } finally {
      setTrafficRunning(false);
    }
  };

  return (
    <div className="glass-card p-7">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-[#0B2D5B]/10 flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-[#0B2D5B]" />
        </div>
        <div>
          <h2 className="font-black text-[#0B2D5B] uppercase tracking-tight text-base">
            Auto ATI Scoring Engine
          </h2>
          <p className="text-sm text-[#6B6560] mt-1">
            Automatically compute ATI proxy scores (0–120) for all aircraft from FAA registry or live traffic — no LLM, pure metadata analysis. Creates AircraftListing records with deal labels.
          </p>
        </div>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-[#E8A83A]/08 border border-[#E8A83A]/20 mb-6 text-xs text-[#7A5C00]">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#E8A83A]" />
        <p>ATI proxy scores are computed from FAA registration metadata only (no user-provided docs or LLM). They represent <strong>data availability & regulatory transparency</strong> — not aircraft condition. Full ATI Passport (with detailed dimensions) requires the ATI Wizard.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* FAA Batch Scorer */}
        <div className="rounded-2xl border border-black/[0.07] bg-white/60 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#0B2D5B]/08 flex items-center justify-center">
              <Database className="w-4 h-4 text-[#0B2D5B]" />
            </div>
            <div>
              <p className="font-black text-[#0B2D5B] text-sm uppercase tracking-tight">FAA Registry Batch</p>
              <p className="text-[11px] text-[#AAA49C]">Score aircraft from FAAAircraft database</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-[#6B6560] block mb-1">
                Batch size (max 200)
              </label>
              <input
                type="number"
                value={faaBatchSize}
                onChange={e => setFaaBatchSize(Math.min(200, Math.max(1, parseInt(e.target.value) || 50)))}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#0B2D5B]"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-[#6B6560] block mb-1">
                Offset (pagination)
              </label>
              <input
                type="number"
                value={faaOffset}
                onChange={e => setFaaOffset(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#0B2D5B]"
              />
            </div>
          </div>

          <Button
            onClick={runFAA}
            disabled={faaRunning}
            className="w-full font-bold text-white"
            style={{ background: "linear-gradient(135deg,#0B2D5B,#143C75)" }}
          >
            {faaRunning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scoring…</> : <><Play className="w-4 h-4 mr-2" /> Run FAA Batch</>}
          </Button>

          {faaResult && <div className="mt-3"><ResultBox result={faaResult} label="FAA Batch" /></div>}
          {faaResult?.has_more && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 font-bold"
              onClick={runFAA}
              disabled={faaRunning}
            >
              Continue next batch →
            </Button>
          )}
        </div>

        {/* Traffic Scorer */}
        <div className="rounded-2xl border border-black/[0.07] bg-white/60 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#E8A83A]/12 flex items-center justify-center">
              <Radar className="w-4 h-4 text-[#E8A83A]" />
            </div>
            <div>
              <p className="font-black text-[#0B2D5B] text-sm uppercase tracking-tight">Live Traffic Enrich</p>
              <p className="text-[11px] text-[#AAA49C]">Score aircraft from latest ADS-B snapshot</p>
            </div>
          </div>

          {latestSnap && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-[#0B2D5B]/05 border border-[#0B2D5B]/08 text-xs">
              <p className="text-[#6B6560]">
                Latest snapshot: <strong className="text-[#0B2D5B]">{latestSnap.total_raw || "?"} aircraft</strong>
                {latestSnap.refreshed_at && (
                  <span className="text-[#AAA49C] ml-2">
                    {Math.round((Date.now() - new Date(latestSnap.refreshed_at).getTime()) / 60000)} min ago
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#6B6560] block mb-1">
              Max aircraft to process (max 500)
            </label>
            <input
              type="number"
              value={trafficLimit}
              onChange={e => setTrafficLimit(Math.min(500, Math.max(1, parseInt(e.target.value) || 100)))}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#0B2D5B]"
            />
          </div>

          <Button
            onClick={runTraffic}
            disabled={trafficRunning || !latestSnap}
            className="w-full font-bold text-white"
            style={{ background: "linear-gradient(135deg,#E8A83A,#D4911A)", color: "#0B2D5B" }}
          >
            {trafficRunning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scoring…</> : <><Play className="w-4 h-4 mr-2" /> Enrich Traffic Snapshot</>}
          </Button>

          {!latestSnap && (
            <p className="text-[11px] text-[#AAA49C] mt-2 text-center">Go to Live Traffic page and refresh first.</p>
          )}

          {trafficResult && <div className="mt-3"><ResultBox result={trafficResult} label="Traffic Enrich" /></div>}
        </div>
      </div>
    </div>
  );
}