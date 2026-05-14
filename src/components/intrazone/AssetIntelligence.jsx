import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

const SCORE_DIMS = [
  { key: "condition",    label: "Condition",       weight: 0.20 },
  { key: "docs",         label: "Documentation",   weight: 0.20 },
  { key: "maintenance",  label: "Maintenance",     weight: 0.20 },
  { key: "provenance",   label: "Provenance",      weight: 0.20 },
  { key: "market",       label: "Market Position", weight: 0.20 },
];

function calcDimensions(listing) {
  const enginePct = listing.engine_hours && listing.tbo
    ? Math.max(0, 1 - listing.engine_hours / listing.tbo)
    : null;

  const condition  = enginePct != null ? Math.round(enginePct * 100) : listing.total_time ? Math.max(20, 100 - Math.floor(listing.total_time / 300)) : 50;
  const docs       = listing.avionics ? 80 : listing.source_url ? 70 : 55;
  const maintenance = listing.last_annual
    ? (new Date() - new Date(listing.last_annual)) / (1000 * 3600 * 24) < 365 ? 90 : 60
    : 45;
  const provenance = listing.registration ? 80 : 50;
  const market     = listing.deal_score != null ? Math.round(listing.deal_score * 10) : listing.ati_score ? Math.round(listing.ati_score / 1.2) : 55;

  const overall = Math.round(
    condition * 0.2 + docs * 0.2 + maintenance * 0.2 + provenance * 0.2 + market * 0.2
  );

  return { condition, docs, maintenance, provenance, market, overall };
}

function riskLabel(score) {
  if (score >= 80) return { text: "LOW RISK",    color: "#0F7A56" };
  if (score >= 60) return { text: "MEDIUM RISK", color: "#D4A017" };
  return { text: "HIGH RISK", color: "#C0392B" };
}

function AssetCard({ listing }) {
  const dims = calcDimensions(listing);
  const risk = riskLabel(dims.overall);

  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-bold text-[#AAA49C] uppercase tracking-wider mb-0.5">
            {listing.registration || "No Reg"}
          </p>
          <h3 className="font-black text-[#1A1814]">
            {listing.year ? `${listing.year} ` : ""}{listing.make} {listing.model}
          </h3>
          {listing.asking_price && (
            <p className="text-sm font-bold text-[#0B2D5B] mt-0.5">${listing.asking_price.toLocaleString()}</p>
          )}
        </div>
        <div className="text-center shrink-0">
          <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center" style={{ borderColor: risk.color, background: `${risk.color}12` }}>
            <span className="font-black text-lg" style={{ color: risk.color }}>{dims.overall}</span>
          </div>
          <p className="text-[8px] font-black mt-1 tracking-wider" style={{ color: risk.color }}>{risk.text}</p>
        </div>
      </div>

      {/* Dimension bars */}
      <div className="space-y-2">
        {[
          ["Condition",     dims.condition],
          ["Documentation", dims.docs],
          ["Maintenance",   dims.maintenance],
          ["Provenance",    dims.provenance],
          ["Market Pos.",   dims.market],
        ].map(([label, val]) => (
          <div key={label}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-[#6B6560] font-semibold">{label}</span>
              <span className="font-black text-[#1A1814]">{val}/100</span>
            </div>
            <div className="h-1.5 bg-[#F7F4EF] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${val}%`,
                  background: val >= 75 ? "#0F7A56" : val >= 50 ? "#D4A017" : "#C0392B",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="mt-4 space-y-1">
        {dims.maintenance >= 80 && <p className="text-[11px] text-[#0F7A56] font-semibold">✓ Annual current</p>}
        {dims.condition >= 75 && <p className="text-[11px] text-[#0F7A56] font-semibold">✓ Good engine life remaining</p>}
        {listing.ati_score >= 90 && <p className="text-[11px] text-[#0F7A56] font-semibold">✓ High ATI score ({listing.ati_score})</p>}
        {dims.condition < 50 && <p className="text-[11px] text-[#C0392B] font-semibold">⚠ Engine near TBO</p>}
        {dims.maintenance < 50 && <p className="text-[11px] text-amber-600 font-semibold">⚠ Annual may be overdue</p>}
        {listing.deal_label === "overpriced" && <p className="text-[11px] text-[#C0392B] font-semibold">⚠ Overpriced vs. market</p>}
        {listing.deal_label === "hot deal" && <p className="text-[11px] text-[#0F7A56] font-semibold">✓ Below market value</p>}
      </div>

      <Link to={`/ati-passport/${listing.id}`}
        className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#D4A017] hover:underline">
        Full ATI Passport <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}

export default function AssetIntelligence() {
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["intrazone-listings"],
    queryFn: () => base44.entities.AircraftListing.list("-ati_score", 50),
  });

  const sorted = [...listings].sort((a, b) => calcDimensions(b).overall - calcDimensions(a).overall);

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-black text-[#0B2D5B] text-lg">Asset Intelligence Scoring</h2>
        <p className="text-sm text-[#6B6560]">Automated risk assessment across 5 dimensions</p>
      </div>

      {isLoading && <p className="text-sm text-[#6B6560] text-center py-10">Loading assets…</p>}
      {!isLoading && sorted.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-black/[0.07]">
          <p className="text-3xl mb-2">🛩️</p>
          <p className="font-bold text-[#1A1814]">No listings found</p>
          <p className="text-sm text-[#6B6560] mt-1">Add aircraft listings to see intelligence scores</p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(l => <AssetCard key={l.id} listing={l} />)}
      </div>
    </div>
  );
}