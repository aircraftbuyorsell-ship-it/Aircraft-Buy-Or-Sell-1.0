import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Zap, Plane, Map,
  Sparkles, Menu, ChevronLeft, ArrowLeft, LogIn, LogOut,
  BarChart2, FileBarChart, Shield, User, CheckCircle, Radar, FileText, GitBranch, Search, Brain } from
"lucide-react";
import SiteFooter from "@/components/SiteFooter";
import ABOSTour from "@/components/onboarding/ABOSTour";
import TierBadge from "@/components/TierBadge";
import SidebarLogo from "@/components/layout/SidebarLogo";
import NavItem from "@/components/layout/NavItem";
import ThemeToggle from "@/components/ThemeToggle";
import PillCommandBar from "@/components/layout/PillCommandBar";

const BACK_BUTTON_ROUTES = [/^\/ati-passport\/[^/]+$/];

// ── Full nav list for mobile drawer ──
const NAV_SECTIONS = [
{
  label: "Discover",
  items: [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/listings", label: "Aircraft Listings", icon: Plane },
  { path: "/faa-map", label: "FAA Map", icon: Map },
  { path: "/analytics", label: "Market Analytics", icon: BarChart2 },
  { path: "/search-console", label: "Search Console", icon: Search }]

},
{
  label: "Intelligence",
  items: [
  { path: "/ati-quick-score", label: "ATI Quick Score", icon: Zap },
  { path: "/ati-full-report", label: "ATI Full Report", icon: FileBarChart },
  { path: "/ati-standard", label: "ATI Passport", icon: Shield },
  { path: "/demo", label: "IntraZone Demo", icon: Sparkles }]

},
{
  label: "Account",
  items: [
  { path: "/my-account", label: "Profile & Settings", icon: User },
  { path: "/pricing", label: "Credits & Benefits", icon: Shield },
  { path: "/ati-verify", label: "Verification Center", icon: CheckCircle }]

},
{
  label: "Deals",
  items: [
  { path: "/deal-radar", label: "Deal Radar", icon: Radar },
  { path: "/funnels", label: "Funnel Builder", icon: GitBranch },
  { path: "/deal-intelligence", label: "Deal Intelligence", icon: Brain },
  { path: "/escrow", label: "Hustl Contract", icon: FileText }]

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
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#f5c242", fontSize: "11px", fontWeight: 600 }}>{initials(user)}</span>
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
        style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", justifyContent: "center", background: "#f5c242", color: "#04060a", border: "none", borderRadius: "8px", padding: "9px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
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
  const [pragueNow, setPragueNow] = useState(new Date());
  const touchStartX = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setPragueNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pragueDateStr = pragueNow.toLocaleDateString("en-GB", { timeZone: "Europe/Prague", day: "2-digit", month: "2-digit", year: "numeric" });
  const pragueTimeStr = pragueNow.toLocaleTimeString("en-GB", { timeZone: "Europe/Prague", hour: "2-digit", minute: "2-digit", second: "2-digit" });

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
    <div className="flex flex-col min-h-screen font-sans" style={{ background: "#04060a" }}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#f5c242] focus:text-[#04060a] focus:rounded-xl focus:text-sm focus:font-bold">
        Skip to content
      </a>

      {/* ── Mobile drawer ── */}
      {mobileOpen &&
      <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      }
      <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-50 flex flex-col transition-transform duration-300"
      style={{
        width: 220, background: "#0d1117", borderRight: "0.5px solid rgba(255,255,255,0.08)",
        transform: mobileOpen ? "translateX(0)" : "translateX(-100%)"
      }}>
        <div className="flex justify-end px-3 pt-3">
          <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
          style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={15} />
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
              </button> :

            <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="lg:hidden"
            style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Menu size={16} />
              </button>
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
            <div className="hidden sm:flex flex-col items-end" style={{ lineHeight: 1.2 }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#f5c242", fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>
                {pragueTimeStr}
              </span>
              <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {pragueDateStr} · Prague
              </span>
            </div>
            {currentUser ?
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "#f5c242", fontSize: "11px", fontWeight: 600 }}>{initials(currentUser)}</span>
                </div>
                <button onClick={() => base44.auth.logout()} aria-label="Log out" title="Log out"
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex", padding: "4px" }}>
                  <LogOut size={14} />
                </button>
              </div> :

            <button onClick={() => base44.auth.redirectToLogin()}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f5c242", color: "#04060a", border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                <LogIn size={13} /> Log In
              </button>
            }
          </div>
        </div>

        {/* Row 2: floating pill command bar — lower */}
        <div className="hidden lg:flex items-center justify-center pb-2.5 opacity-100">
          <PillCommandBar />
        </div>
      </header>

      {/* ── Content ── full width ── */}
      <main id="main-content" className="flex-1 overflow-auto" style={{ background: "#04060a" }}>
        <div className="mx-auto w-full max-w-[1600px]">
          <Outlet />
        </div>
      </main>

      <SiteFooter />
      <ABOSTour />
    </div>);

}