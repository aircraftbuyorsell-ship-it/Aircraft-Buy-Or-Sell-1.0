import { useLocation, useNavigate } from "react-router-dom";
import { NAV_TREE, isPathInSection } from "@/components/layout/navConfig";

/** Flat text nav bar — all sections are direct links to the 4 hubs + Home + Pricing. */
export default function PillCommandBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleNav = (path) => navigate(path);

  return (
    <div className="abos-retro-nav hidden items-center lg:flex">
      {NAV_TREE.map((section) => {
        const active = isPathInSection(section, pathname);

        return (
          <div key={section.label} style={{ position: "relative" }}>
            <button
              onClick={() => handleNav(section.path)}
              className="abos-retro-nav-button"
              aria-current={active ? "page" : undefined}
              style={{ background: "transparent", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {section.label}
            </button>

          </div>
        );
      })}
    </div>
  );
}