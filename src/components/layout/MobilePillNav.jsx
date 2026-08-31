import { useLocation, useNavigate } from "react-router-dom";
import { NAV_TREE, isPathInSection } from "@/components/layout/navConfig";
import { useTheme } from "@/lib/useTheme";

export default function MobilePillNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isDark = useTheme();

  const idleBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)";
  const idleBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const idleColor = isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)";

  const handleNav = (path) => navigate(path);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex items-center justify-center gap-1 w-full">
        {NAV_TREE.map((section) => {
          const active = isPathInSection(section, pathname);
          const Icon = section.icon;
          return (
            <button
              key={section.label}
              onClick={() => handleNav(section.path)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 transition-all"
              style={{
                height: 46,
                minWidth: 44,
                borderRadius: 14,
                padding: "4px 2px",
                background: active
                  ? isDark ? "rgba(212,160,23,0.08)" : "rgba(212,160,23,0.06)"
                  : idleBg,
                border: active
                  ? "1px solid rgba(212,160,23,0.25)"
                  : `1px solid ${idleBorder}`,
                color: active ? "#D4A017" : idleColor,
                cursor: "pointer"
              }}>
              {Icon && <Icon size={17} style={{ opacity: active ? 1 : 0.7 }} />}
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: "0.02em" }} className="text-xs capitalize">
                {section.mobileLabel || section.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}