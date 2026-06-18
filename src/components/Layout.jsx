import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/useTheme";
import {
  LayoutDashboard, Plane, Radar, User, Menu,
  Handshake, Calculator, Users, BarChart3, TrendingUp,
  ArrowLeft, ChevronLeft, ChevronDown, Zap, LogIn, LogOut, CreditCard, ShieldCheck,
  HelpCircle, FileText, Globe, Layers, Video }
from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import ThemeToggle from "@/components/ThemeToggle";
import ABOSTour from "@/components/onboarding/ABOSTour";
import GlobalSearch from "@/components/search/GlobalSearch";

const BACK_BUTTON_ROUTES = [/^\/ati-passport\/[^/]+$/];
const TOP_LEVEL = new Set(["/", "/listings", "/deal-radar", "/my-account", "/escrow"]);

// ═══ Desktop sidebar widths ═══
const SIDEBAR_COLLAPSED = 56;   // icon-only
const SIDEBAR_EXPANDED = 272;   // full with labels

const TOP_ITEMS = [
  { path: "/escrow", label: "Escrow", icon: Handshake },
  { path: "/my-account", label: "Account", icon: User },
];

const SIDEBAR_SECTIONS = [
  {
    key: "marketspace",
    label: "MarketSpace",
    sublabel: "Public Aircraft Intelligence",
    color: "#f48120",
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard, desc: "Platform overview — active listings, ATI scores, market pulse and live globe" },
      { path: "/listings", label: "Aircraft Register", icon: Plane, desc: "Browse the aircraft register with ATI scores, deal ratings and swipe deck" },
      { path: "/ati-quick-score", label: "ATI Quick Score", icon: Zap, desc: "Instant 8-dimension ATI scorecard from any listing text or N-number — free" },
      { path: "/ati-full-report", label: "ATI Full Report", icon: FileText, desc: "Professional ATI appraisal with executive summary, risk breakdown and .docx export" },
      { path: "/deal-radar", label: "Deal Radar", icon: TrendingUp, desc: "Hot deals priced below market with high ATI scores — updated in real time" },
      { path: "/traffic", label: "Live Traffic", icon: Radar, desc: "Real-time ADS-B tracking with N-number search and ABOS listing matching" },
      { path: "/ati-verify", label: "ATI Verify", icon: Video, desc: "Remote document verification — live video calls, OCR extraction and ATI scoring" },
    ],
  },
  {
    key: "intrazone",
    label: "IntraZone",
    sublabel: "User Workspace & Analytics",
    color: "#D4A017",
    items: [
      { path: "/intrazone", label: "IntraZone Hub", icon: LayoutDashboard, desc: "Your private workspace — deals, leads, matching engine and negotiation tools" },
      { path: "/analytics", label: "Market Analytics", icon: BarChart3, desc: "Price trends, days-on-market, top models and inventory liquidity charts" },
      { path: "/valuation", label: "Valuation (OMVM)", icon: TrendingUp, desc: "Off-market valuation model — market-calibrated price estimates" },
      { path: "/opex-calculator", label: "OPEX Calculator", icon: Calculator, desc: "True annual ownership cost calculator — 100h to 999h/year flight time scenarios" },
      { path: "/escrow", label: "Escrow & Deals", icon: Handshake, desc: "Secure buyer-seller escrow with automated commission splits and payout audit trail" },
      { path: "/leads", label: "Leads (CRM)", icon: Users, desc: "Buyer lead pipeline — stage tracking, auto-scoring and deal management" },
    ],
  },
  {
    key: "account",
    label: "Account",
    sublabel: "Plans & Billing",
    color: "#6366f1",
    defaultOpen: false,
    items: [
      { path: "/pricing", label: "Credits & Plans", icon: Zap, desc: "Purchase token packs and manage your credit balance" },
      { path: "/subscription", label: "Subscription", icon: CreditCard, desc: "Manage your subscription plan and billing details" },
      { path: "/my-account", label: "My Account", icon: User, desc: "Profile settings, preferences and account details" },
    ],
  },
  {
    key: "admin",
    label: "Admin",
    sublabel: "Platform Management",
    color: "#ef4444",
    adminOnly: true,
    defaultOpen: false,
    items: [
      { path: "/admin/listings", label: "All Listings", icon: ShieldCheck, desc: "Full listing oversight with bulk actions, scoring and status management" },
      { path: "/admin/marketplace", label: "Marketplace", icon: Globe, desc: "Approve and manage third-party developer tools and integrations" },
      { path: "/admin/settings", label: "Settings", icon: Zap, desc: "Platform configuration, webhooks, auto-scoring and feature toggles" },
      { path: "/admin/supabase-sync", label: "Supabase Sync", icon: Layers, desc: "FAA registry synchronization" },
      { path: "/weekly-briefing", label: "Weekly Briefing", icon: FileText, desc: "AI-generated market intelligence newsletter" },
      { path: "/skyboss", label: "SkyBoss", icon: Globe, desc: "3D globe with full traffic and listing overlay" },
    ],
  },
];

