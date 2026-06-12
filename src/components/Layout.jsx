import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/useTheme";
import {
  LayoutDashboard, Plane, Radar, User, Menu,
  Handshake, Calculator, Users, BarChart3, TrendingUp,
  ArrowLeft, ChevronLeft, Zap, LogIn, LogOut, CreditCard, ShieldCheck,
  MessageCircle,
} from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import ThemeToggle from "@/components/ThemeToggle";

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
      { path: "/", label: "Dashboard", icon: LayoutDashboard },
      { path: "/listings", label: "Listings", icon: Plane },
      { path: "/compare", label: "Compare Aircraft", icon: ShieldCheck },
      { path: "/community", label: "Community", icon: Users },
      { path: "/deal-radar", label: "Deal Radar", icon: Radar },
      { path: "/traffic", label: "Live Traffic", icon: Radar },
      { path: "/analytics", label: "Analytics", icon: BarChart3 },
      { path: "/market-reports", label: "Market Reports", icon: TrendingUp },
    ],
  },
  {
    n: "2",
    label: "Tools",
    items: [
      { path: "/marketplace", label: "ABOS MarketSpace", icon: Zap },
      { path: "/intrazone", label: "IntraZone", icon: Zap },
      { path: "/valuation", label: "Valuation", icon: TrendingUp },
      { path: "/opex-calculator", label: "OPEX Calculator", icon: Calculator },
      { path: "/leads", label: "Leads", icon: Users },
      { path: "/max-chat", label: "Ask Max (AI)", icon: MessageCircle },
    ],
  },
  {
    n: "3",
    label: "Account",
    items: [
      { path: "/pricing", label: "Credits & Plans", icon: Zap },
      { path: "/subscription", label: "Subscription", icon: CreditCard },
    ],
  },
  {
    n: "4",
    label: "Admin",
    items: [
      { path: "/admin/listings", label: "Admin: All Listings", icon: ShieldCheck },
      { path: "/admin/marketplace", label: "Admin: Marketplace", icon: Zap },
      { path: "/admin/settings", label: "Admin: Settings", icon: ShieldCheck },
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
                background:"linear-gradient(135deg,#00f5ff 0%,#7a00ff 100%)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"
              }}>
              ABOS MarketSpace
            </span>
          </Link>

          <div className="flex-1" />

          <nav className="flex items-center gap-1.5">
            <ThemeToggle />
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

      {/* Sidebar — Deep Liquid Glass panel */}
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
          // Swipe left to close (dx < -50 and mostly horizontal)
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
        style={{
          background: "linear-gradient(160deg, rgba(13,15,43,0.94) 0%, rgba(8,8,24,0.98) 100%)",
          backdropFilter: "blur(64px) saturate(240%) brightness(0.85)",
          WebkitBackdropFilter: "blur(64px) saturate(240%) brightness(0.85)",
          borderRight: "1px solid rgba(0,245,255,0.08)",
          boxShadow: "12px 0 80px rgba(0,0,0,0.7), 1px 0 0 rgba(0,245,255,0.05), inset -1px 0 0 rgba(122,0,255,0.06)"
        }}
      >
        {/* Top specular line — Liquid Horizon */}
        <div style={{position:"absolute", top:0, left:0, right:0, height:"1px", background:"linear-gradient(90deg, transparent 0%, rgba(122,0,255,0.55) 30%, rgba(0,245,255,0.70) 65%, transparent 100%)"}} />

        <div className="flex items-center justify-between px-5 pt-16 pb-4" style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <div>
            <p style={{
              background:"linear-gradient(90deg,#F5C842,#E8A83A)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              fontSize:"9px", fontWeight:900, letterSpacing:"0.22em", textTransform:"uppercase"
            }}>Navigation</p>
            <p className="text-white/30 text-[11px] mt-0.5">The Global Aircraft Identity & Sales Network</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90"
            style={{
              background:"rgba(255,255,255,0.06)",
              border:"1px solid rgba(255,255,255,0.10)",
              backdropFilter:"blur(8px)"
            }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {SIDEBAR_SECTIONS.map((section, idx) => (
            <div key={section.n} className={idx > 0 ? "mt-6" : ""}>
              <div className="flex items-center gap-2 px-3 pb-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    background:"linear-gradient(135deg,rgba(232,168,58,0.25),rgba(232,168,58,0.08))",
                    border:"1px solid rgba(232,168,58,0.35)",
                    boxShadow:"0 0 18px rgba(232,168,58,0.18), inset 0 1px 0 rgba(255,255,255,0.12)"
                  }}>
                  <span className="text-[9px] font-black text-[#E8A83A] leading-none">{section.n}</span>
                </div>
                <p style={{
                  background:"linear-gradient(90deg,rgba(245,200,66,0.9),rgba(232,168,58,0.6))",
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                  fontSize:"9px", fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase"
                }}>{section.label}</p>
              </div>
              <div className="space-y-0.5">
                {section.items.map(({ path, label, icon: NavIcon }) => {
                  const active = pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      className={`
                            relative flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-2xl text-[12px] font-semibold tracking-[0.005em] transition-all duration-150
                            ${active ? "text-white" : "text-white/40 hover:text-white/80"}
                          `}
                              style={active ? {
                                background: "linear-gradient(135deg, rgba(232,168,58,0.26) 0%, rgba(232,168,58,0.10) 100%)",
                                border: "1px solid rgba(232,168,58,0.40)",
                                boxShadow: "0 4px 20px rgba(232,168,58,0.18), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 0 12px rgba(232,168,58,0.08)",
                                backdropFilter:"blur(20px) saturate(200%)",
                                WebkitBackdropFilter:"blur(20px) saturate(200%)"
                              } : {
                                border: "1px solid transparent",
                                background: "transparent"
                              }}
                              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.border = "1px solid rgba(255,255,255,0.10)"; }}}
                              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.border = "1px solid transparent"; }}}
                    >
                      <NavIcon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-[#E8A83A]" : ""}`} />
                      <span>{label}</span>
                      {active && (
                        <div className="ml-auto flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-[#E8A83A]/60" />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#E8A83A]" style={{boxShadow:"0 0 6px rgba(232,168,58,0.8)"}} />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-4 py-4" style={{borderTop:"1px solid rgba(255,255,255,0.05)"}}>
          <div
            className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
            style={{
              background:"linear-gradient(135deg,rgba(232,168,58,0.10),rgba(232,168,58,0.03))",
              border:"1px solid rgba(232,168,58,0.16)",
              backdropFilter:"blur(16px)",
              boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)"
            }}
          >
            <div className="w-2 h-2 rounded-full bg-[#28C76F] animate-pulse shrink-0" style={{boxShadow:"0 0 10px rgba(40,199,111,0.7)"}} />
            <div>
              <p style={{
                background:"linear-gradient(90deg,#F5C842,#E8A83A)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                fontSize:"9px", fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase"
              }}>ABOS MarketSpace</p>
              <p className="text-white/25 text-[9px] tracking-wider">Powered by IntraZone Intelligence · Live</p>
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


    </div>
  );
}