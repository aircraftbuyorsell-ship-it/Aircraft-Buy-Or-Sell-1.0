import { Link, useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, Plane, Radar, User } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/listings", label: "Listings", icon: Plane },
  { path: "/deal-radar", label: "Deal Radar", icon: Radar },
  { path: "/my-account", label: "My Account", icon: User },
];

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-[#0a0f1a]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-slate-800 bg-slate-900/60 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-sky-400" />
            <span className="text-white font-black text-lg tracking-tight">ABOS</span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5 ml-7">Aircraft Buy or Sell</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-sky-500/15 text-sky-400 border border-sky-500/25"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800">
          <p className="text-slate-600 text-xs">ABOS Platform v1.0</p>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}