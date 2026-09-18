import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NAV_TREE, isPathInSection } from "@/components/layout/navConfig";
import { useTabHistory } from "@/lib/useTabHistory";
import { useTheme } from "@/lib/useTheme";

const MOBILE_SECTIONS = NAV_TREE.filter((section) => !section.direct);

/**
 * Fixed bottom tab bar — mobile only (hidden on lg+).
 * Reuses NAV_TREE top-level sections as tabs.
 * Re-tapping the active tab resets to its root path.
 */
export default function BottomTabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isDark = useTheme();
  const { getLast, setLast, resetToRoot } = useTabHistory();

  const activeBg = isDark ? "rgba(212,160,23,0.10)" : "rgba(212,160,23,0.08)";
  const idleColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)";
  const activeColor = "#D4A017";
  const barBg = isDark ? "rgba(4,6,10,0.96)" : "rgba(251,250,247,0.98)";
  const barBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const handleTab = (section) => {
    const isActive = isPathInSection(section, pathname);
    if (isActive) {
      // Re-tap → reset to root
      resetToRoot(section.label);
      navigate(section.path);
    } else {
      // Navigate to last-visited or root
      const last = getLast(section.label);
      navigate(last || section.path);
    }
  };

  // Record current path under the active tab on every navigation
  const activeSection = MOBILE_SECTIONS.find((s) => isPathInSection(s, pathname));
  useEffect(() => {
    if (activeSection) setLast(activeSection.label, pathname);
  }, [activeSection, pathname, setLast]);

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch justify-around safe-bottom"
      aria-label="Primary navigation"
      style={{
        background: barBg,
        borderTop: `0.5px solid ${barBorder}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {MOBILE_SECTIONS.map((section) => {
        const active = isPathInSection(section, pathname);
        const Icon = section.icon;
        return (
          <button
            key={section.label}
            onClick={() => handleTab(section)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 transition-colors"
            style={{ minHeight: 44, padding: "6px 2px" }}
            aria-label={section.label}
            aria-current={active ? "page" : undefined}
          >
            {Icon && <Icon size={20} style={{ color: active ? activeColor : idleColor }} />}
            <span
              style={{
                fontSize: 10,
                fontWeight: active ? 700 : 500,
                color: active ? activeColor : idleColor,
                lineHeight: "14px",
              }}
            >
              {section.mobileLabel || section.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}