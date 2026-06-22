import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Zap, Plane, Map, CreditCard, Sparkles, Settings,
  Menu, ChevronLeft, ArrowLeft, LogIn, LogOut, BarChart2, FileBarChart,
  ShieldCheck, User, CheckCircle, Radar, FileText, TrendingUp, Calculator,
  GitCompare, Users, Lightbulb, Rocket, PlaneTakeoff, Search, MessageSquare,
  RefreshCw, List, ShoppingBag, Database, Mail, Crown, Globe, ShieldAlert,
} from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import GlobalSearch from "@/components/search/GlobalSearch";
import ABOSTour from "@/components/onboarding/ABOSTour";
import TierBadge from "@/components/TierBadge";
import SidebarLogo from "@/components/layout/SidebarLogo";
import SidebarSection from "@/components/layout/SidebarSection";

const COLLAPSED_W = 56;
const EXPANDED_W = 272;
const MOBILE_W = 272;
const BACK_BUTTON_ROUTES = [/^\/ati-passport\/[^/]+$/];

// ── Full sidebar structure: 4 accordion sections ──
const NAV_SECTIONS = [
  {
    label: "MarketSpace",
    subtitle: "Public Aircraft Intelligence",
    color: "#f48120",
    icon: Globe,
    items: [
      { path: "/",                label: "Dashboard",       icon: LayoutDashboard },
      { path: "/listings",        label: "Aircraft Register", icon: Plane },
      { path: "/ati-quick-score", label: "ATI Quick Score", icon: Zap },
      { path: "/ati-full-report", label: "ATI Full Report", icon: FileBarChart },
      { path: "/compare",         label: "Compare Aircraft", icon: GitCompare },
      { path: "/deal-radar",      label: "Deal Radar",      icon: Radar },
      { path: "/traffic",         label: "Live Traffic",    icon: Map },
      { path: "/community",       label: "Community",       icon: Users },
      { path: "/feature-requests", label: "Feature Requests", icon: Lightbulb },
      { path: "/ati-standard",    label: "ATI Standard",    icon: ShieldCheck },
      { path: "/soar",            label: "SOAR Hub",         icon: Rocket },
      { path: "/startup-hub",     label: "Start Up Hub",    icon: PlaneTakeoff },
      { path: "/ati-verify",      label: "ATI Verify",      icon: CheckCircle },
    ],
  },
  {
    label: "IntraZone",
    subtitle: "User Workspace & Analytics",
    color: "#D4A017",
    icon: Sparkles,
    items: [
      { path: "/intrazone",       label: "IntraZone Hub",    icon: Sparkles },
      { path: "/analytics",       label: "Market Analytics", icon: BarChart2 },
      { path: "/market-reports",  label: "Market Reports",   icon: FileText },
      { path: "/valuation",      label: "Valuation (OMVM)", icon: TrendingUp },
      { path: "/opex-calculator", label: "OPEX Calculator",  icon: Calculator },
      { path: "/escrow",          label: "Escrow & Deals",   icon: FileText },
      { path: "/leads",           label: "Leads (CRM)",      icon: Users },
      { path: "/pre-buy-inspection", label: "Pre-Buy Inspection", icon: Search },
      { path: "/max-chat",        label: "Ask Max",          icon: MessageSquare },
    ],
  },
  {
    label: "Account",
    subtitle: "Plans & Billing",
    color: "#6366f1",
    icon: User,
    items: [
      { path: "/pricing",      label: "Credits & Plans", icon: CreditCard },
      { path: "/subscription", label: "Subscription",    icon: RefreshCw },
      { path: "/my-account",   label: "My Account",       icon: User },
    ],
  },
  {
    label: "Admin",
    subtitle: "Platform Management",
    color: "#ef4444",
    icon: ShieldAlert,
    adminOnly: true,
    items: [
      { path: "/admin/listings",     label: "All Listings",   icon: List },
      { path: "/admin/marketplace",  label: "Marketplace",     icon: ShoppingBag },
      { path: "/admin/settings",     label: "Settings",         icon: Settings },
      { path: "/admin/supabase-sync", label: "Supabase Sync", icon: Database },
      { path: "/weekly-briefing",    label: "Weekly Briefing", icon: Mail },
      { path: "/skyboss",            label: "SkyBoss",          icon: Crown },
    ],
  },
];

