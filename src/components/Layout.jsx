import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Zap, Plane, Map,
  Sparkles, Menu, ChevronLeft, ArrowLeft, LogIn, LogOut,
  BarChart2, FileBarChart, Shield, User, CheckCircle, Radar, FileText, GitBranch, Search, Brain,
  Calculator, Users, TrendingUp, Code, Scale } from
"lucide-react";
import SiteFooter from "@/components/SiteFooter";
import ABOSTour from "@/components/onboarding/ABOSTour";
import TierBadge from "@/components/TierBadge";
import SidebarLogo from "@/components/layout/SidebarLogo";
import NavItem from "@/components/layout/NavItem";
import ThemeToggle from "@/components/ThemeToggle";
import PillCommandBar from "@/components/layout/PillCommandBar";
import MobilePillNav from "@/components/layout/MobilePillNav";
import PragueClock from "@/components/layout/PragueClock";
import DotGrid from "@/components/layout/DotGrid";

const BACK_BUTTON_ROUTES = [/^\/ati-passport\/[^/]+$/];

// ── Full nav list for mobile drawer ──
const NAV_SECTIONS = [
{
  label: "Home",
  items: [
  { path: "/", label: "Dashboard", icon: LayoutDashboard }]
},
{
  label: "Marketplace",
  items: [
  { path: "/listings", label: "Aircraft Listings", icon: Plane },
  { path: "/compare", label: "Compare Aircraft", icon: Scale },
  { path: "/deal-radar", label: "Deal Radar", icon: Radar },
  { path: "/escrow", label: "Escrow", icon: Shield },
  { path: "/pre-buy-inspection", label: "Pre-buy Inspection", icon: CheckCircle }]
},
{
  label: "Intelligence",
  items: [
  { path: "/analytics", label: "Analytics", icon: BarChart2 },
  { path: "/market-reports", label: "Market Reports", icon: FileText },
  { path: "/traffic", label: "Traffic Maps", icon: Plane },
  { path: "/faa-map", label: "FAA Registry", icon: Map }]
},
{
  label: "ATI",
  items: [
  { path: "/ati-quick-score", label: "Quick Score", icon: Zap },
  { path: "/ati-standard", label: "Standard", icon: Shield },
  { path: "/ati-full-report", label: "Full Report", icon: FileBarChart },
  { path: "/ati-verify", label: "Verification", icon: CheckCircle },
  { path: "/ati-passport", label: "Passport", icon: Shield }]
},
{
  label: "Tools",
  items: [
  { path: "/opex-calculator", label: "OPEX Calculator", icon: Calculator },
  { path: "/valuation", label: "Valuation", icon: TrendingUp }]
},
{
  label: "Community",
  items: [
  { path: "/community", label: "ABOS Community", icon: Users },
  { path: "/weekly-briefing", label: "Weekly Briefings", icon: FileText },
  { path: "/feature-requests", label: "Feature Requests", icon: GitBranch }]
},
{
  label: "Developers",
  items: [
  { path: "/developers", label: "API & SDK", icon: Code }]
},
{
  label: "Account",
  items: [
  { path: "/my-account", label: "Profile & Settings", icon: User },
  { path: "/pricing", label: "Credits & Benefits", icon: Shield }]
},
{
  label: "Admin",
  items: [
  { path: "/admin/settings", label: "Admin Settings", icon: Shield },
  { path: "/admin/listings", label: "Admin Listings", icon: Shield }]
}];


