import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  ChevronDown, LayoutDashboard, User, CreditCard, Zap, Users, FileText,
  GitBranch, BadgeCheck, Shield, Plane, Database, LogOut, Building2, Wand2,
} from "lucide-react";
import { isAdminRole } from "@/utils/roles";
import { unwrapPortalResponse } from "@/utils/portalEnvelope";

function initials(user) {
  const name = user?.full_name || user?.email || "?";
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

const BASE_GROUPS = [
  {
    label: "Account",
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard },
      { path: "/my-account", label: "My Account", icon: User },
      { path: "/subscription", label: "Billing & Subscription", icon: CreditCard },
      { path: "/pricing", label: "Credits & Plans", icon: Zap },
    ],
  },
  {
    label: "Community",
    items: [
      { path: "/community", label: "ABOS Community", icon: Users },
      { path: "/weekly-briefing", label: "Weekly Briefings", icon: FileText },
      { path: "/feature-requests", label: "Feature Requests", icon: GitBranch },
    ],
  },
  {
    label: "Workspaces",
    items: [
      { path: "/expert-dashboard", label: "Expert Dashboard", icon: BadgeCheck },
    ],
  },
];

// Only rendered for accounts that actually resolve to a white-label tenant —
// otherwise the Partner Portal is dead weight in every other user's menu.
const PARTNER_GROUP = {
  label: "Partner",
  items: [
    { path: "/partner-portal", label: "Partner Portal", icon: Building2 },
    { path: "/install", label: "Set up integration", icon: Wand2 },
  ],
};

const ADMIN_GROUP = {
  label: "Administration",
  items: [
    { path: "/admin/settings", label: "Admin Settings", icon: Shield },
    { path: "/admin/listings", label: "Admin Listings", icon: Plane },
    { path: "/admin/marketplace", label: "Marketplace Admin", icon: Zap },
    { path: "/workflows", label: "Workflows", icon: GitBranch },
    { path: "/admin/data-cleanup", label: "Data Cleanup", icon: Database },
    { path: "/admin/supabase-sync", label: "Registry Sync", icon: Database },
  ],
};

export default function AccountMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Shares its cache with the Partner Portal page, which queries the same key,
  // so opening the menu does not cost an extra round trip.
  const { data: partner } = useQuery({
    queryKey: ["tenantPortal"],
    queryFn: async () => {
      const response = await base44.functions.invoke("tenantPortal", { action: "overview" });
      return unwrapPortalResponse(response);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const isAdmin = isAdminRole(user);
  const groups = [
    ...BASE_GROUPS,
    ...(partner?.tenant ? [PARTNER_GROUP] : []),
    ...(isAdmin ? [ADMIN_GROUP] : []),
  ];

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Account menu"
        style={{
          display: "flex", alignItems: "center", gap: 4,
          background: "transparent", border: "none", cursor: "pointer", padding: 2,
        }}
      >
        <span style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(212,160,23,0.09)", border: "0.5px solid rgba(212,160,23,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#D4A017", fontSize: 11, fontWeight: 600,
        }}>
          {initials(user)}
        </span>
        <ChevronDown size={13} style={{
          color: "rgba(255,255,255,0.45)",
          transition: "transform 150ms ease",
          transform: open ? "rotate(180deg)" : "none",
        }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0,
          width: 240, maxHeight: "72vh", overflowY: "auto",
          background: "linear-gradient(180deg, rgba(28,28,38,0.97) 0%, rgba(16,16,24,0.97) 100%)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(212,160,23,0.18)", borderRadius: 16,
          boxShadow: "0 12px 40px rgba(0,0,0,0.7)", padding: 8, zIndex: 100,
        }}>
          <div style={{ padding: "8px 10px 10px", borderBottom: "0.5px solid rgba(255,255,255,0.08)", marginBottom: 4 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.full_name || user?.email}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email}
            </p>
          </div>

          {groups.map((group) => (
            <div key={group.label}>
              <div style={{
                fontSize: 8, fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "rgba(212,160,23,0.55)",
                padding: "8px 10px 3px",
              }}>
                {group.label}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    style={{
                      display: "flex", alignItems: "center", gap: 9, width: "100%",
                      background: "transparent", border: "none", borderRadius: 9,
                      padding: "7px 10px", cursor: "pointer", textAlign: "left",
                      color: "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: 500,
                      minHeight: 32,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(212,160,23,0.10)";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.72)";
                    }}
                  >
                    <Icon size={14} style={{ opacity: 0.75, flexShrink: 0 }} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}

          <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)", marginTop: 4, paddingTop: 4 }}>
            <button
              onClick={() => base44.auth.logout()}
              style={{
                display: "flex", alignItems: "center", gap: 9, width: "100%",
                background: "transparent", border: "none", borderRadius: 9,
                padding: "7px 10px", cursor: "pointer", textAlign: "left",
                color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 500, minHeight: 32,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#e24b4a"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
            >
              <LogOut size={14} style={{ flexShrink: 0 }} />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}