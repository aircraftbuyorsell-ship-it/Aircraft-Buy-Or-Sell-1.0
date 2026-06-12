import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/useTheme";
import {
  LayoutDashboard, Plane, Radar, User, Menu,
  Handshake, Calculator, Users, BarChart3, TrendingUp, Lightbulb,
  ArrowLeft, ChevronLeft, Zap, LogIn, LogOut, CreditCard, ShieldCheck,
  MessageCircle, HelpCircle,
} from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import ThemeToggle from "@/components/ThemeToggle";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import ABOSTour from "@/components/onboarding/ABOSTour";
import GlobalSearch from "@/components/search/GlobalSearch";

const BACK_BUTTON_ROUTES = [
  /^\/ati-passport\/[^/]+$/,
];
const TOP_LEVEL = new Set(["/", "/listings", "/deal-radar", "/my-account", "/live-traffic", "/escrow"]);

const TOP_ITEMS = [
  { path: "/traffic", label: "Live Traffic", icon: Radar, accent: true },
  { path: "/escrow", label: "Escrow", icon: Handshake },
  { path: "/my-account", label: "Account", icon: User },
];

const SIDEBAR_SECTIONS = [
  {
    n: "1",
    label: "Market",
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard, desc: "Overview of platform activity, ATI scores, and market pulse" },
      { path: "/listings", label: "Listings", icon: Plane, desc: "Browse all active aircraft listings with ATI transparency scores" },
      { path: "/compare", label: "Compare Aircraft", icon: ShieldCheck, desc: "Compare up to 3 aircraft side-by-side on specs, pricing, and ATI scores" },
      { path: "/community", label: "Community", icon: Users, desc: "Connect with aviation dealers, brokers, and buyers" },
      { path: "/feature-requests", label: "Feature Requests", icon: Lightbulb, desc: "Suggest and vote on new features for the platform" },
      { path: "/deal-radar", label: "Deal Radar", icon: Radar, desc: "Spot aircraft priced below market — hot deals with high ATI scores" },
      { path: "/traffic", label: "Live Traffic", icon: Radar, desc: "Real-time ADS-B aircraft tracking with N-number search and ABOS listing matching" },
      { path: "/analytics", label: "Analytics", icon: BarChart3, desc: "Market trend charts, price movements, and time-on-market data" },
      { path: "/market-reports", label: "Market Reports", icon: TrendingUp, desc: "AI-generated aviation market intelligence reports with macro signals" },
    ],
  },
  {
    n: "2",
    label: "Tools",
    items: [
      { path: "/marketplace", label: "ABOS MarketSpace", icon: Zap, desc: "Third-party aviation tools and integrations marketplace" },
      { path: "/intrazone", label: "IntraZone", icon: Zap, desc: "Sales intelligence: lead scoring, deal pipeline, and matching engine" },
      { path: "/valuation", label: "Valuation", icon: TrendingUp, desc: "Expert aircraft valuation with OMVM market-model estimates" },
      { path: "/opex-calculator", label: "OPEX Calculator", icon: Calculator, desc: "Calculate true annual ownership costs before buying" },
      { path: "/leads", label: "Leads", icon: Users, desc: "Manage buyer leads, track pipeline stages, and score lead quality" },
      { path: "/max-chat", label: "Ask Max", icon: MessageCircle, desc: "Aviation assistant for pre-buy inspections, valuations, and market advice" },
    ],
  },
  {
    n: "3",
    label: "Account",
    items: [
      { path: "/pricing", label: "Credits & Plans", icon: Zap, desc: "Purchase token packs and manage your credit balance" },
      { path: "/subscription", label: "Subscription", icon: CreditCard, desc: "Manage your subscription plan and billing details" },
    ],
  },
  {
    n: "4",
    label: "Admin",
    items: [
      { path: "/admin/listings", label: "Admin: All Listings", icon: ShieldCheck, desc: "Full listing oversight with bulk actions, scoring, and status management" },
      { path: "/admin/marketplace", label: "Admin: Marketplace", icon: Zap, desc: "Approve and manage third-party developer tools and integrations" },
      { path: "/admin/settings", label: "Admin: Settings", icon: ShieldCheck, desc: "Platform configuration, webhooks, auto-scoring, and feature toggles" },
    ],
  },
];