const IDLE_MS = 7000;

// ── Accordion helper: read/write open state in localStorage ──
function useSectionAccordion(sectionKey, defaultOpen = true) {
  const [open, setOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(`sidebar-section-${sectionKey}`);
      return stored !== null ? stored === "true" : defaultOpen;
    } catch {
      return defaultOpen;
    }
  });
  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      try { localStorage.setItem(`sidebar-section-${sectionKey}`, String(next)); } catch {}
      return next;
    });
  }, [sectionKey]);
  return [open, toggle];
}

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopHovered, setDesktopHovered] = useState(false);
  const isDark = useTheme();
  const idleTimer = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const showBack = !TOP_LEVEL.has(pathname) && BACK_BUTTON_ROUTES.some((re) => re.test(pathname));

  const { data: currentUser } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  // ── Mobile: auto-close idle ──
  const resetIdle = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setMobileOpen(false), IDLE_MS);
  };

  useEffect(() => {
    if (mobileOpen) resetIdle();
    return () => idleTimer.current && clearTimeout(idleTimer.current);
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // ── Swipe right from left edge to open mobile sidebar ──
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
      if (dx > 60 && dy < 80) setMobileOpen(true);
      touchStartX.current = null;
    };
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  // ── Sections to render (filter admin for non-admins) ──
  const visibleSections = SIDEBAR_SECTIONS.filter((s) => !s.adminOnly || isAdmin);

  // ── Sidebar rendering function (shared between desktop & mobile) ──
  const renderSidebarContent = (isDesktop) => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0"
        style={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)" }}>
        {isDesktop && !desktopHovered ? (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: isDark ? "linear-gradient(135deg,#0A081E 0%,#1a1040 100%)" : "linear-gradient(135deg,#f48120,#e07310)",
                boxShadow: isDark ? "0 2px 16px rgba(122,0,255,0.25)" : "0 2px 12px rgba(244,129,32,0.30)",
                border: isDark ? "1px solid rgba(0,245,255,0.20)" : "1px solid rgba(244,129,32,0.20)",
              }}>
              <Plane className="w-4 h-4" style={{ color: isDark ? "#00f5ff" : "#fff" }} />
            </div>
          </div>
        ) : (
          <div>
            <p className="text-[10px] font-semibold tracking-wide" style={{ color: isDark ? "#f48120" : "#e07310" }}>Navigation</p>
            <p className="text-[10px] mt-0.5" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(100,116,139,0.8)" }}>Global Aircraft Intelligence Network</p>
          </div>
        )}
        {!isDesktop && (
          <button onClick={() => setMobileOpen(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.08)",
            }}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {visibleSections.map((section, idx) => (
          <SidebarSection
            key={section.key}
            section={section}
            isDark={isDark}
            pathname={pathname}
            collapsed={isDesktop && !desktopHovered}
            topMargin={idx > 0}
          />
        ))}
      </nav>

      {/* Footer status */}
      <div className="px-3 py-3 shrink-0"
        style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)" }}>
        {isDesktop && !desktopHovered ? (
          <div className="flex justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
            style={{ background: isDark ? "rgba(59,130,246,0.06)" : "rgba(37,99,235,0.04)", border: `1px solid ${isDark ? "rgba(59,130,246,0.15)" : "rgba(37,99,235,0.1)"}` }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0" />
            <div>
              <p className="text-[10px] font-semibold" style={{ color: isDark ? "#f1f5f9" : "#1e293b" }}>ABOS MarketSpace</p>
              <p className="text-[9px]" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(100,116,139,0.8)" }}>Live · All systems operational</p>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans tracking-[-0.015em]">
      {/* Skip to content — accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#0B2D5B] focus:text-white focus:rounded-xl focus:text-sm focus:font-bold focus:outline-none focus:ring-2 focus:ring-[#E8A83A]">
        Skip to content
      </a>

      {/* ═══════════════════════════════════════
          DESKTOP SIDEBAR — persistent, icon-only, expands on hover
      ═══════════════════════════════════════ */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-50 flex-col transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden"
        style={{
          width: desktopHovered ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED,
          background: isDark ? "rgba(14,14,24,0.96)" : "rgba(255,255,255,0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
        }}
        onMouseEnter={() => setDesktopHovered(true)}
        onMouseLeave={() => setDesktopHovered(false)}
      >
        {renderSidebarContent(true)}
      </aside>

      {/* ═══════════════════════════════════════
          MOBILE SIDEBAR — overlay drawer
      ═══════════════════════════════════════ */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px) saturate(140%)", WebkitBackdropFilter: "blur(8px) saturate(140%)" }}
        />
      )}
      <aside
        onMouseMove={() => mobileOpen && resetIdle()}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
          touchStartY.current = e.touches[0].clientY;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
          if (dx < -50 && dy < 60) setMobileOpen(false);
          touchStartX.current = null;
          touchStartY.current = null;
        }}
        className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-[272px] flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          background: isDark ? "rgba(14,14,24,0.96)" : "rgba(255,255,255,0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* ═══════════════════════════════════════
          TOP BAR
      ═══════════════════════════════════════ */}
      <header className="sticky top-0 z-40 glass-navbar safe-top lg:ml-[var(--sidebar-w)]"
        style={{ "--sidebar-w": `${SIDEBAR_COLLAPSED}px`, WebkitBackdropFilter: "blur(24px) saturate(180%)" }}>
        <div className="flex items-center gap-2.5 px-4 sm:px-6 h-[58px]">
          {showBack ? (
            <button onClick={() => navigate(-1)}
              className="glass-pill flex items-center gap-1 px-3 py-1.5 text-[#0B2D5B] dark:text-white/80 hover:text-[#0B2D5B] dark:hover:text-white touch-target-compact transition-all active:scale-95"
              aria-label="Go back">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-[11px] font-semibold hidden sm:inline">Back</span>
            </button>
          ) : (
            <button onClick={() => setMobileOpen((v) => !v)}
              className="glass-pill w-9 h-9 lg:hidden flex items-center justify-center text-[#0B2D5B]/60 dark:text-white/60 hover:text-[#0B2D5B] dark:hover:text-white touch-target-compact transition-all active:scale-95"
              aria-label="Open menu">
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Logo — hidden on desktop (lives in sidebar) */}
          <Link to="/" className="lg:hidden flex items-center gap-2 shrink-0 min-w-0 transition-all hover:opacity-80 active:scale-95 px-1 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
              style={{ background: isDark ? "linear-gradient(135deg,#0A081E 0%,#1a1040 100%)" : "linear-gradient(135deg,#f48120,#e07310)", boxShadow: isDark ? "0 2px 16px rgba(122,0,255,0.25)" : "0 2px 12px rgba(244,129,32,0.30)", border: isDark ? "1px solid rgba(0,245,255,0.20)" : "1px solid rgba(244,129,32,0.20)" }}>
              <Plane className="w-4 h-4" style={{ color: isDark ? "#00f5ff" : "#fff" }} />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-black text-[13px] tracking-[-0.03em] bg-clip-text text-transparent"
                style={{ backgroundImage: isDark ? "linear-gradient(135deg,#00f5ff 20%,#7a00ff 80%)" : "linear-gradient(135deg,#2563eb 0%,#1e293b 100%)" }}>ABOS</span>
              <span className="text-[9px] font-semibold tracking-[0.12em] uppercase"
                style={{ color: isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.40)" }}>MarketSpace</span>
            </div>
          </Link>

          <GlobalSearch />
          <div className="flex-1" />

          <nav className="flex items-center gap-1.5">
            {TOP_ITEMS.map(({ path, label, icon: Icon, accent }) => {
              const active = pathname === path;
              return (
                <Link key={path} to={path}
                  className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all active:scale-95
                    ${active ? "text-white shadow-md" : accent ? "glass-pill text-[#E8A83A] hover:text-[#D4911A]" : "glass-pill text-[#0B2D5B]/70 dark:text-white/60 hover:text-[#0B2D5B] dark:hover:text-white"}`}
                  style={active ? { background: "linear-gradient(135deg,#f48120,#e07310)", boxShadow: "0 2px 14px rgba(244,129,32,0.30)" } : {}}>
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${accent && !active ? "animate-pulse" : ""}`} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}

            {/* Pricing */}
            <Link to="/pricing"
              className="flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-bold transition-all active:scale-95"
              style={{
                background: isDark ? "linear-gradient(135deg,rgba(212,160,23,0.18),rgba(166,124,0,0.12))" : "linear-gradient(135deg,rgba(212,160,23,0.12),rgba(166,124,0,0.08))",
                border: `1px solid ${isDark ? "rgba(212,160,23,0.30)" : "rgba(212,160,23,0.25)"}`,
                color: isDark ? "#F5C842" : "#A67C00",
              }}>
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Pricing</span>
            </Link>

            <ThemeToggle />

            {/* Tour */}
            <button onClick={() => { localStorage.removeItem("abos_tour_completed_v3"); window.dispatchEvent(new Event("abos-tour-open")); }}
              className="glass-pill w-9 h-9 flex items-center justify-center text-[#0B2D5B]/60 dark:text-white/60 hover:text-[#0B2D5B] dark:hover:text-white touch-target-compact transition-all active:scale-95"
              aria-label="Open guided tour" title="Platform tour">
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Auth */}
            {currentUser ? (
              <button onClick={() => base44.auth.logout()}
                className="glass-pill flex items-center gap-1.5 px-3 h-8 text-[11px] font-semibold text-[#0B2D5B]/60 dark:text-white/50 hover:text-[#0B2D5B] dark:hover:text-white transition-all active:scale-95">
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            ) : (
              <button onClick={() => base44.auth.redirectToLogin()}
                className="flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-bold text-white transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#f48120,#e07310)", boxShadow: "0 2px 12px rgba(244,129,32,0.35)" }}>
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Log In</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* ═══════════════════════════════════════
          CONTENT
      ═══════════════════════════════════════ */}
      <main id="main-content" className="flex-1 overflow-auto pb-4 lg:ml-[var(--sidebar-w)]"
        style={{ "--sidebar-w": `${SIDEBAR_COLLAPSED}px` }}>
        <div className="mx-auto w-full max-w-[1600px]">
          <Outlet />
        </div>
      </main>

      <SiteFooter />

      <ABOSTour />
    </div>
  );
}

