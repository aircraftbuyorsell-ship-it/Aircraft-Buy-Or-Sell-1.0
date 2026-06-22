import { Link, useLocation } from "react-router-dom";
import { Globe, Flame, FileCheck } from "lucide-react";
import { useTheme } from "@/lib/useTheme";

export default function MobileBottomNav() {
  const isDark = useTheme();
  const location = useLocation();
  
  const ABOS_AMBER = "#f5c242";
  const navBg = isDark 
    ? "rgba(10,10,20,0.92)" 
    : "rgba(255,255,255,0.92)";
  const navBorder = isDark
    ? "rgba(245,194,66,0.15)"
    : "rgba(0,0,0,0.08)";
  const iconActive = ABOS_AMBER;
  const iconInactive = isDark
    ? "rgba(255,255,255,0.45)"
    : "rgba(0,0,0,0.45)";

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  const navItems = [
    { path: "/listings", label: "MarketSpace", Icon: Globe },
    { path: "/deal-radar", label: "Deal Radar", Icon: Flame },
    { path: "/ati-passport", label: "ATI Passport", Icon: FileCheck },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        background: navBg,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: `1px solid ${navBorder}`,
        boxShadow: isDark
          ? "0 -4px 20px rgba(0,0,0,0.3)"
          : "0 -2px 10px rgba(0,0,0,0.05)",
      }}
    >
      <div className="flex items-center justify-around h-16 px-2 safe-bottom">
        {navItems.map(({ path, label, Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all duration-200 group"
              style={{ textDecoration: "none" }}
            >
              <div
                className="p-2 rounded-lg transition-all duration-200"
                style={{
                  background: active ? `${ABOS_AMBER}18` : "transparent",
                }}
              >
                <Icon
                  size={20}
                  style={{
                    color: active ? iconActive : iconInactive,
                    transition: "color 0.2s",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: active ? iconActive : iconInactive,
                  transition: "color 0.2s",
                  textAlign: "center",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}