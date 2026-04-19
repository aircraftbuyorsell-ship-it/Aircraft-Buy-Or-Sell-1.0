import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Plane, Radar, User } from "lucide-react";

const ITEMS = [
  { path: "/", label: "Home", icon: LayoutDashboard },
  { path: "/listings", label: "Listings", icon: Plane },
  { path: "/deal-radar", label: "Radar", icon: Radar },
  { path: "/my-account", label: "Account", icon: User },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();

  const isActive = (path) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111113] border-t border-white/10 safe-bottom"
      aria-label="Primary navigation"
    >
      <div className="flex items-stretch justify-around px-1">
        {ITEMS.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] no-select"
            >
              <Icon
                className={`w-5 h-5 transition-colors ${active ? "text-[#E8A83A]" : "text-[#8A8780]"}`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={`text-[10px] uppercase tracking-wider font-black transition-colors ${
                  active ? "text-[#E8A83A]" : "text-[#8A8780]"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}