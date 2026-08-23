import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  ChevronLeft, ArrowLeft, LogIn, LogOut, MapPin, Menu } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import ABOSTour from "@/components/onboarding/ABOSTour";
import MarketspaceTour from "@/components/marketspace-tour/MarketspaceTour";
import TierBadge from "@/components/TierBadge";
import SidebarLogo from "@/components/layout/SidebarLogo";
import NavItem from "@/components/layout/NavItem";
import ThemeToggle from "@/components/ThemeToggle";
import PillCommandBar from "@/components/layout/PillCommandBar";
import MobilePillNav from "@/components/layout/MobilePillNav";
import PragueClock from "@/components/layout/PragueClock";
import AccountMenu from "@/components/layout/AccountMenu";
import DotGrid from "@/components/layout/DotGrid";
import UniversalSearchBar from "@/components/search/UniversalSearchBar";
import { NAV_TREE } from "@/components/layout/navConfig";
import { useTheme } from "@/lib/useTheme";


function initials(user) {
  const name = user?.full_name || user?.email || "?";
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function DrawerContent({ pathname, user, onNavigate, isDark }) {
  const tx = (darkVal, lightVal) => (isDark ? darkVal : lightVal);
  const cardBg = tx("rgba(255,255,255,0.03)", "rgba(0,0,0,0.03)");
  const border = tx("rgba(255,255,255,0.08)", "rgba(0,0,0,0.08)");
  const text = tx("rgba(255,255,255,0.75)", "rgba(0,0,0,0.75)");
  const textDim = tx("rgba(255,255,255,0.35)", "rgba(0,0,0,0.40)");
  const textFaint = tx("rgba(255,255,255,0.25)", "rgba(0,0,0,0.30)");

  return (
    <>
      {/* Logo + status bar */}
      <div style={{ padding: "14px 16px 12px", borderBottom: `0.5px solid ${border}` }}>
        <SidebarLogo />
        {/* Time / Location / Theme status bar */}
        <div
          className="flex items-center justify-between gap-2 mt-3 px-3 py-2 rounded-xl"
          style={{ background: cardBg, border: `0.5px solid ${border}` }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin size={11} style={{ color: "#D4A017", flexShrink: 0 }} />
            <PragueClock />
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Smart search */}
      <div style={{ padding: "10px 12px 6px" }}>
        <UniversalSearchBar />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "6px 10px 12px" }}>
        {NAV_TREE.map((section) =>
          <div key={section.label} style={{ marginTop: 8 }}>
            <NavItem
              to={section.path}
              icon={section.icon}
              label={section.label}
              active={pathname === section.path || (section.path !== "/" && pathname.startsWith(section.path + "/"))}
              onClick={onNavigate} />
          </div>
        )}
      </nav>

      {/* Legal Footer */}
      <div style={{
        borderTop: `0.5px solid ${border}`,
        padding: "16px 16px 20px",
        marginTop: "auto"
      }}>
        <p style={{ fontSize: "10px", color: textFaint, margin: "0 0 8px", letterSpacing: "0.02em" }}>
          © 2026 ABOS s.r.o.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <Link to="/terms" style={{ fontSize: "10px", color: textDim, textDecoration: "none", letterSpacing: "0.02em" }}>
            Terms of Service
          </Link>
          <Link to="/privacy" style={{ fontSize: "10px", color: textDim, textDecoration: "none", letterSpacing: "0.02em" }}>
            Privacy Policy
          </Link>
          <Link to="/legal/dsa" style={{ fontSize: "10px", color: textDim, textDecoration: "none", letterSpacing: "0.02em" }}>
            DSA — Report Content
          </Link>
          <Link to="/legal/ai-transparency" style={{ fontSize: "10px", color: textDim, textDecoration: "none", letterSpacing: "0.02em" }}>
            AI Disclosure
          </Link>
          <Link to="/legal/ip-notice" style={{ fontSize: "10px", color: textDim, textDecoration: "none", letterSpacing: "0.02em" }}>
            IP & Trademark Notice
          </Link>
          <button
            onClick={() => window.ABOS_openCookieSettings?.()}
            style={{ background: "transparent", border: "none", padding: 0, textAlign: "left", fontSize: "10px", color: textDim, cursor: "pointer", letterSpacing: "0.02em" }}>
            
            Cookie Settings
          </button>
        </div>
      </div>

      {/* User info */}
      <div style={{ borderTop: `0.5px solid ${border}`, padding: "12px 16px" }}>
        {user ?
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(212,160,23,0.09)", border: "0.5px solid rgba(212,160,23,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#D4A017", fontSize: "11px", fontWeight: 600 }}>{initials(user)}</span>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: 500, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.full_name || user.email}
              </p>
              <div style={{ marginTop: "3px" }}>
                <TierBadge tier={user.subscription_tier || user.tier || "free_explorer"} />
              </div>
            </div>
            <button onClick={() => base44.auth.logout()} aria-label="Log out"
          style={{ background: "none", border: "none", cursor: "pointer", color: textDim, display: "flex", padding: "4px" }}>
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
  const isDark = useTheme();

  const isHomepage = pathname === "/";
  const isWorkspace = pathname === "/intrazone" || pathname.startsWith("/intrazone/");
  const showBack = !isHomepage && !isWorkspace;

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

    const onOpenDrawer = () => setMobileOpen(true);
    window.addEventListener("abos-open-drawer", onOpenDrawer);

    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
      window.removeEventListener("abos-open-drawer", onOpenDrawer);
    };
  }, []);

  const layoutBg = isDark
    ? { background: "#04060a", backgroundImage: "radial-gradient(ellipse at 8% 12%, rgba(245,194,66,0.14) 0%, transparent 52%), radial-gradient(ellipse at 92% 88%, rgba(93,202,165,0.12) 0%, transparent 52%), radial-gradient(ellipse at 85% 8%, rgba(78,142,247,0.07) 0%, transparent 40%)" }
    : { background: "#f7f8fa", backgroundImage: "radial-gradient(ellipse at 8% 12%, rgba(212,160,23,0.035) 0%, transparent 48%), radial-gradient(ellipse at 92% 88%, rgba(93,202,165,0.025) 0%, transparent 48%), radial-gradient(ellipse at 85% 8%, rgba(78,142,247,0.025) 0%, transparent 38%)" };

  return (
    <div className="relative flex flex-col min-h-screen font-sans" style={layoutBg}>
      {!isWorkspace && <DotGrid />}
      {!isWorkspace && <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-8deg)", opacity: isDark ? 0.055 : 0.018, pointerEvents: "none", zIndex: 0 }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 172 106" width="480" height="296">
          <defs>
            <marker id="wm-arr" markerWidth="9" markerHeight="9" refX="8.5" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
              <polygon points="0,0 9,4.5 0,9" fill={isDark ? "white" : "#111827"} />
            </marker>
          </defs>
          <polyline points="2,98 52,8 70,98" stroke={isDark ? "white" : "#111827"} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <polyline points="70,98 86,48 102,70 122,14 140,80 156,57" stroke={isDark ? "white" : "#111827"} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" markerEnd="url(#wm-arr)" />
        </svg>
        <div style={{ textAlign: "center", marginTop: 18, color: isDark ? "#fff" : "#111827", fontFamily: "Inter, -apple-system, sans-serif" }}>
          <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-0.03em" }}>
            ABOS<span style={{ fontSize: 18, fontWeight: 600, verticalAlign: "super", marginLeft: 2 }}>™</span>
          </span>
          <span style={{ display: "block", fontSize: 15, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", marginTop: 6 }}>
            Marketspace<span style={{ fontSize: 10, verticalAlign: "super", marginLeft: 2 }}>™</span>
          </span>
        </div>
      </div>}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#D4A017] focus:text-[#0B1220] focus:rounded-xl focus:text-sm focus:font-bold">
        Skip to content
      </a>

      {/* ── Mobile drawer ── */}
      {mobileOpen &&
      <div className="fixed inset-0 z-[55] lg:hidden" onClick={() => setMobileOpen(false)}
      style={{ background: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)", backdropFilter: isDark ? "blur(4px)" : "none" }} />
      }
      <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-[60] flex flex-col transition-transform duration-300 w-[85vw] max-w-[300px] overflow-y-auto"
      style={{
        background: isDark ? "#111827" : "#ffffff", borderRight: `0.5px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        transform: mobileOpen ? "translateX(0)" : "translateX(-100%)"
      }}>
        <div className="flex justify-end px-3 pt-3 safe-top">
          <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
          style={{ width: "44px", height: "44px", borderRadius: "50%", background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", border: `0.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`, color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ChevronLeft size={18} />
          </button>
        </div>
        <DrawerContent pathname={pathname} user={currentUser} onNavigate={() => setMobileOpen(false)} isDark={isDark} />
      </aside>

      {/* ── Top header bar ── (suppressed on homepage — HomepageHeader takes over) */}
      {!isHomepage && !isWorkspace && (
      <header className="sticky top-0 z-40"
      style={{ background: isDark ? "rgba(4,6,10,0.92)" : "rgba(255,255,255,0.96)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"}` }}>
        {/* Single row: logo (centered, dominant) | pill bar (desktop) | controls */}
        <div className="flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-8 h-[64px] safe-left safe-right">
          {/* Left: back + dominant logo — centered with equal flex */}
          <div className="flex items-center gap-3 min-w-0 shrink-0 flex-1 lg:flex-none lg:w-[260px]">
            <button onClick={() => setMobileOpen(true)} aria-label="Open menu"
            style={{ width: "40px", height: "40px", borderRadius: "8px", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: `0.5px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Menu size={18} />
            </button>
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

        {/* Mobile only: compact icon pill nav on second row */}
        <div className="lg:hidden flex items-center justify-center pb-2 px-4">
          <MobilePillNav />
        </div>
      </header>
      )}

      {/* ── Content ── full width ── */}
      <main id="main-content" className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden" style={{ background: "transparent" }}>
          <Outlet />
      </main>

      {!isWorkspace && <SiteFooter />}
      <ABOSTour />
      <MarketspaceTour />
    </div>);

}