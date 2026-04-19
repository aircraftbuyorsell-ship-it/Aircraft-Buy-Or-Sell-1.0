import { Link, useLocation, Outlet } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Plane, Radar, User, Menu, X, ShieldCheck, Users,
  Palette, Zap, Calculator, MapPin, BadgeCheck, Handshake,
} from "lucide-react";
import TokenBalance from "./marketing/TokenBalance";

// Grouped navigation — logical flow: analyze → engage → manage
const NAV_GROUPS = [
  {
    label: "Market & Intelligence",
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard },
      { path: "/listings", label: "Listings", icon: Plane, hint: "ATI · FAA · Valuation" },
      { path: "/deal-radar", label: "Deal Radar", icon: Radar },
      { path: "/opex-calculator", label: "OPEX Calculator", icon: Calculator, hint: "50–1500 hr/yr" },
      { path: "/service-finder", label: "Service Finder", icon: MapPin, hint: "MRO · FBO · Dealers" },
    ],
  },
  {
    label: "CRM & Engagement",
    items: [
      { path: "/leads", label: "Leads", icon: Users },
      { path: "/escrow", label: "Escrow & Contracts", icon: Handshake, hint: "Hustle · Finder's Fee %" },
      { path: "/verification-center", label: "Verification", icon: BadgeCheck, hint: "3-step · $8 → 20 credits" },
      { path: "/verified-users", label: "Verified Users", icon: ShieldCheck, adminOnly: true },
    ],
  },
  {
    label: "Account",
    items: [
      { path: "/my-account", label: "My Account", icon: User },
      { path: "/my-branding", label: "My Branding", icon: Palette },
      { path: "/pricing", label: "Credits & Plans", icon: Zap },
    ],
  },
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

  return (
    <div className="flex min-h-screen bg-[#F7F4EF]">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-[232px] bg-[#111113] flex flex-col border-r border-white/5
          transform transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {currentUser?.personalization_enabled && currentUser?.brand_logo_url ? (
                <img src={currentUser.brand_logo_url} alt="Logo" className="w-7 h-7 rounded object-contain bg-white/5" />
              ) : (
                <div className="w-7 h-7 rounded bg-[#E8A83A]/20 border border-[#E8A83A]/40 flex items-center justify-center shrink-0">
                  <Plane className="w-4 h-4 text-[#E8A83A]" />
                </div>
              )}
              <span className="text-[#F0EDE6] font-black text-base tracking-tight truncate">
                {currentUser?.personalization_enabled && currentUser?.company_name ? currentUser.company_name : "ABOS"}
              </span>
            </div>
            <button onClick={() => setMobileOpen(false)} className="lg:hidden text-[#8A8780] hover:text-[#F0EDE6]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[#4A4845] text-[10px] mt-1 ml-9 uppercase tracking-widest font-medium">
            {currentUser?.personalization_enabled ? "Powered by ABOS" : "IntraZone"}
          </p>
        </div>

        {/* Grouped nav */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {NAV_GROUPS.map(group => {
            const items = group.items.filter(it => !it.adminOnly || isAdmin);
            if (!items.length) return null;
            return (
              <div key={group.label}>
                <p className="text-[#E8A83A] text-[9px] uppercase tracking-[0.2em] font-bold px-3 pb-2">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {items.map(({ path, label, icon: Icon, hint }) => {
                    const active = pathname === path;
                    return (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setMobileOpen(false)}
                        className={`
                          flex items-start gap-3 px-3 py-2 rounded-md text-[13px] font-bold uppercase tracking-tight transition-all
                          ${active
                            ? "bg-[#0B2D5B] text-white border border-[#E8A83A]/40 shadow-sm"
                            : "text-[#8A8780] hover:text-white hover:bg-white/5 border border-transparent"}
                        `}
                      >
                        <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="leading-tight">{label}</p>
                          {hint && <p className="text-[9.5px] text-[#4A4845] leading-tight mt-0.5">{hint}</p>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <TokenBalance />

        <div className="px-5 py-4 border-t border-white/5">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E8A83A] animate-pulse" />
            <p className="text-[#E8A83A] text-[10px] uppercase tracking-[0.2em] font-bold">Live · Global Network</p>
          </div>
          <p className="text-[#4A4845] text-[10px] uppercase tracking-wider">ABOS Platform v1.0</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-[#111113] border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="text-[#8A8780] hover:text-[#F0EDE6] p-1">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-[#E8A83A]" />
            <span className="text-[#F0EDE6] font-black text-sm tracking-tight uppercase">ABOS</span>
          </div>
          <div className="w-7" />
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}