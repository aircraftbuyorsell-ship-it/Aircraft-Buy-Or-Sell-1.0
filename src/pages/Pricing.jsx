import { CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const INK   = "#04060a";
const INK1  = "#0d1117";
const AMBER = "#f5c242";
const TEAL  = "#5dcaa5";
const BLUE  = "#4e8ef7";
const W1    = "rgba(255,255,255,0.90)";
const W2    = "rgba(255,255,255,0.60)";
const W3    = "rgba(255,255,255,0.35)";
const BORDER = "rgba(255,255,255,0.08)";

const TIERS = [
  {
    id: "t0", label: "T0 — Free", price: "€0", cadence: "automatic, all listings", accent: "gray",
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
    cta: "Included automatically", ctaVariant: "ghost", link: null,
  },
  {
    id: "t1", label: "T1 — Starter", price: "€29", cadence: "/month", accent: "amber",
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
    cta: "Get started", ctaVariant: "ghost", link: "/my-account",
  },
  {
    id: "t2", label: "T2 — Pro", price: "€99", cadence: "/month", accent: "amber",
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
    cta: "Start Pro", ctaVariant: "amber", link: "/my-account",
  },
  {
    id: "t3", label: "T3 — Enterprise", price: "€249", cadence: "/month", accent: "blue",
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
    cta: "Contact sales", ctaVariant: "ghost", link: "/contact",
  },
];

const ONE_TIME = [
  { label: "Implementation service", price: "€749", trigger: "Billed at contract signing", desc: "Full API widget integration, onboarding, technical documentation, and setup support." },
  { label: "Risk identification milestone", price: "€249", trigger: "Billed on dataset delivery", desc: "Complete risky-listing dataset with risk flags, severity classifications (CRITICAL/HIGH), and direct listing URLs." },
  { label: "White-label API account setup", price: "€500", trigger: "Billed on API account activation", desc: "Creation and configuration of your white-label ATI API management account. Offer ATI under your own brand." },
];

const VERIFY_FLOW = [
  { label: "Listing submitted", sub: "seller on your platform", color: W3 },
  { label: "ABOS ATI engine",   sub: "N-reg extracted",         color: AMBER },
  { label: "FAA / EASA dataset",sub: "live cross-reference",    color: TEAL },
  { label: "Match result",      sub: "TRUE or FALSE",           color: W2 },
];

const AFFILIATE_ROWS = [
  { tier: "T0 — Free",       price: "—",    abos: "—",   your: "—",   earn: "—"      },
  { tier: "T1 — Starter",    price: "€29",  abos: "80%", your: "20%", earn: "€5.80"  },
  { tier: "T2 — Pro",        price: "€99",  abos: "80%", your: "20%", earn: "€19.80" },
  { tier: "T3 — Enterprise", price: "€249", abos: "80%", your: "20%", earn: "€49.80" },
];

const ACCENTS = {
  gray:  { line: BORDER,                      chip: { bg: "rgba(255,255,255,0.06)", color: W3,    border: BORDER }                  },
  amber: { line: AMBER,                       chip: { bg: "rgba(245,194,66,0.09)",  color: AMBER, border: "rgba(245,194,66,0.22)" } },
  teal:  { line: "rgba(93,202,165,0.55)",     chip: { bg: "rgba(93,202,165,0.09)",  color: TEAL,  border: "rgba(93,202,165,0.20)" } },
  blue:  { line: "rgba(78,142,247,0.55)",     chip: { bg: "rgba(78,142,247,0.09)",  color: BLUE,  border: "rgba(78,142,247,0.20)" } },
};

function CTAButton({ variant, children }) {
  const styles = {
    amber: { background: AMBER, color: INK, border: "none" },
    ghost: { background: "transparent", color: W2, border: `0.5px solid ${BORDER}` },
  };
  return (
    <button
      className="w-full text-center py-2.5 px-4 rounded-lg text-[13px] font-semibold cursor-pointer transition-opacity hover:opacity-85 outline-none"
      style={{ letterSpacing: "-0.01em", ...styles[variant] }}
    >
      {children}
    </button>
  );
}

const eyebrow = { fontSize: "9px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: W3 };

export default function Pricing() {
  return (
    <div style={{ background: INK, backgroundImage: "radial-gradient(ellipse at 8% 12%, rgba(245,194,66,0.14) 0%, transparent 52%), radial-gradient(ellipse at 92% 88%, rgba(93,202,165,0.12) 0%, transparent 52%), radial-gradient(ellipse at 85% 8%, rgba(78,142,247,0.07) 0%, transparent 40%), radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)", backgroundSize: "100% 100%, 100% 100%, 100% 100%, 24px 24px", minHeight: "100vh", color: W1, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif", position: "relative" }}>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-8deg)", opacity: 0.055, pointerEvents: "none", zIndex: 0 }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 172 106" width="480" height="296">
          <defs>
            <marker id="wm-arr" markerWidth="9" markerHeight="9" refX="8.5" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
              <polygon points="0,0 9,4.5 0,9" fill="white" />
            </marker>
          </defs>
          <polyline points="2,98 52,8 70,98" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <polyline points="70,98 86,48 102,70 122,14 140,80 156,57" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" markerEnd="url(#wm-arr)" />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="text-center py-2 text-[11px]" style={{ background: "rgba(255,255,255,0.04)", color: W2, borderBottom: `0.5px solid ${BORDER}` }}>
          New:&nbsp;<strong style={{ color: AMBER }}>N-Reg Validation</strong>&nbsp;— automatic FAA/EASA dataset matching on every listing, free on all tiers
        </div>

        <header className="text-center py-12 px-6">
          <p style={{ ...eyebrow, color: AMBER }} className="mb-2">INTRAZONE — ATI PRICING</p>
          <h1 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 500, letterSpacing: "-0.04em", color: W1, margin: 0 }}>Aircraft Transaction Intelligence</h1>
          <p className="text-[14px] max-w-xl mx-auto mt-3" style={{ color: W2 }}>
            Compliance, valuation, and fraud prevention for aviation marketplaces and individual aircraft buyers &amp; sellers.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {["FAA / EASA registry integrated", "ITAR auto-flag", "White-label API", "Fraud-proof N-Reg validation"].map((badge) => (
              <span key={badge} className="text-[11px] px-3 py-1 rounded-full font-semibold"
                style={{ background: "rgba(245,194,66,0.09)", color: AMBER, border: "0.5px solid rgba(245,194,66,0.22)" }}>{badge}</span>
            ))}
          </div>
        </header>

        {/* Tiers */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <p style={eyebrow} className="text-center mb-8">Subscription tiers</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {TIERS.map((tier) => {
              const a = ACCENTS[tier.accent];
              return (
                <div key={tier.id} className="rounded-xl relative flex flex-col overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.04)", border: `0.5px solid ${BORDER}`, boxShadow: tier.featured ? "0 12px 40px rgba(0,0,0,0.65), 0 0 0 0.5px rgba(255,255,255,0.10)" : "0 1px 3px rgba(0,0,0,0.35)" }}>
                  <div style={{ height: "2px", background: a.line }} />
                  <div className="p-5 flex flex-col flex-1">
                    {tier.badge && (
                      <span className="self-start text-[9px] font-bold px-2.5 py-1 rounded-full mb-3" style={{ background: a.chip.bg, color: a.chip.color, border: `0.5px solid ${a.chip.border}`, letterSpacing: "0.08em", textTransform: "uppercase" }}>{tier.badge}</span>
                    )}
                    <p style={{ ...eyebrow }} className="mb-2">{tier.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span style={{ fontSize: "32px", fontWeight: 500, letterSpacing: "-0.04em", color: W1 }}>{tier.price}</span>
                      <span style={{ fontSize: "13px", color: W3 }}>{tier.cadence}</span>
                    </div>
                    <p className="text-[12px] mt-3 mb-4 min-h-[36px]" style={{ color: W2 }}>{tier.desc}</p>
                    <ul className="flex-1 mb-5">
                      {tier.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-[13px] py-1.5" style={{ borderBottom: `0.5px solid ${BORDER}` }}>
                          {f.ok
                            ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: tier.accent === "gray" ? TEAL : a.chip.color }} />
                            : <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: W3 }} />}
                          <span style={{ color: f.ok ? W2 : W3 }}>{f.text}</span>
                        </li>
                      ))}
                    </ul>
                    {tier.link ? (
                      <Link to={tier.link}><CTAButton variant={tier.ctaVariant}>{tier.cta}</CTAButton></Link>
                    ) : (
                      <CTAButton variant={tier.ctaVariant}>{tier.cta}</CTAButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* One-time fees */}
        <section className="py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <p style={eyebrow} className="text-center mb-1">One-time implementation fees</p>
            <p className="text-center text-[12px] mb-8" style={{ color: W3 }}>For marketplace platform partners integrating IntraZone via API</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ONE_TIME.map((item) => (
                <div key={item.label} className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: `0.5px solid ${BORDER}` }}>
                  <div style={{ height: "2px", background: AMBER }} />
                  <div className="p-5">
                    <p style={eyebrow} className="mb-2">{item.label}</p>
                    <p style={{ fontSize: "24px", fontWeight: 600, letterSpacing: "-0.03em", color: W1 }} className="mb-1">{item.price}</p>
                    <p className="text-[10px] font-semibold mb-3" style={{ color: AMBER }}>{item.trigger}</p>
                    <p className="text-[12px] leading-relaxed" style={{ color: W2 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl px-5 py-4 mt-4 flex justify-between items-center" style={{ background: "rgba(245,194,66,0.06)", border: `0.5px solid rgba(245,194,66,0.22)` }}>
              <span className="text-[13px]" style={{ color: W2 }}>Total one-time package (all three items)</span>
              <span style={{ fontSize: "20px", fontWeight: 600, letterSpacing: "-0.03em", color: AMBER }}>€1,498</span>
            </div>
          </div>
        </section>

        {/* N-Reg flow */}
        <section className="max-w-4xl mx-auto px-4 py-10">
          <p style={eyebrow} className="text-center mb-1">N-Reg validation — how it works</p>
          <p className="text-center text-[12px] mb-8" style={{ color: W3 }}>Autonomous, binary, fraud-proof. No human decision-making in the loop.</p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 justify-center flex-wrap">
            {VERIFY_FLOW.map((node, i) => (
              <div key={node.label} className="flex items-center gap-2">
                <div className="rounded-lg px-4 py-3 text-center min-w-[110px]" style={{ background: "rgba(255,255,255,0.04)", border: `0.5px solid ${BORDER}`, borderLeft: `3px solid ${node.color}` }}>
                  <p className="text-[11px] font-semibold" style={{ color: W1 }}>{node.label}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: W3 }}>{node.sub}</p>
                </div>
                {i < VERIFY_FLOW.length - 1 && <ChevronRight className="w-4 h-4 shrink-0" style={{ color: W3 }} />}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(93,202,165,0.06)", border: `0.5px solid rgba(93,202,165,0.20)` }}>
              <div style={{ height: "2px", background: TEAL }} />
              <div className="p-5">
                <p className="text-[13px] font-semibold mb-3" style={{ color: TEAL }}>N-Reg match = TRUE → ATI PASS</p>
                {["Registration confirmed in FAA / EASA dataset","ATI PASS badge displayed on listing","Airworthiness verifiable by any buyer","Seller eligible for paid T1 / T2 / T3 upgrade"].map((item) => (
                  <p key={item} className="text-[12px] py-1.5" style={{ color: W2, borderBottom: `0.5px solid ${BORDER}` }}>{item}</p>
                ))}
              </div>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(226,75,74,0.06)", border: `0.5px solid rgba(226,75,74,0.22)` }}>
              <div style={{ height: "2px", background: "#e24b4a" }} />
              <div className="p-5">
                <p className="text-[13px] font-semibold mb-3" style={{ color: "#e24b4a" }}>N-Reg match = FALSE → Admin report</p>
                {["No matching registration found in dataset","Automatic report generated instantly","Platform owner notified directly","Zero ABOS influence on this outcome"].map((item, i) => (
                  <p key={item} className="text-[12px] py-1.5" style={{ color: i === 3 ? "#e24b4a" : W2, fontWeight: i === 3 ? 600 : 400, borderBottom: `0.5px solid ${BORDER}` }}>{item}</p>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-xl p-5 text-[13px] leading-relaxed" style={{ background: "rgba(255,255,255,0.04)", border: `0.5px solid ${BORDER}`, color: W2 }}>
            <strong style={{ color: AMBER }}>Structurally fraud-proof:</strong> Affiliate revenue flows from end customer → ABOS → platform partner. The N-Reg validation outcome is computed exclusively against official FAA/EASA registry data. Compliant with EU Digital Services Act requirements for platform compliance mechanisms.
          </div>
        </section>

        {/* Affiliate table */}
        <section className="py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <p style={eyebrow} className="text-center mb-1">Affiliate revenue share — for platform partners</p>
            <p className="text-center text-[12px] mb-8" style={{ color: W3 }}>Earn a passive revenue share on every subscription or report generated through your platform</p>
            <div className="overflow-hidden rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: `0.5px solid ${BORDER}` }}>
              <div style={{ height: "2px", background: "linear-gradient(90deg, transparent 5%, rgba(245,194,66,0.40) 50%, transparent 95%)" }} />
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: `0.5px solid ${BORDER}` }}>
                      {["Tier","Monthly price","ABOS share","Your share","Your earn / user / mo"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left" style={{ ...eyebrow }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {AFFILIATE_ROWS.map((row) => (
                      <tr key={row.tier} style={{ borderBottom: `0.5px solid ${BORDER}` }}>
                        <td className="px-4 py-3" style={{ color: W1 }}>{row.tier}</td>
                        <td className="px-4 py-3" style={{ color: W2 }}>{row.price}</td>
                        <td className="px-4 py-3" style={{ color: W2 }}>{row.abos}</td>
                        <td className="px-4 py-3" style={{ color: W2 }}>{row.your}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: AMBER }}>{row.earn}</td>
                      </tr>
                    ))}
                    <tr style={{ background: "rgba(245,194,66,0.06)" }}>
                      <td className="px-4 py-3 font-semibold" colSpan={4} style={{ color: W1 }}>Example: 50 Pro subscribers via your platform</td>
                      <td className="px-4 py-3" style={{ fontSize: "15px", fontWeight: 600, color: AMBER }}>€990 / mo</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <footer className="text-center py-8 px-4 text-[12px]" style={{ borderTop: `0.5px solid ${BORDER}`, color: W3 }}>
          <p className="mb-1"><strong style={{ color: W1 }}>IntraZone</strong> — powered by <Link to="/" style={{ color: AMBER }}>Aircraft Buy Or Sell (ABOS)</Link></p>
          <p>Aviation intelligence since 2021 · 270,000+ member community · FAA / EASA / ITAR compliant</p>
        </footer>
      </div>
    </div>
  );
}