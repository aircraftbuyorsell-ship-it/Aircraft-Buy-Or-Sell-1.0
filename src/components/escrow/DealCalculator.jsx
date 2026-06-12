import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calculator, Search, Loader2, X, TrendingDown, TrendingUp, Banknote, ShieldCheck, Info } from "lucide-react";
import { formatMoney } from "@/lib/escrow";

// ── Internal fee rules based on ATI score ────────────────────────
function getFinderFeePct(atiScore) {
  if (atiScore >= 100) return 1.5;
  if (atiScore >= 80)  return 2.0;
  if (atiScore >= 60)  return 2.5;
  return 3.0;
}

function getEscrowFeePct() {
  return 0.89; // standard Escrow.com rate
}

function estimateOMVM(make, model, year) {
  // Rough estimate: base value decays with age, adjusted by make reputation
  const age = year ? new Date().getFullYear() - year : 20;
  return Math.max(15000, Math.round(120000 * Math.exp(-0.04 * age) / 5000) * 5000);
}

const ATI_LABELS = {
  100: "Exceptional — lowest risk",
  80:  "Strong Buy — low risk",
  60:  "Fair — moderate risk",
  40:  "Caution — elevated risk",
  20:  "Red Flags — high risk",
  0:   "Avoid — extreme risk",
};

