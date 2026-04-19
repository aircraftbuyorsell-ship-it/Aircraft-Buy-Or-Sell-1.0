import { Link, useLocation, Outlet } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Plane, Radar, User, Menu, X, ShieldCheck, Users,
  Palette, Zap, Calculator, MapPin, BadgeCheck, Handshake,
} from "lucide-react";
import TokenBalance from "./marketing/TokenBalance";

// Flat nav — horizontal top bar (groups collapsed into a single row)
const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/listings", label: "Listings", icon: Plane },
  { path: "/deal-radar", label: "Deal Radar", icon: Radar },
  { path: "/opex-calculator", label: "OPEX", icon: Calculator },
  { path: "/service-finder", label: "Services", icon: MapPin },
  { path: "/leads", label: "Leads", icon: Users },
  { path: "/escrow", label: "Escrow", icon: Handshake },
  { path: "/verification-center", label: "Verify", icon: BadgeCheck },
  { path: "/verified-users", label: "Verified", icon: ShieldCheck, adminOnly: true },
  { path: "/my-account", label: "Account", icon: User },
  { path: "/my-branding", label: "Branding", icon: Palette },
  { path: "/pricing", label: "Credits", icon: Zap },
];

export default function Layout() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: currentUser } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });
  const isAdmin = currentUser?.role === "admin";
  const items = NAV_ITEMS.filter(it => !it.adminOnly || isAdmin);

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F4EF]">
      {/* Thin horizontal top bar */}
      <header className="sticky top-0 z-40 bg-[#111113] border-b border-white/5">
        <div className="flex items-center gap-3 px-4 h-12">
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

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 overflow-x-auto">
            {items.map(({ path, label, icon: Icon }) => {
              const active = pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`
                    flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[11px] font-bold uppercase tracking-tight whitespace-nowrap transition-all
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

          {/* Spacer for mobile */}
          <div className="flex-1 lg:hidden" />

          {/* Token balance (compact) */}
          <div className="hidden md:block shrink-0">
            <TokenBalance />
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="lg:hidden text-[#8A8780] hover:text-[#F0EDE6] p-1 shrink-0"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown nav */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-white/5 px-2 py-2 grid grid-cols-2 gap-1 bg-[#111113]">
            {items.map(({ path, label, icon: Icon }) => {
              const active = pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-2 px-2.5 py-2 rounded-md text-[11px] font-bold uppercase tracking-tight
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
        )}
      </header>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}