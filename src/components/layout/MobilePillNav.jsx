import { useLocation, useNavigate } from "react-router-dom";
import { Search, Plane, Zap, User } from "lucide-react";

const ACTIONS = [
  { icon: Search, label: "Search", path: "/" },
  { icon: Plane, label: "Listings", path: "/listings" },
  { icon: Zap, label: "ATI Score", path: "/ati-quick-score" },
  { icon: User, label: "Account", path: "/my-account" },
];

/**
 * Compact single-row icon pill bar for mobile (visible < lg).
 * Shows the 4 most important actions, just below the header.
 * Matches the existing glass-navbar / dark terminal aesthetic.
 */
export default function MobilePillNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center gap-1 w-full max-w-sm mx-auto"
      style={{
        height: 44,
        padding: 4,
        background: "#111827",
        border: "1px solid rgba(212,160,23,0.28)",
        borderRadius: 999,
        boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
      }}
    >
      {ACTIONS.map((action) => {
        const active = pathname === action.path;
        return (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            aria-label={action.label}
            className="flex-1 flex items-center justify-center gap-1.5 transition-colors"
            style={{
              height: 36,
              minWidth: 44,
              borderRadius: 999,
              fontSize: 11,
              fontWeight: active ? 700 : 500,
              color: active ? "#0B1220" : "rgba(255,255,255,0.65)",
              background: active ? "#D4A017" : "transparent",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <action.icon size={16} />
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}