function initials(user) {
  const name = user?.full_name || user?.email || "?";
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function DrawerContent({ pathname, user, onNavigate }) {
  return (
    <>
      {/* Logo */}
      <div style={{ padding: "18px 16px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
        <SidebarLogo />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "6px 10px 12px" }}>
        {NAV_SECTIONS.map((section) =>
        <div key={section.label}>
            <div style={{
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
            padding: "16px 16px 6px",
            marginTop: "4px"
          }}>
              {section.label}
            </div>
            {section.items.map((item) =>
          <NavItem
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={item.label}
            active={pathname === item.path}
            onClick={onNavigate} />

          )}
          </div>
        )}
      </nav>

      {/* Legal Footer */}
      <div style={{
        borderTop: "0.5px solid rgba(255,255,255,0.06)",
        padding: "16px 16px 20px",
        marginTop: "auto"
      }}>
        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", margin: "0 0 8px", letterSpacing: "0.02em" }}>
          © 2026 ABOS s.r.o.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <a href="/terms" style={{ fontSize: "10px", color: "rgba(255,255,255,0.30)", textDecoration: "none", letterSpacing: "0.02em" }}>
            Terms of Service
          </a>
          <a href="/privacy" style={{ fontSize: "10px", color: "rgba(255,255,255,0.30)", textDecoration: "none", letterSpacing: "0.02em" }}>
            Privacy Policy
          </a>
          <a href="/legal/dsa" style={{ fontSize: "10px", color: "rgba(255,255,255,0.30)", textDecoration: "none", letterSpacing: "0.02em" }}>
            DSA — Report Content
          </a>
          <a href="/legal/ai-transparency" style={{ fontSize: "10px", color: "rgba(255,255,255,0.30)", textDecoration: "none", letterSpacing: "0.02em" }}>
            AI Disclosure
          </a>
          <button
            onClick={() => window.ABOS_openCookieSettings?.()}
            style={{ background: "transparent", border: "none", padding: 0, textAlign: "left", fontSize: "10px", color: "rgba(255,255,255,0.30)", cursor: "pointer", letterSpacing: "0.02em" }}>
            
            Cookie Settings
          </button>
        </div>
      </div>

      {/* User info */}
      <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)", padding: "12px 16px" }}>
        {user ?
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(212,160,23,0.09)", border: "0.5px solid rgba(212,160,23,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#D4A017", fontSize: "11px", fontWeight: 600 }}>{initials(user)}</span>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: 500, color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.full_name || user.email}
              </p>
              <div style={{ marginTop: "3px" }}>
                <TierBadge tier={user.subscription_tier || user.tier || "free_explorer"} />
              </div>
            </div>
            <button onClick={() => base44.auth.logout()} aria-label="Log out"
          style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex", padding: "4px" }}>
              <LogOut size={14} />
            </button>
          </div> :

        <button onClick={() => base44.auth.redirectToLogin()}
        style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", justifyContent: "center", background: "#D4A017", color: "#0B1220", border: "none", borderRadius: "8px", padding: "9px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            <LogIn size={14} /> Log In
          </button>
        }
      </div>
    </>);

}

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const touchStartX = useRef(null);

  const showBack = BACK_BUTTON_ROUTES.some((re) => re.test(pathname));

  const { data: currentUser } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  useEffect(() => {setMobileOpen(false);}, [pathname]);

  // Swipe from left edge to open mobile drawer
  useEffect(() => {
    const onStart = (e) => {const x = e.touches[0].clientX;if (x < 20) touchStartX.current = x;};
    const onEnd = (e) => {
      if (touchStartX.current == null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (dx > 60) setMobileOpen(true);
      touchStartX.current = null;
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {document.removeEventListener("touchstart", onStart);document.removeEventListener("touchend", onEnd);};
  }, []);

  return (
    <div className="relative flex flex-col min-h-screen font-sans" style={{
      background: "#04060a",
      backgroundImage: "radial-gradient(ellipse at 8% 12%, rgba(245,194,66,0.14) 0%, transparent 52%), radial-gradient(ellipse at 92% 88%, rgba(93,202,165,0.12) 0%, transparent 52%), radial-gradient(ellipse at 85% 8%, rgba(78,142,247,0.07) 0%, transparent 40%)",
    }}>
      <DotGrid />
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
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#D4A017] focus:text-[#0B1220] focus:rounded-xl focus:text-sm focus:font-bold">
        Skip to content
      </a>

      {/* ── Mobile drawer ── */}
      {mobileOpen &&
      <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      }
      <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-50 flex flex-col transition-transform duration-300"
      style={{
        width: 220, background: "#111827", borderRight: "0.5px solid rgba(255,255,255,0.08)",
        transform: mobileOpen ? "translateX(0)" : "translateX(-100%)"
      }}>
        <div className="flex justify-end px-3 pt-3">
          <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
          style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={18} />
          </button>
        </div>
        <DrawerContent pathname={pathname} user={currentUser} onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* ── Top header bar ── */}
      <header className="sticky top-0 z-40"
      style={{ background: "rgba(4,6,10,0.92)", backdropFilter: "blur(16px)", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
        {/* Row 1: logo | theme + datetime + user */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-[54px]">
          {/* Left: logo (desktop) / hamburger + logo (mobile) */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {showBack ?
            <button onClick={() => navigate(-1)} aria-label="Go back"
            style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "6px 12px", color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: 600 }}>
                <ArrowLeft size={15} /> <span className="hidden sm:inline">Back</span>
              </button> : null





            }
            <Link to="/" className="hidden lg:block">
              <SidebarLogo />
            </Link>
            <Link to="/" className="lg:hidden">
              <SidebarLogo />
            </Link>
          </div>

          {/* Right: theme toggle + Prague date/time + user */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <ThemeToggle />
            {/* Prague date/time — under logout, upper right */}
            <PragueClock />
            {currentUser ?
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(212,160,23,0.09)", border: "0.5px solid rgba(212,160,23,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "#D4A017", fontSize: "11px", fontWeight: 600 }}>{initials(currentUser)}</span>
                </div>
                <button onClick={() => base44.auth.logout()} aria-label="Log out" title="Log out"
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex", padding: "4px" }}>
                  <LogOut size={14} />
                </button>
              </div> :

            <button onClick={() => base44.auth.redirectToLogin()}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "#D4A017", color: "#0B1220", border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                <LogIn size={13} /> Log In
              </button>
            }
          </div>
        </div>

        {/* Row 2: floating pill command bar — lower (desktop) */}
        <div className="hidden lg:flex items-center justify-center pb-2.5 opacity-100">
          <PillCommandBar />
        </div>
        {/* Row 2 mobile: compact icon pill nav */}
        <div className="lg:hidden flex items-center justify-center pb-2 px-4">
          <MobilePillNav />
        </div>
      </header>

      {/* ── Content ── full width ── */}
      <main id="main-content" className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden" style={{ background: "transparent" }}>
          <Outlet />
      </main>

      <SiteFooter />
      <ABOSTour />
    </div>);

}