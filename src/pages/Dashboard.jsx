import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/useTheme";
import { Link } from "react-router-dom";
import AviationNewsTicker from "@/components/newsletter/AviationNewsTicker";
import BlackGlobeHUD from "@/components/dashboard/BlackGlobeHUD";
import SubscriptionBadge from "@/components/dashboard/SubscriptionBadge";
import NotificationStack from "@/components/notifications/NotificationStack";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
import DashboardNRegSearch from "@/components/dashboard/DashboardNRegSearch";
import {
  GlobeIcon, Lock, Zap, ArrowRight, Flame
} from "lucide-react";

export default function Dashboard() {
  const isDark = useTheme();

  const ABOS_AMBER = isDark ? "#f5c242" : "#D4A017";
  const NAVY = isDark ? "#e2e8f0" : "#1A1F2B";
  const MUTED = isDark ? "rgba(255,255,255,0.45)" : "#7D8590";
  const BG = isDark ? "#04060a" : "#F4F6F8";
  const CARD = isDark ? "rgba(22,22,38,0.9)" : "#FFFFFF";
  const SCRIM = isDark ? "4,6,10" : "244,246,248";

  const { data: listings = [] } = useQuery({
    queryKey: ["listings-active"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }, "-created_date", 200),
    staleTime: 30000,
  });

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: "100dvh",
        overflow: "hidden",
        background: BG,
        backgroundImage: "radial-gradient(ellipse at 8% 12%, rgba(212,160,23,0.06) 0%, transparent 52%), radial-gradient(ellipse at 92% 88%, rgba(93,202,165,0.05) 0%, transparent 52%)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <NotificationStack />
      <NotificationCenter />

      {/* ── GLOBE — full bleed background (light theme) ── */}
      <div className="absolute inset-0 z-0">
        <BlackGlobeHUD
          listings={listings}
          listingsCount={listings.length}
          stats={{ adsbCount: 2315, liveDbCount: listings.length, faaCount: 456 }}
          isDark={isDark}
          hideOverlayPills
        />
      </div>

      {/* ── READABILITY SCRIMS — soft white gradients for text contrast ── */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
        style={{ height: "28%", background: `linear-gradient(to bottom, rgba(${SCRIM},0.92) 0%, rgba(${SCRIM},0.6) 50%, transparent 100%)` }} />
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
        style={{ height: "46%", background: `linear-gradient(to top, rgba(${SCRIM},0.95) 0%, rgba(${SCRIM},0.7) 35%, rgba(${SCRIM},0.25) 70%, transparent 100%)` }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
        style={{ width: "520px", height: "200px", background: `radial-gradient(ellipse at center, rgba(${SCRIM},0.85) 0%, rgba(${SCRIM},0.4) 50%, transparent 75%)` }} />

      {/* ── TOP BAR: brand + subscription ── */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 md:px-8 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: ABOS_AMBER }}>
              A.B.O.S — Aircraft Buy or Sell
            </p>
            <h1 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.03em", color: NAVY, margin: "1px 0 0" }}>
              Aviation Intelligence Platform
            </h1>
          </div>
          <SubscriptionBadge />
        </div>
      </div>

      {/* ── CENTER: N-Reg search ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-full px-4 md:px-8 pointer-events-none">
        <div className="max-w-xl mx-auto pointer-events-auto">
          <p className="text-center text-[9px] tracking-[0.22em] font-bold mb-2" style={{ color: ABOS_AMBER }}>
            FAA N-REGISTRY LOOKUP
          </p>
          <DashboardNRegSearch />
        </div>
      </div>

      {/* ── BOTTOM: news ticker + CTA cards ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 md:px-8 pb-3">
        {/* News ticker */}
        <div className="mb-2 abos-news-wrap max-w-5xl mx-auto">
          <p className="text-[8px] tracking-[0.2em] font-bold mb-1 px-1" style={{ color: MUTED }}>
            AVIATION MARKET PULSE
          </p>
          <AviationNewsTicker />
        </div>

        {/* CTA cards — clean white cards with soft shadows */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 md:grid-cols-3 gap-1.5 md:gap-2.5">

            {/* MarketSpace */}
            <Link to="/listings" className="block">
              <div className="rounded-xl px-4 py-3 cursor-pointer group hover:scale-[1.02] transition-all duration-200 relative overflow-hidden h-full"
                style={{
                  background: CARD,
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
                }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${ABOS_AMBER}14`, border: `1px solid ${ABOS_AMBER}30` }}>
                    <GlobeIcon className="w-4 h-4" style={{ color: ABOS_AMBER }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] tracking-[0.18em] font-bold" style={{ color: ABOS_AMBER }}>PUBLIC ACCESS</p>
                    <p className="text-[13px] font-black tracking-tight" style={{ color: NAVY }}>MarketSpace</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-1 transition-transform" style={{ color: MUTED }} />
                </div>
                <p className="text-[10px] leading-snug mt-1.5 abos-cta-text" style={{ color: MUTED }}>
                  Browse listings, verify N-Reg, check deal scores.
                </p>
              </div>
            </Link>

            {/* IntraZone */}
            <Link to="/pricing" className="block">
              <div className="rounded-xl px-4 py-3 cursor-pointer group hover:scale-[1.02] transition-all duration-200 relative overflow-hidden h-full"
                style={{
                  background: CARD,
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
                }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${ABOS_AMBER}14`, border: `1px solid ${ABOS_AMBER}30` }}>
                    <Lock className="w-4 h-4" style={{ color: ABOS_AMBER }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] tracking-[0.18em] font-bold" style={{ color: ABOS_AMBER }}>AUTHENTICATED</p>
                    <p className="text-[13px] font-black tracking-tight" style={{ color: NAVY }}>IntraZone</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-1 transition-transform" style={{ color: MUTED }} />
                </div>
                <p className="text-[10px] leading-snug mt-1.5 abos-cta-text" style={{ color: MUTED }}>
                  Full ATI, OMVM valuation, deal pipeline, API.
                </p>
              </div>
            </Link>

            {/* Free DEMO — most prominent */}
            <Link to="/ati-quick-score" className="block">
              <div className="rounded-xl px-4 py-3 cursor-pointer group hover:scale-[1.02] transition-all duration-200 relative overflow-hidden h-full"
                style={{
                  background: CARD,
                  border: `1.5px solid ${ABOS_AMBER}44`,
                  boxShadow: `0 2px 8px ${ABOS_AMBER}14, 0 4px 16px rgba(0,0,0,0.04)`,
                }}>
                {/* HOT badge */}
                <div className="absolute top-2 right-2 flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: `${ABOS_AMBER}14`, color: ABOS_AMBER, border: `1px solid ${ABOS_AMBER}33` }}>
                  <Flame className="w-2.5 h-2.5" /> HOT
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${ABOS_AMBER}18`, border: `1px solid ${ABOS_AMBER}40` }}>
                    <Zap className="w-4 h-4" style={{ color: ABOS_AMBER }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] tracking-[0.18em] font-bold" style={{ color: ABOS_AMBER }}>NO ACCOUNT</p>
                    <p className="text-[13px] font-black tracking-tight" style={{ color: NAVY }}>Free DEMO</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-1 transition-transform" style={{ color: MUTED }} />
                </div>
                <p className="text-[10px] leading-snug mt-1.5 abos-cta-text" style={{ color: MUTED }}>
                  Try ATI scoring — 30 min, no credit card.
                </p>
              </div>
            </Link>

          </div>
        </div>
      </div>

      {/* Mobile / responsive adjustments */}
      <style>{`
        @media (max-width: 640px) {
          .abos-news-wrap { display: none; }
        }
        @media (max-width: 380px) {
          .abos-cta-text { display: none; }
        }
      `}</style>
    </div>
  );
}