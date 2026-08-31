import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Plane, Radar, Zap, ShoppingCart, BarChart3,
  Shield, Settings, Database, Trash2, Menu, X
} from "lucide-react";
import { isAdminRole } from "@/utils/roles";

const NAV_LINKS = [
  { to: "/listings",       icon: Plane,       label: "Listings" },
  { to: "/deal-radar",      icon: Radar,       label: "Deal Radar" },
  { to: "/ati-quick-score", icon: Zap,         label: "Quick Score" },
  { to: "/marketplace",     icon: ShoppingCart, label: "Marketplace" },
  { to: "/analytics",       icon: BarChart3,   label: "Analytics" },
];

const ADMIN_LINKS = [
  { to: "/admin/listings",     icon: Database, label: "Admin Listings" },
  { to: "/admin/marketplace",   icon: Shield,   label: "Admin Marketplace" },
  { to: "/admin/settings",     icon: Settings, label: "Admin Settings" },
  { to: "/admin/data-cleanup", icon: Trash2,   label: "Data Cleanup" },
];

export default function GlobeNav({ isDark }) {
  const [open, setOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["auth-me-globe-nav"],
    queryFn: () => base44.auth.me(),
    retry: false,
    staleTime: 60000,
  });
  const isAdmin = isAdminRole(user);

  const glassBg = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(255,255,255,0.65)";
  const glassBorder = isDark
    ? "1px solid rgba(255,255,255,0.12)"
    : "1px solid rgba(0,0,0,0.08)";
  const textColor = isDark ? "#fff" : "#1a1a1a";
  const mutedText = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.50)";
  const brandAmber = "#f5c242";  // ABOS brand amber
  const hoverBg = isDark ? `${brandAmber}14` : `${brandAmber}1A`;
  const adminColor = isDark ? "#5dcaa5" : "#0D9488";

  const linkCls = {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 12px", borderRadius: 8,
    fontSize: 12, fontWeight: 600, color: textColor,
    textDecoration: "none", cursor: "pointer",
    transition: "background 0.15s",
  };

  return (
    <div style={{ position: "absolute", top: 16, right: 16, zIndex: 20 }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px", borderRadius: 999,
          background: glassBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: glassBorder, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          color: textColor, fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}
      >
        {open ? <Menu size={14} /> : <Menu size={14} />}
        <span style={{ letterSpacing: "0.06em" }}>NAVIGATE</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          marginTop: 8, minWidth: 200,
          background: isDark ? "rgba(10,10,10,0.95)" : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          border: glassBorder, borderRadius: 14, padding: "10px 10px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        }}>
          {/* Close */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: mutedText, cursor: "pointer", padding: 2 }}>
              <X size={14} />
            </button>
          </div>

          {/* Nav links */}
          {NAV_LINKS.map(l => {
            const Icon = l.icon;
            return (
              <Link key={l.to} to={l.to} style={{ textDecoration: "none" }}>
                <div style={linkCls}
                  onMouseEnter={e => { e.currentTarget.style.background = hoverBg; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <Icon size={14} style={{ color: brandAmber }} />
                  <span>{l.label}</span>
                </div>
              </Link>
            );
          })}

          {/* Admin section */}
          {isAdmin && (
            <>
              <div style={{ height: 1, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", margin: "8px 0" }} />
              <button
                onClick={() => setAdminOpen(v => !v)}
                style={{
                  ...linkCls,
                  width: "100%", color: adminColor, fontWeight: 700,
                  textTransform: "uppercase", fontSize: 10, letterSpacing: "0.1em",
                  background: "transparent",
                }}
              >
                <Shield size={14} />
                <span style={{ flex: 1, textAlign: "left" }}>Admin Section</span>
                <span style={{ fontSize: 9 }}>{adminOpen ? "▾" : "▸"}</span>
              </button>
              {adminOpen && ADMIN_LINKS.map(l => {
                const Icon = l.icon;
                return (
                  <Link key={l.to} to={l.to} style={{ textDecoration: "none" }}>
                    <div style={{ ...linkCls, paddingLeft: 28 }}
                      onMouseEnter={e => { e.currentTarget.style.background = hoverBg; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <Icon size={12} style={{ color: adminColor }} />
                      <span style={{ fontSize: 11 }}>{l.label}</span>
                    </div>
                  </Link>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}