import { Link } from "react-router-dom";
import { useTheme } from "@/lib/useTheme";
import {
  ShieldCheck, TrendingUp, Zap, Globe, Building2, Handshake,
  Rocket, Lightbulb, ArrowRight, Star, CheckCircle2, Users,
  BarChart3, FileText, Plane, Award, Sparkles
} from "lucide-react";

function Panel({ children, className = "", translucent = false, isDark = true }) {
  return (
    <div className={`rounded-xl ${className}`} style={{
      background: isDark
        ? "rgba(22,22,38,0.78)"
        : "rgba(255,255,255,0.94)",
      border: isDark
        ? "1px solid rgba(255,255,255,0.06)"
        : "1px solid rgba(0,0,0,0.06)",
      boxShadow: isDark
        ? "0 1px 3px rgba(0,0,0,0.2)"
        : "0 1px 2px rgba(0,0,0,0.04)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)"
    }}>
      {children}
    </div>
  );
}

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
  const isDark = useTheme();
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const muted = isDark ? "rgba(255,255,255,0.5)" : "rgba(100,116,139,0.9)";
  const accent = isDark ? "#60a5fa" : "#3b82f6";
  const gold = "#D4A017";
  const subtleBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  return (
    <div className="min-h-screen" style={{ background: isDark ? "#0A081E" : "#f8fafc" }}>
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative px-4 md:px-8 pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}40 0%, transparent 60%)` }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-[10px] font-semibold tracking-wide"
            style={{ background: `${accent}15`, border: `1px solid ${accent}30`, color: accent }}>
            <Globe className="w-3 h-3" /> European Aviation Intelligence
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6"
            style={{ color: textColor }}>
            The New Standard in<br />
            <span style={{ color: accent }}>Aircraft Valuation</span>
          </h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed" style={{ color: muted }}>
            ATI Score, ATI Report, and ATI Card are being adopted by European marketplaces and
            top aircraft sales companies as the unified language of transaction intelligence.
            Join the professionals shaping the future of secondary market transparency.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/ati-quick-score"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{ background: accent, color: "#fff" }}>
              <Zap className="w-4 h-4" /> Try ATI Score
            </Link>
            <Link to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{ background: "transparent", border: `2px solid ${accent}`, color: accent }}>
              Partner With Us <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ TRUSTED BY ═══════════ */}
      <section className="px-4 md:px-8 py-12">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[10px] tracking-[0.2em] font-semibold mb-6" style={{ color: muted }}>
            TRUSTED BY EUROPEAN AVIATION PROFESSIONALS
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {TRUSTED_LOGOS.map((name) => (
              <div key={name}
                className="flex items-center justify-center p-4 rounded-xl text-center"
                style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", border: `1px solid ${subtleBorder}` }}>
                <span className="text-[11px] font-semibold tracking-wide" style={{ color: muted }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ ATI EXPLAINED ═══════════ */}
      <section className="px-4 md:px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.2em] font-semibold mb-2" style={{ color: accent }}>
              UNIFIED INTELLIGENCE
            </p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: textColor }}>
              Three Pillars of Aircraft Transparency
            </h2>
            <p className="text-sm mt-3 max-w-xl mx-auto" style={{ color: muted }}>
              A complete system replacing fragmented, inconsistent valuation with a standardized,
              verifiable, and shareable intelligence framework.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {ATI_FEATURES.map((f) => (
              <Panel key={f.title} isDark={isDark} className="p-6 text-center">
                <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}>
                  <f.icon className="w-6 h-6" style={{ color: accent }} />
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: textColor }}>{f.title}</h3>
                <p className="text-[11px] leading-relaxed mb-3" style={{ color: muted }}>{f.desc}</p>
                <span className="text-[9px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: `${accent}12`, color: accent }}>
                  {f.stat}
                </span>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ MARKET ADOPTION ═══════════ */}
      <section className="px-4 md:px-8 py-16"
        style={{ background: isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <Sparkles className="w-8 h-8 mx-auto mb-4" style={{ color: gold }} />
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4" style={{ color: textColor }}>
            Becoming the European Standard
          </h2>
          <p className="text-sm max-w-2xl mx-auto mb-8 leading-relaxed" style={{ color: muted }}>
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
              <div key={s.label} className="p-5 rounded-xl"
                style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", border: `1px solid ${subtleBorder}` }}>
                <p className="text-2xl md:text-3xl font-black mb-1" style={{ color: gold }}>{s.value}</p>
                <p className="text-[10px] tracking-wide" style={{ color: muted }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ AVIATION STARTUP HUB ═══════════ */}
      <section className="px-4 md:px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-[10px] font-semibold tracking-wide"
              style={{ background: `${gold}15`, border: `1px solid ${gold}30`, color: gold }}>
              <Rocket className="w-3 h-3" /> Launching Now
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: textColor }}>
              Aviation Start Up Hub
            </h2>
            <p className="text-sm md:text-base max-w-2xl mx-auto leading-relaxed" style={{ color: muted }}>
              We believe healthy competition drives innovation. The Aviation Start Up Hub connects founders,
              investors, and industry mentors to build the next generation of aviation technology —
              from valuation algorithms to marketplace infrastructure, from maintenance AI to
              fractional ownership platforms.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {HUB_PILLARS.map((p) => (
              <Panel key={p.title} isDark={isDark} className="p-5">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: `${gold}12`, border: `1px solid ${gold}25` }}>
                  <p.icon className="w-5 h-5" style={{ color: gold }} />
                </div>
                <h3 className="text-sm font-bold mb-2" style={{ color: textColor }}>{p.title}</h3>
                <p className="text-[11px] leading-relaxed" style={{ color: muted }}>{p.desc}</p>
              </Panel>
            ))}
          </div>
          <div className="text-center">
            <p className="text-sm mb-6 max-w-2xl mx-auto leading-relaxed" style={{ color: muted }}>
              Whether you're a founder with a scalable aviation concept or an investor
              seeking exposure to the $XX billion secondary aircraft market, the Hub
              provides the infrastructure, data, and network to turn vision into value.
            </p>
            <Link to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{ background: gold, color: "#0B2D5B" }}>
              Explore the Hub <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ COOPERATION ═══════════ */}
      <section className="px-4 md:px-8 py-16"
        style={{ background: isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.2em] font-semibold mb-2" style={{ color: accent }}>
              JOIN THE MOVEMENT
            </p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4" style={{ color: textColor }}>
              Cooperation That Elevates the Industry
            </h2>
            <p className="text-sm max-w-2xl mx-auto leading-relaxed" style={{ color: muted }}>
              We invite aviation professionals — marketplaces, sales companies, brokers,
              and technology startups — to not only adopt the ATI standard but to actively
              contribute to its evolution. Together we raise the bar for transparency,
              trust, and transaction efficiency across global aviation markets.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {COOPERATION_TIERS.map((t) => (
              <Panel key={t.title} isDark={isDark} className="p-6 flex flex-col">
                <Building2 className="w-8 h-8 mb-4" style={{ color: accent }} />
                <h3 className="text-base font-bold mb-2" style={{ color: textColor }}>{t.title}</h3>
                <p className="text-[11px] leading-relaxed mb-5 flex-1" style={{ color: muted }}>{t.desc}</p>
                <Link to="/pricing"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-[11px] font-semibold transition-all hover:opacity-80"
                  style={{ background: `${accent}12`, border: `1px solid ${accent}25`, color: accent }}>
                  {t.cta} <ArrowRight className="w-3 h-3" />
                </Link>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ QUALITY COMMITMENT ═══════════ */}
      <section className="px-4 md:px-8 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <ShieldCheck className="w-10 h-10 mx-auto mb-5" style={{ color: accent }} />
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-4" style={{ color: textColor }}>
            Keeping Quality High. Raising It Higher.
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: muted }}>
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
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: accent, opacity: 0.7 }} />
                <span className="text-[11px] font-medium" style={{ color: muted }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="px-4 md:px-8 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-[10px] font-semibold tracking-wide"
            style={{ background: `${accent}15`, border: `1px solid ${accent}30`, color: accent }}>
            <Star className="w-3 h-3" /> New Era Begins Now
          </div>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: textColor }}>
            A New Era of Market<br />Aircraft Valuation
          </h2>
          <p className="text-sm md:text-base mb-8 leading-relaxed" style={{ color: muted }}>
            The fragmented, inconsistent, and opaque way aircraft change hands is ending.
            ATI brings unified intelligence, startup-driven innovation, and professional
            cooperation to the heart of the secondary aircraft market. Be part of it.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/ati-quick-score"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-bold transition-all hover:scale-[1.02]"
              style={{ background: accent, color: "#fff" }}>
              <Zap className="w-4 h-4" /> Score an Aircraft
            </Link>
            <Link to="/pricing"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-bold transition-all hover:scale-[1.02]"
              style={{ background: gold, color: "#0B2D5B" }}>
              <Handshake className="w-4 h-4" /> Become a Partner
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER NOTE ═══════════ */}
      <div className="text-center pb-10">
        <p className="text-[10px]" style={{ color: muted }}>
          ABOS MarketSpace — Aviation Intelligence for the Next Generation
        </p>
      </div>
    </div>
  );
}