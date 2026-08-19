import { Link } from "react-router-dom";
import { Plane, Shield, Code, CreditCard, ArrowRight } from "lucide-react";

const HUBS = [
  {
    label: "Marketspace",
    path: "/marketspace",
    icon: Plane,
    accent: "#D4A017",
    description: "Browse listings, manage sales pipelines, track deals, and connect with verified sellers.",
    tools: "Listings · Pipeline · Escrow · Leads",
  },
  {
    label: "Intelligence",
    path: "/intelligence",
    icon: Shield,
    accent: "#3B82F6",
    description: "Valuations, market analytics, calculators, and AI-generated reports for every aircraft.",
    tools: "Valuation Studio · Analytics · Reports",
  },
  {
    label: "Verify",
    path: "/verify",
    icon: Shield,
    accent: "#22C55E",
    description: "Registry lookups, digital twins, pre-buy inspections, and expert cross-checks.",
    tools: "N-Lookup · Digital Twin · Pre-Buy",
  },
  {
    label: "API",
    path: "/api",
    icon: Code,
    accent: "#8B5CF6",
    description: "Core API, MCP server, developer marketplace, integration kit, and tiered access plans.",
    tools: "Core API · MCP · Marketplace · SDKs",
  },
];

export default function HubGrid() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-[1500px] px-4 py-12 md:px-8 md:py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#D4A017]">
              Explore the platform
            </p>
            <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
              Four hubs. One mission.
            </h2>
          </div>
          <Link
            to="/pricing"
            className="hidden items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition hover:border-[#D4A017]/40 sm:inline-flex"
          >
            <CreditCard className="h-3.5 w-3.5" />
            View Pricing
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HUBS.map((hub) => {
            const Icon = hub.icon;
            return (
              <Link
                key={hub.label}
                to={hub.path}
                className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:border-[#D4A017]/30 hover:shadow-lg hover:shadow-[#D4A017]/[0.04]"
              >
                {/* Icon */}
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{
                    background: `${hub.accent}14`,
                    border: `1px solid ${hub.accent}30`,
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: hub.accent }} />
                </div>

                {/* Title */}
                <h3 className="mb-2 text-base font-black tracking-tight text-foreground">
                  {hub.label}
                </h3>

                {/* Description */}
                <p className="mb-4 flex-1 text-xs leading-relaxed text-muted-foreground">
                  {hub.description}
                </p>

                {/* Tools list */}
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70">
                  {hub.tools}
                </p>

                {/* Arrow */}
                <div className="flex items-center gap-1 text-xs font-bold text-[#D4A017] opacity-0 transition-opacity group-hover:opacity-100">
                  Enter hub
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}