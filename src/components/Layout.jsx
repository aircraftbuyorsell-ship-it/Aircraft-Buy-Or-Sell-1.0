import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/useTheme";
import {
  LayoutDashboard, Plane, Radar, User, Menu,
  Handshake, Calculator, Users, BarChart3, TrendingUp, Lightbulb,
  ArrowLeft, ChevronLeft, Zap, LogIn, LogOut, CreditCard, ShieldCheck,
  MessageCircle, HelpCircle, FileText, Globe, Layers } from
"lucide-react";
import SiteFooter from "@/components/SiteFooter";
import ThemeToggle from "@/components/ThemeToggle";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import ABOSTour from "@/components/onboarding/ABOSTour";
import GlobalSearch from "@/components/search/GlobalSearch";

const BACK_BUTTON_ROUTES = [
/^\/ati-passport\/[^/]+$/];

const TOP_LEVEL = new Set(["/", "/listings", "/deal-radar", "/my-account", "/live-traffic", "/escrow"]);

const TOP_ITEMS = [
{ path: "/traffic", label: "Live Traffic", icon: Radar, accent: true },
{ path: "/escrow", label: "Escrow", icon: Handshake },
{ path: "/my-account", label: "Account", icon: User }];


const SIDEBAR_SECTIONS = [
{
  n: "1",
  label: "MarketSpace",
  sublabel: "Public Aircraft Intelligence",
  color: "#00c2ff",
  items: [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, desc: "Platform overview — active listings, ATI scores, market pulse and live globe" },
  { path: "/listings", label: "Aircraft Listings", icon: Plane, desc: "Browse all public aircraft listings with ATI scores, deal ratings and swipe deck" },
  { path: "/ati-quick-score", label: "ATI Quick Score", icon: Zap, desc: "Instant 8-dimension ATI scorecard from any listing text or N-number — free" },
  { path: "/ati-full-report", label: "ATI Full Report", icon: FileText, desc: "Professional ATI appraisal with executive summary, risk breakdown and .docx export" },
  { path: "/compare", label: "Compare Aircraft", icon: Layers, desc: "Compare up to 3 aircraft side-by-side on specs, pricing and ATI scores" },
  { path: "/deal-radar", label: "Deal Radar", icon: TrendingUp, desc: "Hot deals priced below market with high ATI scores — updated in real time" },
  { path: "/traffic", label: "Live Traffic", icon: Radar, desc: "Real-time ADS-B tracking with N-number search and ABOS listing matching" },
  { path: "/community", label: "Community", icon: Users, desc: "Aviation dealers, brokers and buyers — connect, discuss and share" },
  { path: "/feature-requests", label: "Feature Requests", icon: Lightbulb, desc: "Suggest and vote on new platform features" }]

},
{
  n: "2",
  label: "IntraZone",
  sublabel: "User Workspace & Analytics",
  color: "#D4A017",
  items: [
  { path: "/intrazone", label: "IntraZone Hub", icon: LayoutDashboard, desc: "Your private workspace — deals, leads, matching engine and negotiation tools" },
  { path: "/analytics", label: "Market Analytics", icon: BarChart3, desc: "Price trends, days-on-market, top models and inventory liquidity charts" },
  { path: "/market-reports", label: "Market Reports", icon: TrendingUp, desc: "AI-generated aviation market intelligence with macro signals and regional forecasts" },
  { path: "/valuation", label: "Valuation (OMVM)", icon: TrendingUp, desc: "Off-market valuation model — market-calibrated price estimates" },
  { path: "/opex-calculator", label: "OPEX Calculator", icon: Calculator, desc: "True annual ownership cost calculator — 100h to 999h/year flight time scenarios" },
  { path: "/escrow", label: "Escrow & Deals", icon: Handshake, desc: "Secure buyer-seller escrow with automated commission splits and payout audit trail" },
  { path: "/leads", label: "Leads (CRM)", icon: Users, desc: "Buyer lead pipeline — stage tracking, auto-scoring and deal management" },
  { path: "/pre-buy-inspection", label: "Pre-Buy Inspection", icon: ShieldCheck, desc: "On-site with Max — live visual analysis of airframe, engine and avionics" },
  { path: "/max-chat", label: "Ask Max", icon: MessageCircle, desc: "Aviation intelligence assistant — appraisals, inspections and market advice" }]

},
{
  n: "3",
  label: "Account",
  sublabel: "Plans & Billing",
  color: "#6366f1",
  items: [
  { path: "/pricing", label: "Credits & Plans", icon: Zap, desc: "Purchase token packs and manage your credit balance" },
  { path: "/subscription", label: "Subscription", icon: CreditCard, desc: "Manage your subscription plan and billing details" },
  { path: "/my-account", label: "My Account", icon: User, desc: "Profile settings, preferences and account details" }]

},
{
  n: "4",
  label: "Admin",
  sublabel: "Platform Management",
  color: "#ef4444",
  items: [
  { path: "/admin/listings", label: "All Listings", icon: ShieldCheck, desc: "Full listing oversight with bulk actions, scoring and status management" },
  { path: "/admin/marketplace", label: "Marketplace", icon: Globe, desc: "Approve and manage third-party developer tools and integrations" },
  { path: "/admin/settings", label: "Settings", icon: Zap, desc: "Platform configuration, webhooks, auto-scoring and feature toggles" }]

}];