// ═══════════════════════════════════════════
// SidebarSection — accordion section with localStorage persistence
// ═══════════════════════════════════════════
function SidebarSection({ section, isDark, pathname, collapsed, topMargin }) {
  const [open, toggle] = useSectionAccordion(section.key, section.defaultOpen !== false);

  return (
    <div className={topMargin ? "mt-4" : ""}>
      {/* Section header — click to toggle */}
      {!collapsed && (
        <button onClick={toggle}
          className="w-full flex items-center gap-2 px-3 pb-1.5 group"
        >
          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `${section.color}18`, border: `1px solid ${section.color}40` }}>
            <span className="text-[9px] font-black leading-none" style={{ color: section.color }}>
              {section.key === "marketspace" ? "1" : section.key === "intrazone" ? "2" : section.key === "account" ? "3" : "4"}
            </span>
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] flex-1 text-left" style={{ color: section.color }}>
            {section.label}
          </p>
          <ChevronDown
            className="w-3 h-3 shrink-0 transition-transform duration-200"
            style={{
              color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            }}
          />
        </button>
      )}

      {/* Collapsed divider (icon-only mode) */}
      {collapsed && (
        <div className="flex justify-center py-2">
          <div className="w-6 h-px" style={{ background: `${section.color}30` }} />
        </div>
      )}

      {/* Items */}
      {(open || collapsed) && (
        <div className="space-y-0.5">
          {section.items.map(({ path, label, icon: NavIcon }) => {
            const active = pathname === path;
            const sc = section.color;
            const inactiveColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)";
            const hoverColor = isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.75)";
            const hoverBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)";

            if (collapsed) {
              // ── Icon-only item ──
              return (
                <Link key={path} to={path}
                  className="flex items-center justify-center py-2.5 mx-1 rounded-xl transition-all duration-150"
                  style={{
                    color: active ? sc : inactiveColor,
                    background: active ? `${sc}14` : "transparent",
                    border: active ? `1px solid ${sc}38` : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = hoverBg;
                      e.currentTarget.style.color = sc;
                      e.currentTarget.style.border = isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.06)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = inactiveColor;
                      e.currentTarget.style.border = "1px solid transparent";
                    }
                  }}
                  title={label}
                >
                  <NavIcon className="w-4 h-4 shrink-0" />
                </Link>
              );
            }

            // ── Expanded item (with label) ──
            return (
              <Link key={path} to={path}
                className="relative flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-2xl text-[12px] font-semibold transition-all duration-150"
                style={{
                  color: active ? (isDark ? "#fff" : "#1e293b") : inactiveColor,
                  background: active ? `${sc}14` : "transparent",
                  border: active ? `1px solid ${sc}38` : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = hoverBg;
                    e.currentTarget.style.color = hoverColor;
                    e.currentTarget.style.border = isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.06)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = inactiveColor;
                    e.currentTarget.style.border = "1px solid transparent";
                  }
                }}
              >
                <NavIcon className="w-3.5 h-3.5 shrink-0" style={{ color: active ? sc : undefined }} />
                <span>{label}</span>
                {active && (
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full" style={{ background: `${sc}60` }} />
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: sc }} />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}