import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { NAV_TREE } from "@/components/layout/navConfig";

const SECTION_TITLE = {
  Discover: "Browse Aircraft",
  Transact: "Buy Securely",
  Manage: "Your Dashboard",
};

const SECTION_DESC = {
  Discover: "Search thousands of aircraft listings, compare models, track live market prices, and get AI valuations — all in one place.",
  Transact: "Close deals securely with escrow protection, pre-buy inspections, and verified aircraft identity reports.",
  Manage: "Your dashboard for account settings, community access, developer tools, and platform administration.",
};

const SECTION_ACCENT = {
  Discover: "#4e8ef7",
  Transact: "#D4A017",
  Manage: "#5dcaa5",
};

export default function JourneySections() {
  return (
    <section className="relative z-10 w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-8">
        <p className="text-[10px] tracking-[0.18em] uppercase text-white/40 font-medium mb-2">
          Buy · Verify · Manage Aircraft Online
        </p>
        <h2 className="text-[clamp(22px,3.5vw,34px)] font-bold tracking-[-0.02em] text-white">
          Find, Buy &amp; Own Aircraft with Confidence
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {NAV_TREE.map((section, si) => {
          const accent = SECTION_ACCENT[section.label] || "#D4A017";
          const totalItems = section.categories.reduce((n, c) => n + c.items.length, 0);

          return (
            <Link
              key={section.label}
              to={section.path}
              className="group relative rounded-2xl p-6 flex flex-col transition-all duration-300 hover:scale-[1.015]"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                minHeight: 280,
              }}
            >
              {/* Number badge */}
              <div className="flex items-center justify-between mb-5">
                <div
                  className="flex items-center justify-center rounded-full text-[13px] font-bold"
                  style={{
                    width: 40,
                    height: 40,
                    background: `${accent}14`,
                    border: `1px solid ${accent}30`,
                    color: accent,
                  }}
                >
                  {String(si + 1).padStart(2, "0")}
                </div>
                <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/30">
                  {totalItems} tools
                </span>
              </div>

              {/* Title */}
              <h3 className="text-[20px] font-bold tracking-[-0.01em] text-white mb-2">
                {SECTION_TITLE[section.label]}
              </h3>
              <p className="text-[12px] leading-[1.6] text-white/45 mb-5">
                {SECTION_DESC[section.label]}
              </p>

              {/* Divider */}
              <div className="w-full h-px mb-4" style={{ background: `linear-gradient(90deg, ${accent}40, transparent)` }} />

              {/* Category tree */}
              <div className="flex flex-col gap-3 flex-1">
                {section.categories.map((cat) => (
                  <div key={cat.label}>
                    <p className="text-[8px] uppercase tracking-[0.14em] font-bold text-white/25 mb-1.5">
                      {cat.label}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {cat.items.map((item) => (
                        <span
                          key={item.path}
                          className="text-[11px] font-medium text-white/55 group-hover:text-white/70 transition-colors"
                        >
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div
                className="flex items-center gap-1.5 mt-5 text-[12px] font-bold"
                style={{ color: accent }}
              >
                {section.label === "Discover" ? "Start Browsing" : section.label === "Transact" ? "Start Buying" : "Go to Dashboard"}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}