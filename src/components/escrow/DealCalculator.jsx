import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calculator, Search, Loader2, X, TrendingDown, TrendingUp, Banknote, ShieldCheck, Info } from "lucide-react";
import { formatMoney } from "@/lib/escrow";

const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";
const BORDER = "rgba(255,255,255,0.08)";
const AMBER = "#f5c242";
const TEAL = "#5dcaa5";
const RED = "#e24b4a";
const CARD = "rgba(255,255,255,0.04)";

function getFinderFeePct(atiScore) {
  if (atiScore >= 100) return 1.5;
  if (atiScore >= 80)  return 2.0;
  if (atiScore >= 60)  return 2.5;
  return 3.0;
}

function getEscrowFeePct() { return 0.89; }

function estimateOMVM(make, model, year) {
  const age = year ? new Date().getFullYear() - year : 20;
  return Math.max(15000, Math.round(120000 * Math.exp(-0.04 * age) / 5000) * 5000);
}

const ATI_LABELS = {
  100: "Exceptional — lowest risk", 80: "Strong Buy — low risk",
  60: "Fair — moderate risk", 40: "Caution — elevated risk",
  20: "Red Flags — high risk", 0: "Avoid — extreme risk",
};

function getATILabel(score) {
  const thresholds = Object.keys(ATI_LABELS).map(Number).sort((a, b) => b - a);
  for (const t of thresholds) { if (score >= t) return ATI_LABELS[t]; }
  return ATI_LABELS[0];
}

