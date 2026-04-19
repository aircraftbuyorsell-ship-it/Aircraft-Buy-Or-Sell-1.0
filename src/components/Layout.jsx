import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Plane, Radar, User, Menu, X, ShieldCheck, Users,
  Palette, Zap, Calculator, MapPin, BadgeCheck, Handshake, Radio, Gift, Bell,
  ChevronLeft, ArrowLeft, Music, BarChart3,
} from "lucide-react";
import MobileBottomNav from "@/components/MobileBottomNav";

// Routes considered "child" screens that show a back button.
// Any route deeper than these (with a param) also qualifies.
const BACK_BUTTON_ROUTES = [
  /^\/ati-passport\/[^/]+$/,
];
// Top-level pages that should NEVER show a back button (main tabs)
const TOP_LEVEL = new Set(["/", "/listings", "/deal-radar", "/my-account", "/live-traffic", "/escrow"]);

// Primary top-bar items — always visible (highest-intent, daily workflows)
const TOP_ITEMS = [
  { path: "/live-traffic", label: "Live Traffic", icon: Radio, accent: true },
  { path: "/escrow", label: "Escrow", icon: Handshake },
  { path: "/my-account", label: "Account", icon: User },
];

// Sidebar — numbered sections showing the user workflow order
const SIDEBAR_SECTIONS = [
  {
    n: "1",
    label: "Market & Intelligence",
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard },
      { path: "/listings", label: "Listings", icon: Plane },
      { path: "/deal-radar", label: "Deal Radar", icon: Radar },
      { path: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    n: "2",
    label: "Analyze & Plan",
    items: [
      { path: "/opex-calculator", label: "OPEX Calculator", icon: Calculator },
      { path: "/service-finder", label: "Service Finder", icon: MapPin },
    ],
  },
  {
    n: "3",
    label: "Engage & Convert",
    items: [
      { path: "/leads", label: "Leads", icon: Users },
      { path: "/alerts", label: "Alerts", icon: Bell },
      { path: "/rewards", label: "Rewards", icon: Gift },
      { path: "/verification-center", label: "Verification", icon: BadgeCheck },
      { path: "/verified-users", label: "Verified Users", icon: ShieldCheck, adminOnly: true },
    ],
  },
  {
    n: "4",
    label: "Account & Settings",
    items: [
      { path: "/my-branding", label: "My Branding", icon: Palette },
      { path: "/pricing", label: "Credits & Plans", icon: Zap },
      { path: "/radio", label: "Media Hub", icon: Music },
    ],
  },
];

const IDLE_MS = 7000;

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const idleTimer = useRef(null);

  // Back button visibility — matches patterns above, not main tabs
  const showBack = !TOP_LEVEL.has(pathname) && BACK_BUTTON_ROUTES.some(re => re.test(pathname));

  const { data: currentUser } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });
  const isAdmin = currentUser?.role === "admin";

  const visibleSections = SIDEBAR_SECTIONS
    .map(s => ({ ...s, items: s.items.filter(it => !it.adminOnly || isAdmin) }))
    .filter(s => s.items.length > 0);

  // Auto-hide sidebar after 7s of inactivity
  const resetIdle = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setSidebarOpen(false), IDLE_MS);
  };
  const handleSidebarActivity = () => {
    if (sidebarOpen) resetIdle();
  };
  useEffect(() => {
    if (sidebarOpen) resetIdle();
    return () => idleTimer.current && clearTimeout(idleTimer.current);
  }, [sidebarOpen]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F4EF]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#111113] border-b border-white/5 safe-top">
        <div className="flex items-center gap-2 px-3 sm:px-4 h-12">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="text-[#8A8780] hover:text-[#F0EDE6] touch-target-compact p-1.5 shrink-0 flex items-center gap-1"
              title="Back"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="text-[#8A8780] hover:text-[#F0EDE6] touch-target-compact p-1.5 shrink-0"
              title="Menu"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2 shrink-0 min-w-0">
            {currentUser?.personalization_enabled && currentUser?.brand_logo_url ? (
              <img src={currentUser.brand_logo_url} alt="Logo" className="w-6 h-6 rounded object-contain bg-white/5" />
            ) : (
              <div className="w-6 h-6 rounded bg-[#E8A83A]/20 border border-[#E8A83A]/40 flex items-center justify-center shrink-0">
                <Plane className="w-3.5 h-3.5 text-[#E8A83A]" />
              </div>
            )}
            <span className="text-[#F0EDE6] font-black text-sm tracking-tight truncate hidden sm:block">
              {currentUser?.personalization_enabled && currentUser?.company_name ? currentUser.company_name : "ABOS"}
            </span>
          </Link>

          <div className="flex-1" />

          <nav className="flex items-center gap-1">
            {TOP_ITEMS.map(({ path, label, icon: Icon, accent }) => {
              const active = pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`
                    flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[11px] font-black uppercase tracking-tight whitespace-nowrap transition-all
                    ${active
                      ? "bg-[#0B2D5B] text-white border border-[#E8A83A]/40"
                      : accent
                        ? "text-[#E8A83A] hover:text-white hover:bg-[#E8A83A]/10 border border-[#E8A83A]/30"
                        : "text-[#8A8780] hover:text-white hover:bg-white/5 border border-transparent"}
                  `}
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
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Self-hiding left sidebar with numbered sections */}
      <aside
        onMouseMove={handleSidebarActivity}
        onClick={handleSidebarActivity}
        className={`
          fixed left-0 top-12 bottom-0 z-50
          w-[248px] bg-[#111113] border-r border-white/5
          flex flex-col transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <p className="text-[#E8A83A] text-[9px] uppercase tracking-[0.2em] font-bold">Navigation</p>
          <button onClick={() => setSidebarOpen(false)} className="text-[#8A8780] hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          {visibleSections.map((section, idx) => (
            <div key={section.n} className={idx > 0 ? "mt-5" : ""}>
              <div className="flex items-center gap-2 px-3 pb-1.5">
                <div className="w-4 h-4 rounded-sm bg-[#E8A83A]/20 border border-[#E8A83A]/40 flex items-center justify-center">
                  <span className="text-[9px] font-black text-[#E8A83A] leading-none">{section.n}</span>
                </div>
                <p className="text-[#E8A83A] text-[9px] uppercase tracking-[0.2em] font-bold">
                  {section.label}
                </p>
              </div>
              <div className="space-y-0.5">
                {section.items.map(({ path, label, icon: Icon }) => {
                  const active = pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      className={`
                        flex items-center gap-2.5 pl-7 pr-3 py-2 rounded-md text-[12px] font-bold uppercase tracking-tight transition-all
                        ${active
                          ? "bg-[#0B2D5B] text-white border border-[#E8A83A]/40"
                          : "text-[#8A8780] hover:text-white hover:bg-white/5 border border-transparent"}
                      `}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-white/5">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E8A83A] animate-pulse" />
            <p className="text-[#E8A83A] text-[9px] uppercase tracking-[0.2em] font-bold">Auto-hide · 7s idle</p>
          </div>
          <p className="text-[#4A4845] text-[9px] uppercase tracking-wider">ABOS v1.0</p>
        </div>
      </aside>

      {/* Content — pb keeps content clear of mobile bottom nav */}
      <main className="flex-1 overflow-auto pb-[72px] md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav (hidden on md+) */}
      <MobileBottomNav />
    </div>
  );
}