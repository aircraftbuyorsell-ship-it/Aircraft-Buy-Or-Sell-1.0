import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText, BarChart3, DollarSign, ChevronDown, Plane, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

// ———————————————————————————————————————————————
// Color palette (AircraftValuation.com inspired)
// Navy: #0B2D5B  Amber: #E8A83A  Deep text: #1A1814
// ———————————————————————————————————————————————

function NavyCircleIcon({ icon: Icon }) {
  return (
    <div className="w-14 h-14 rounded-full bg-[#0B2D5B] flex items-center justify-center mx-auto shadow-md">
      <Icon className="w-6 h-6 text-white" strokeWidth={2} />
    </div>
  );
}

function FeatureCard({ icon, title, body }) {
  return (
    <div className="bg-white rounded-lg border border-black/[0.06] p-6 md:p-8 text-center shadow-sm hover:shadow-md transition-shadow">
      <NavyCircleIcon icon={icon} />
      <h3 className="text-lg font-black text-[#0B2D5B] mt-5 uppercase tracking-tight">{title}</h3>
      <p className="text-sm text-[#4A4845] leading-relaxed mt-3">{body}</p>
    </div>
  );
}

function StepCard({ n, title, body }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-5xl font-black text-[#E8A83A] leading-none">{n}.</p>
      <div className="mt-4 w-full aspect-[4/3] bg-gradient-to-br from-[#0B2D5B] to-[#143C75] rounded-lg flex items-center justify-center">
        <Plane className="w-16 h-16 text-white/20" strokeWidth={1} />
      </div>
      <h4 className="text-base font-black text-[#0B2D5B] uppercase mt-4 tracking-tight">{title}</h4>
      <p className="text-sm text-[#4A4845] mt-2 leading-relaxed px-2">{body}</p>
    </div>
  );
}

function StatPill({ value, label }) {
  return (
    <div className="text-center">
      <p className="text-3xl md:text-4xl font-black text-[#0B2D5B] leading-none">{value}</p>
      <p className="text-[10px] md:text-[11px] text-[#6B6560] uppercase tracking-[0.15em] font-semibold mt-1.5">{label}</p>
    </div>
  );
}

const MARKET_PULSE = [
  { type: "Single Piston", ati: 72, trend: 3.2 },
  { type: "Multi Piston", ati: 65, trend: -1.8 },
  { type: "Turboprop", ati: 81, trend: 5.1 },
  { type: "Light Jet", ati: 88, trend: 0.3 },
];

