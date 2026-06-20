import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Menu, X, Plane, ChevronRight } from "lucide-react";
import GlobalSearch from "@/components/search/GlobalSearch";

const NAV_LINKS = [
  { path: "/listings", label: "Buy" },
  { path: "/my-account", label: "Sell" },
  { path: "/ati-quick-score", label: "ATI" },
];

const INK = "#0C1620";
const AMBER = "#F8C73E";

export default function TopNav({ currentUser, onOpenSidebar }) {
  const { pathname } = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);

  const linkStyle = (active) => ({
    color: active ? "#fff" : "rgba(255,255,255,0.62)",
  });

  return (
    <>
      <header
        className="sticky top-0 z-40 safe-top"
        style={{
          background: INK,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
        }}
      >
        <div className="flex items-center gap-3 h-[56px] px-3 sm:px-6 max-w-[1600px] mx-auto">
          {/* Sidebar toggle (mobile) */}
          <button
            onClick={onOpenSidebar}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-95"
            style={{ color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            aria-label="Open sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Logo — AM mark + wordmark */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              style={{ background: AMBER, boxShadow: "0 2px 12px rgba(248,199,62,0.32)" }}
            >
              <span className="text-[13px] font-black leading-none" style={{ color: INK }}>AM</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[14px] font-black tracking-[-0.02em] text-white">ABOS</span>
              <span className="text-[9px] font-semibold tracking-[0.14em] uppercase" style={{ color: "rgba(255,255,255,0.40)" }}>
                Marketspace
              </span>
            </div>
          </Link>

          {/* Left nav links — ghost text (desktop) */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {NAV_LINKS.map(({ path, label }) => {
              const active = pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className="px-3 h-9 flex items-center text-[13px] font-semibold rounded-lg transition-colors"
                  style={linkStyle(active)}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = active ? "#fff" : "rgba(255,255,255,0.62)")}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />

          {/* Search (desktop) */}
          <div className="hidden sm:block">
            <GlobalSearch />
          </div>

          {/* Pricing */}
          <Link
            to="/pricing"
            className="hidden md:flex items-center px-3 h-9 text-[13px] font-semibold rounded-lg transition-colors"
            style={{ color: "rgba(255,255,255,0.62)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.62)")}
          >
            Pricing
          </Link>

          {/* Auth */}
          {currentUser ? (
            <button
              onClick={() => base44.auth.logout()}
              className="hidden sm:flex items-center gap-2 px-2.5 h-9 rounded-lg transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              title="Log out"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black"
                style={{ background: "rgba(142,183,220,0.18)", color: "#8EB7DC" }}
              >
                {(currentUser.full_name || currentUser.email || "U").charAt(0).toUpperCase()}
              </div>
              <span className="text-[12px] font-semibold text-white/70 hidden lg:inline">Log Out</span>
            </button>
          ) : (
            <button
              onClick={() => base44.auth.redirectToLogin()}
              className="hidden sm:flex items-center px-3 h-9 text-[13px] font-semibold rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.62)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.62)")}
            >
              Log In
            </button>
          )}

          {/* Start — solid amber CTA */}
          <Link
            to="/pricing"
            className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-[13px] font-bold transition-all active:scale-95"
            style={{ background: AMBER, color: INK, boxShadow: "0 2px 14px rgba(248,199,62,0.35)" }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
          >
            Start
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenu((v) => !v)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-95"
            style={{ color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            aria-label="Open menu"
          >
            {mobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile slide-down drawer */}
        {mobileMenu && (
          <div
            className="md:hidden px-3 pb-4 pt-1 animate-in slide-in-from-top-2"
            style={{ background: INK, borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="sm:hidden mb-2"><GlobalSearch /></div>
            {[...NAV_LINKS, { path: "/pricing", label: "Pricing" }].map(({ path, label }) => {
              const active = pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenu(false)}
                  className="flex items-center justify-between px-3 py-3 rounded-xl text-[14px] font-semibold transition-colors"
                  style={{
                    color: active ? AMBER : "rgba(255,255,255,0.8)",
                    background: active ? "rgba(248,199,62,0.1)" : "transparent",
                  }}
                >
                  {label}
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>
              );
            })}
            <div className="mt-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {currentUser ? (
                <button
                  onClick={() => base44.auth.logout()}
                  className="w-full text-left px-3 py-3 rounded-xl text-[14px] font-semibold text-white/70"
                >
                  Log Out
                </button>
              ) : (
                <button
                  onClick={() => base44.auth.redirectToLogin()}
                  className="w-full text-left px-3 py-3 rounded-xl text-[14px] font-semibold text-white/70"
                >
                  Log In
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}