function getATILabel(score) {
  const thresholds = Object.keys(ATI_LABELS).map(Number).sort((a, b) => b - a);
  for (const t of thresholds) {
    if (score >= t) return ATI_LABELS[t];
  }
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

  // Determine effective values
  const listing = selectedListing;
  const effectivePrice = manualMode
    ? Number(manualPrice) || 0
    : listing?.asking_price || 0;
  const effectiveATI = manualMode
    ? Number(manualATI) || 0
    : listing?.ati_score || 0;
  const effectiveOMVM = listing?.omvm_value
    || (effectivePrice > 0 ? estimateOMVM(listing?.make, listing?.model, listing?.year) : 0);

  const savings = effectiveOMVM > effectivePrice ? effectiveOMVM - effectivePrice : 0;
  const savingsPct = effectiveOMVM > 0 ? (savings / effectiveOMVM * 100).toFixed(1) : 0;

  const finderFeePct = getFinderFeePct(effectiveATI);
  const escrowFeePct = getEscrowFeePct();
  const finderFee = Math.round(effectivePrice * finderFeePct) / 100;
  const escrowFee = Math.round(effectivePrice * escrowFeePct) / 100;
  const totalFees = finderFee + escrowFee;
  const netSavings = savings - totalFees;

  const hasData = effectivePrice > 0;

  const clearSelection = () => {
    setSelectedListing(null);
    setSearchReg("");
  };

  return (
    <div className={`rounded-2xl border border-[#E8A83A]/30 bg-gradient-to-br from-white to-[#FFF9ED] p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#E8A83A]/15 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-[#A67C00]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#1A1814] uppercase tracking-wide">Deal Calculator</h3>
            <p className="text-[10px] text-[#6B6560]">Estimate savings & transaction fees</p>
          </div>
        </div>
        <button
          onClick={() => setShowRules(!showRules)}
          className="flex items-center gap-1 text-[10px] font-bold text-[#A67C00] hover:text-[#876000] transition-colors"
        >
          <Info className="w-3 h-3" />
          {showRules ? "Hide rules" : "Fee rules"}
        </button>
      </div>

      {/* Fee rules expander */}
      {showRules && (
        <div className="mb-4 rounded-xl border border-[#E8A83A]/20 bg-[#E8A83A]/5 p-3 text-[10px] space-y-1">
          <p className="font-black text-[#A67C00] uppercase mb-1">Platform Fee Rules</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[#4A4845]">
            <span>ATI ≥ 100 (Exceptional):</span><span className="font-bold">1.5% finder's fee</span>
            <span>ATI ≥ 80 (Strong Buy):</span><span className="font-bold">2.0% finder's fee</span>
            <span>ATI ≥ 60 (Fair):</span><span className="font-bold">2.5% finder's fee</span>
            <span>ATI &lt; 60:</span><span className="font-bold">3.0% finder's fee</span>
          </div>
          <p className="text-[#6B6560] mt-1">Escrow fee: 0.89% · Savings = OMVM − Asking Price</p>
        </div>
      )}

      {/* Input: search or manual toggle */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => { setManualMode(false); setSelectedListing(null); setSearchReg(""); }}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors ${
              !manualMode ? "bg-[#0B2D5B] text-white" : "bg-black/5 text-[#6B6560]"
            }`}
          >
            Search listing
          </button>
          <button
            onClick={() => { setManualMode(true); setSelectedListing(null); setSearchReg(""); }}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors ${
              manualMode ? "bg-[#0B2D5B] text-white" : "bg-black/5 text-[#6B6560]"
            }`}
          >
            Manual entry
          </button>
        </div>

        {!manualMode ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#AAA49C]" />
            <input
              value={searchReg}
              onChange={e => { setSearchReg(e.target.value); setSelectedListing(null); }}
              placeholder="Search by N-number (e.g. N123AB)..."
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-black/10 rounded-xl text-sm text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#0B2D5B] transition-colors"
            />
            {searchReg && (
              <button onClick={() => setSearchReg("")} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-[#AAA49C]" /></button>
            )}
            {searchReg.length >= 2 && !selectedListing && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/10 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {searching ? (
                  <div className="flex items-center gap-2 px-4 py-3 text-[11px] text-[#6B6560]">
                    <Loader2 className="w-3 h-3 animate-spin" /> Searching…
                  </div>
                ) : listings.length === 0 ? (
                  <div className="px-4 py-3 text-[11px] text-[#6B6560]">No matching listings found</div>
                ) : (
                  listings.map(l => (
                    <button
                      key={l.id}
                      onClick={() => { setSelectedListing(l); setSearchReg(l.registration || ""); }}
                      className="w-full text-left px-4 py-3 hover:bg-[#F7F4EF] transition-colors border-b border-black/[0.04] last:border-0"
                    >
                      <p className="text-sm font-bold text-[#1A1814]">{l.registration} — {l.year} {l.make} {l.model}</p>
                      <p className="text-[10px] text-[#6B6560]">
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
              <label className="text-[9px] uppercase tracking-wider font-bold text-[#6B6560] mb-1 block">Asking Price (USD)</label>
              <input
                type="number"
                value={manualPrice}
                onChange={e => setManualPrice(e.target.value)}
                placeholder="e.g. 250000"
                className="w-full px-3 py-2.5 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#0B2D5B]"
              />
            </div>
            <div className="flex-1">
              <label className="text-[9px] uppercase tracking-wider font-bold text-[#6B6560] mb-1 block">ATI Score (0–120)</label>
              <input
                type="number"
                min="0"
                max="120"
                value={manualATI}
                onChange={e => setManualATI(e.target.value)}
                placeholder="e.g. 85"
                className="w-full px-3 py-2.5 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#0B2D5B]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Selected listing info */}
      {selectedListing && (
        <div className="mb-4 flex items-center justify-between gap-2 p-3 rounded-xl bg-[#0B2D5B]/5 border border-[#0B2D5B]/15">
          <div className="min-w-0">
            <p className="text-sm font-black text-[#1A1814] truncate">
              {selectedListing.year} {selectedListing.make} {selectedListing.model}
            </p>
            <p className="text-[10px] text-[#6B6560]">
              {selectedListing.registration} · ATI {selectedListing.ati_score || "—"}
            </p>
          </div>
          <button onClick={clearSelection} className="shrink-0">
            <X className="w-4 h-4 text-[#6B6560] hover:text-[#1A1814]" />
          </button>
        </div>
      )}

      {/* Results */}
      {hasData ? (
        <div className="space-y-3">
          {/* Summary row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white border border-black/8 p-3">
              <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-bold">Asking Price</p>
              <p className="text-lg font-black text-[#1A1814]">{formatMoney(effectivePrice)}</p>
              {effectiveATI > 0 && (
                <p className="text-[10px] font-bold text-[#A67C00] mt-0.5">
                  ATI {effectiveATI} · {getATILabel(effectiveATI).split(" —")[0]}
                </p>
              )}
            </div>
            <div className="rounded-xl bg-white border border-black/8 p-3">
              <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-bold">Est. Market Value</p>
              <p className="text-lg font-black text-[#0F7A56]">{formatMoney(effectiveOMVM)}</p>
              {savings > 0 && (
                <p className="text-[10px] font-bold text-[#0F7A56] mt-0.5 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> {savingsPct}% below market
                </p>
              )}
            </div>
          </div>

          {/* Savings */}
          <div className="rounded-xl bg-[#0F7A56]/8 border border-[#0F7A56]/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-[#0F7A56]" />
                <span className="text-sm font-black text-[#0F7A56]">Potential Savings</span>
              </div>
              <p className="text-lg font-black text-[#0F7A56]">{formatMoney(savings)}</p>
            </div>
            {savings <= 0 && (
              <p className="text-[10px] text-[#6B6560] mt-1">
                Asking price is at or above estimated market value — no discount detected.
              </p>
            )}
          </div>

          {/* Fee breakdown */}
          <div className="rounded-xl bg-white border border-black/8 p-3">
            <p className="text-[10px] uppercase tracking-wider font-black text-[#6B6560] mb-2">Transaction Fees</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#A67C00]" />
                  <span className="text-[#1A1814]">Finder's fee ({finderFeePct}%)</span>
                </div>
                <span className="font-bold text-[#1A1814]">{formatMoney(finderFee)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Banknote className="w-3.5 h-3.5 text-[#6B6560]" />
                  <span className="text-[#1A1814]">Escrow fee ({escrowFeePct}%)</span>
                </div>
                <span className="font-bold text-[#1A1814]">{formatMoney(escrowFee)}</span>
              </div>
              <div className="border-t border-black/8 pt-2 flex items-center justify-between">
                <span className="text-sm font-black text-[#1A1814]">Total fees</span>
                <span className="text-sm font-black text-[#1A1814]">{formatMoney(totalFees)}</span>
              </div>
            </div>
          </div>

          {/* Net result */}
          <div className={`rounded-xl p-3 ${netSavings > 0 ? "bg-[#0F7A56]/8 border border-[#0F7A56]/20" : "bg-red-50 border border-red-200"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {netSavings > 0 ? (
                  <TrendingDown className="w-4 h-4 text-[#0F7A56]" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-black ${netSavings > 0 ? "text-[#0F7A56]" : "text-red-700"}`}>
                  Net {netSavings > 0 ? "Savings" : "Cost"} After Fees
                </span>
              </div>
              <p className={`text-lg font-black ${netSavings > 0 ? "text-[#0F7A56]" : "text-red-600"}`}>
                {formatMoney(Math.abs(netSavings))}
              </p>
            </div>
            <p className="text-[10px] text-[#6B6560] mt-1">
              {netSavings > 0
                ? `You save ${formatMoney(netSavings)} after all fees — ${((netSavings / effectiveOMVM) * 100).toFixed(1)}% net discount vs market.`
                : netSavings < 0
                  ? `Total fees exceed any market discount by ${formatMoney(Math.abs(netSavings))}.`
                  : "Break-even after fees — no net gain or loss vs market value."}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-[#AAA49C]">
          <Calculator className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">Search a listing or enter values manually</p>
          <p className="text-[10px] mt-0.5">See estimated savings and transaction costs instantly</p>
        </div>
      )}
    </div>
  );
}