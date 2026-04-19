import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Fingerprint, Percent, Users, Lock, TrendingUp, ArrowRight, CheckCircle2, Plane, Radar, Handshake } from "lucide-react";
import { Link } from "react-router-dom";
import RotatingGlobe from "@/components/dashboard/RotatingGlobe";
import AIInsightsPanel from "@/components/dashboard/AIInsightsPanel";

// ———————————————————————————————————————————————
// Palette: Navy #0B2D5B · Amber #E8A83A · Deep #1A1814
// ———————————————————————————————————————————————

function NavyIcon({ icon: Icon, size = "md" }) {
  const s = size === "lg" ? "w-16 h-16" : "w-14 h-14";
  const i = size === "lg" ? "w-7 h-7" : "w-6 h-6";
  return (
    <div className={`${s} rounded-full bg-[#0B2D5B] flex items-center justify-center mx-auto shadow-md`}>
      <Icon className={`${i} text-white`} strokeWidth={2} />
    </div>
  );
}

function PillarCard({ icon, title, body }) {
  return (
    <div className="bg-white rounded-lg border border-black/[0.06] p-6 md:p-8 text-center shadow-sm hover:shadow-md transition-shadow">
      <NavyIcon icon={icon} />
      <h3 className="text-lg font-black text-[#0B2D5B] mt-5 uppercase tracking-tight">{title}</h3>
      <p className="text-sm text-[#4A4845] leading-relaxed mt-3">{body}</p>
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

export default function Dashboard() {
  const { data: listings = [] } = useQuery({
    queryKey: ["listings-active"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }),
  });
  const { data: deals = [] } = useQuery({
    queryKey: ["deals"],
    queryFn: () => base44.entities.DealRadar.list(),
  });

  const total_listings = listings.length;
  const avg_ati = listings.length > 0
    ? Math.round(listings.reduce((s, l) => s + (l.ati_score || 0), 0) / listings.length)
    : 0;
  const hot_deals = deals.filter(d => (d.deal_score || 0) >= 8.5).length;
  const evaluated = listings.filter(l => l.ati_score).length;

  return (
    <div className="min-h-screen bg-white">
      {/* ———————— HERO ———————— */}
      <section className="relative overflow-hidden bg-white border-b border-black/[0.06]">
        {/* Rotating globe background */}
        <RotatingGlobe className="absolute inset-0 w-full h-full pointer-events-none opacity-90" />
        {/* Soft left-side fade so text stays readable over the globe */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.75) 40%, rgba(255,255,255,0.2) 70%, rgba(255,255,255,0) 100%)" }}
        />

        <div className="relative max-w-6xl mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-16 md:pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-[#0B2D5B]/5 border border-[#0B2D5B]/15 rounded-full px-4 py-1.5 mb-6">
            <Lock className="w-3.5 h-3.5 text-[#0B2D5B]" />
            <p className="text-[11px] uppercase tracking-[0.15em] font-black text-[#0B2D5B]">Private · Verified Dealers & Brokers Only</p>
          </div>

          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-[#1A1814] leading-[1.15] uppercase tracking-tight max-w-5xl mx-auto">
            <span className="text-[#0B2D5B]">ATI Score Cards</span>, <span className="text-[#E8A83A]">Escrow</span> & <span className="text-[#0B2D5B]">Live Traffic</span> — The Three Pillars Of Transparent Aviation Deal-Making
          </h1>
          <p className="text-sm md:text-base text-[#4A4845] mt-5 max-w-3xl mx-auto leading-relaxed">
            Generate verifiable <b className="text-[#0B2D5B]">ATI Score Cards</b> live, close deals in protected <b className="text-[#E8A83A]">Escrow</b>, and track any aircraft in real-time with <b className="text-[#0B2D5B]">Live Traffic</b>. Built for professional dealers & brokers.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              to="/listings"
              className="inline-flex items-center gap-2.5 bg-[#0B2D5B] hover:bg-[#143C75] text-white uppercase font-black text-sm md:text-base px-6 py-3.5 rounded-md tracking-wider transition-colors"
            >
              <Fingerprint className="w-5 h-5" />
              Generate ATI Score Card
            </Link>
            <Link
              to="/escrow"
              className="inline-flex items-center gap-2.5 bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] uppercase font-black text-sm md:text-base px-6 py-3.5 rounded-md tracking-wider transition-colors"
            >
              <Handshake className="w-5 h-5" />
              Open Escrow Deal
            </Link>
            <Link
              to="/live-traffic"
              className="inline-flex items-center gap-2.5 bg-white border-2 border-[#0B2D5B] text-[#0B2D5B] hover:bg-[#0B2D5B] hover:text-white uppercase font-black text-sm md:text-base px-6 py-[13px] rounded-md tracking-wider transition-colors"
            >
              <Radar className="w-5 h-5" />
              Track Aircraft Live
            </Link>
          </div>

          <p className="text-[11px] text-[#6B6560] uppercase tracking-wider mt-6 font-semibold">
            <Link to="/rewards" className="text-[#E8A83A] hover:underline">🎁 Earn free credits</Link> — invite dealers, hit ATI 90+ milestones, unlock more.
          </p>
        </div>
      </section>

      {/* ———————— NOT ANOTHER valuation / WHAT IT IS ———————— */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#E8A83A] text-center">The ABOS Difference</p>
        <h2 className="text-2xl md:text-3xl font-black text-[#1A1814] text-center uppercase tracking-tight mt-2 max-w-3xl mx-auto leading-tight">
          Not Another Valuation Tool. The <span className="text-[#0B2D5B]">Professional Off-Market Zone</span>.
        </h2>

        <div className="grid md:grid-cols-3 gap-5 mt-12">
          <PillarCard
            icon={ShieldCheck}
            title="ATI Score Card · Aircraft ID"
            body="Every aircraft carries a verifiable Aircraft Transparency Index card — 8 dimensions, 120 points, transparent ownership history. No more guessing. No more hidden damage."
          />
          <PillarCard
            icon={Percent}
            title="% Hustling · No Price Tags"
            body="Off-market deals run on percentages, not sticker prices. Claim your finder's fee transparently. Every professional hustles openly — everyone gets paid."
          />
          <PillarCard
            icon={Handshake}
            title="All-In-One Dealer Intelligence"
            body="ATI scoring, deal radar, lead CRM, broker network, and transparent ownership chain — one zone for smart, fast, profitable decisions."
          />
        </div>
      </section>

      {/* ———————— LIVE ZONE STATS ———————— */}
      <section className="bg-[#F7F4EF] border-y border-black/[0.06] py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-[#E8A83A] font-semibold text-center">Live IntraZone Data</p>
          <h3 className="text-xl md:text-2xl font-black text-[#0B2D5B] text-center mt-1 uppercase tracking-tight">
            The Network At A Glance
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
            <StatPill value={total_listings} label="Aircraft in Zone" />
            <StatPill value={evaluated} label="ATI Score Cards" />
            <StatPill value={hot_deals} label="Hot Off-Market" />
            <StatPill value={avg_ati || "—"} label="Avg ATI Score" />
          </div>
        </div>
      </section>

      {/* ———————— HOW THE HUSTLE WORKS ———————— */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#E8A83A] text-center">How The Hustle Works</p>
        <h2 className="text-2xl md:text-3xl font-black text-[#1A1814] text-center uppercase tracking-tight mt-2">
          Transparent % Deals · Everyone Profits
        </h2>

        <div className="grid md:grid-cols-4 gap-6 mt-12">
          {[
            { n: "01", title: "Aircraft Gets ATI ID", body: "Dealer imports or claims an aircraft. An ATI Score Card is generated with verifiable history and transparency score." },
            { n: "02", title: "Ownership Registered", body: "The rightful owner or finder locks in their claim on the card — protected by the transparent registry." },
            { n: "03", title: "Hustle With %", body: "Share the aircraft inside the zone with a finder's-fee %. No price tags. Brokers forward deals freely." },
            { n: "04", title: "Deal Closes — All Paid", body: "When the aircraft sells, the transparent chain pays every % participant. Everyone is happy. Everyone hustles again." },
          ].map(s => (
            <div key={s.n} className="relative">
              <p className="text-5xl font-black text-[#E8A83A] leading-none">{s.n}</p>
              <h4 className="text-base font-black text-[#0B2D5B] uppercase mt-3 tracking-tight">{s.title}</h4>
              <p className="text-sm text-[#4A4845] mt-2 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/listings"
            className="inline-flex items-center gap-2 bg-[#0B2D5B] hover:bg-[#143C75] text-white uppercase font-black text-sm px-8 py-4 rounded-md tracking-wider transition-colors"
          >
            Start Hustling Transparently <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ———————— WHO IT'S FOR ———————— */}
      <section className="bg-[#0B2D5B] text-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#E8A83A] text-center">Professionals Only</p>
          <h2 className="text-2xl md:text-3xl font-black text-center uppercase tracking-tight mt-2">
            Built For Dealers, Brokers & Serious Operators
          </h2>

          <div className="grid md:grid-cols-3 gap-5 mt-12">
            {[
              { icon: Users, title: "Aircraft Dealers", body: "Manage your inventory with verifiable ATI IDs. Surface off-market opportunities before anyone else." },
              { icon: Handshake, title: "Brokers", body: "Forward deals transparently with locked-in %. Never lose your finder's fee to a handshake gone wrong." },
              { icon: TrendingUp, title: "Operators & Flippers", body: "Find mispriced aircraft, verify ownership, act fast. The zone rewards speed and transparency." },
            ].map(x => (
              <div key={x.title} className="bg-white/5 backdrop-blur rounded-lg border border-white/10 p-6">
                <div className="w-12 h-12 rounded-full bg-[#E8A83A] flex items-center justify-center">
                  <x.icon className="w-5 h-5 text-[#0B2D5B]" strokeWidth={2.5} />
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight mt-4">{x.title}</h4>
                <p className="text-sm text-white/75 mt-2 leading-relaxed">{x.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {[
              "No price tags — only %",
              "Verified ownership chain",
              "Off-market exclusivity",
              "Finder's fee protected",
              "ATI transparency score",
              "Zero public listings",
            ].map(x => (
              <div key={x} className="flex items-center gap-2 text-sm text-white/90">
                <CheckCircle2 className="w-4 h-4 text-[#E8A83A]" />
                {x}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ———————— RECENT CARDS + AI INSIGHTS ———————— */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#E8A83A]">Your Zone</p>
            <h2 className="text-2xl md:text-3xl font-black text-[#1A1814] uppercase tracking-tight mt-1">Recent ATI Score Cards</h2>
          </div>
          <Link to="/listings" className="text-sm font-black text-[#0B2D5B] uppercase tracking-wider hover:text-[#E8A83A] transition-colors flex items-center gap-1">
            View All Cards <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          <div className="grid sm:grid-cols-2 gap-4">
          {listings.slice(0, 6).map(l => {
            const score = l.ati_score || 0;
            const color = score >= 85 ? "#0F7A56" : score >= 65 ? "#E8A83A" : score > 0 ? "#C0392B" : "#AAA49C";
            return (
              <Link key={l.id} to={`/ati-passport/${l.id}`} className="block bg-white border border-black/[0.08] rounded-lg p-5 hover:border-[#0B2D5B] hover:shadow-lg transition-all">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-[#E8A83A] font-black">ATI ID</p>
                    <p className="text-xs uppercase tracking-wider text-[#6B6560] font-semibold font-mono mt-0.5">{l.registration || "—"}</p>
                    <p className="text-lg font-black text-[#1A1814] mt-1 truncate">
                      {l.year} {l.make} {l.model}
                    </p>
                  </div>
                  <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: color }}>
                    {score || "—"}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-black/[0.06] flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-[#6B6560] font-semibold">Finder's Fee</p>
                  <p className="text-base font-black text-[#0B2D5B]">%</p>
                </div>
              </Link>
            );
          })}
          {listings.length === 0 && (
            <div className="sm:col-span-2 text-center py-16 text-[#AAA49C]">
              <Plane className="w-10 h-10 mx-auto opacity-30 mb-3" />
              <p className="text-sm">No ATI score cards in your zone yet.</p>
            </div>
          )}
          </div>

          {/* AI Insights side panel */}
          <div className="lg:sticky lg:top-16 lg:self-start">
            <AIInsightsPanel />
          </div>
        </div>
      </section>

      {/* ———————— FOOTER CTA ———————— */}
      <section className="bg-[#F7F4EF] border-t border-black/[0.06] py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-black text-[#1A1814] uppercase tracking-tight">
          One Zone. <span className="text-[#0B2D5B]">One Standard.</span> <span className="text-[#E8A83A]">Transparent Hustle.</span>
        </h2>
        <p className="text-[#4A4845] text-sm md:text-base mt-3 max-w-2xl mx-auto">
          The Aviation IntraZone isn't for tire-kickers. It's where professionals make smart, fast, profitable decisions — together.
        </p>
        <Link
          to="/listings"
          className="inline-flex items-center gap-2 bg-[#0B2D5B] hover:bg-[#143C75] text-white uppercase font-black text-sm px-8 py-4 rounded-md tracking-wider transition-colors mt-8"
        >
          Enter The IntraZone <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}