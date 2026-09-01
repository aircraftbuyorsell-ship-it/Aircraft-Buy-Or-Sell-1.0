import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/lib/useTheme";
import {
  Rocket, Globe, Zap, Users, TrendingUp, BarChart3,
  Plane, ShieldCheck, ArrowRight, Star, Sparkles, Send,
  CheckCircle2, Award, Target,
  ChevronRight, Layers
} from "lucide-react";

function Panel({ children, className = "", isDark = true, accent = false }) {
  return (
    <div className={`rounded-xl ${className}`} style={{
      background: isDark ? "rgba(22,22,38,0.78)" : "#ffffff",
      border: isDark
        ? `1px solid ${accent ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)"}`
        : `1px solid ${accent ? "rgba(37,99,235,0.15)" : "rgba(0,0,0,0.06)"}`,
      boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.2)" : "0 1px 2px rgba(0,0,0,0.04)"
    }}>
      {children}
    </div>
  );
}

const PROGRAM_TRACKS = [
  {
    icon: Plane,
    title: "Marketplace & Listings",
    desc: "Build the next generation of aircraft listing platforms, marketplaces, and inventory management tools powered by ATI intelligence APIs.",
    tag: "High Demand",
  },
  {
    icon: BarChart3,
    title: "Valuation & Analytics",
    desc: "Create innovative pricing engines, predictive valuation models, and market intelligence dashboards for the secondary market.",
    tag: "Data-Rich",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & Trust",
    desc: "Develop verification systems, title chain tracking, escrow automation, and regulatory compliance tools for transactions.",
    tag: "Essential",
  },
  {
    icon: Globe,
    title: "Cross-Border & Logistics",
    desc: "Solve international transaction friction — import/export workflows, ferry logistics, customs documentation, and multi-currency settlement.",
    tag: "Growing",
  },
  {
    icon: Zap,
    title: "AI & Automation",
    desc: "Leverage machine learning for aircraft condition assessment, document parsing, market forecasting, and intelligent deal matching.",
    tag: "Cutting Edge",
  },
];

const BENEFITS = [
  { icon: Database, title: "ATI API Access", desc: "Full access to the ATI scoring engine, market data, and market intelligence — the same tools used by European marketplaces." },
  { icon: Users, title: "Mentor Network", desc: "Direct access to 40+ aviation industry veterans — dealers, brokers, financiers, and regulators who've shaped the market." },
  { icon: TrendingUp, title: "Investor Pipeline", desc: "Curated introductions to aviation-focused angel investors, family offices, and venture funds actively seeking aviation tech exposure." },
  { icon: CreditCard, title: "Platform Credits", desc: "Up to €50,000 in ABOS platform credits — covering ATI scoring, market data, API calls, and hosting for your first year." },
  { icon: Globe, title: "Distribution Channel", desc: "Your product featured in the ABOS Marketplace, reaching 850+ evaluated aircraft and a growing European professional network." },
  { icon: Award, title: "Co-Branding Rights", desc: "Official 'Powered by ABOS' and 'ATI Certified' badges for your product — instant credibility with aviation professionals." },
];

// Need Database icon from lucide — using Layers as fallback
function Database(props) { return <Layers {...props} />; }
function CreditCard(props) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>; }

const INVESTOR_HIGHLIGHTS = [
  "Access to pre-vetted aviation startups",
  "Secondary market deal flow exposure",
  "Co-investment with industry insiders",
  "Quarterly aviation tech landscape reports",
  "Priority access to ABOS market intelligence",
];

