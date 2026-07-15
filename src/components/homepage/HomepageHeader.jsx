import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { LogIn, LogOut } from "lucide-react";
import SidebarLogo from "@/components/layout/SidebarLogo";
import UniversalSearchBar from "@/components/search/UniversalSearchBar";
import ThemeToggle from "@/components/ThemeToggle";
import PillCommandBar from "@/components/layout/PillCommandBar";
import MobilePillNav from "@/components/layout/MobilePillNav";
import AccountMenu from "@/components/layout/AccountMenu";
import { useTheme } from "@/lib/useTheme";

function initials(user) {
  const name = user?.full_name || user?.email || "?";
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function HomepageHeader() {
  const [scrolled, setScrolled] = useState(false);
  const isDark = useTheme();

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

  // n8n-style floating pill navbar — uses glass-navbar for automatic light/dark
  const pillStyle = {
    background: isDark
      ? (scrolled ? "hsl(var(--card) / 0.92)" : "hsl(var(--card) / 0.75)")
      : "hsl(var(--card))",
    backdropFilter: isDark ? "blur(20px)" : "none",
    WebkitBackdropFilter: isDark ? "blur(20px)" : "none",
    border: scrolled
      ? "1px solid hsl(var(--primary) / 0.25)"
      : "1px solid hsl(var(--border))",
    borderRadius: 10,
    boxShadow: isDark
      ? "0 8px 32px hsl(var(--foreground) / 0.10)"
      : "0 8px 24px rgba(15,23,42,0.08)",
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-2 sm:px-6 pt-2 sm:pt-3 safe-left safe-right">
        <div className="max-w-[1240px] mx-auto transition-all duration-300" style={pillStyle}>
          <div className="flex items-center justify-between px-3 sm:px-6 h-[54px] sm:h-[60px]">
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
              <UniversalSearchBar compact />
              <ThemeToggle />
              {currentUser ? (
                <AccountMenu user={currentUser} />
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
          <div className="lg:hidden flex items-center justify-center pb-2 px-2 sm:px-4">
            <MobilePillNav />
          </div>
        </div>
      </header>
    </>
  );
}