function initials(user) {
  const name = user?.full_name || user?.email || "?";
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function SidebarContent({ pathname, user, collapsed, expandedSections, onToggleSection, onNavigate }) {
  const isAdmin = user?.role === "admin";
  const sections = NAV_SECTIONS.filter((s) => !s.adminOnly || isAdmin);

  return (
    <>
      {/* Logo */}
      <div style={{
        padding: collapsed ? "16px 0 14px" : "18px 16px 16px",
        borderBottom: "0.5px solid rgba(255,255,255,0.08)",
        display: "flex", justifyContent: collapsed ? "center" : "flex-start",
        overflow: "hidden",
      }}>
        <SidebarLogo />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: collapsed ? "6px 0 12px" : "6px 10px 12px" }}>
        {sections.map((section) => (
          <SidebarSection
            key={section.label}
            section={section}
            pathname={pathname}
            collapsed={collapsed}
            expanded={expandedSections[section.label] !== false}
            onToggle={() => onToggleSection(section.label)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Legal Footer (only when expanded) */}
      {!collapsed && (
        <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", padding: "12px 16px 16px", marginTop: "auto" }}>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", margin: "0 0 6px", letterSpacing: "0.02em" }}>© 2026 ABOS s.r.o.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <a href="/terms" style={{ fontSize: "10px", color: "rgba(255,255,255,0.30)", textDecoration: "none" }}>Terms of Service</a>
            <a href="/privacy" style={{ fontSize: "10px", color: "rgba(255,255,255,0.30)", textDecoration: "none" }}>Privacy Policy</a>
            <a href="/legal/dsa" style={{ fontSize: "10px", color: "rgba(255,255,255,0.30)", textDecoration: "none" }}>DSA — Report Content</a>
            <a href="/legal/ai-transparency" style={{ fontSize: "10px", color: "rgba(255,255,255,0.30)", textDecoration: "none" }}>AI Disclosure</a>
            <button onClick={() => window.ABOS_openCookieSettings?.()}
              style={{ background: "transparent", border: "none", padding: 0, textAlign: "left", fontSize: "10px", color: "rgba(255,255,255,0.30)", cursor: "pointer" }}>
              Cookie Settings
            </button>
          </div>
        </div>
      )}

      {/* User info */}
      <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)", padding: collapsed ? "12px 0" : "12px 16px", overflow: "hidden" }}>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: collapsed ? "center" : "flex-start" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#f5c242", fontSize: "11px", fontWeight: 600 }}>{initials(user)}</span>
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: "12px", fontWeight: 500, color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.full_name || user.email}
                </p>
                <div style={{ marginTop: "3px" }}>
                  <TierBadge tier={user.subscription_tier || user.tier || "free_explorer"} />
                </div>
              </div>
            )}
            {!collapsed && (
              <button onClick={() => base44.auth.logout()} aria-label="Log out"
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex", padding: "4px" }}>
                <LogOut size={14} />
              </button>
            )}
          </div>
        ) : (
          !collapsed && (
            <button onClick={() => base44.auth.redirectToLogin()}
              style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", justifyContent: "center", background: "#f5c242", color: "#04060a", border: "none", borderRadius: "8px", padding: "9px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              <LogIn size={14} /> Log In
            </button>
          )
        )}
      </div>
    </>
  );
}

