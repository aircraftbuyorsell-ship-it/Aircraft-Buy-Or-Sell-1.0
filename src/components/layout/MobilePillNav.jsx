import { useLocation, useNavigate } from "react-router-dom";
import { NAV_TREE, isPathInSection } from "@/components/layout/navConfig";

export default function MobilePillNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

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
                background: active ? "rgba(212,160,23,0.08)" : "rgba(255,255,255,0.04)",
                border: active
                  ? "1px solid rgba(212,160,23,0.25)"
                  : "1px solid rgba(55,65,81,0.5)",
                color: active ? "#D4A017" : "rgba(255,255,255,0.60)",
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