import { Link } from "react-router-dom";
import {
  ShieldCheck, Zap, Globe, Building2, Handshake,
  Rocket, Lightbulb, ArrowRight, Star, CheckCircle2, Users,
  BarChart3, FileText, Award, Sparkles
} from "lucide-react";

const TRUSTED_LOGOS = [
  "Aircraft Dealer Network EU",
  "European Broker Alliance",
  "Central European Sales Group",
  "Aviation Asset Managers",
  "Pre-Owned Market Association",
  "Business Aviation Europe",
];

const ATI_FEATURES = [
  {
    icon: ShieldCheck,
    title: "ATI Score",
    desc: "8-dimension risk scoring calibrated to European market conditions — documentation integrity, engine condition, avionics, operational history, and transaction readiness.",
    stat: "120-point scale",
  },
  {
    icon: FileText,
    title: "ATI Report",
    desc: "Professional appraisal export with executive summary, strengths analysis, risk identification, and branded .docx output accepted by financial institutions.",
    stat: "Institutional grade",
  },
  {
    icon: Award,
    title: "ATI Card",
    desc: "Persistent digital identity card for each aircraft — traceable, versioned, and shareable across marketplaces with verified ownership chain.",
    stat: "Lifetime validity",
  },
];

const HUB_PILLARS = [
  {
    icon: Rocket,
    title: "Startup Accelerator",
    desc: "Scalable aviation startups gain visibility, mentorship, and integration into the ATI ecosystem — from valuation tools to marketplace APIs.",
  },
  {
    icon: Lightbulb,
    title: "Investor Network",
    desc: "Curated deal flow connecting vetted aviation startups with institutional and angel investors seeking exposure to the secondary aircraft market.",
  },
  {
    icon: Users,
    title: "Founder Community",
    desc: "Peer support, co-development opportunities, and shared infrastructure for founders building the next generation of aviation technology.",
  },
  {
    icon: BarChart3,
    title: "Market Data Access",
    desc: "Startups receive privileged access to anonymized market intelligence, pricing trends, and transaction data to power their innovations.",
  },
];

const COOPERATION_TIERS = [
  {
    title: "Marketplace Integration",
    desc: "Adopt ATI scoring and reporting as your platform's standard for aircraft listings. API-first design with white-label options.",
    cta: "Integrate ATI",
  },
  {
    title: "Sales Company Partnership",
    desc: "Equip your sales team with ATI intelligence — every listing professionally scored, every aircraft comprehensively documented.",
    cta: "Partner With Us",
  },
  {
    title: "Startup Program",
    desc: "Early-stage aviation startups receive platform credits, technical mentorship, and exposure to our investor network.",
    cta: "Apply Now",
  },
];