export default function Dashboard() {
  const { data: listings = [] } = useQuery({
    queryKey: ["listings-active"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }),
  });
  const { data: deals = [] } = useQuery({
    queryKey: ["deals"],
    queryFn: () => base44.entities.DealRadar.list(),
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["orders-paid"],
    queryFn: () => base44.entities.Order.filter({ status: "paid" }),
  });

  const total_listings = listings.length;
  const avg_ati = listings.length > 0
    ? Math.round(listings.reduce((s, l) => s + (l.ati_score || 0), 0) / listings.length)
    : 0;
  const hot_deals = deals.filter(d => (d.deal_score || 0) >= 8.5).length;
  const total_revenue = orders.reduce((s, o) => s + (o.amount || 0), 0);

  return (
    <div className="min-h-screen bg-white">
      {/* ———————— HERO ———————— */}
      <section className="relative overflow-hidden bg-white border-b border-black/[0.06]">
        {/* blueprint / circuit bg pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #0B2D5B 1px, transparent 1px), radial-gradient(circle at 70% 70%, #0B2D5B 1px, transparent 1px), linear-gradient(to right, #0B2D5B 1px, transparent 1px), linear-gradient(to bottom, #0B2D5B 1px, transparent 1px)",
            backgroundSize: "80px 80px, 80px 80px, 160px 160px, 160px 160px",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-16 md:pb-24 text-center">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-[#1A1814] leading-[1.15] uppercase tracking-tight max-w-4xl mx-auto">
            Discover Your Aircraft's Value With The Aviation Industry's Most Powerful Valuation Tool
          </h1>
          <p className="text-sm md:text-base text-[#4A4845] mt-5 max-w-3xl mx-auto leading-relaxed">
            Enter your aircraft's details (serial number, registration number, category, make & model) to get an accurate, real-time market and asking aircraft values powered by ABOS trusted aircraft data.
          </p>

          <div className="mt-10 bg-white rounded-xl shadow-[0_8px_30px_rgba(11,45,91,0.08)] border border-black/[0.06] p-6 md:p-8 max-w-3xl mx-auto">
            <Link
              to="/listings"
              className="inline-flex items-center gap-2.5 bg-[#0B2D5B] hover:bg-[#143C75] text-white uppercase font-black text-sm md:text-base px-8 py-4 rounded-md tracking-wider transition-colors"
            >
              <FileText className="w-5 h-5" />
              Start My AircraftValuation
            </Link>
          </div>

          <ChevronDown className="w-6 h-6 text-[#AAA49C] mx-auto mt-10 animate-bounce" />
        </div>
      </section>

      {/* ———————— WHAT IS ———————— */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <h2 className="text-2xl md:text-3xl font-black text-[#1A1814] text-center uppercase tracking-tight">
          What Is <span className="text-[#0B2D5B]">ABOS Valuation?</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-5 mt-12">
          <FeatureCard
            icon={FileText}
            title="Instant Aircraft Values"
            body="Get instant base, asking, and market aircraft prices from ABOS — the most accurate aircraft valuation tool in the aviation industry."
          />
          <FeatureCard
            icon={BarChart3}
            title="The Industry's Most Powerful Tool"
            body="ABOS is powered by over $20B transactions annually from Jets, Piston Aircraft, Helicopters, Experimental Aircraft, and even Warbirds."
          />
          <FeatureCard
            icon={DollarSign}
            title="Improve Your Return on Investment"
            body="Monitor aircraft base, asking, and market values to determine which assets will attract the most buyers and bring the biggest return."
          />
        </div>
      </section>

      {/* ———————— LIVE STATS (platform data) ———————— */}
      <section className="bg-[#F7F4EF] border-y border-black/[0.06] py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-[#E8A83A] font-semibold text-center">Live Platform Data</p>
          <h3 className="text-xl md:text-2xl font-black text-[#0B2D5B] text-center mt-1 uppercase tracking-tight">
            Real-Time Market Pulse
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
            <StatPill value={total_listings} label="Aircraft Cards" />
            <StatPill value={avg_ati || "—"} label="Avg ATI Score" />
            <StatPill value={hot_deals} label="Hot Deals" />
            <StatPill value={`$${(total_revenue / 1000).toFixed(1)}k`} label="Transacted" />
          </div>
        </div>
      </section>

      {/* ———————— HOW IT WORKS ———————— */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#E8A83A] text-center">How It Works</p>
        <h2 className="text-2xl md:text-3xl font-black text-[#1A1814] text-center uppercase tracking-tight mt-2">
          Get Your ABOS Valuation in 3 Simple Steps
        </h2>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <StepCard n="1" title="Enter Aircraft Information" body="Input your Serial Number, Make, Model, Year, and Registration Number to get started." />
          <StepCard n="2" title="Confirm the Details" body="Add airframe time, avionics, and location for accurate aircraft values." />
          <StepCard n="3" title="View Your Aircraft Values" body="Instantly see your aircraft's base, asking, and market value with ATI transparency score." />
        </div>

        <div className="text-center mt-12">
          <Link
            to="/listings"
            className="inline-flex items-center gap-2 bg-[#0B2D5B] hover:bg-[#143C75] text-white uppercase font-black text-sm px-8 py-4 rounded-md tracking-wider transition-colors"
          >
            Start My ABOS Valuation <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ———————— MARKET PREDICTION ———————— */}
      <section className="bg-[#0B2D5B] text-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#E8A83A] text-center">Market Prediction</p>
          <h2 className="text-2xl md:text-3xl font-black text-center uppercase tracking-tight mt-2">
            GA Sector Trends — Next 30 Days
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {MARKET_PULSE.map(m => (
              <div key={m.type} className="bg-white/5 backdrop-blur rounded-lg border border-white/10 p-5">
                <p className="text-[10px] uppercase tracking-wider text-white/60 font-semibold">{m.type}</p>
                <p className="text-3xl font-black text-white mt-2">{m.ati}</p>
                <p className="text-[11px] text-white/60 mt-0.5">Avg ATI Score</p>
                <div className={`mt-3 inline-flex items-center gap-1 text-sm font-bold px-2 py-1 rounded ${m.trend >= 0 ? "bg-[#E8A83A]/20 text-[#E8A83A]" : "bg-red-500/20 text-red-300"}`}>
                  {m.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {m.trend >= 0 ? "+" : ""}{m.trend}%
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-white/70 text-sm mt-10 max-w-2xl mx-auto leading-relaxed">
            ABOS combines real-time aviation market data, aircraft-specific details, and decades of industry experience to help you understand your aircraft's market position — fast, simple, accurate.
          </p>
        </div>
      </section>

      {/* ———————— RECENT CARDS ———————— */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#E8A83A]">Your Fleet</p>
            <h2 className="text-2xl md:text-3xl font-black text-[#1A1814] uppercase tracking-tight mt-1">Recent Aircraft Cards</h2>
          </div>
          <Link to="/listings" className="text-sm font-black text-[#0B2D5B] uppercase tracking-wider hover:text-[#E8A83A] transition-colors flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.slice(0, 6).map(l => {
            const score = l.ati_score || 0;
            const color = score >= 85 ? "#0F7A56" : score >= 65 ? "#E8A83A" : score > 0 ? "#C0392B" : "#AAA49C";
            return (
              <Link key={l.id} to={`/ati-passport/${l.id}`} className="block bg-white border border-black/[0.08] rounded-lg p-5 hover:border-[#0B2D5B] hover:shadow-lg transition-all">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-[#6B6560] font-semibold">{l.registration || "—"}</p>
                    <p className="text-lg font-black text-[#1A1814] mt-0.5 truncate">
                      {l.year} {l.make} {l.model}
                    </p>
                  </div>
                  <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: color }}>
                    {score || "—"}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-black/[0.06] flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-[#6B6560] font-semibold">Asking</p>
                  <p className="text-base font-black text-[#0B2D5B]">
                    {l.asking_price ? `$${l.asking_price.toLocaleString()}` : "—"}
                  </p>
                </div>
              </Link>
            );
          })}
          {listings.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 text-center py-16 text-[#AAA49C]">
              <Plane className="w-10 h-10 mx-auto opacity-30 mb-3" />
              <p className="text-sm">No aircraft cards yet — start your first valuation above.</p>
            </div>
          )}
        </div>
      </section>

      {/* ———————— FOOTER CTA ———————— */}
      <section className="bg-[#F7F4EF] border-t border-black/[0.06] py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-black text-[#1A1814] uppercase tracking-tight">
          Your Aircraft. <span className="text-[#0B2D5B]">Your Value.</span>
        </h2>
        <p className="text-[#E8A83A] font-black text-lg mt-2 uppercase tracking-wider">Fast. Easy. Free of Charge.</p>
        <Link
          to="/listings"
          className="inline-flex items-center gap-2 bg-[#0B2D5B] hover:bg-[#143C75] text-white uppercase font-black text-sm px-8 py-4 rounded-md tracking-wider transition-colors mt-8"
        >
          Start My ABOS Valuation <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}