import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, LogIn, LogOut } from "lucide-react";
import SidebarLogo from "@/components/layout/SidebarLogo";
import ThemeToggle from "@/components/ThemeToggle";
import PillCommandBar from "@/components/layout/PillCommandBar";
import MobilePillNav from "@/components/layout/MobilePillNav";

function initials(user) {
  const name = user?.full_name || user?.email || "?";
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function HomepageHeader() {
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

  // n8n-style floating pill navbar — detached rounded container with border + blur
  const pillStyle = {
    background: scrolled ? "rgba(5,7,11,0.90)" : "rgba(10,12,18,0.65)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: scrolled
      ? "1px solid rgba(245,194,66,0.18)"
      : "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 pt-3 safe-left safe-right">
        <div className="max-w-[1240px] mx-auto transition-all duration-300" style={pillStyle}>
          <div className="flex items-center justify-between px-4 sm:px-6 h-[60px]">
            <div className="flex items-center shrink-0">
              <div className="lg:hidden">
                <SidebarLogo compact />
              </div>
              <div className="hidden lg:block">
                <SidebarLogo compact />
              </div>
            </div>

            {/* Unified platform navigation — same as inner pages */}
            <div className="hidden lg:flex items-center justify-center flex-1 min-w-0">
              <PillCommandBar />
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={handleSearchClick}
                aria-label="Search"
                className="flex items-center justify-center transition-colors"
                style={{ width: 36, height: 36, color: "rgba(255,255,255,0.60)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.90)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.60)"; }}
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
                      background: "rgba(245,194,66,0.09)",
                      border: "0.5px solid rgba(245,194,66,0.22)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      textDecoration: "none",
                    }}
                  >
                    <span style={{ color: "#f5c242", fontSize: 11, fontWeight: 600 }}>
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
                    background: "#f5c242", color: "#04060a", border: "none",
                    borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", minHeight: 36,
                  }}
                >
                  <LogIn size={14} /> <span>Get Started</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile: unified pill nav — same as inner pages */}
          <div className="lg:hidden flex items-center justify-center pb-2 px-4">
            <MobilePillNav />
          </div>
        </div>
      </header>
    </>
  );
}