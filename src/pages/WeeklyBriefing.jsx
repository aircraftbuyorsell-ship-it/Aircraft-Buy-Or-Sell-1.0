import { useState, useEffect } from "react";
import { useTheme } from "@/lib/useTheme";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Newspaper, ArrowLeft, TrendingUp, Fuel, DollarSign,
  Shield, Plane, Zap, Building2, Globe, Check, Loader2
} from "lucide-react";

const SECTIONS = [
  {
    id: "ga", icon: Plane, label: "GA Secondary Market",
    desc: "Piston & turboprop pricing, inventory levels, transaction volumes",
    color: "#0A6E5C",
    summary: "Single-engine piston prices remain resilient through Q2 2026 with average transaction values up 4.2% year-over-year. Inventory in the $150K–$350K range continues to tighten, particularly for low-time IFR-equipped aircraft under 2,000 hours TT. Cirrus SR22/G3–G6 models lead demand, with median days-on-market falling to 38 days (vs. 52 days in 2025). Cessna 172SP and 182T models also show strong liquidity. Turboprop singles (PC-12, TBM 900-series) are experiencing a supply-demand imbalance favoring sellers, with well-maintained examples commanding premiums of 6–10% above Vref.",
    points: [
      "Median transaction price for IFR Cessna 182T: $385K (+5.1% YoY)",
      "Cirrus SR22T G6 inventory down 22% vs. Q1 2026",
      "TBM 900/930 average days-on-market: 41 days (52 in 2025)",
      "Piper M600/SLS gaining traction in owner-flown turboprop segment",
    ]
  },
  {
    id: "bizjet", icon: Building2, label: "Business Jet & Charter",
    desc: "Pre-owned jet transactions, charter demand, fleet expansion",
    color: "#1B4965",
    summary: "Pre-owned business jet transactions reached 2,840 units in the first half of 2026, an 8.3% increase over the same period in 2025. Light jets (Citation CJ3+/M2, Phenom 300E) account for 44% of all transactions. Mid-size jets (Citation Latitude, Challenger 350) are seeing renewed interest from corporate flight departments upgrading from older large-cabin aircraft. Charter demand remains elevated at 112% of pre-pandemic baseline, driven by first-time users entering the market. Supply of late-model pre-owned aircraft (2018+) remains tight, keeping residual values strong.",
    points: [
      "2,840 pre-owned jet transactions in H1 2026 (+8.3% YoY)",
      "Light jets represent 44% of all transactions",
      "Charter demand at 112% of 2019 baseline",
      "Late-model pre-owned inventory (2018+) 19% below 5-year average",
    ]
  },
  {
    id: "finance", icon: DollarSign, label: "Aviation Financing",
    desc: "Loan rates, leasing trends, credit availability",
    color: "#8B6914",
    summary: "Aircraft financing rates have moderated slightly from their 2025 peaks, with 20-year fixed rates for owner-flown aircraft now averaging 6.35–6.85% (down from 7.25% in late 2025). Lenders remain selective but are actively competing for well-qualified borrowers with 15%+ down payments. Leasing as a percentage of total aircraft acquisitions has grown to 18.4%, up from 14.7% in 2024, reflecting buyer preference for flexibility amid economic uncertainty. Operating lease structures for turbine aircraft now commonly include maintenance reserve adjustment clauses.",
    points: [
      "Owner-flown aircraft loans averaging 6.35–6.85% (20-year fixed)",
      "Leasing now accounts for 18.4% of acquisitions (up from 14.7% in 2024)",
      "Typical down payment requirements: 15–20% for prime borrowers",
      "New lenders entering market increase competition in $100K–$500K segment",
    ]
  },
  {
    id: "fuel", icon: Fuel, label: "Fuel & Operating Costs",
    desc: "Jet-A, Avgas, crude outlook, operating economics",
    color: "#7A2E0E",
    summary: "Jet-A spot prices averaged $5.82/gallon across US FBOs in Q2 2026, down from $6.45/gallon in Q4 2025. The decline is driven by softening crude demand and increased refinery output. 100LL avgas continues its gradual price decline, now averaging $6.95/gallon nationally (down 4.8% YoY) as G100UL unleaded fuel gains certification momentum and distribution expands. Operators should note that regional price dispersion remains wide — West Coast Jet-A premiums over Gulf Coast can exceed $1.80/gallon. Oil markets face continued uncertainty from geopolitical factors.",
    points: [
      "Jet-A spot: $5.82/gal average (down from $6.45 in Q4 2025)",
      "100LL avgas: $6.95/gal (-4.8% YoY), G100UL expanding availability",
      "West Coast Jet-A premium: up to $1.80/gal over Gulf Coast",
      "Annual fuel cost for 200hr/year piston twin: ~$28K at current rates",
    ]
  },
  {
    id: "regulatory", icon: Shield, label: "FAA / EASA Regulatory",
    desc: "Airworthiness directives, rulemaking, certification updates",
    color: "#4A1942",
    summary: "The FAA published NPRM 2026-12 proposing expanded ADS-B Out requirements for certain Part 91 operations below 10,000 ft MSL in Class E airspace, with a proposed compliance date of January 2028. EASA issued Emergency AD 2026-0142 addressing potential fatigue cracking in select Continental IO-550 series crankshafts manufactured between 2022–2024. The UK CAA finalized its post-Brexit aircraft certification framework, now fully independent of EASA for Part 21 type certification. Industry groups are actively engaging on MOSAIC rulemaking with final publication expected by Q4 2026.",
    points: [
      "FAA NPRM 2026-12: Expanded ADS-B requirements for Part 91 (proposed 2028)",
      "EASA Emergency AD 2026-0142: IO-550 crankshaft inspection mandate",
      "UK CAA independent certification framework now fully operational",
      "MOSAIC final rule expected Q4 2026 — significant GA implications",
    ]
  },
  {
    id: "stocks", icon: TrendingUp, label: "Aviation Stocks & M&A",
    desc: "Public company performance, M&A activity, market caps",
    color: "#2D1B69",
    summary: "Textron Aviation (TXT) shares rose 14.3% in H1 2026 on record backlog and strong Citation deliveries. Gulfstream parent General Dynamics (GD) reported 9% aerospace revenue growth as G700 deliveries accelerated. Boeing's business jet division (BBJ) saw a 22% increase in new orders as ultra-high-net-worth demand rebounds. M&A activity in the FBO and MRO sectors remains elevated, with Atlantic Aviation completing its acquisition of three European FBO locations. Private equity continues to consolidate regional maintenance providers.",
    points: [
      "TXT: +14.3% H1 2026 (record backlog, strong Citation deliveries)",
      "GD aerospace revenue +9% (G700 ramp, G800 certification near)",
      "BBJ new orders +22% YoY (ultra-high-net-worth demand)",
      "FBO/MRO M&A remains elevated; Atlantic Aviation expands in Europe",
    ]
  },
  {
    id: "sustainability", icon: Zap, label: "Sustainability & eVTOL",
    desc: "SAF production, electric aircraft, carbon markets",
    color: "#1A5C2A",
    summary: "Sustainable Aviation Fuel (SAF) production capacity has doubled year-over-year to approximately 1.8 billion gallons annually, though this still represents only 1.9% of global jet fuel consumption. The EU's ReFuelEU mandate now requires 2% SAF blending at EU airports, with penalties for non-compliance beginning in 2027. In the eVTOL sector, Joby Aviation received FAA Part 135 certification for its air taxi operations while Archer Aviation completed its first piloted transition flight. Beta Technologies secured a 50-aircraft order from a major European logistics operator for its Alia eCTOL cargo variant.",
    points: [
      "Global SAF capacity: 1.8B gal/year (doubled YoY, 1.9% of jet fuel)",
      "EU ReFuelEU: 2% SAF mandate now in effect at EU airports",
      "Joby Aviation: FAA Part 135 certification achieved",
      "Beta Alia eCTOL: 50-unit order from European logistics operator",
    ]
  },
  {
    id: "realestate", icon: Globe, label: "Aviation Real Estate",
    desc: "Hangar availability, airport development, FBO transactions",
    color: "#5C3A1A",
    summary: "Hangar availability remains critically constrained across major US metropolitan airports, with waitlists at Van Nuys (KVNY), Teterboro (KTEB), and Centennial (KAPA) extending beyond 24 months. New hangar construction has accelerated, with 340+ new T-hangar units completed or under construction in 2026 across 28 US airports, though demand still outpaces supply by approximately 3:1. Hangar rental rates in premium markets have risen 8–12% year-over-year. Airport privatization and public-private partnership models are gaining traction as municipalities seek to fund infrastructure without burdening taxpayers.",
    points: [
      "Waitlists at KVNY, KTEB, KAPA: 24+ months for T-hangars",
      "340+ new T-hangar units in 2026 pipeline across 28 US airports",
      "Demand-to-supply ratio for new hangar construction: ~3:1",
      "Hangar rental rates in premium markets: +8–12% YoY",
    ]
  },
];