export default function ATIStandard() {
  return (
    <div className="min-h-screen dot-grid bg-canvas text-foreground">
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative px-4 md:px-8 pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(212,160,23,0.35) 0%, transparent 60%)" }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-[10px] font-bold tracking-wide uppercase border border-gold-official/30 bg-gold-bg text-gold-official">
            <Globe className="w-3 h-3" /> European Aviation Intelligence
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
            The New Standard in<br />
            <span className="text-gold-official">Aircraft Valuation</span>
          </h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed text-muted-foreground">
            ATI Score, ATI Report, and ATI Card are being adopted by European marketplaces and
            top aircraft sales companies as the unified language of aircraft transparency.
            Join the professionals shaping the future of secondary market transparency.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/ati-quick-score"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-gold-official text-white hover:opacity-90 transition-opacity">
              <Zap className="w-4 h-4" /> Try ATI Score
            </Link>
            <Link to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border border-gold-official/40 text-gold-official hover:bg-gold-bg transition-colors">
              Partner With Us <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ TRUSTED BY ═══════════ */}
      <section className="px-4 md:px-8 py-12">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[10px] tracking-[0.2em] font-semibold mb-6 text-muted-foreground">
            TRUSTED BY EUROPEAN AVIATION PROFESSIONALS
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {TRUSTED_LOGOS.map((name) => (
              <div key={name} className="flex items-center justify-center p-4 rounded-xl text-center border border-border bg-card">
                <span className="text-[11px] font-semibold tracking-wide text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ ATI EXPLAINED ═══════════ */}
      <section className="px-4 md:px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.2em] font-bold mb-2 text-gold-official uppercase">
              Unified Intelligence
            </p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Three Pillars of Aircraft Transparency
            </h2>
            <p className="text-sm mt-3 max-w-xl mx-auto text-muted-foreground">
              A complete system replacing fragmented, inconsistent valuation with a standardized,
              verifiable, and shareable intelligence framework.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {ATI_FEATURES.map((f) => (
              <div key={f.title} className="glass-card p-6 text-center">
                <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-4 border border-gold-official/25 bg-gold-bg">
                  <f.icon className="w-6 h-6 text-gold-official" />
                </div>
                <h3 className="text-base font-bold mb-2">{f.title}</h3>
                <p className="text-[11px] leading-relaxed mb-3 text-muted-foreground">{f.desc}</p>
                <span className="text-[9px] font-bold px-2.5 py-1 rounded-md border border-gold-official/25 bg-gold-bg text-gold-official uppercase tracking-wider">
                  {f.stat}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ MARKET ADOPTION ═══════════ */}
      <section className="px-4 md:px-8 py-16 bg-muted/40">
        <div className="max-w-4xl mx-auto text-center">
          <Sparkles className="w-8 h-8 mx-auto mb-4 text-gold-official" />
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
            Becoming the European Standard
          </h2>
          <p className="text-sm max-w-2xl mx-auto mb-8 leading-relaxed text-muted-foreground">
            Across Central and Western Europe, leading aircraft marketplaces and sales organizations
            are adopting ATI as their primary valuation and documentation framework. What began as
            an internal tool for rigorous due diligence is now becoming the benchmark for how the
            secondary aircraft market communicates value, condition, and risk.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { value: "12+", label: "European Markets" },
              { value: "850+", label: "Aircraft Evaluated" },
              { value: "40+", label: "Partner Organizations" },
            ].map((s) => (
              <div key={s.label} className="glass-card p-5">
                <p className="text-2xl md:text-3xl font-black mb-1 tabular-nums text-gold-official">{s.value}</p>
                <p className="text-[10px] tracking-wide text-muted-foreground uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ AVIATION STARTUP HUB ═══════════ */}
      <section className="px-4 md:px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-[10px] font-bold tracking-wide uppercase border border-gold-official/30 bg-gold-bg text-gold-official">
              <Rocket className="w-3 h-3" /> Launching Now
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
              Aviation Start Up Hub
            </h2>
            <p className="text-sm md:text-base max-w-2xl mx-auto leading-relaxed text-muted-foreground">
              We believe healthy competition drives innovation. The Aviation Start Up Hub connects founders,
              investors, and industry mentors to build the next generation of aviation technology —
              from valuation algorithms to marketplace infrastructure, from maintenance AI to
              fractional ownership platforms.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {HUB_PILLARS.map((p) => (
              <div key={p.title} className="glass-card p-5">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 border border-gold-official/25 bg-gold-bg">
                  <p.icon className="w-5 h-5 text-gold-official" />
                </div>
                <h3 className="text-sm font-bold mb-2">{p.title}</h3>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-sm mb-6 max-w-2xl mx-auto leading-relaxed text-muted-foreground">
              Whether you're a founder with a scalable aviation concept or an investor
              seeking exposure to the $XX billion secondary aircraft market, the Hub
              provides the infrastructure, data, and network to turn vision into value.
            </p>
            <Link to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-gold-official text-white hover:opacity-90 transition-opacity">
              Explore the Hub <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ COOPERATION ═══════════ */}
      <section className="px-4 md:px-8 py-16 bg-muted/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.2em] font-bold mb-2 text-gold-official uppercase">
              Join the Movement
            </p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
              Cooperation That Elevates the Industry
            </h2>
            <p className="text-sm max-w-2xl mx-auto leading-relaxed text-muted-foreground">
              We invite aviation professionals — marketplaces, sales companies, brokers,
              and technology startups — to not only adopt the ATI standard but to actively
              contribute to its evolution. Together we raise the bar for transparency,
              trust, and transaction efficiency across global aviation markets.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {COOPERATION_TIERS.map((t) => (
              <div key={t.title} className="glass-card p-6 flex flex-col">
                <Building2 className="w-8 h-8 mb-4 text-gold-official" />
                <h3 className="text-base font-bold mb-2">{t.title}</h3>
                <p className="text-[11px] leading-relaxed mb-5 flex-1 text-muted-foreground">{t.desc}</p>
                <Link to="/pricing"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-[11px] font-bold border border-gold-official/30 bg-gold-bg text-gold-official hover:opacity-80 transition-opacity">
                  {t.cta} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ QUALITY COMMITMENT ═══════════ */}
      <section className="px-4 md:px-8 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <ShieldCheck className="w-10 h-10 mx-auto mb-5 text-gold-official" />
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-4">
            Keeping Quality High. Raising It Higher.
          </h2>
          <p className="text-sm leading-relaxed mb-8 text-muted-foreground">
            Standardization without quality is meaningless. Every ATI score is backed by
            verified data sources, every report is reviewed for consistency, and every card
            maintains a permanent audit trail. We call on industry professionals to hold
            the line — and then push it further.
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {[
              "8-dimension calibrated scoring",
              "Verified ownership chain",
              "Institutional-grade exports",
              "Continuous score improvement",
              "European market calibration",
              "Auditable transaction history",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-gold-official/70" />
                <span className="text-[11px] font-medium text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="px-4 md:px-8 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-[10px] font-bold tracking-wide uppercase border border-gold-official/30 bg-gold-bg text-gold-official">
            <Star className="w-3 h-3" /> New Era Begins Now
          </div>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
            A New Era of Market<br />Aircraft Valuation
          </h2>
          <p className="text-sm md:text-base mb-8 leading-relaxed text-muted-foreground">
            The fragmented, inconsistent, and opaque way aircraft change hands is ending.
            ATI brings unified intelligence, startup-driven innovation, and professional
            cooperation to the heart of the secondary aircraft market. Be part of it.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/ati-quick-score"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-bold bg-gold-official text-white hover:opacity-90 transition-opacity">
              <Zap className="w-4 h-4" /> Score an Aircraft
            </Link>
            <Link to="/pricing"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-bold border border-gold-official/40 text-gold-official hover:bg-gold-bg transition-colors">
              <Handshake className="w-4 h-4" /> Become a Partner
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER NOTE ═══════════ */}
      <div className="text-center pb-10">
        <p className="text-[10px] text-muted-foreground">
          ABOS MarketSpace — Aviation Intelligence for the Next Generation
        </p>
      </div>
    </div>
  );
}