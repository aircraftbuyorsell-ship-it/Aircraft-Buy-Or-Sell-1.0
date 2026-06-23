import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const PRIMARY_ITEMS = [
{ path: "/", label: "Dashboard" },
{ path: "/listings", label: "Aircraft Listings" },
{ path: "/faa-map", label: "FAA Map" },
{ path: "/analytics", label: "Market Analytics" },
{ path: "/search-console", label: "Search Console" },
{ path: "/ati-quick-score", label: "ATI Quick Score" }];


const MORE_ITEMS = [
{ path: "/ati-full-report", label: "ATI Full Report" },
{ path: "/ati-standard", label: "ATI Passport" },
{ path: "/demo", label: "IntraZone Demo" },
{ path: "/my-account", label: "Profile & Settings" },
{ path: "/pricing", label: "Credits & Benefits" },
{ path: "/ati-verify", label: "Verification Center" },
{ path: "/deal-radar", label: "Deal Radar" },
{ path: "/funnels", label: "Funnel Builder" },
{ path: "/deal-intelligence", label: "Deal Intelligence" },
{ path: "/escrow", label: "Hustl Contract" }];


export default function PillCommandBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleNav = (path) => {
    setMoreOpen(false);
    navigate(path);
  };

  return (
    <div className="hidden lg:flex items-center gap-1" style={{ height: 48 }}>
      {/* Pill bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          height: 48,
          padding: 4,
          background: "#0d1117",
          border: "1px solid rgba(245,194,66,0.28)",
          borderRadius: 999,
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)"
        }} className="mx-auto">
        
        {PRIMARY_ITEMS.map((item) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                color: active ? "#04060a" : "rgba(255,255,255,0.65)",
                background: active ? "#f5c242" : "transparent",
                borderRadius: 999,
                padding: "8px 16px",
                textDecoration: "none",
                transition: "color 150ms ease, background 150ms ease",
                whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.65)";
              }}>
              
              {item.label}
            </Link>);

        })}

        {/* More dropdown */}
        <div ref={moreRef} style={{ position: "relative" }}>
          <button
            onClick={() => setMoreOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
              fontWeight: 500,
              color: moreOpen ? "#fff" : "rgba(255,255,255,0.65)",
              background: "transparent",
              border: "none",
              borderRadius: 999,
              padding: "8px 16px",
              cursor: "pointer",
              transition: "color 150ms ease",
              whiteSpace: "nowrap"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
            onMouseLeave={(e) => {
              if (!moreOpen) e.currentTarget.style.color = "rgba(255,255,255,0.65)";
            }}>
            
            More <ChevronDown size={14} style={{ transition: "transform 150ms ease", transform: moreOpen ? "rotate(180deg)" : "none" }} />
          </button>

          {moreOpen &&
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              minWidth: 220,
              background: "#0d1117",
              border: "1px solid rgba(245,194,66,0.15)",
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              padding: 6,
              zIndex: 100
            }}>
            
              {MORE_ITEMS.map((item) => {
              const active = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    color: active ? "#f5c242" : "rgba(255,255,255,0.75)",
                    background: "transparent",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 16px",
                    cursor: "pointer",
                    transition: "background 150ms ease, color 150ms ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(245,194,66,0.07)";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = active ? "#f5c242" : "rgba(255,255,255,0.75)";
                  }}>
                  
                    {item.label}
                  </button>);

            })}
            </div>
          }
        </div>
      </div>
    </div>);

}