export default function DealCalculator({ className = "" }) {
  const [searchReg, setSearchReg] = useState("");
  const [selectedListing, setSelectedListing] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualPrice, setManualPrice] = useState("");
  const [manualATI, setManualATI] = useState("");
  const [showRules, setShowRules] = useState(false);

  const { data: allListings = [], isLoading: searching } = useQuery({
    queryKey: ["deal-calc-listings"],
    enabled: !manualMode,
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }, "-created_date", 100),
  });

  const listings = searchReg.length >= 2
    ? allListings.filter(l => (l.registration || "").toUpperCase().includes(searchReg.toUpperCase())).slice(0, 5)
    : [];

  const listing = selectedListing;
  const effectivePrice = manualMode ? Number(manualPrice) || 0 : listing?.asking_price || 0;
  const effectiveATI = manualMode ? Number(manualATI) || 0 : listing?.ati_score || 0;
  const effectiveOMVM = listing?.omvm_value || (effectivePrice > 0 ? estimateOMVM(listing?.make, listing?.model, listing?.year) : 0);

  const savings = effectiveOMVM > effectivePrice ? effectiveOMVM - effectivePrice : 0;
  const savingsPct = effectiveOMVM > 0 ? (savings / effectiveOMVM * 100).toFixed(1) : 0;

  const finderFeePct = getFinderFeePct(effectiveATI);
  const escrowFeePct = getEscrowFeePct();
  const finderFee = Math.round(effectivePrice * finderFeePct) / 100;
  const escrowFee = Math.round(effectivePrice * escrowFeePct) / 100;
  const totalFees = finderFee + escrowFee;
  const netSavings = savings - totalFees;
  const hasData = effectivePrice > 0;

  const clearSelection = () => { setSelectedListing(null); setSearchReg(""); };

  const inputStyle = { background: CARD, border: `0.5px solid ${BORDER}`, color: W1 };
  const cardStyle = { background: CARD, border: `0.5px solid ${BORDER}` };

  return (
    <div className={`rounded-2xl p-5 ${className}`} style={cardStyle}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,194,66,0.09)" }}>
            <Calculator className="w-4 h-4" style={{ color: AMBER }} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: W1 }}>Deal Calculator</h3>
            <p className="text-[10px]" style={{ color: W2 }}>Estimate savings & transaction fees</p>
          </div>
        </div>
        <button onClick={() => setShowRules(!showRules)} className="flex items-center gap-1 text-[10px] font-bold transition-colors hover:opacity-80" style={{ color: AMBER }}>
          <Info className="w-3 h-3" />
          {showRules ? "Hide rules" : "Fee rules"}
        </button>
      </div>

      {showRules && (
        <div className="mb-4 rounded-xl p-3 text-[10px] space-y-1" style={{ background: "rgba(245,194,66,0.06)", border: `0.5px solid rgba(245,194,66,0.22)` }}>
          <p className="font-black uppercase mb-1" style={{ color: AMBER }}>Platform Fee Rules</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5" style={{ color: W2 }}>
            <span>ATI ≥ 100 (Exceptional):</span><span className="font-bold">1.5% finder's fee</span>
            <span>ATI ≥ 80 (Strong Buy):</span><span className="font-bold">2.0% finder's fee</span>
            <span>ATI ≥ 60 (Fair):</span><span className="font-bold">2.5% finder's fee</span>
            <span>ATI &lt; 60:</span><span className="font-bold">3.0% finder's fee</span>
          </div>
          <p className="mt-1" style={{ color: W3 }}>Escrow fee: 0.89% · Savings = OMVM − Asking Price</p>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => { setManualMode(false); setSelectedListing(null); setSearchReg(""); }}
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-opacity"
            style={!manualMode ? { background: AMBER, color: "#04060a" } : { background: CARD, border: `0.5px solid ${BORDER}`, color: W2 }}
          >
            Search listing
          </button>
          <button
            onClick={() => { setManualMode(true); setSelectedListing(null); setSearchReg(""); }}
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-opacity"
            style={manualMode ? { background: AMBER, color: "#04060a" } : { background: CARD, border: `0.5px solid ${BORDER}`, color: W2 }}
          >
            Manual entry
          </button>
        </div>

        {!manualMode ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: W3 }} />
            <input
              value={searchReg}
              onChange={e => { setSearchReg(e.target.value); setSelectedListing(null); }}
              placeholder="Search by N-number (e.g. N123AB)..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
              style={inputStyle}
            />
            {searchReg && (
              <button onClick={() => setSearchReg("")} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5" style={{ color: W3 }} /></button>
            )}
            {searchReg.length >= 2 && !selectedListing && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl z-10 max-h-48 overflow-y-auto" style={{ background: "rgba(13,17,23,0.98)", border: `0.5px solid ${BORDER}` }}>
                {searching ? (
                  <div className="flex items-center gap-2 px-4 py-3 text-[11px]" style={{ color: W2 }}>
                    <Loader2 className="w-3 h-3 animate-spin" /> Searching…
                  </div>
                ) : listings.length === 0 ? (
                  <div className="px-4 py-3 text-[11px]" style={{ color: W2 }}>No matching listings found</div>
                ) : (
                  listings.map(l => (
                    <button
                      key={l.id}
                      onClick={() => { setSelectedListing(l); setSearchReg(l.registration || ""); }}
                      className="w-full text-left px-4 py-3 transition-colors hover:bg-white/5"
                      style={{ borderBottom: `0.5px solid ${BORDER}` }}
                    >
                      <p className="text-sm font-bold" style={{ color: W1 }}>{l.registration} — {l.year} {l.make} {l.model}</p>
                      <p className="text-[10px]" style={{ color: W2 }}>
                        {l.asking_price ? `$${l.asking_price.toLocaleString()}` : "On request"} · ATI: {l.ati_score || "—"}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[9px] uppercase tracking-wider font-bold mb-1 block" style={{ color: W3 }}>Asking Price (USD)</label>
              <input type="number" value={manualPrice} onChange={e => setManualPrice(e.target.value)} placeholder="e.g. 250000" className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
            </div>
            <div className="flex-1">
              <label className="text-[9px] uppercase tracking-wider font-bold mb-1 block" style={{ color: W3 }}>ATI Score (0–120)</label>
              <input type="number" min="0" max="120" value={manualATI} onChange={e => setManualATI(e.target.value)} placeholder="e.g. 85" className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
            </div>
          </div>
        )}
      </div>

      {selectedListing && (
        <div className="mb-4 flex items-center justify-between gap-2 p-3 rounded-xl" style={{ background: "rgba(78,142,247,0.06)", border: "0.5px solid rgba(78,142,247,0.20)" }}>
          <div className="min-w-0">
            <p className="text-sm font-black truncate" style={{ color: W1 }}>
              {selectedListing.year} {selectedListing.make} {selectedListing.model}
            </p>
            <p className="text-[10px]" style={{ color: W2 }}>
              {selectedListing.registration} · ATI {selectedListing.ati_score || "—"}
            </p>
          </div>
          <button onClick={clearSelection} className="shrink-0">
            <X className="w-4 h-4" style={{ color: W3 }} />
          </button>
        </div>
      )}

      {hasData ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={cardStyle}>
              <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: W3 }}>Asking Price</p>
              <p className="text-lg font-black" style={{ color: W1 }}>{formatMoney(effectivePrice)}</p>
              {effectiveATI > 0 && (
                <p className="text-[10px] font-bold mt-0.5" style={{ color: AMBER }}>
                  ATI {effectiveATI} · {getATILabel(effectiveATI).split(" —")[0]}
                </p>
              )}
            </div>
            <div className="rounded-xl p-3" style={cardStyle}>
              <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: W3 }}>Est. Market Value</p>
              <p className="text-lg font-black" style={{ color: TEAL }}>{formatMoney(effectiveOMVM)}</p>
              {savings > 0 && (
                <p className="text-[10px] font-bold mt-0.5 flex items-center gap-1" style={{ color: TEAL }}>
                  <TrendingDown className="w-3 h-3" /> {savingsPct}% below market
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl p-3" style={{ background: "rgba(93,202,165,0.06)", border: "0.5px solid rgba(93,202,165,0.20)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4" style={{ color: TEAL }} />
                <span className="text-sm font-black" style={{ color: TEAL }}>Potential Savings</span>
              </div>
              <p className="text-lg font-black" style={{ color: TEAL }}>{formatMoney(savings)}</p>
            </div>
            {savings <= 0 && (
              <p className="text-[10px] mt-1" style={{ color: W2 }}>
                Asking price is at or above estimated market value — no discount detected.
              </p>
            )}
          </div>

          <div className="rounded-xl p-3" style={cardStyle}>
            <p className="text-[10px] uppercase tracking-wider font-black mb-2" style={{ color: W2 }}>Transaction Fees</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: AMBER }} />
                  <span style={{ color: W1 }}>Finder's fee ({finderFeePct}%)</span>
                </div>
                <span className="font-bold" style={{ color: W1 }}>{formatMoney(finderFee)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Banknote className="w-3.5 h-3.5" style={{ color: W3 }} />
                  <span style={{ color: W1 }}>Escrow fee ({escrowFeePct}%)</span>
                </div>
                <span className="font-bold" style={{ color: W1 }}>{formatMoney(escrowFee)}</span>
              </div>
              <div className="pt-2 flex items-center justify-between" style={{ borderTop: `0.5px solid ${BORDER}` }}>
                <span className="text-sm font-black" style={{ color: W1 }}>Total fees</span>
                <span className="text-sm font-black" style={{ color: W1 }}>{formatMoney(totalFees)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-3" style={netSavings > 0 ? { background: "rgba(93,202,165,0.06)", border: "0.5px solid rgba(93,202,165,0.20)" } : { background: "rgba(226,75,74,0.06)", border: "0.5px solid rgba(226,75,74,0.22)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {netSavings > 0 ? <TrendingDown className="w-4 h-4" style={{ color: TEAL }} /> : <TrendingUp className="w-4 h-4" style={{ color: RED }} />}
                <span className="text-sm font-black" style={{ color: netSavings > 0 ? TEAL : RED }}>
                  Net {netSavings > 0 ? "Savings" : "Cost"} After Fees
                </span>
              </div>
              <p className="text-lg font-black" style={{ color: netSavings > 0 ? TEAL : RED }}>
                {formatMoney(Math.abs(netSavings))}
              </p>
            </div>
            <p className="text-[10px] mt-1" style={{ color: W2 }}>
              {netSavings > 0
                ? `You save ${formatMoney(netSavings)} after all fees — ${((netSavings / effectiveOMVM) * 100).toFixed(1)}% net discount vs market.`
                : netSavings < 0
                  ? `Total fees exceed any market discount by ${formatMoney(Math.abs(netSavings))}.`
                  : "Break-even after fees — no net gain or loss vs market value."}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8" style={{ color: W3 }}>
          <Calculator className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">Search a listing or enter values manually</p>
          <p className="text-[10px] mt-0.5">See estimated savings and transaction costs instantly</p>
        </div>
      )}
    </div>
  );
}