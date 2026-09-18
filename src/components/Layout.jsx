import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, LogIn } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import ABOSTour from "@/components/onboarding/ABOSTour";
import MarketspaceTour from "@/components/marketspace-tour/MarketspaceTour";
import SidebarLogo from "@/components/layout/SidebarLogo";
import ThemeToggle from "@/components/ThemeToggle";
import PillCommandBar from "@/components/layout/PillCommandBar";
import BottomTabBar from "@/components/layout/BottomTabBar";
import RouteTransition from "@/components/layout/RouteTransition";
import PragueClock from "@/components/layout/PragueClock";
import AccountMenu from "@/components/layout/AccountMenu";
import DotGrid from "@/components/layout/DotGrid";
import UniversalSearchBar from "@/components/search/UniversalSearchBar";
import { useTheme } from "@/lib/useTheme";


export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isDark = useTheme();

  const isHomepage = pathname === "/";
  const showBack = !isHomepage;

  const { data: currentUser } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const layoutBg = isDark
    ? { background: "#04060a", backgroundImage: "radial-gradient(ellipse at 8% 12%, rgba(245,194,66,0.14) 0%, transparent 52%), radial-gradient(ellipse at 92% 88%, rgba(93,202,165,0.12) 0%, transparent 52%), radial-gradient(ellipse at 85% 8%, rgba(78,142,247,0.07) 0%, transparent 40%)" }
    : { background: "#fbfaf7", backgroundImage: "radial-gradient(ellipse at 8% 12%, rgba(212,160,23,0.10) 0%, transparent 52%), radial-gradient(ellipse at 92% 88%, rgba(93,202,165,0.08) 0%, transparent 52%), radial-gradient(ellipse at 85% 8%, rgba(78,142,247,0.05) 0%, transparent 40%)" };

  return (
    <div className="relative flex flex-col min-h-screen font-sans" style={layoutBg}>
      <DotGrid />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-8deg)", opacity: 0.055, pointerEvents: "none", zIndex: 0 }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 172 106" width="480" height="296">
          <defs>
            <marker id="wm-arr" markerWidth="9" markerHeight="9" refX="8.5" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
              <polygon points="0,0 9,4.5 0,9" fill={isDark ? "white" : "rgba(0,0,0,0.9)"} />
            </marker>
          </defs>
          <polyline points="2,98 52,8 70,98" stroke={isDark ? "white" : "rgba(0,0,0,0.9)"} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <polyline points="70,98 86,48 102,70 122,14 140,80 156,57" stroke={isDark ? "white" : "rgba(0,0,0,0.9)"} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" markerEnd="url(#wm-arr)" />
        </svg>
        <div style={{ textAlign: "center", marginTop: 18, color: isDark ? "#fff" : "rgba(0,0,0,0.9)", fontFamily: "Inter, -apple-system, sans-serif" }}>
          <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-0.03em" }}>
            ABOS<span style={{ fontSize: 18, fontWeight: 600, verticalAlign: "super", marginLeft: 2 }}>™</span>
          </span>
          <span style={{ display: "block", fontSize: 15, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", marginTop: 6 }}>
            Marketspace<span style={{ fontSize: 10, verticalAlign: "super", marginLeft: 2 }}>™</span>
          </span>
        </div>
      </div>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#D4A017] focus:text-[#0B1220] focus:rounded-xl focus:text-sm focus:font-bold">
        Skip to content
      </a>

      {/* ── Top header bar ── (suppressed on homepage — HomepageHeader takes over) */}
      {!isHomepage && (
      <header className="sticky top-0 z-40 safe-top"
      style={{ background: isDark ? "rgba(4,6,10,0.92)" : "rgba(251,250,247,0.98)", backdropFilter: isDark ? "blur(16px)" : "none", borderBottom: `0.5px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` }}>
        {/* Single row: logo (centered, dominant) | pill bar (desktop) | controls */}
        <div className="flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-8 h-[64px] safe-left safe-right">
          {/* Left: back + dominant logo — centered with equal flex */}
          <div className="flex items-center gap-3 min-w-0 shrink-0 flex-1 lg:flex-none lg:w-[260px]">
            {showBack &&
            <button onClick={() => navigate(-1)} aria-label="Go back"
            style={{ display: "flex", alignItems: "center", gap: "4px", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: `0.5px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, borderRadius: "8px", padding: "8px", color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)", fontSize: "12px", fontWeight: 600, flexShrink: 0, minWidth: 44, minHeight: 36, justifyContent: "center" }}>
                <ArrowLeft size={16} /> <span className="hidden sm:inline">Back</span>
              </button>
            }
            {/* Mobile: compact logo; Desktop: full dominant logo */}
            <div className="lg:hidden">
              <SidebarLogo compact />
            </div>
            <div className="hidden lg:block">
              <SidebarLogo />
            </div>
          </div>

          {/* Center: pill command bar (desktop only, truly centered) */}
          <div className="hidden lg:flex items-center justify-center flex-1 min-w-0">
            <PillCommandBar />
          </div>

          {/* Right: theme toggle + Prague date/time + user — balanced with logo width */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0 lg:w-[260px] lg:justify-end">
            <UniversalSearchBar compact />
            <ThemeToggle />
            <PragueClock />
            {currentUser ?
            <AccountMenu user={currentUser} /> :

            <button onClick={() => base44.auth.redirectToLogin()}
            style={{ display: "flex", alignItems: "center", gap: "5px", background: "#D4A017", color: "#0B1220", border: "none", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer", flexShrink: 0, minHeight: 36 }}>
                <LogIn size={14} /> <span>Log In</span>
              </button>
            }
          </div>
        </div>

      </header>
      )}

      {/* ── Content ── full width ── */}
      <main id="main-content" className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden pb-14 lg:pb-0" style={{ background: "transparent" }}>
          <RouteTransition>
            <Outlet />
          </RouteTransition>
      </main>

      <SiteFooter />
      <ABOSTour />
      <MarketspaceTour />
      <BottomTabBar />
    </div>);

}