const IDLE_MS = 7000;

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDark = useTheme();
  const idleTimer = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const showBack = !TOP_LEVEL.has(pathname) && BACK_BUTTON_ROUTES.some(re => re.test(pathname));

  const { data: currentUser } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const resetIdle = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setSidebarOpen(false), IDLE_MS);
  };

  useEffect(() => {
    if (sidebarOpen) resetIdle();
    return () => idleTimer.current && clearTimeout(idleTimer.current);
  }, [sidebarOpen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Swipe right from left edge to open sidebar
  useEffect(() => {
    const onTouchStart = (e) => {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      if (x < 20) { touchStartX.current = x; touchStartY.current = y; }
    };
    const onTouchEnd = (e) => {
      if (touchStartX.current == null || touchStartX.current >= 20) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      if (dx > 60 && dy < 80) setSidebarOpen(true);
      touchStartX.current = null;
    };
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans tracking-[-0.015em]">
      {/* Skip to content — accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#0B2D5B] focus:text-white focus:rounded-xl focus:text-sm focus:font-bold focus:outline-none focus:ring-2 focus:ring-[#E8A83A]">
        Skip to content
      </a>
      {/* Top bar — iOS Liquid Glass Navbar */}
      <header className="sticky top-0 z-40 glass-navbar safe-top" style={{WebkitBackdropFilter:"blur(24px) saturate(180%)"}}>
        <div className="flex items-center gap-2.5 px-4 sm:px-6 h-[58px]">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="glass-pill flex items-center gap-1 px-3 py-1.5 text-[#0B2D5B] dark:text-white/80 hover:text-[#0B2D5B] dark:hover:text-white touch-target-compact transition-all active:scale-95"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-[11px] font-semibold hidden sm:inline">Back</span>
            </button>
          ) : (
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="glass-pill w-9 h-9 flex items-center justify-center text-[#0B2D5B]/60 dark:text-white/60 hover:text-[#0B2D5B] dark:hover:text-white touch-target-compact transition-all active:scale-95"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2 shrink-0 min-w-0 transition-all hover:scale-[1.02] active:scale-95 pl-1.5 pr-3 py-1 rounded-full"
            style={isDark ? {
              background:"rgba(255,255,255,0.06)",
              backdropFilter:"blur(16px) saturate(160%)",
              WebkitBackdropFilter:"blur(16px) saturate(160%)",
              border:"1px solid rgba(255,255,255,0.12)",
              boxShadow:"0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)"
            } : {
              background:"rgba(255,255,255,0.75)",
              backdropFilter:"blur(16px) saturate(160%)",
              WebkitBackdropFilter:"blur(16px) saturate(160%)",
              border:"1px solid rgba(0,0,0,0.08)",
              boxShadow:"0 2px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.90)"
            }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{background:"linear-gradient(135deg,#0B2D5B,#1A4A8A)", boxShadow:"0 2px 12px rgba(11,45,91,0.35)"}}>
              <Plane className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-sm tracking-[-0.04em] hidden sm:block"
              style={{
                background: isDark ? "linear-gradient(135deg,#00f5ff 0%,#7a00ff 100%)" : "linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"
              }}>
              ABOS MarketSpace
            </span>
          </Link>

          <GlobalSearch />
          <div className="flex-1" />

          <nav className="flex items-center gap-1.5">
            <ThemeToggle />
            <button
              onClick={() => {
                localStorage.removeItem("abos_tour_completed_v3");
                window.dispatchEvent(new Event("abos-tour-open"));
              }}
              className="glass-pill w-9 h-9 flex items-center justify-center text-[#0B2D5B]/60 dark:text-white/60 hover:text-[#0B2D5B] dark:hover:text-white touch-target-compact transition-all active:scale-95"
              aria-label="Open guided tour"
              title="Platform tour"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            {currentUser ? (
              <button
                onClick={() => base44.auth.logout()}
                className="glass-pill flex items-center gap-1.5 px-3 h-8 text-[11px] font-semibold text-[#0B2D5B]/60 dark:text-white/50 hover:text-[#0B2D5B] dark:hover:text-white transition-all active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            ) : (
              <button
                onClick={() => base44.auth.redirectToLogin()}
                className="flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-bold text-white transition-all active:scale-95"
                style={{background:"linear-gradient(135deg,#E8A83A,#D4911A)", boxShadow:"0 2px 12px rgba(232,168,58,0.35)"}}
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Log In</span>
              </button>
            )}
            {TOP_ITEMS.map(({ path, label, icon: Icon, accent }) => {
              const active = pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`
                    flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all active:scale-95
                    ${active
                      ? "text-white shadow-md"
                      : accent
                        ? "glass-pill text-[#E8A83A] hover:text-[#D4911A]"
                        : "glass-pill text-[#0B2D5B]/70 dark:text-white/60 hover:text-[#0B2D5B] dark:hover:text-white"}
                  `}
                  style={active ? {background:"linear-gradient(135deg,#0B2D5B,#1A4A8A)", boxShadow:"0 2px 14px rgba(11,45,91,0.30)"} : {}}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${accent && !active ? "animate-pulse" : ""}`} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setSidebarOpen(false)}
          style={{background:"rgba(0,0,0,0.55)", backdropFilter:"blur(8px) saturate(140%)", WebkitBackdropFilter:"blur(8px) saturate(140%)"}}
        />
      )}

      {/* Sidebar — theme-aware glass panel */}
      <aside
        onMouseMove={() => sidebarOpen && resetIdle()}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
          touchStartY.current = e.touches[0].clientY;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
          if (dx < -50 && dy < 60) setSidebarOpen(false);
          touchStartX.current = null;
          touchStartY.current = null;
        }}
        className={`
          fixed left-0 top-0 bottom-0 z-50
          w-[272px] flex flex-col
          transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={isDark ? {
          background: "linear-gradient(160deg, rgba(13,15,43,0.94) 0%, rgba(8,8,24,0.98) 100%)",
          backdropFilter: "blur(64px) saturate(240%) brightness(0.85)",
          WebkitBackdropFilter: "blur(64px) saturate(240%) brightness(0.85)",
          borderRight: "1px solid rgba(0,245,255,0.08)",
          boxShadow: "12px 0 80px rgba(0,0,0,0.7), 1px 0 0 rgba(0,245,255,0.05), inset -1px 0 0 rgba(122,0,255,0.06)"
        } : {
          background: "linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(248,250,255,0.98) 100%)",
          backdropFilter: "blur(48px) saturate(160%)",
          WebkitBackdropFilter: "blur(48px) saturate(160%)",
          borderRight: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "8px 0 40px rgba(0,0,0,0.06), inset -1px 0 0 rgba(0,0,0,0.03)"
        }}
      >
        <div style={{position:"absolute", top:0, left:0, right:0, height:"1px", background: isDark ? "linear-gradient(90deg, transparent 0%, rgba(122,0,255,0.55) 30%, rgba(0,245,255,0.70) 65%, transparent 100%)" : "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.25) 30%, rgba(99,102,241,0.30) 65%, transparent 100%)"}} />

        <div className="flex items-center justify-between px-5 pt-16 pb-4" style={{borderBottom: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)"}}>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em]" style={{color: "#D4A017"}}>Navigation</p>
            <p className="text-[11px] mt-0.5" style={{color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)"}}>The Global Aircraft Identity & Sales Network</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <TooltipProvider delayDuration={600}>
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {SIDEBAR_SECTIONS.map((section, idx) => (
            <div key={section.n} className={idx > 0 ? "mt-6" : ""}>
              <div className="flex items-center gap-2 px-3 pb-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(212,160,23,0.15)", border: "1px solid rgba(212,160,23,0.30)" }}>
                  <span className="text-[9px] font-black text-[#D4A017] leading-none">{section.n}</span>
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{color: "#D4A017"}}>{section.label}</p>
              </div>
              <div className="space-y-0.5">
                {section.items.map(({ path, label, icon: NavIcon, desc }) => {
                  const active = pathname === path;
                  const inactiveColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)";
                  const hoverColor = isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.75)";
                  const hoverBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)";
                  return (
                    <Tooltip key={path}>
                      <TooltipTrigger asChild>
                        <Link
                          to={path}
                      className="relative flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-2xl text-[12px] font-semibold transition-all duration-150"
                      style={{
                        color: active ? "#1e293b" : inactiveColor,
                        background: active ? "rgba(212,160,23,0.14)" : "transparent",
                        border: active ? "1px solid rgba(212,160,23,0.35)" : "1px solid transparent",
                      }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = hoverColor; e.currentTarget.style.border = isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.06)"; }}}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = inactiveColor; e.currentTarget.style.border = "1px solid transparent"; }}}
                    >
                      <NavIcon className="w-3.5 h-3.5 shrink-0" style={{color: active ? "#D4A017" : undefined}} />
                      <span>{label}</span>
                      {active && (
                        <div className="ml-auto flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-[#D4A017]/50" />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
                        </div>
                      )}
                        </Link>
                      </TooltipTrigger>
                      {desc && (
                        <TooltipContent side="right" className="max-w-[220px]">
                          <p className="text-[11px] leading-snug">{desc}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        </TooltipProvider>

        <div className="px-4 py-4" style={{borderTop: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)"}}>
          <div className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
            style={{ background: isDark ? "rgba(212,160,23,0.06)" : "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.16)" }}>
            <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse shrink-0" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{color: "#D4A017"}}>ABOS MarketSpace</p>
              <p className="text-[9px] tracking-wider" style={{color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.30)"}}>Powered by IntraZone Intelligence · Live</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main id="main-content" className="flex-1 overflow-auto pb-4">
        <div className="mx-auto w-full max-w-[1600px]">
          <Outlet />
        </div>
      </main>

      <SiteFooter />

      <ABOSTour />

    </div>
  );
}