import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/useTheme";
import { Link, useNavigate } from "react-router-dom";
import AviationNewsTicker from "@/components/newsletter/AviationNewsTicker";
import Globe from "@/components/Globe";
import GlobeLayerFilter, { DEFAULT_FILTER } from "@/components/dashboard/GlobeLayerFilter";
import SubscriptionBadge from "@/components/dashboard/SubscriptionBadge";
import QuickAccessStrip from "@/components/dashboard/QuickAccessStrip";
import NotificationStack from "@/components/notifications/NotificationStack";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
import {
  GlobeIcon, Lock, Zap, ArrowRight, CheckCircle2, ShieldCheck,
  FileText, Download, TrendingUp, Calculator, BarChart3,
  Plane, Users, Building2, UserCheck, ChevronRight, Clock
} from "lucide-react";

const VERIFY_STEPS = [
  { label: "N-Reg", sub: "FAA / EASA registry", color: "#00c2cb" },
  { label: "Owner / Operator", sub: "name + address match", color: "#22c55e" },
  { label: "Dealer DB", sub: "ABOS dealer cross-ref", color: "#a855f7" },
  { label: "AW / AD / SD / STC", sub: "compliance flags", color: "#f48120" },
  { label: "Damage History", sub: "incident & accident", color: "#ef4444" },
];

const USER_CATEGORIES = [
  { icon: Users,     label: "Private Buyer",   color: "#00c2cb", desc: "Individual purchase intent" },
  { icon: Plane,     label: "Private Seller",  color: "#22c55e", desc: "Single aircraft listing"    },
  { icon: Building2, label: "Dealer / Broker", color: "#f48120", desc: "Verified dealer account"   },
  { icon: UserCheck, label: "Operator / FBO",  color: "#D4A017", desc: "Fleet or charter context"   },
];

const UPSELL_HOOKS = [
  { icon: FileText,   label: "ATI Score Report",  desc: "Full 8-dimension PDF scorecard",           link: "/ati-full-report", color: "#E8A83A" },
  { icon: Download,   label: "Export PDF",         desc: "Download branded .pdf or .docx",          link: "/ati-full-report", color: "#a855f7" },
  { icon: TrendingUp, label: "OMVM Price Check",   desc: "Off-Market Valuation Model — real comps", link: "/valuation",       color: "#22c55e" },
  { icon: Calculator, label: "OPEX Calculator",    desc: "Total cost of ownership breakdown",        link: "/opex-calculator", color: "#f97316" },
  { icon: BarChart3,  label: "CAPEX Analysis",     desc: "Investment & acquisition cost modelling",  link: "/opex-calculator", color: "#00c2cb" },
];

