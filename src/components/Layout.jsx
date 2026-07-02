import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  ChevronLeft, ArrowLeft, LogIn, LogOut,
  LayoutDashboard } from "lucide-react";
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
import { NAV_TREE } from "@/components/layout/navConfig";

// Home link for the drawer
const HOME_ITEM = { path: "/", label: "Dashboard", icon: LayoutDashboard };


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
        {/* Home shortcut */}
        <div style={{ marginBottom: 4 }}>
          <NavItem
            to={HOME_ITEM.path}
            icon={HOME_ITEM.icon}
            label={HOME_ITEM.label}
            active={pathname === "/"}
            onClick={onNavigate} />
        </div>

        {NAV_TREE.map((section) =>
          <div key={section.label}>
            <div style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(212,160,23,0.55)",
              padding: "16px 16px 4px",
              marginTop: 4,
            }}>
              {section.label}
            </div>
            {section.categories.map((cat) =>
              <div key={cat.label} style={{ marginBottom: 2 }}>
                <div style={{
                  fontSize: "8px",
                  fontWeight: 600,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                  padding: "8px 16px 2px",
                }}>
                  {cat.label}
                </div>
                {cat.items.map((item) =>
                  <NavItem
                    key={item.path}
                    to={item.path}
                    icon={item.icon}
                    label={item.label}
                    active={pathname === item.path || pathname.startsWith(item.path + "/")}
                    onClick={onNavigate} />
                )}
              </div>
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

  const isHomepage = pathname === "/";
  const showBack = !isHomepage;

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
      {!isHomepage && mobileOpen &&
      <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      }
      {!isHomepage && (
      <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-50 flex flex-col transition-transform duration-300 w-[85vw] max-w-[300px] overflow-y-auto"
      style={{
        background: "#111827", borderRight: "0.5px solid rgba(255,255,255,0.08)",
        transform: mobileOpen ? "translateX(0)" : "translateX(-100%)"
      }}>
        <div className="flex justify-end px-3 pt-3 safe-top">
          <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
          style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ChevronLeft size={18} />
          </button>
        </div>
        <DrawerContent pathname={pathname} user={currentUser} onNavigate={() => setMobileOpen(false)} />
      </aside>
      )}

      {/* ── Top header bar ── (suppressed on homepage — HomepageHeader takes over) */}
      {!isHomepage && (
      <header className="sticky top-0 z-40"
      style={{ background: "rgba(4,6,10,0.92)", backdropFilter: "blur(16px)", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
        {/* Single row: logo (centered, dominant) | pill bar (desktop) | controls */}
        <div className="flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-8 h-[64px] safe-left safe-right">
          {/* Left: back + dominant logo — centered with equal flex */}
          <div className="flex items-center gap-3 min-w-0 shrink-0 flex-1 lg:flex-none lg:w-[260px]">
            {showBack &&
            <button onClick={() => navigate(-1)} aria-label="Go back"
            style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "8px", color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: 600, flexShrink: 0, minWidth: 44, minHeight: 36, justifyContent: "center" }}>
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
            <ThemeToggle />
            <PragueClock />
            {currentUser ?
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <Link to="/my-account"
                  style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(212,160,23,0.09)", border: "0.5px solid rgba(212,160,23,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, textDecoration: "none" }}>
                  <span style={{ color: "#D4A017", fontSize: "11px", fontWeight: 600 }}>{initials(currentUser)}</span>
                </Link>
                <button onClick={() => base44.auth.logout()} aria-label="Log out" title="Log out"
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex", padding: "8px", flexShrink: 0 }}>
                  <LogOut size={16} />
                </button>
              </div> :

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
      <main id="main-content" className={`relative z-10 flex-1 overflow-y-auto overflow-x-hidden ${isHomepage ? "pb-14 lg:pb-0" : ""}`} style={{ background: "transparent" }}>
          <Outlet />
      </main>

      {isHomepage && <div className="h-14 lg:hidden shrink-0" />}
      <SiteFooter />
      <ABOSTour />
    </div>);

}