import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search, Plus, ShieldCheck, TrendingUp, FileText, Mail, CalendarDays,
  Landmark, Radar, Zap, Scale, Calculator, BadgeCheck, GitBranch
} from "lucide-react";
import SkillCard from "@/components/skills/SkillCard";

const SKILLS = [
  { icon: ShieldCheck, title: "ATI Scoring", badge: "Default Skill", color: "#4e8ef7", path: "/ati-quick-score",
    description: "Scores aircraft transparency across 8 dimensions — documentation, engine condition, avionics, storage and transaction readiness." },
  { icon: Zap, title: "Digital Twin Verification", badge: "Default Skill", color: "#f5c242", path: "/n-lookup",
    description: "Builds an independent Digital Twin from FAA registry, ADS-B traffic and engine spec data with 3-source integrity cross-check." },
  { icon: TrendingUp, title: "Expert Valuation", badge: "Default Skill", color: "#5dcaa5", path: "/valuation",
    description: "Generates market appraisals from live comparables, condition data and deal-quality scoring with discount detection." },
  { icon: FileText, title: "Contract Generator", badge: "Google Docs", color: "#a78bfa", path: "/sales-pipeline",
    description: "Drafts aircraft purchase agreements in Google Docs pre-filled with pipeline data — parties, price, conditions and signatures." },
  { icon: Mail, title: "Deal Notifications", badge: "Gmail", color: "#5dcaa5", path: "/sales-pipeline",
    description: "Sends contracts and deal notifications to buyers directly from the sales pipeline via Gmail." },
  { icon: CalendarDays, title: "Inspection Scheduler", badge: "Calendar", color: "#4e8ef7", path: "/sales-pipeline",
    description: "Books pre-buy inspections and closing dates in Google Calendar with automatic attendee invitations." },
  { icon: Landmark, title: "Escrow Management", badge: "Default Skill", color: "#e2a44b", path: "/escrow",
    description: "Manages transaction escrow from contract to release — Stripe or USDC funding, finder's fees and settlement tracking." },
  { icon: Radar, title: "Deal Radar", badge: "Default Skill", color: "#e24b4a", path: "/deal-radar",
    description: "Continuously scans the market for undervalued aircraft — flags listings priced 8%+ below expert market value." },
  { icon: BadgeCheck, title: "Expert Crosscheck", badge: "Human Moat", color: "#f5c242", path: "/experts",
    description: "Routes verification requests to certified A&P, IA and EASA experts from the 280k-member community network." },
  { icon: Scale, title: "Aircraft Comparison", badge: "Default Skill", color: "#a78bfa", path: "/compare",
    description: "Side-by-side comparison of aircraft listings across specs, ATI scores, pricing and total cost of ownership." },
  { icon: Calculator, title: "OPEX Engine", badge: "Default Skill", color: "#4e8ef7", path: "/opex-calculator",
    description: "Models full operating costs — fuel, maintenance reserves, hangar, insurance and hourly rates per aircraft type." },
  { icon: GitBranch, title: "Sales Pipeline Spider", badge: "Workflow", color: "#f5c242", path: "/sales-pipeline",
    description: "End-to-end deal workflow — from Digital Twin init through AI document review to contract, escrow and closing." },
];

export default function Skills() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return SKILLS;
    return SKILLS.filter(s => `${s.title} ${s.description} ${s.badge}`.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] font-black text-[#f5c242] mb-1">ABOS Aviation OS</p>
            <h1 className="text-2xl font-black text-[rgba(255,255,255,0.92)]">Available Skills</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/feature-requests"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold whitespace-nowrap"
              style={{ background: "rgba(255,255,255,0.9)", color: "#0a0a12" }}>
              <Plus className="w-3.5 h-3.5" />
              Request Skill
            </Link>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgba(255,255,255,0.3)]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search Skills…"
                className="w-44 sm:w-56 pl-8 pr-3 py-2 rounded-lg text-[12px] outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", color: "#fff" }} />
            </div>
          </div>
        </div>

        {/* Skills grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[13px] text-[rgba(255,255,255,0.4)]">No skills match "{search}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(skill => <SkillCard key={skill.title} skill={skill} />)}
          </div>
        )}
      </div>
    </div>
  );
}