export default function Dashboard() {
  const isDark = useTheme();
  const navigate = useNavigate();
  const [globeFilter, setGlobeFilter] = useState(DEFAULT_FILTER);
  const [focusLocation, setFocusLocation] = useState(null);

  const { data: listings = [] } = useQuery({
    queryKey: ["listings-active"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }, "-created_date", 200),
    staleTime: 30000,
  });

  const textColor    = isDark ? "#e2e8f0" : "#1a1a1a";
  const mutedColor   = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)";
  const accentOrange = "#f48120";
  const accentGold   = "#D4A017";
  const accentCyan   = "#00c2cb";

  const glass = (alpha = 0.78) =>
    isDark ? `rgba(10,18,36,${alpha})` : `rgba(230,240,255,${alpha})`;
  const glassBorder = isDark
    ? "1px solid rgba(0,180,255,0.13)"
    : "1px solid rgba(37,99,235,0.10)";

  return (
    <div className="min-h-screen relative" style={{ background: "transparent" }}>
      <NotificationStack />
      <NotificationCenter />

      <div className="relative z-10">

        {/* ── GLOBE SECTION ── */}
        <section className="px-4 md:px-8 pt-6 pb-4">
          <div className="max-w-6xl mx-auto">
            <div className="relative">
              <div className="w-full" style={{ maxHeight: "520px", aspectRatio: "1 / 1" }}>
                <Globe
                  listings={listings}
                  filter={globeFilter}
                  focusLocation={focusLocation}
                />
              </div>
              <div className="absolute top-3 right-3 z-20">
                <GlobeLayerFilter filter={globeFilter} onChange={setGlobeFilter} />
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 md:px-8 pb-3">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-[10px] tracking-[0.18em] font-bold" style={{ color: accentOrange }}>
                  A.B.O.S — AIRCRAFT BUY OR SELL
                </p>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight mt-0.5" style={{ color: textColor }}>
                  Aviation Intelligence Platform
                </h1>
              </div>
              <SubscriptionBadge />
            </div>
            <div className="mt-3"><AviationNewsTicker /></div>
          </div>
        </section>

        <section className="px-4 md:px-8 pb-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-[9px] tracking-[0.22em] font-bold text-center mb-4" style={{ color: mutedColor }}>
              SELECT YOUR ENTRY POINT
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <Link to="/listings">
                <div className="rounded-2xl p-5 cursor-pointer group hover:scale-[1.02] transition-all duration-200 relative overflow-hidden"
                  style={{ background: glass(0.82), border: `1.5px solid ${accentOrange}40`, backdropFilter: "blur(28px) saturate(180%)", WebkitBackdropFilter: "blur(28px) saturate(180%)", boxShadow: `0 0 32px ${accentOrange}18` }}>
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: `radial-gradient(ellipse at 50% 0%, ${accentOrange}10 0%, transparent 70%)` }} />
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${accentOrange}18`, border: `1px solid ${accentOrange}40` }}>
                      <GlobeIcon className="w-5 h-5" style={{ color: accentOrange }} />
                    </div>
                    <div>
                      <p className="text-[9px] tracking-[0.2em] font-bold" style={{ color: accentOrange }}>PUBLIC ACCESS</p>
                      <p className="text-base font-black tracking-tight mt-0.5" style={{ color: textColor }}>MarketSpace</p>
                    </div>
                  </div>
                  <p className="text-[12px] leading-relaxed mb-4" style={{ color: mutedColor }}>
                    Browse aircraft listings, verify N-Reg, check AD/SB compliance status — no account required.
                  </p>
                  <div className="space-y-1.5 mb-4">
                    {["N-Reg instant lookup", "Active listings globe", "ATI Quick Score", "Deal Radar"].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: accentOrange }} />
                        <span className="text-[11px]" style={{ color: mutedColor }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold" style={{ color: accentOrange }}>
                    Enter MarketSpace <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              <Link to="/pricing">
                <div className="rounded-2xl p-5 cursor-pointer group hover:scale-[1.02] transition-all duration-200 relative overflow-hidden"
                  style={{ background: glass(0.85), border: `1.5px solid ${accentGold}55`, backdropFilter: "blur(28px) saturate(180%)", WebkitBackdropFilter: "blur(28px) saturate(180%)", boxShadow: `0 0 36px ${accentGold}22` }}>
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: `radial-gradient(ellipse at 50% 0%, ${accentGold}14 0%, transparent 70%)` }} />
                  <div className="absolute top-3 right-3">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${accentGold}22`, color: accentGold, border: `1px solid ${accentGold}40` }}>
                      Starter · Pro · Enterprise
                    </span>
                  </div>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${accentGold}18`, border: `1px solid ${accentGold}45` }}>
                      <Lock className="w-5 h-5" style={{ color: accentGold }} />
                    </div>
                    <div>
                      <p className="text-[9px] tracking-[0.2em] font-bold" style={{ color: accentGold }}>AUTHENTICATED WORKSPACE</p>
                      <p className="text-base font-black tracking-tight mt-0.5" style={{ color: textColor }}>IntraZone</p>
                    </div>
                  </div>
                  <p className="text-[12px] leading-relaxed mb-4" style={{ color: mutedColor }}>
                    Full ATI scoring, OMVM valuation, deal pipeline, verified identity, and API access for platforms.
                  </p>
                  <div className="space-y-1.5 mb-4">
                    {["Full ATI Report (.docx)", "OMVM Market Valuation", "User verification + ABOS ID", "White-label API (T2/T3)"].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: accentGold }} />
                        <span className="text-[11px]" style={{ color: mutedColor }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold" style={{ color: accentGold }}>
                    View Plans — from €29/mo <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              <Link to="/ati-quick-score">
                <div className="rounded-2xl p-5 cursor-pointer group hover:scale-[1.02] transition-all duration-200 relative overflow-hidden"
                  style={{ background: glass(0.80), border: `1.5px solid ${accentCyan}35`, backdropFilter: "blur(28px) saturate(180%)", WebkitBackdropFilter: "blur(28px) saturate(180%)", boxShadow: `0 0 28px ${accentCyan}14` }}>
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: `radial-gradient(ellipse at 50% 0%, ${accentCyan}10 0%, transparent 70%)` }} />
                  <div className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${accentCyan}18`, color: accentCyan, border: `1px solid ${accentCyan}35` }}>
                    <Clock className="w-2.5 h-2.5" /> 30 min
                  </div>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${accentCyan}18`, border: `1px solid ${accentCyan}35` }}>
                      <Zap className="w-5 h-5" style={{ color: accentCyan }} />
                    </div>
                    <div>
                      <p className="text-[9px] tracking-[0.2em] font-bold" style={{ color: accentCyan }}>NO ACCOUNT NEEDED</p>
                      <p className="text-base font-black tracking-tight mt-0.5" style={{ color: textColor }}>Free DEMO</p>
                    </div>
                  </div>
                  <p className="text-[12px] leading-relaxed mb-4" style={{ color: mutedColor }}>
                    Try ATI scoring with sample aircraft data. Demo account, demo statistics, example case studies. 30-minute session.
                  </p>
                  <div className="space-y-1.5 mb-4">
                    {["Demo ATI Quick Score", "Sample valuation data", "Example case studies", "No credit card required"].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: accentCyan }} />
                        <span className="text-[11px]" style={{ color: mutedColor }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold" style={{ color: accentCyan }}>
                    Try DEMO now — free <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>

            </div>
          </div>
        </section>

        <section className="px-4 md:px-8 pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl p-4 md:p-5"
              style={{ background: glass(0.80), border: glassBorder, backdropFilter: "blur(28px) saturate(180%)", WebkitBackdropFilter: "blur(28px) saturate(180%)" }}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <p className="text-[9px] tracking-[0.22em] font-bold" style={{ color: accentOrange }}>AIRCRAFT VERIFICATION PIPELINE</p>
                  <p className="text-[12px] mt-0.5" style={{ color: mutedColor }}>Verify ADs · SDs · AWs · STC · Damage History · Log &amp; Docs completeness</p>
                </div>
                <Link to="/ati-verify">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                    style={{ background: `${accentOrange}18`, color: accentOrange, border: `1px solid ${accentOrange}35` }}>
                    <ShieldCheck className="w-3.5 h-3.5" /> Start Verification
                  </div>
                </Link>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {VERIFY_STEPS.map((step, i) => (
                  <div key={step.label} className="flex items-center gap-2 shrink-0">
                    <div className="rounded-xl px-3 py-2 text-center"
                      style={{ background: `${step.color}12`, border: `1px solid ${step.color}30` }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <CheckCircle2 className="w-3 h-3" style={{ color: step.color }} />
                        <span className="text-[10px] font-black" style={{ color: step.color }}>{step.label}</span>
                      </div>
                      <p className="text-[9px]" style={{ color: mutedColor }}>{step.sub}</p>
                    </div>
                    {i < VERIFY_STEPS.length - 1 && (
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: mutedColor, opacity: 0.5 }} />
                    )}
                  </div>
                ))}
                <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: mutedColor, opacity: 0.5 }} />
                <div className="rounded-xl px-3 py-2 shrink-0 text-center"
                  style={{ background: `${accentGold}14`, border: `1.5px solid ${accentGold}45` }}>
                  <p className="text-[10px] font-black" style={{ color: accentGold }}>ATI CARD</p>
                  <p className="text-[9px]" style={{ color: mutedColor }}>identity + docs</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: mutedColor, opacity: 0.5 }} />
                <div className="rounded-xl px-3 py-2 shrink-0 text-center"
                  style={{ background: "rgba(34,197,94,0.12)", border: "1.5px solid rgba(34,197,94,0.4)" }}>
                  <ShieldCheck className="w-4 h-4 mx-auto mb-0.5" style={{ color: "#22c55e" }} />
                  <p className="text-[10px] font-black" style={{ color: "#22c55e" }}>ATI PASS</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 md:px-8 pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl p-4 md:p-5"
              style={{ background: glass(0.76), border: glassBorder, backdropFilter: "blur(28px) saturate(180%)", WebkitBackdropFilter: "blur(28px) saturate(180%)" }}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <p className="text-[9px] tracking-[0.22em] font-bold" style={{ color: accentGold }}>ABOS USER IDENTITY</p>
                  <p className="text-[12px] mt-0.5" style={{ color: mutedColor }}>Get your ABOS ID — verified via LOI, contracts &amp; purchase agreements</p>
                </div>
                <Link to="/my-account">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                    style={{ background: `${accentGold}18`, color: accentGold, border: `1px solid ${accentGold}40` }}>
                    <UserCheck className="w-3.5 h-3.5" /> Get Verified
                  </div>
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {USER_CATEGORIES.map((cat) => (
                  <div key={cat.label} className="rounded-xl p-3"
                    style={{ background: `${cat.color}10`, border: `1px solid ${cat.color}28` }}>
                    <cat.icon className="w-4 h-4 mb-1.5" style={{ color: cat.color }} />
                    <p className="text-[11px] font-bold" style={{ color: cat.color }}>{cat.label}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: mutedColor }}>{cat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 md:px-8 pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl p-4 md:p-5"
              style={{ background: glass(0.80), border: glassBorder, backdropFilter: "blur(28px) saturate(180%)", WebkitBackdropFilter: "blur(28px) saturate(180%)" }}>
              <p className="text-[9px] tracking-[0.22em] font-bold mb-3 text-center" style={{ color: accentOrange }}>AVIATION TOOLS</p>
              <QuickAccessStrip />
            </div>
          </div>
        </section>

        <section className="px-4 md:px-8 pb-10">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl p-4 md:p-5"
              style={{ background: glass(0.74), border: glassBorder, backdropFilter: "blur(28px) saturate(180%)", WebkitBackdropFilter: "blur(28px) saturate(180%)" }}>
              <p className="text-[9px] tracking-[0.22em] font-bold mb-1 text-center" style={{ color: mutedColor }}>GENERATE · EXPORT · ANALYSE</p>
              <p className="text-[11px] text-center mb-4" style={{ color: mutedColor }}>After verification, unlock the full intelligence layer</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {UPSELL_HOOKS.map((hook) => (
                  <Link key={hook.label} to={hook.link}>
                    <div className="rounded-xl p-3 cursor-pointer group hover:scale-[1.02] transition-transform"
                      style={{ background: `${hook.color}10`, border: `1px solid ${hook.color}28` }}>
                      <hook.icon className="w-4 h-4 mb-2" style={{ color: hook.color }} />
                      <p className="text-[10px] font-black leading-tight" style={{ color: hook.color }}>{hook.label}</p>
                      <p className="text-[9px] mt-1 leading-relaxed" style={{ color: mutedColor }}>{hook.desc}</p>
                      <div className="flex items-center gap-0.5 mt-2 text-[9px] font-bold" style={{ color: hook.color }}>
                        Open <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}