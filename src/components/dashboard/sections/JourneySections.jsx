import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { NAV_TREE } from "@/components/layout/navConfig";

const HUB_INFO = {
  Marketspace: {
    title: "Browse & Trade Aircraft",
    desc: "Search listings, manage deals through the sales pipeline, handle escrow, track leads, and match buyers with sellers.",
    accent: "#4e8ef7",
  },
  Intelligence: {
    title: "Valuation & Analytics",
    desc: "Run AI valuations, compare aircraft, analyze market trends, calculate operating costs, and generate investment briefs.",
    accent: "#D4A017",
  },
  Verify: {
    title: "Verify & Inspect",
    desc: "Look up registrations, inspect digital twins, run pre-buy inspections, verify documentation, and connect with experts.",
    accent: "#5dcaa5",
  },
  API: {
    title: "Developer Hub",
    desc: "Core API, MCP server, SDK references, integration kit, agent connections, workflows, and the developer marketplace.",
    accent: "#a855f7",
  },
  Pricing: {
    title: "Plans & Credits",
    desc: "Choose the plan that fits your mission — from free explorer to professional broker.",
    accent: "#f5c242",
  },
};

export default function JourneySections() {
  // Skip Home, show the 4 hubs + Pricing
  const hubs = NAV_TREE.filter((s) => s.path !== "/");

  return (
    <section className="relative z-10 w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-8">
        <p className="text-[10px] tracking-[0.18em] uppercase text-white/40 font-medium mb-2">
          One Platform · Four Hubs
        </p>
        <h2 className="text-[clamp(22px,3.5vw,34px)] font-bold tracking-[-0.02em] text-white">
          Everything Aircraft, Organized
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {hubs.map((section, si) => {
          const info = HUB_INFO[section.label] || { title: section.label, desc: "", accent: "#D4A017" };
          const Icon = section.icon;
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
                minHeight: 240,
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 40,
                    height: 40,
                    background: `${info.accent}14`,
                    border: `1px solid ${info.accent}30`,
                    color: info.accent,
                  }}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                </div>
                <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/30">
                  {String(si + 1).padStart(2, "0")}
                </span>
              </div>

              <h3 className="text-[20px] font-bold tracking-[-0.01em] text-white mb-2">
                {info.title}
              </h3>
              <p className="text-[12px] leading-[1.6] text-white/45 mb-5">
                {info.desc}
              </p>

              <div className="w-full h-px mb-4" style={{ background: `linear-gradient(90deg, ${info.accent}40, transparent)` }} />

              <div
                className="flex items-center gap-1.5 mt-auto text-[12px] font-bold"
                style={{ color: info.accent }}
              >
                Explore {section.label}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}