import { Link, useLocation, Outlet } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Plane, Radar, User,
  Menu, X, ShieldCheck, BarChart2, Wifi, Calculator, Users
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/listings", label: "Listings", icon: Plane },
  { path: "/deal-radar", label: "Deal Radar", icon: Radar },
  { path: "/leads", label: "Leads", icon: Users },
  { path: "/my-account", label: "My Account", icon: User },
];

const TOOL_ITEMS = [
  { path: "/listings", label: "ATI Passport", icon: ShieldCheck, sub: "Score any aircraft" },
  { path: "/deal-radar", label: "FAA Intelligence", icon: BarChart2, sub: "Fleet analytics" },
  { path: "/listings", label: "Live Traffic", icon: Wifi, sub: "ADS-B vectors" },
  { path: "/listings", label: "OPEX Calculator", icon: Calculator, sub: "Ownership costs" },
];

export default function Layout() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F7F4EF]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-[220px] bg-[#111113] flex flex-col
          border-r border-white/5
          transform transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-[#D4A017]/20 border border-[#D4A017]/30 flex items-center justify-center">
                <Plane className="w-4 h-4 text-[#D4A017]" />
              </div>
              <span className="text-[#F0EDE6] font-black text-base tracking-tight">ABOS</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-[#8A8780] hover:text-[#F0EDE6]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[#4A4845] text-[10px] mt-1 ml-9 uppercase tracking-widest font-medium">IntraZone</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[#4A4845] text-[9px] uppercase tracking-[0.15em] font-semibold px-3 pb-2 pt-1">Navigation</p>
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all
                  ${active
                    ? "bg-[rgba(212,160,23,0.12)] text-[#D4A017] border border-[rgba(212,160,23,0.2)]"
                    : "text-[#8A8780] hover:text-[#C8C4BC] hover:bg-white/5"}
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}

          <div className="pt-4">
            <p className="text-[#4A4845] text-[9px] uppercase tracking-[0.15em] font-semibold px-3 pb-2">Tools</p>
            {TOOL_ITEMS.map(({ path, label, icon: Icon, sub }) => (
              <Link
                key={label}
                to={path}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-[#8A8780] hover:text-[#C8C4BC] hover:bg-white/5"
              >
                <Icon className="w-4 h-4 shrink-0 text-[#D4A017]/60" />
                <div>
                  <p className="text-[12px] font-medium leading-tight">{label}</p>
                  <p className="text-[10px] text-[#4A4845] leading-tight">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/5">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4A017] animate-pulse" />
            <p className="text-[#4A4845] text-[10px] uppercase tracking-widest font-medium">Live · Global Network</p>
          </div>
          <p className="text-[#2A2825] text-[10px]">ABOS Platform v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#111113] border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-[#8A8780] hover:text-[#F0EDE6] p-1"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-[#D4A017]" />
            <span className="text-[#F0EDE6] font-black text-sm tracking-tight">ABOS</span>
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