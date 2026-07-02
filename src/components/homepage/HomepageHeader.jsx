import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Home, Shield, BarChart2, User, LogIn, LogOut } from "lucide-react";
import SidebarLogo from "@/components/layout/SidebarLogo";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_LINKS = [
  { label: "Marketplace", path: "/listings" },
  { label: "ATI Passport", path: "/ati-passport" },
  { label: "OMVM", path: "/valuation" },
  { label: "Finance", path: "/leasing-calculator" },
  { label: "Analytics", path: "/analytics" },
  { label: "API", path: "/developers" },
  { label: "Enterprise", path: "/pricing" },
];

const MOBILE_TABS = [
  { label: "Home", path: "/", icon: Home },
  { label: "Search", path: "/listings", icon: Search },
  { label: "ATI", path: "/ati-quick-score", icon: Shield },
  { label: "Analytics", path: "/analytics", icon: BarChart2 },
  { label: "Account", path: "/my-account", icon: User },
];

function initials(user) {
  const name = user?.full_name || user?.email || "?";
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function HomepageHeader() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearchClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("abos:focus-hero-search"));
    }, 600);
  };

  const headerStyle = scrolled
    ? {
        background: "rgba(5,7,11,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(201,168,77,0.15)",
      }
    : {
        background: "transparent",
        borderBottom: "1px solid transparent",
      };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={headerStyle}
      >
        <div className="flex items-center justify-between px-4 sm:px-8 h-[64px] safe-left safe-right">
          <div className="flex items-center shrink-0">
            <div className="lg:hidden">
              <SidebarLogo compact />
            </div>
            <div className="hidden lg:block">
              <SidebarLogo />
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-[13px] font-medium transition-colors duration-150"
                  style={{ color: active ? "#C9A84D" : "rgba(255,255,255,0.6)" }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={handleSearchClick}
              aria-label="Search"
              className="flex items-center justify-center transition-colors"
              style={{ width: 36, height: 36, color: "rgba(255,255,255,0.6)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            >
              <Search size={18} />
            </button>
            <ThemeToggle />
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/my-account"
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "rgba(201,168,77,0.09)",
                    border: "0.5px solid rgba(201,168,77,0.22)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    textDecoration: "none",
                  }}
                >
                  <span style={{ color: "#C9A84D", fontSize: 11, fontWeight: 600 }}>
                    {initials(currentUser)}
                  </span>
                </Link>
                <button
                  onClick={() => base44.auth.logout()}
                  aria-label="Log out"
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "rgba(255,255,255,0.35)", display: "flex", padding: 8,
                  }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => base44.auth.redirectToLogin()}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "#C9A84D", color: "#05070B", border: "none",
                  borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", minHeight: 36,
                }}
              >
                <LogIn size={14} /> <span>Log In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around safe-bottom"
        style={{
          background: "#05070B",
          borderTop: "1px solid rgba(201,168,77,0.15)",
          height: 56,
        }}
      >
        {MOBILE_TABS.map((tab) => {
          const active = pathname === tab.path;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="relative flex flex-col items-center justify-center gap-0.5 transition-colors"
              style={{
                minWidth: 44, minHeight: 44,
                color: active ? "#C9A84D" : "rgba(255,255,255,0.5)",
              }}
            >
              {active && (
                <div
                  style={{
                    position: "absolute", top: 0, width: 24, height: 2,
                    background: "#C9A84D", borderRadius: 1,
                    boxShadow: "0 0 8px rgba(201,168,77,0.6)",
                  }}
                />
              )}
              <Icon size={20} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}