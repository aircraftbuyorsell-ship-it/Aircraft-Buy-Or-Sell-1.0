import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ExternalLink, CheckCircle, XCircle } from "lucide-react";

function parseMaxBudget(budgetStr) {
  if (!budgetStr) return null;
  const nums = budgetStr.replace(/[$,K]/g, "").match(/\d+/g);
  if (!nums) return null;
  const val = parseInt(nums[nums.length - 1]);
  return budgetStr.includes("K") && val < 10000 ? val * 1000 : val;
}

function calcMatchScore(lead, listing) {
  let score = 0;

  // Type fit (30%)
  const pref = (lead.aircraft_preference || "").toLowerCase();
  const name = `${listing.make || ""} ${listing.model || ""}`.toLowerCase();
  if (pref && name) {
    const words = pref.split(/[\s,]+/).filter(Boolean);
    const typeMatch = words.some(w => name.includes(w) || w.includes(listing.make?.toLowerCase()));
    score += typeMatch ? 30 : 0;
  } else {
    score += 15; // partial if unknown
  }

  // Budget fit (25%)
  const maxBudget = parseMaxBudget(lead.budget);
  if (maxBudget && listing.asking_price) {
    if (listing.asking_price <= maxBudget * 1.05) score += 25;
    else if (listing.asking_price <= maxBudget * 1.2) score += 12;
  } else {
    score += 12;
  }

  // Risk alignment (20%) — use ATI score as proxy for quality
  if (listing.ati_score) {
    score += Math.round((listing.ati_score / 120) * 20);
  } else {
    score += 10;
  }

  // Feature match (15%) — deal label
  if (listing.deal_label === "hot deal" || listing.deal_label === "good deal") score += 15;
  else if (listing.deal_label === "fair") score += 8;

  // Timing (10%) — listing is active
  if (listing.status === "active") score += 10;

  return Math.min(score, 100);
}

function matchLabel(score) {
  if (score >= 80) return { text: "EXCELLENT FIT", color: "#0F7A56", bg: "rgba(15,122,86,0.08)" };
  if (score >= 60) return { text: "GOOD MATCH",   color: "#185FA5", bg: "rgba(24,95,165,0.08)" };
  if (score >= 40) return { text: "POSSIBLE FIT", color: "#D4A017", bg: "rgba(212,160,23,0.08)" };
  return { text: "WEAK MATCH", color: "#AAA49C", bg: "rgba(170,164,156,0.08)" };
}

function MatchCard({ lead, listing, score }) {
  const label = matchLabel(score);
  const maxBudget = parseMaxBudget(lead.budget);
  const withinBudget = maxBudget && listing.asking_price ? listing.asking_price <= maxBudget * 1.05 : null;

  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] p-4">
      {/* Score header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold text-[#AAA49C] uppercase tracking-wider">Match Score</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-[#0B2D5B]">{score}</span>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: label.bg, color: label.color }}>{label.text}</span>
          </div>
        </div>
        <div className="w-14 h-14 rounded-full flex items-center justify-center border-2" style={{ borderColor: label.color, background: label.bg }}>
          <span className="font-black text-lg" style={{ color: label.color }}>{score}</span>
        </div>
      </div>

      {/* Buyer & Asset */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-[#F7F4EF] rounded-xl p-2.5">
          <p className="text-[8px] font-bold text-[#AAA49C] uppercase tracking-wider mb-1">Buyer</p>
          <p className="text-[12px] font-black text-[#1A1814]">{lead.name}</p>
          <p className="text-[10px] text-[#6B6560]">{lead.budget || "Budget unknown"}</p>
        </div>
        <div className="bg-[#F7F4EF] rounded-xl p-2.5">
          <p className="text-[8px] font-bold text-[#AAA49C] uppercase tracking-wider mb-1">Aircraft</p>
          <p className="text-[12px] font-black text-[#1A1814]">{listing.make} {listing.model}</p>
          {listing.asking_price && <p className="text-[10px] text-[#6B6560]">${listing.asking_price.toLocaleString()}</p>}
        </div>
      </div>

      {/* Fit checks */}
      <div className="space-y-1.5 mb-3">
        {[
          [withinBudget !== null ? withinBudget : true, withinBudget === false ? `Price $${listing.asking_price?.toLocaleString()} exceeds budget` : "Within budget range"],
          [!!listing.ati_score && listing.ati_score >= 60, `ATI Score: ${listing.ati_score || "N/A"}/120`],
          [listing.deal_label !== "overpriced", `Deal: ${listing.deal_label || "unscored"}`],
          [listing.status === "active", "Listing active"],
        ].map(([ok, text], i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            {ok
              ? <CheckCircle className="w-3.5 h-3.5 text-[#0F7A56] shrink-0" />
              : <XCircle className="w-3.5 h-3.5 text-[#C0392B] shrink-0" />}
            <span className={ok ? "text-[#1A1814]" : "text-[#C0392B]"}>{text}</span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between">
        <p className="text-[11px] font-bold text-[#0B2D5B]">
          {score >= 70 ? "📞 Schedule intro call" : score >= 50 ? "📧 Send proposal" : "🌱 Keep nurturing"}
        </p>
        <Link to={`/ati-passport/${listing.id}`} className="flex items-center gap-1 text-[10px] font-bold text-[#D4A017] hover:underline">
          ATI Report <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export default function MatchingEngine() {
  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["intrazone-leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 50),
  });

  const { data: listings = [], isLoading: loadingListings } = useQuery({
    queryKey: ["intrazone-listings"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }, "-ati_score", 50),
  });

  const isLoading = loadingLeads || loadingListings;

  // Generate top matches: for each active lead, find best listing match
  const activLeads = leads.filter(l => !["closed", "lost"].includes(l.status));
  const matches = [];
  activLeads.forEach(lead => {
    listings.forEach(listing => {
      const score = calcMatchScore(lead, listing);
      if (score >= 40) matches.push({ lead, listing, score });
    });
  });
  matches.sort((a, b) => b.score - a.score);
  const topMatches = matches.slice(0, 12);

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-black text-[#0B2D5B] text-lg">Matching Engine</h2>
        <p className="text-sm text-[#6B6560]">Auto-matched buyer ↔ aircraft pairs, ranked by fit score</p>
      </div>

      {isLoading && <p className="text-sm text-[#6B6560] text-center py-10">Computing matches…</p>}
      {!isLoading && topMatches.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-black/[0.07]">
          <p className="text-3xl mb-2">🎯</p>
          <p className="font-bold text-[#1A1814]">No strong matches yet</p>
          <p className="text-sm text-[#6B6560] mt-1">Add active leads with budgets and aircraft preferences to see matches</p>
        </div>
      )}

      {topMatches.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] text-[#6B6560] font-semibold">{topMatches.length} match{topMatches.length !== 1 ? "es" : ""} found across {activLeads.length} active leads & {listings.length} listings</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {topMatches.map((m, i) => (
          <MatchCard key={`${m.lead.id}-${m.listing.id}`} {...m} />
        ))}
      </div>
    </div>
  );
}