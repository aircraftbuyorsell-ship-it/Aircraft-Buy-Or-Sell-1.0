import { Link, useLocation, Outlet } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Plane, Radar, User, Menu, X, ShieldCheck, Users,
  Palette, Zap, Calculator, MapPin, BadgeCheck, Handshake, Radio,
  ChevronLeft,
} from "lucide-react";

// Primary top-bar items — always visible
const TOP_ITEMS = [
  { path: "/live-traffic", label: "Live Traffic", icon: Radio, accent: true },
  { path: "/escrow", label: "Escrow", icon: Handshake },
  { path: "/my-account", label: "Account", icon: User },
];

// Secondary items — in self-hiding left sidebar
const SIDEBAR_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/listings", label: "Listings", icon: Plane },
  { path: "/deal-radar", label: "Deal Radar", icon: Radar },
  { path: "/opex-calculator", label: "OPEX Calculator", icon: Calculator },
  { path: "/service-finder", label: "Service Finder", icon: MapPin },
  { path: "/leads", label: "Leads", icon: Users },
  { path: "/verification-center", label: "Verification", icon: BadgeCheck },
  { path: "/verified-users", label: "Verified Users", icon: ShieldCheck, adminOnly: true },
  { path: "/my-branding", label: "My Branding", icon: Palette },
  { path: "/pricing", label: "Credits & Plans", icon: Zap },
];

const IDLE_MS = 7000;

export default function Layout() {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const idleTimer = useRef(null);

  const { data: currentUser } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });
  const isAdmin = currentUser?.role === "admin";
  const sidebarItems = SIDEBAR_ITEMS.filter(it => !it.adminOnly || isAdmin);

  // Auto-hide sidebar after 7s of inactivity over the sidebar
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
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F4EF]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#111113] border-b border-white/5">
        <div className="flex items-center gap-3 px-4 h-12">
          {/* Sidebar trigger */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="text-[#8A8780] hover:text-[#F0EDE6] p-1 shrink-0"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
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

          {/* Primary top nav */}
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

      {/* Self-hiding left sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        onMouseMove={handleSidebarActivity}
        onClick={handleSidebarActivity}
        className={`
          fixed left-0 top-12 bottom-0 z-50
          w-[220px] bg-[#111113] border-r border-white/5
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

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {sidebarItems.map(({ path, label, icon: Icon }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`
                  flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] font-bold uppercase tracking-tight transition-all
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
        </nav>

        <div className="px-4 py-3 border-t border-white/5">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E8A83A] animate-pulse" />
            <p className="text-[#E8A83A] text-[9px] uppercase tracking-[0.2em] font-bold">Auto-hide · 7s idle</p>
          </div>
          <p className="text-[#4A4845] text-[9px] uppercase tracking-wider">ABOS v1.0</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}