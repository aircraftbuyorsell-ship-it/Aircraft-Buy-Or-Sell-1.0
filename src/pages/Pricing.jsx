import { useState } from "react";
import { CheckCircle2, XCircle, ShieldCheck, ArrowRight, ChevronRight } from "lucide-react";
import { useTheme } from "@/lib/useTheme";
import { Link } from "react-router-dom";

const TIERS = [
  {
    id: "t0", label: "T0 — Free", price: "EUR 0", cadence: "automatic, all listings",
    desc: "Baseline N-Reg compliance validation. Every listing gets it.",
    featured: false,
    features: [
      { ok: true,  text: "N-Reg validation vs FAA / EASA dataset" },
      { ok: true,  text: "ATI PASS badge on match" },
      { ok: true,  text: "Auto admin report on mismatch" },
      { ok: true,  text: "Immediate flag — zero human involvement" },
      { ok: false, text: "No ATI scoring" },
      { ok: false, text: "No valuation" },
    ],
    cta: "Included automatically", ctaVariant: "outline", link: null,
  },
  {
    id: "t1", label: "T1 — Starter", price: "EUR 29", cadence: "/month",
    desc: "ATI scoring and market valuation for active sellers.",
    featured: false,
    features: [
      { ok: true,  text: "Everything in T0" },
      { ok: true,  text: "ATI Quick Score (120-point)" },
      { ok: true,  text: "OMVM market valuation estimate" },
      { ok: true,  text: "PDF scorecard output" },
      { ok: true,  text: "Up to 10 listings / month" },
      { ok: false, text: "No .docx branded report" },
    ],
    cta: "Get started", ctaVariant: "outline", link: "/my-account",
  },
  {
    id: "t2", label: "T2 — Pro", price: "EUR 99", cadence: "/month",
    desc: "Full ATI report, white-label API, and unlimited listings.",
    featured: true, badge: "Most popular",
    features: [
      { ok: true, text: "Everything in T1" },
      { ok: true, text: "Full ATI Report (.docx branded)" },
      { ok: true, text: "White-label API account on ABOS" },
      { ok: true, text: "ITAR / AD / SB auto-flag" },
      { ok: true, text: "FAA + EASA registry cross-check" },
      { ok: true, text: "Unlimited listings" },
    ],
    cta: "Start Pro", ctaVariant: "gold", link: "/my-account",
  },
  {
    id: "t3", label: "T3 — Enterprise", price: "EUR 249", cadence: "/month",
    desc: "Dedicated API, custom branding, SLA, and compliance audit.",
    featured: false,
    features: [
      { ok: true, text: "Everything in T2" },
      { ok: true, text: "Dedicated ATI API endpoint" },
      { ok: true, text: "Custom branding + domain" },
      { ok: true, text: "SLA + priority support" },
      { ok: true, text: "Quarterly compliance audit report" },
      { ok: true, text: "Named account manager" },
    ],
    cta: "Contact sales", ctaVariant: "primary", link: "/contact",
  },
];

const ONE_TIME = [
  { label: "Implementation service", price: "EUR 749", trigger: "Billed at contract signing", desc: "Full API widget integration, onboarding, technical documentation, and setup support." },
  { label: "Risk identification milestone", price: "EUR 249", trigger: "Billed on dataset delivery", desc: "Complete risky-listing dataset with risk flags, severity classifications (CRITICAL/HIGH), and direct listing URLs." },
  { label: "White-label API account setup", price: "EUR 500", trigger: "Billed on API account activation", desc: "Creation and configuration of your white-label ATI API management account. Offer ATI under your own brand." },
];

const VERIFY_FLOW = [
  { label: "Listing submitted", sub: "seller on your platform", variant: "seller" },
  { label: "ABOS ATI engine",   sub: "N-reg extracted",         variant: "abos"   },
  { label: "FAA / EASA dataset",sub: "live cross-reference",    variant: "faa"    },
  { label: "Match result",      sub: "TRUE or FALSE",           variant: "result" },
];

const AFFILIATE_ROWS = [
  { tier: "T0 — Free",       price: "—",       abos: "—",   your: "—",   earn: "—"         },
  { tier: "T1 — Starter",    price: "EUR 29",  abos: "80%", your: "20%", earn: "EUR 5.80"  },
  { tier: "T2 — Pro",        price: "EUR 99",  abos: "80%", your: "20%", earn: "EUR 19.80" },
  { tier: "T3 — Enterprise", price: "EUR 249", abos: "80%", your: "20%", earn: "EUR 49.80" },
];

const NAVY = "#1B2A4A";
const GOLD = "#D4A017";

