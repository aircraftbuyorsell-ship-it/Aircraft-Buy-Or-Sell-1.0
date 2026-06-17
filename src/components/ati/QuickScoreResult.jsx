import { Zap, Lock, Unlock, CheckCircle2 } from "lucide-react";

const DIMS = [
  { key: "documentation", label: "Documentation & Records" },
  { key: "technical", label: "Technical Condition" },
  { key: "transparency", label: "Seller Transparency" },
  { key: "transaction_ready", label: "Transaction Readiness" },
  { key: "usage_mission", label: "Usage & Mission" },
  { key: "storage_exposure", label: "Storage & Exposure" },
  { key: "config_clarity", label: "Configuration Clarity" },
  { key: "market_readiness", label: "Market Readiness" },
];

function verdictFor(total) {
  if (total >= 100) return { label: "EXCEPTIONAL", color: "#00f5ff" };
  if (total >= 85) return { label: "STRONG BUY", color: "#0F7A56" };
  if (total >= 65) return { label: "FAIR", color: "#D4A017" };
  if (total >= 45) return { label: "CAUTION", color: "#E8762D" };
  if (total >= 20) return { label: "RED FLAGS", color: "#C0392B" };
  return { label: "AVOID", color: "#7f0000" };
}

function DimBar({ label, score, reason, blurred }) {
  const pct = score / 15 * 100;
  const color = score >= 13 ? "#00f5ff" : score >= 10 ? "#0F7A56" : score >= 7 ? "#D4A017" : "#C0392B";
  return (
    <div className="py-3 border-b border-white/[0.06] last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-white/80">{label}</span>
        {blurred ? (
          <span className="text-[13px] font-black text-white/15 blur-[6px] select-none">88</span>
        ) : (
          <span className="text-[13px] font-black" style={{ color }}>{score}<span className="text-white/30 text-[10px]">/15</span></span>
        )}
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-1.5">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: blurred ? "rgba(255,255,255,0.08)" : color,
            filter: blurred ? "blur(3px)" : "none",
          }}
        />
      </div>
      {reason && (
        <p className={`text-[10px] leading-snug ${blurred ? "blur-[5px] select-none text-white/15" : "text-white/45"}`}>
          {reason}
        </p>
      )}
    </div>
  );
}