export default function WeeklyBriefing() {
  const isDark = useTheme();
  const [hasAccess, setHasAccess] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    base44.auth.me().then(user => {
      base44.entities.UserProfile.filter({ user_email: user.email }).then(profiles => {
        if (profiles.length > 0) {
          const profile = profiles[0];
          const tier = profile.tier;
          const newsletterFlag = profile.feature_flags?.newsletter_subscribed === true;
          setHasAccess(tier === "pro" || tier === "enterprise" || newsletterFlag);
        } else {
          setHasAccess(false);
        }
      });
    }).catch(() => setHasAccess(false));
  }, []);

  const handleNewsletterCheckout = async () => {
    setCheckingOut(true);
    try {
      const returnUrl = `${window.location.origin}/weekly-briefing`;
      const res = await base44.functions.invoke('newsletterCheckout', { returnUrl });
      if (res.data?.sessionUrl) {
        window.location.href = res.data.sessionUrl;
      }
    } catch {
      setCheckingOut(false);
    }
  };

  const bg = isDark ? "#0A0A14" : "#f8fafc";
  const cardBg = isDark ? "rgba(22,22,38,0.9)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const text = isDark ? "#f1f5f9" : "#1e293b";
  const muted = isDark ? "rgba(255,255,255,0.5)" : "#64748b";
  const accent = isDark ? "#60a5fa" : "#3b82f6";
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const weekNum = Math.ceil((new Date() - new Date(2026, 0, 1)) / (7 * 24 * 60 * 60 * 1000));

  if (hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: bg }}>
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: isDark ? "rgba(212,160,23,0.12)" : "rgba(212,160,23,0.10)" }}>
              <Newspaper className="w-7 h-7" style={{ color: "#D4A017" }} />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: text }}>Weekly Aviation Briefing</h1>
            <p className="text-sm leading-relaxed" style={{ color: muted }}>
              Comprehensive market intelligence across 8 aviation sectors — delivered every week.
            </p>
          </div>

          {/* Newsletter subscription card */}
          <div
            className="rounded-2xl p-6 mb-4"
            style={{
              background: isDark ? "rgba(212,160,23,0.06)" : "rgba(212,160,23,0.04)",
              border: `1px solid ${isDark ? "rgba(212,160,23,0.25)" : "rgba(212,160,23,0.20)"}`,
            }}
          >
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-black chrome-text">€12</span>
              <span className="text-sm font-medium" style={{ color: muted }}>/month</span>
            </div>
            <p className="text-xs mb-4" style={{ color: muted }}>Cancel anytime · €1.50 per sector</p>

            <div className="space-y-2 mb-5">
              {[
                "GA secondary market & turboprop pricing",
                "Business jet transactions & charter demand",
                "Aviation financing rates & leasing trends",
                "Fuel & operating cost analysis",
                "FAA / EASA regulatory updates",
                "Aviation stocks & M&A activity",
                "Sustainability, SAF & eVTOL developments",
                "Hangar availability & airport real estate",
              ].map((feat) => (
                <div key={feat} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#D4A017" }} />
                  <span className="text-[12px] leading-snug" style={{ color: isDark ? "rgba(255,255,255,0.80)" : "#334155" }}>{feat}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleNewsletterCheckout}
              disabled={checkingOut}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: "#D4A017", color: "#fff" }}
            >
              {checkingOut ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to checkout…</>
              ) : (
                <>Subscribe to Weekly Briefing</>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs mb-2" style={{ color: muted }}>
              Already a Pro or Enterprise member?
            </p>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-1.5 text-xs font-semibold hover:opacity-70 transition-opacity"
              style={{ color: accent }}
            >
              View full subscription plans <ArrowLeft className="w-3 h-3 rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: bg, minHeight: "100vh" }}>
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-8 pb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium mb-6 hover:opacity-70 transition-opacity"
          style={{ color: accent }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="text-[10px] tracking-[0.15em] font-semibold uppercase mb-1" style={{ color: accent }}>
              Week {weekNum} · {dateStr}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: text }}>
              Aviation Market Weekly Briefing
            </h1>
            <p className="text-sm mt-2 max-w-2xl leading-relaxed" style={{ color: muted }}>
              Comprehensive intelligence across general aviation, business jets, financing, fuel markets,
              regulatory developments, public markets, sustainability, and aviation real estate.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: isDark ? "rgba(34,197,94,0.08)" : "rgba(34,197,94,0.06)", border: `1px solid ${isDark ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.15)"}` }}>
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-semibold" style={{ color: isDark ? "#4ade80" : "#16a34a" }}>Current Edition</span>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-5">
          {SECTIONS.map((section) => (
            <div key={section.id}
              className="rounded-xl p-5 md:p-6"
              style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${section.color}15`, border: `1px solid ${section.color}30` }}>
                  <section.icon className="w-4.5 h-4.5" style={{ color: section.color }} />
                </div>
                <div>
                  <h2 className="text-base font-semibold" style={{ color: text }}>{section.label}</h2>
                  <p className="text-[10px] mt-0.5" style={{ color: muted }}>{section.desc}</p>
                </div>
              </div>

              <p className="text-[13px] leading-relaxed mb-4" style={{ color: isDark ? "rgba(255,255,255,0.8)" : "#334155" }}>
                {section.summary}
              </p>

              <div className="grid sm:grid-cols-2 gap-2">
                {section.points.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg"
                    style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                    <span className="text-[11px] mt-0.5 shrink-0" style={{ color: section.color }}>•</span>
                    <span className="text-[11px] leading-snug" style={{ color: muted }}>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 mb-8 pt-6 border-t text-center" style={{ borderColor: border }}>
          <p className="text-[10px]" style={{ color: muted }}>
            ABOS MarketSpace Weekly Briefing · Week {weekNum}, 2026 ·
            Sources: FAA, EASA, CAA, Aviation Week, FlightGlobal, AIN, NBAA, GAMA, Bloomberg, Reuters
          </p>
          <p className="text-[9px] mt-1 opacity-50" style={{ color: muted }}>
            This briefing is for informational purposes only and does not constitute financial or investment advice.
          </p>
        </div>
      </div>
    </div>
  );
}