import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/useTheme";
import {
  LayoutDashboard, Plane, Radar, User, Menu,
  Handshake, Calculator, Users, BarChart3, TrendingUp,
  ArrowLeft, ChevronLeft, ChevronDown, Zap, LogIn, LogOut, CreditCard, ShieldCheck,
  HelpCircle, FileText, Globe, Layers, Map, Video }
from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import ABOSTour from "@/components/onboarding/ABOSTour";
import TopNav from "@/components/nav/TopNav";

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
      { path: "/faa-map", label: "FAA Map", icon: Map, desc: "Interactive FAA aircraft registry map with filters and N-number lookup" },
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
        style={{ borderBottom: "1px solid var(--abos-border-1)" }}>
        {isDesktop && !desktopHovered ? (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "var(--abos-gold-soft)",
                    boxShadow: "0 2px 16px rgba(232,168,58,0.20)",
                    border: "1px solid var(--abos-gold-border)",
                  }}>
                  <Plane className="w-4 h-4" style={{ color: "var(--abos-gold)" }} />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--abos-gold-soft)", border: "1px solid var(--abos-gold-border)" }}>
              <Plane className="w-4 h-4" style={{ color: "var(--abos-gold)" }} />
            </div>
            <div>
              <p className="text-[12px] font-black tracking-tight leading-none" style={{ color: "var(--abos-white)" }}>ABOS</p>
              <p className="text-[9px] mt-1 uppercase" style={{ color: "var(--abos-text-3)", letterSpacing: "0.12em" }}>Aircraft Intelligence</p>
            </div>
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
        style={{ borderTop: "1px solid var(--abos-border-1)" }}>
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
          background: "var(--abos-dark-mid)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid var(--abos-border-1)",
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
          background: "var(--abos-dark-mid)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid var(--abos-border-1)",
        }}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* ═══════════════════════════════════════
          TOP BAR — Marketspace full-width nav
      ═══════════════════════════════════════ */}
      <div className="lg:ml-[var(--sidebar-w)]" style={{ "--sidebar-w": `${SIDEBAR_COLLAPSED}px` }}>
        <TopNav currentUser={currentUser} onOpenSidebar={() => setMobileOpen((v) => !v)} />
      </div>

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
            style={{ background: "var(--abos-gold-soft)", border: "1px solid var(--abos-gold-border)" }}>
            <span className="text-[9px] font-black leading-none" style={{ color: "var(--abos-gold)" }}>
              {section.key === "marketspace" ? "1" : section.key === "intrazone" ? "2" : section.key === "account" ? "3" : "4"}
            </span>
          </div>
          <p className="text-[9px] font-black uppercase flex-1 text-left" style={{ color: "var(--abos-text-3)", letterSpacing: "0.12em" }}>
            {section.label}
          </p>
          <ChevronDown
            className="w-3 h-3 shrink-0 transition-transform duration-200"
            style={{
              color: "var(--abos-text-3)",
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            }}
          />
        </button>
      )}

      {/* Collapsed divider (icon-only mode) */}
      {collapsed && (
        <div className="flex justify-center py-2">
          <div className="w-6 h-px" style={{ background: "var(--abos-border-1)" }} />
        </div>
      )}

      {/* Items */}
      {(open || collapsed) && (
        <div className="space-y-0.5">
          {section.items.map(({ path, label, icon: NavIcon }) => {
            const active = pathname === path;
            const sc = "var(--abos-gold)";
            const inactiveColor = "var(--abos-text-3)";
            const hoverColor = "var(--abos-text-1)";
            const hoverBg = "var(--abos-surface-3)";

            if (collapsed) {
              // ── Icon-only item ──
              return (
                <Link key={path} to={path}
                  className="flex items-center justify-center py-2.5 mx-1 rounded-xl transition-all duration-150"
                  style={{
                    color: active ? sc : inactiveColor,
                    background: active ? "var(--abos-gold-soft)" : "transparent",
                    border: active ? "1px solid var(--abos-gold-border)" : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = hoverBg;
                      e.currentTarget.style.color = sc;
                      e.currentTarget.style.border = "1px solid var(--abos-border-2)";
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
                  color: active ? sc : inactiveColor,
                  background: active ? "var(--abos-gold-soft)" : "transparent",
                  border: active ? "1px solid var(--abos-gold-border)" : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = hoverBg;
                    e.currentTarget.style.color = hoverColor;
                    e.currentTarget.style.border = "1px solid var(--abos-border-2)";
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
                    <div className="w-1 h-1 rounded-full" style={{ background: "var(--abos-gold-border)" }} />
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