export default function QuickScoreResult({ result, nReg, blurred, onUnlock, unlocking, unlocked }) {
  const total = result
    ? DIMS.reduce((s, d) => s + (result[d.key] || 0), 0)
    : null;
  const dealScore = total != null ? (total / 120 * 10).toFixed(1) : null;
  const verdict = total != null ? verdictFor(total) : null;
  const omvmMid = result ? Math.round(((result.omvm_low || 0) + (result.omvm_high || 0)) / 2) : null;
  const priceDiff =
    result?.asking_price && omvmMid
      ? ((omvmMid - result.asking_price) / omvmMid * 100).toFixed(1)
      : null;

  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.1] relative"
      style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)" }}>

      {/* ── Blur overlay ───────────────────────────────── */}
      {blurred && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl"
          style={{ background: "rgba(10,8,30,0.82)", backdropFilter: "blur(12px)" }}>
          <div className="text-center px-6">
            <Lock className="w-8 h-8 mx-auto mb-3 text-[#D4A017]" />
            <p className="text-white/80 text-sm font-bold mb-1">Score Locked</p>
            <p className="text-white/40 text-xs mb-4">
              Unlock the full ATI Quick Score for <span className="text-[#D4A017] font-bold">3 credits</span>
            </p>
          </div>
        </div>
      )}

      {/* ── Score hero ──────────────────────────────────── */}
      <div className={`px-6 py-5 border-b border-white/[0.08] ${blurred ? "blur-[10px] select-none" : ""}`}
        style={{ background: `${verdict?.color || "#00f5ff"}0d` }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] font-black" style={{ color: verdict?.color || "#00f5ff" }}>
              ATI Quick Score
            </p>
            <p className="text-5xl font-black leading-none text-white mt-1">
              {total}<span className="text-lg text-white/30">/120</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black" style={{ color: verdict?.color || "#00f5ff" }}>{dealScore}</div>
            <div className="text-[9px] text-white/40 uppercase tracking-wider">Deal Score /10</div>
            <div className="mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block"
              style={{ background: `${verdict?.color || "#00f5ff"}18`, border: `1px solid ${verdict?.color || "#00f5ff"}40`, color: verdict?.color || "#00f5ff" }}>
              {verdict?.label || "—"}
            </div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(total || 0) / 120 * 100}%`,
              background: `linear-gradient(90deg, ${(verdict?.color || "#00f5ff")}80, ${verdict?.color || "#00f5ff"})`,
            }} />
        </div>
      </div>

      {/* ── N-Reg (always visible) ─────────────────────── */}
      <div className={`px-5 py-3 border-b border-white/[0.07] ${blurred ? "z-20 relative" : ""}`}
        style={{ background: "rgba(0,245,255,0.05)" }}>
        <p className="text-[9px] uppercase tracking-wider text-[#00f5ff] font-black mb-0.5">Aircraft Registration</p>
        <p className="text-white text-[15px] font-black">{nReg || "—"}</p>
      </div>

      {/* ── Flash line ──────────────────────────────────── */}
      {result?.flash_line && (
        <div className={`px-5 py-3 border-b border-white/[0.07] ${blurred ? "blur-[8px] select-none" : ""}`}
          style={{ background: "rgba(212,160,23,0.06)" }}>
          <p className="text-[9px] uppercase tracking-wider text-[#D4A017] font-black mb-0.5">⚡ Key Buyer Alert</p>
          <p className="text-white text-[13px] font-semibold leading-snug">{result.flash_line}</p>
        </div>
      )}

      {/* ── Valuation ───────────────────────────────────── */}
      {omvmMid && (
        <div className={`px-5 py-4 border-b border-white/[0.07] grid grid-cols-3 gap-4 ${blurred ? "blur-[8px] select-none" : ""}`}>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/35 font-semibold">OMVM Range</p>
            <p className="text-[13px] font-black text-white/80">
              ${(result.omvm_low || 0).toLocaleString()} – ${(result.omvm_high || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/35 font-semibold">Midpoint</p>
            <p className="text-[13px] font-black text-white">${omvmMid.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/35 font-semibold">Asking</p>
            {result.asking_price ? (
              <>
                <p className="text-[13px] font-black text-white">${result.asking_price.toLocaleString()}</p>
                {priceDiff && (
                  <p className="text-[10px] font-bold" style={{ color: parseFloat(priceDiff) >= 0 ? "#0F7A56" : "#C0392B" }}>
                    {parseFloat(priceDiff) >= 0 ? "▼" : "▲"} {Math.abs(parseFloat(priceDiff))}% {parseFloat(priceDiff) >= 0 ? "below" : "above"} market
                  </p>
                )}
              </>
            ) : (
              <p className="text-[12px] text-white/30">Not listed</p>
            )}
          </div>
        </div>
      )}

      {/* ── Dimension bars ──────────────────────────────── */}
      <div className="px-5 py-4">
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/35 font-black mb-3">8-Dimension Breakdown</p>
        {DIMS.map((d) => (
          <DimBar key={d.key} label={d.label} score={result[d.key] || 0} reason={result.reasons?.[d.key]} blurred={blurred} />
        ))}
      </div>

      {/* ── Unlocked badge ──────────────────────────────── */}
      {unlocked && (
        <div className="px-5 py-3 border-t border-white/[0.08] flex items-center justify-center gap-2 text-[#22c55e]"
          style={{ background: "rgba(34,197,94,0.05)" }}>
          <CheckCircle2 className="w-4 h-4" />
          <p className="text-[11px] font-bold uppercase tracking-wider">Score Unlocked</p>
        </div>
      )}
    </div>
  );
}