function CTAButton({ variant, children }) {
  const base = "w-full text-center py-2.5 px-4 rounded-xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-85 border-0 outline-none";
  const styles = {
    outline: { background: "transparent", color: NAVY, border: `1px solid ${NAVY}` },
    gold:    { background: GOLD, color: "#fff" },
    primary: { background: NAVY, color: "#fff" },
  };
  return <button className={base} style={styles[variant]}>{children}</button>;
}

export default function Pricing() {
  const isDark = useTheme();
  const textColor  = isDark ? "#e2e8f0" : "#1a1a1a";
  const mutedColor = isDark ? "rgba(255,255,255,0.55)" : "#555";
  const pageBg     = isDark ? "#0d1526" : "#f5f5f3";
  const cardBg     = isDark ? "rgba(18,28,52,0.95)" : "#fff";
  const cardBorder = isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #e0e0e0";

  return (
    <div className="min-h-screen" style={{ background: pageBg, color: textColor }}>
      <div className="text-center py-2 text-xs" style={{ background: NAVY, color: "#9baabb" }}>
        New:&nbsp;<strong style={{ color: GOLD }}>N-Reg Validation</strong>&nbsp;— automatic FAA/EASA dataset matching on every listing, free on all tiers
      </div>
      <header className="text-center py-12 px-6" style={{ background: NAVY }}>
        <p className="text-[10px] tracking-[0.2em] font-bold mb-2" style={{ color: GOLD }}>INTRAZONE — ATI PRICING</p>
        <h1 className="text-3xl font-bold text-white mb-3">Aircraft Transaction Intelligence</h1>
        <p className="text-sm max-w-xl mx-auto" style={{ color: "#c0ccdd" }}>
          Compliance, valuation, and fraud prevention for aviation marketplaces and individual aircraft buyers &amp; sellers.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {["FAA / EASA registry integrated", "ITAR auto-flag", "White-label API", "Fraud-proof N-Reg validation"].map((badge) => (
            <span key={badge} className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}40` }}>{badge}</span>
          ))}
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <p className="text-center text-sm font-medium mb-8" style={{ color: mutedColor }}>Subscription tiers</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map((tier) => (
            <div key={tier.id} className="rounded-2xl p-5 relative flex flex-col"
              style={{ background: tier.featured ? `${GOLD}10` : cardBg, border: tier.featured ? `2px solid ${GOLD}` : cardBorder }}>
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full text-white" style={{ background: GOLD }}>{tier.badge}</span>
                </div>
              )}
              <p className="text-[10px] tracking-[0.15em] font-bold uppercase mb-2" style={{ color: mutedColor }}>{tier.label}</p>
              <p className="text-3xl font-black" style={{ color: NAVY }}>{tier.price}</p>
              <p className="text-xs mb-3" style={{ color: mutedColor }}>{tier.cadence}</p>
              <p className="text-xs mb-4 min-h-[36px]" style={{ color: mutedColor }}>{tier.desc}</p>
              <ul className="flex-1 space-y-1 mb-5">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs py-1 border-b last:border-0"
                    style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "#f0f0f0" }}>
                    {f.ok
                      ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#1D9E75" }} />
                      : <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#ccc" }} />}
                    <span style={{ color: f.ok ? textColor : mutedColor }}>{f.text}</span>
                  </li>
                ))}
              </ul>
              {tier.link ? (
                <Link to={tier.link}><CTAButton variant={tier.ctaVariant}>{tier.cta}</CTAButton></Link>
              ) : (
                <CTAButton variant={tier.ctaVariant}>{tier.cta}</CTAButton>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 px-4" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f5f5f3" }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm font-medium mb-1" style={{ color: mutedColor }}>One-time implementation fees</p>
          <p className="text-center text-xs mb-8" style={{ color: mutedColor }}>For marketplace platform partners integrating IntraZone via API</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ONE_TIME.map((item) => (
              <div key={item.label} className="rounded-2xl p-5" style={{ background: cardBg, border: cardBorder }}>
                <p className="text-[10px] tracking-[0.15em] font-bold uppercase mb-2" style={{ color: mutedColor }}>{item.label}</p>
                <p className="text-2xl font-black mb-1" style={{ color: NAVY }}>{item.price}</p>
                <p className="text-[10px] font-medium mb-3" style={{ color: GOLD }}>{item.trigger}</p>
                <p className="text-xs leading-relaxed" style={{ color: mutedColor }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl px-5 py-4 mt-4 flex justify-between items-center" style={{ background: NAVY }}>
            <span className="text-sm" style={{ color: "#9baabb" }}>Total one-time package (all three items)</span>
            <span className="text-xl font-black" style={{ color: GOLD }}>EUR 1,498</span>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-center text-sm font-medium mb-1" style={{ color: mutedColor }}>N-Reg validation — how it works</p>
        <p className="text-center text-xs mb-8" style={{ color: mutedColor }}>Autonomous, binary, fraud-proof. No human decision-making in the loop.</p>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 justify-center flex-wrap">
          {VERIFY_FLOW.map((node, i) => {
            const s = { seller: { background: "#edf0f5", color: NAVY }, abos: { background: NAVY, color: "#fff" }, faa: { background: "#eaf3de", color: "#27500a" }, result: { background: cardBg, color: "#444", border: cardBorder } };
            return (
              <div key={node.label} className="flex items-center gap-2">
                <div className="rounded-xl px-4 py-3 text-center min-w-[110px]" style={s[node.variant]}>
                  <p className="text-[11px] font-bold">{node.label}</p>
                  <p className="text-[9px] opacity-70 mt-0.5">{node.sub}</p>
                </div>
                {i < VERIFY_FLOW.length - 1 && <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#ccc" }} />}
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="rounded-2xl p-5" style={{ background: "#eaf3de", border: "1px solid #97c459" }}>
            <p className="text-sm font-bold mb-3" style={{ color: "#27500a" }}>N-Reg match = TRUE → ATI PASS</p>
            {["Registration confirmed in FAA / EASA dataset","ATI PASS badge displayed on listing","Airworthiness verifiable by any buyer","Seller eligible for paid T1 / T2 / T3 upgrade"].map((item) => (
              <p key={item} className="text-xs py-1.5 border-b last:border-0" style={{ color: "#444", borderColor: "rgba(0,0,0,0.08)" }}>{item}</p>
            ))}
          </div>
          <div className="rounded-2xl p-5" style={{ background: "#fcebeb", border: "1px solid #f09595" }}>
            <p className="text-sm font-bold mb-3" style={{ color: "#791f1f" }}>N-Reg match = FALSE → Admin report</p>
            {["No matching registration found in dataset","Automatic report generated instantly","Platform owner notified directly","Zero ABOS influence on this outcome"].map((item, i) => (
              <p key={item} className={`text-xs py-1.5 border-b last:border-0 ${i===3?"font-bold":""}`} style={{ color: i===3?"#a32d2d":"#444", borderColor: "rgba(0,0,0,0.08)" }}>{item}</p>
            ))}
          </div>
        </div>
        <div className="rounded-2xl p-5 text-sm leading-relaxed" style={{ background: NAVY, color: "#c0ccdd" }}>
          <strong style={{ color: GOLD }}>Structurally fraud-proof:</strong> Affiliate revenue flows from end customer → ABOS → platform partner. The N-Reg validation outcome is computed exclusively against official FAA/EASA registry data. Compliant with EU Digital Services Act requirements for platform compliance mechanisms.
        </div>
      </section>

      <section className="py-12 px-4" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f5f5f3" }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-sm font-medium mb-1" style={{ color: mutedColor }}>Affiliate revenue share — for platform partners</p>
          <p className="text-center text-xs mb-8" style={{ color: mutedColor }}>Earn a passive revenue share on every subscription or report generated through your platform</p>
          <div className="overflow-x-auto rounded-2xl" style={{ border: cardBorder }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: NAVY, color: "#fff" }}>
                  {["Tier","Monthly price","ABOS share","Your share","Your earn per user/mo"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AFFILIATE_ROWS.map((row) => (
                  <tr key={row.tier} style={{ borderBottom: "1px solid #eee", background: cardBg }}>
                    <td className="px-4 py-3 text-xs">{row.tier}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: mutedColor }}>{row.price}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: mutedColor }}>{row.abos}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: mutedColor }}>{row.your}</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: GOLD }}>{row.earn}</td>
                  </tr>
                ))}
                <tr style={{ background: `${GOLD}10` }}>
                  <td className="px-4 py-3 text-xs font-bold" colSpan={4} style={{ color: textColor }}>Example: 50 Pro subscribers via your platform</td>
                  <td className="px-4 py-3 text-sm font-black" style={{ color: GOLD }}>EUR 990 / month</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="text-center py-8 px-4 text-xs" style={{ background: NAVY, color: "#9baabb" }}>
        <p className="mb-1"><strong className="text-white">IntraZone</strong> — powered by <Link to="/" style={{ color: GOLD }}>Aircraft Buy Or Sell (ABOS)</Link></p>
        <p>Aviation intelligence since 2021 · 270,000+ member community · FAA / EASA / ITAR compliant</p>
      </footer>
    </div>
  );
}