// ── Header pill button ──
function HeaderPill({ to, icon: Icon, label }) {
  return (
    <Link to={to} style={{
      display: "flex", alignItems: "center", gap: "6px",
      padding: "7px 14px", borderRadius: "999px",
      background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.12)",
      fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.70)",
      textDecoration: "none", transition: "background 150ms, color 150ms, border-color 150ms",
      flexShrink: 0,
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.90)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.70)"; }}
    >
      <Icon size={14} />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const touchStartX = useRef(null);

  const showBack = BACK_BUTTON_ROUTES.some((re) => re.test(pathname));

  const { data: currentUser } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const toggleSection = (label) => {
    setExpandedSections((prev) => ({ ...prev, [label]: prev[label] === false ? true : false }));
  };

  // Swipe from left edge to open mobile drawer
  useEffect(() => {
    const onStart = (e) => { const x = e.touches[0].clientX; if (x < 20) touchStartX.current = x; };
    const onEnd = (e) => {
      if (touchStartX.current == null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (dx > 60) setMobileOpen(true);
      touchStartX.current = null;
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => { document.removeEventListener("touchstart", onStart); document.removeEventListener("touchend", onEnd); };
  }, []);

  const desktopWidth = hovered ? EXPANDED_W : COLLAPSED_W;

  return (
    <div className="flex flex-col min-h-screen font-sans" style={{ background: "#04060a" }}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#f5c242] focus:text-[#04060a] focus:rounded-xl focus:text-sm focus:font-bold">
        Skip to content
      </a>

      {/* Ambient glow */}
      <div aria-hidden style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "400px",
        background: "radial-gradient(ellipse at 8% 12%, rgba(245,194,66,0.06) 0%, transparent 52%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* ── Desktop sidebar (collapsible on hover) ── */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-50 flex-col"
        style={{
          width: desktopWidth,
          background: "#0d1117",
          borderRight: "0.5px solid rgba(255,255,255,0.08)",
          transition: "width 200ms cubic-bezier(0.16,1,0.3,1)",
          overflow: "hidden",
          boxShadow: hovered ? "4px 0 24px rgba(0,0,0,0.4)" : "none",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <SidebarContent
          pathname={pathname}
          user={currentUser}
          collapsed={!hovered}
          expandedSections={expandedSections}
          onToggleSection={toggleSection}
        />
      </aside>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      )}
      <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-50 flex flex-col transition-transform duration-300"
        style={{
          width: MOBILE_W, background: "#0d1117", borderRight: "0.5px solid rgba(255,255,255,0.08)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        }}>
        <div className="flex justify-end px-3 pt-3">
          <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
            style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={15} />
          </button>
        </div>
        <SidebarContent
          pathname={pathname}
          user={currentUser}
          collapsed={false}
          expandedSections={expandedSections}
          onToggleSection={toggleSection}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 lg:ml-[56px]"
        style={{ background: "rgba(4,6,10,0.92)", backdropFilter: "blur(16px)", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2.5 px-4 sm:px-6 h-[58px]">
          {showBack ? (
            <button onClick={() => navigate(-1)} aria-label="Go back"
              style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "6px 12px", color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: 600 }}>
              <ArrowLeft size={15} /> <span className="hidden sm:inline">Back</span>
            </button>
          ) : (
            <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="lg:hidden"
              style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Menu size={16} />
            </button>
          )}

          {/* Mobile logo */}
          <Link to="/" className="lg:hidden">
            <SidebarLogo />
          </Link>

          <GlobalSearch />
          <div className="flex-1" />

          {/* Right pill buttons */}
          <div className="flex items-center gap-2">
            <HeaderPill to="/escrow" icon={FileText} label="Escrow" />
            <HeaderPill to="/my-account" icon={User} label="Account" />
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main id="main-content" className="flex-1 overflow-auto lg:ml-[56px] relative z-10"
        style={{
          background: "#04060a",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.09) 1.5px, transparent 1.5px)",
          backgroundSize: "40px 40px",
        }}>
        <div className="mx-auto w-full max-w-[1600px]">
          <Outlet />
        </div>
      </main>

      <SiteFooter />
      <ABOSTour />
    </div>
  );
}