const IDLE_MS = 7000;

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDark = useTheme();
  const idleTimer = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const showBack = !TOP_LEVEL.has(pathname) && BACK_BUTTON_ROUTES.some((re) => re.test(pathname));

  const { data: currentUser } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false
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
      if (x < 20) {touchStartX.current = x;touchStartY.current = y;}
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
      <header className="sticky top-0 z-40 glass-navbar safe-top" style={{ WebkitBackdropFilter: "blur(24px) saturate(180%)" }}>
        <div className="flex items-center gap-2.5 px-4 sm:px-6 h-[58px]">
          {showBack ?
          <button
            onClick={() => navigate(-1)}
            className="glass-pill flex items-center gap-1 px-3 py-1.5 text-[#0B2D5B] dark:text-white/80 hover:text-[#0B2D5B] dark:hover:text-white touch-target-compact transition-all active:scale-95"
            aria-label="Go back">
            
              <ArrowLeft className="w-4 h-4" />
              <span className="text-[11px] font-semibold hidden sm:inline">Back</span>
            </button> :

          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="glass-pill w-9 h-9 flex items-center justify-center text-[#0B2D5B]/60 dark:text-white/60 hover:text-[#0B2D5B] dark:hover:text-white touch-target-compact transition-all active:scale-95"
            aria-label="Open menu">
            
              <Menu className="w-4 h-4" />
            </button>
          }

          <Link to="/" className="flex items-center gap-2 shrink-0 min-w-0 transition-all hover:opacity-80 active:scale-95 px-1 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
            style={{ background: isDark ? "linear-gradient(135deg,#0A081E 0%,#1a1040 100%)" : "linear-gradient(135deg,#0B2D5B,#1A4A8A)", boxShadow: isDark ? "0 2px 16px rgba(122,0,255,0.25)" : "0 2px 12px rgba(11,45,91,0.30)", border: isDark ? "1px solid rgba(0,245,255,0.20)" : "1px solid rgba(37,99,235,0.20)" }}>
              <Plane className="w-4 h-4" style={{ color: isDark ? "#00f5ff" : "#fff" }} />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-black text-[13px] tracking-[-0.03em]"
              style={{
                background: isDark ? "linear-gradient(135deg,#00f5ff 20%,#7a00ff 80%)" : "linear-gradient(135deg,#2563eb 0%,#1e293b 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
              }}>ABOS</span>
              <span className="text-[9px] font-semibold tracking-[0.12em] uppercase" style={{ color: isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.40)" }}>MarketSpace</span>
            </div>
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
              title="Platform tour">
              
              <HelpCircle className="w-4 h-4" />
            </button>
            {currentUser ?
            <button
              onClick={() => base44.auth.logout()}
              className="glass-pill flex items-center gap-1.5 px-3 h-8 text-[11px] font-semibold text-[#0B2D5B]/60 dark:text-white/50 hover:text-[#0B2D5B] dark:hover:text-white transition-all active:scale-95 [font-family:'-apple-system',_BlinkMacSystemFont,_SF_Pro_Display,_SF_Pro_Text,_Inter,_system-ui,_sans-serif]">
              
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Log Out</span>
              </button> :

            <button
              onClick={() => base44.auth.redirectToLogin()}
              className="flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-bold text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg,#E8A83A,#D4911A)", boxShadow: "0 2px 12px rgba(232,168,58,0.35)" }}>
              
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Log In</span>
              </button>
            }
            {TOP_ITEMS.map(({ path, label, icon: Icon, accent }) => {
              const active = pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`
                    flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all active:scale-95
                    ${active ?
                  "text-white shadow-md" :
                  accent ?
                  "glass-pill text-[#E8A83A] hover:text-[#D4911A]" :
                  "glass-pill text-[#0B2D5B]/70 dark:text-white/60 hover:text-[#0B2D5B] dark:hover:text-white"}
                  `}
                  style={active ? { background: "linear-gradient(135deg,#0B2D5B,#1A4A8A)", boxShadow: "0 2px 14px rgba(11,45,91,0.30)" } : {}}>
                  
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${accent && !active ? "animate-pulse" : ""}`} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>);

            })}
          </nav>
        </div>
      </header>

      {/* Backdrop */}
      {sidebarOpen &&
      <div
        className="fixed inset-0 z-40"
        onClick={() => setSidebarOpen(false)}
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px) saturate(140%)", WebkitBackdropFilter: "blur(8px) saturate(140%)" }} />

      }

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
          background: "rgba(14,14,24,0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        } : {
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(0,0,0,0.06)",
        }}>
        
        

        <div className="flex items-center justify-between px-5 pt-16 pb-4" style={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)" }}>
          <div>
            <p className="text-[10px] font-semibold tracking-wide" style={{ color: isDark ? "#60a5fa" : "#3b82f6" }}>Navigation</p>
            <p className="text-[10px] mt-0.5" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(100,116,139,0.8)" }}>Global Aircraft Intelligence Network</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.08)"
            }}>
            
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <TooltipProvider delayDuration={600}>
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {SIDEBAR_SECTIONS.map((section, idx) =>
            <div key={section.n} className={idx > 0 ? "mt-5" : ""}>
              <div className="flex items-center gap-2 px-3 pb-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${section.color}18`, border: `1px solid ${section.color}40` }}>
                  <span className="text-[9px] font-black leading-none" style={{ color: section.color }}>{section.n}</span>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: section.color }}>{section.label}</p>
                  {section.sublabel && <p className="text-[8px] leading-none mt-0.5" style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.30)" }}>{section.sublabel}</p>}
                </div>
              </div>
              <div className="space-y-0.5">
                {section.items.map(({ path, label, icon: NavIcon, desc }) => {
                  const active = pathname === path;
                  const sc = section.color;
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
                            color: active ? isDark ? "#fff" : "#1e293b" : inactiveColor,
                            background: active ? `${sc}14` : "transparent",
                            border: active ? `1px solid ${sc}38` : "1px solid transparent"
                          }}
                          onMouseEnter={(e) => {if (!active) {e.currentTarget.style.background = hoverBg;e.currentTarget.style.color = hoverColor;e.currentTarget.style.border = isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.06)";}}}
                          onMouseLeave={(e) => {if (!active) {e.currentTarget.style.background = "transparent";e.currentTarget.style.color = inactiveColor;e.currentTarget.style.border = "1px solid transparent";}}}>
                          
                      <NavIcon className="w-3.5 h-3.5 shrink-0" style={{ color: active ? sc : undefined }} />
                      <span>{label}</span>
                      {active &&
                          <div className="ml-auto flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full" style={{ background: `${sc}60` }} />
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: sc }} />
                        </div>
                          }
                        </Link>
                      </TooltipTrigger>
                      {desc &&
                      <TooltipContent side="right" className="max-w-[220px]">
                          <p className="text-[11px] leading-snug">{desc}</p>
                        </TooltipContent>
                      }
                    </Tooltip>);

                })}
              </div>
            </div>
            )}
        </nav>
        </TooltipProvider>

        <div className="px-4 py-4" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)" }}>
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
          style={{ background: isDark ? "rgba(59,130,246,0.06)" : "rgba(37,99,235,0.04)", border: `1px solid ${isDark ? "rgba(59,130,246,0.15)" : "rgba(37,99,235,0.1)"}` }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0" />
            <div>
              <p className="text-[10px] font-semibold" style={{ color: isDark ? "#f1f5f9" : "#1e293b" }}>ABOS MarketSpace</p>
              <p className="text-[9px]" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(100,116,139,0.8)" }}>Live · All systems operational</p>
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

    </div>);

}