export default function SoarStartupHub() {
  const isDark = useTheme();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const muted = isDark ? "rgba(255,255,255,0.5)" : "rgba(100,116,139,0.9)";
  const accent = isDark ? "#60a5fa" : "#3b82f6";
  const gold = "#D4A017";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="min-h-screen" style={{ background: isDark ? "#0A081E" : "#f8fafc" }}>
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative px-4 md:px-8 pt-16 pb-16 md:pt-24 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${accent}25 0%, transparent 55%),
                         radial-gradient(ellipse at 80% 80%, ${gold}15 0%, transparent 50%)`
          }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-[10px] font-bold tracking-[0.15em] uppercase"
            style={{ background: `${gold}15`, border: `1px solid ${gold}30`, color: gold }}>
            <Sparkles className="w-3.5 h-3.5" /> Soar Startup Hub
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6"
            style={{ color: textColor }}>
            The Future of<br />
            <span style={{ color: accent }}>Aviation Technology</span><br />
            Starts Here
          </h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: muted }}>
            SOAR is the aviation industry's startup accelerator — connecting visionary founders,
            strategic investors, and established market infrastructure. We turn scalable ideas
            into flight-ready businesses that reshape the secondary aircraft market.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="#apply"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] shadow-lg"
              style={{ background: accent, color: "#fff", boxShadow: `0 4px 20px ${accent}40` }}>
              <Rocket className="w-4 h-4" /> Apply to SOAR
            </a>
            <a href="#program"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
              style={{ background: "transparent", border: `2px solid ${accent}`, color: accent }}>
              Explore Program <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ STATS ROW ═══════════ */}
      <section className="px-4 md:px-8 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { v: "€50K", l: "Platform Credits" },
            { v: "40+", l: "Industry Mentors" },
            { v: "12+", l: "European Markets" },
            { v: "€2.5B", l: "Market Access" },
          ].map((s) => (
            <div key={s.l} className="text-center p-4 rounded-xl"
              style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>
              <p className="text-xl md:text-2xl font-black mb-1" style={{ color: accent }}>{s.v}</p>
              <p className="text-[10px] font-medium tracking-wide" style={{ color: muted }}>{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ WHAT WE LOOK FOR ═══════════ */}
      <section id="program" className="px-4 md:px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.2em] font-semibold mb-3" style={{ color: accent }}>PROGRAM TRACKS</p>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: textColor }}>
              What We're Building Together
            </h2>
            <p className="text-sm max-w-2xl mx-auto" style={{ color: muted }}>
              We invest in startups that leverage the ATI ecosystem to create scalable solutions
              across the aviation transaction lifecycle.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROGRAM_TRACKS.map((t) => (
              <Panel key={t.title} isDark={isDark} className="p-5 flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}>
                    <t.icon className="w-5 h-5" style={{ color: accent }} />
                  </div>
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-full ml-auto"
                    style={{ background: `${gold}15`, color: gold, border: `1px solid ${gold}30` }}>
                    {t.tag}
                  </span>
                </div>
                <h3 className="text-sm font-bold mb-2" style={{ color: textColor }}>{t.title}</h3>
                <p className="text-[11px] leading-relaxed flex-1" style={{ color: muted }}>{t.desc}</p>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BENEFITS ═══════════ */}
      <section className="px-4 md:px-8 py-20"
        style={{ background: isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.2em] font-semibold mb-3" style={{ color: gold }}>FOUNDER BENEFITS</p>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: textColor }}>
              Everything You Need to Scale
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map((b) => (
              <Panel key={b.title} isDark={isDark} className="p-5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: `${accent}10`, border: `1px solid ${accent}20` }}>
                  <b.icon className="w-4.5 h-4.5" style={{ color: accent }} />
                </div>
                <h3 className="text-sm font-bold mb-1.5" style={{ color: textColor }}>{b.title}</h3>
                <p className="text-[11px] leading-relaxed" style={{ color: muted }}>{b.desc}</p>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FOR INVESTORS ═══════════ */}
      <section className="px-4 md:px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-[10px] tracking-[0.2em] font-semibold mb-3" style={{ color: gold }}>INVESTOR OPPORTUNITY</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4" style={{ color: textColor }}>
                Aviation's Next<br />Growth Frontier
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: muted }}>
                The secondary aircraft market represents over €50 billion in annual transactions —
                yet remains one of the least digitized sectors in global finance. SOAR gives investors
                early access to the startups building the infrastructure layer.
              </p>
              <div className="space-y-3 mb-6">
                {INVESTOR_HIGHLIGHTS.map((h) => (
                  <div key={h} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: gold }} />
                    <span className="text-[12px]" style={{ color: muted }}>{h}</span>
                  </div>
                ))}
              </div>
              <a href="#apply"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[11px] font-bold transition-all hover:opacity-90"
                style={{ background: gold, color: "#0B2D5B" }}>
                <Target className="w-3.5 h-3.5" /> Investor Inquiry
              </a>
            </div>
            <Panel isDark={isDark} className="p-6">
              <h3 className="text-sm font-bold mb-4" style={{ color: textColor }}>Market Snapshot</h3>
              <div className="space-y-4">
                {[
                  { l: "Annual Transaction Volume", v: "€50B+" },
                  { l: "Digitization Rate", v: "~15%" },
                  { l: "Active Aircraft (GA)", v: "350,000+" },
                  { l: "YoY Growth (EU)", v: "18%" },
                  { l: "ATI Standard Adoption", v: "Growing 3x QoQ" },
                ].map((row) => (
                  <div key={row.l} className="flex justify-between items-center pb-3"
                    style={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>
                    <span className="text-[11px]" style={{ color: muted }}>{row.l}</span>
                    <span className="text-[13px] font-black" style={{ color: textColor }}>{row.v}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="px-4 md:px-8 py-20"
        style={{ background: isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.2em] font-semibold mb-3" style={{ color: accent }}>PROCESS</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4" style={{ color: textColor }}>
              From Idea to Flight-Ready
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: "01", title: "Apply", desc: "Submit your aviation startup concept. We review within 14 days — looking for scalable, ATI-ecosystem-aligned ideas." },
              { step: "02", title: "Accelerate", desc: "Accepted startups receive credits, mentorship, API access, and integration support over a 12-week program." },
              { step: "03", title: "Launch", desc: "Graduate into the ABOS Marketplace with co-branding, investor introductions, and ongoing distribution support." },
            ].map((s, i) => (
              <div key={s.step} className="text-center relative">
                <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${accent}15`, border: `2px solid ${accent}30` }}>
                  <span className="text-lg font-black" style={{ color: accent }}>{s.step}</span>
                </div>
                <h3 className="text-sm font-bold mb-2" style={{ color: textColor }}>{s.title}</h3>
                <p className="text-[11px] leading-relaxed" style={{ color: muted }}>{s.desc}</p>
                {i < 2 && (
                  <div className="hidden sm:block absolute top-7 -right-2" style={{ color: accent }}>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ APPLICATION FORM ═══════════ */}
      <section id="apply" className="px-4 md:px-8 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-[10px] font-semibold tracking-wide"
            style={{ background: `${gold}15`, border: `1px solid ${gold}30`, color: gold }}>
            <Star className="w-3 h-3" /> Now Accepting Applications
          </div>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: textColor }}>
            Join SOAR
          </h2>
          <p className="text-sm mb-10 max-w-lg mx-auto" style={{ color: muted }}>
            Whether you're a founder with a vision or an investor seeking aviation tech exposure,
            we'd love to hear from you.
          </p>

          {submitted ? (
            <Panel isDark={isDark} className="p-8 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-4" style={{ color: "#22c55e" }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: textColor }}>Application Received</h3>
              <p className="text-sm" style={{ color: muted }}>
                Thank you for your interest in SOAR. Our team will review your submission
                and respond within 14 business days.
              </p>
            </Panel>
          ) : (
            <Panel isDark={isDark} className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
                    border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.1)",
                    color: textColor
                  }}
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                  style={{ background: accent, color: "#fff" }}>
                  <Send className="w-4 h-4" /> Apply Now
                </button>
              </form>
              <p className="text-[9px] mt-3" style={{ color: muted }}>
                By applying you agree to our{" "}
                <Link to="/terms-of-service" className="underline" style={{ color: accent }}>terms</Link>{" "}
                and{" "}
                <Link to="/privacy" className="underline" style={{ color: accent }}>privacy policy</Link>.
              </p>
            </Panel>
          )}
        </div>
      </section>

      {/* ═══════════ BRANDING ═══════════ */}
      <section className="px-4 md:px-8 py-16 text-center"
        style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: isDark ? "linear-gradient(135deg,#0A081E,#1a1040)" : "linear-gradient(135deg,#0B2D5B,#1A4A8A)" }}>
              <Plane className="w-5 h-5" style={{ color: isDark ? "#00f5ff" : "#fff" }} />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight" style={{ color: textColor }}>aircraftbuyorsell.com</p>
              <p className="text-[9px] tracking-wide" style={{ color: muted }}>powered by ABOS Group</p>
            </div>
          </div>
          <p className="text-[10px]" style={{ color: muted }}>
            SOAR Startup Hub is an initiative of ABOS MarketSpace — the European standard for aircraft transparency.
          </p>
        </div>
      </section>
    </div>
  );
}