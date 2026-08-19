import { useLocation, useNavigate } from "react-router-dom";
import { NAV_TREE, isPathInSection } from "@/components/layout/navConfig";

export default function MobilePillNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Filter to the 4 hubs + Home (5 items) — Pricing is in the drawer
  const items = NAV_TREE.filter((s) => s.path !== "/pricing");

  const handleNav = (path) => navigate(path);

  return (
    <div className="w-full">
      <div className="abos-retro-mobile-nav flex w-full items-center justify-center gap-1">
        {items.map((section) => {
          const active = isPathInSection(section, pathname);
          const Icon = section.icon;
          return (
            <button
              key={section.label}
              onClick={() => handleNav(section.path)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 transition-all"
              style={{
                height: 48,
                minWidth: 44,
                borderRadius: 14,
                padding: "4px 2px",
                background: active ? "rgba(224,176,52,0.08)" : "rgba(255,255,255,0.04)",
                border: active
                  ? "1px solid rgba(224,176,52,0.25)"
                  : "1px solid rgba(47,55,74,0.72)",
                color: active ? "var(--brand-primary)" : "rgba(255,255,255,0.60)",
                cursor: "pointer"
              }}>
              {Icon && <Icon size={18} style={{ opacity: active ? 1 : 0.7 }} />}
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: "0.02em" }}>
                {section.mobileLabel || section.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}