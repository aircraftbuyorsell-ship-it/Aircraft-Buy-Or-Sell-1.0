import { Link } from "react-router-dom";

/* Brand icons from DESIGN_SYSTEM.md */
const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);
const PlaneIcon = ({ color = "#D4A017" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  </svg>
);
const ShieldIcon = ({ color = "#3B82F6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" />
  </svg>
);
const CodeIcon = ({ color = "#8B5CF6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
  </svg>
);
const BadgeCheckIcon = ({ color = "#22C55E" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="m9 12 2 2 4-4" />
  </svg>
);

const HUBS = [
  {
    label: "Marketspace",
    path: "/marketspace",
    Icon: PlaneIcon,
    accent: "#D4A017",
    description: "Browse listings, manage sales pipelines, track deals, and connect with verified sellers.",
    tools: "Listings · Pipeline · Escrow · Leads",
  },
  {
    label: "Intelligence",
    path: "/intelligence",
    Icon: ShieldIcon,
    accent: "#3B82F6",
    description: "Valuations, market analytics, calculators, and AI-generated reports for every aircraft.",
    tools: "Valuation Studio · Analytics · Reports",
  },
  {
    label: "Verify",
    path: "/verify",
    Icon: BadgeCheckIcon,
    accent: "#22C55E",
    description: "Registry lookups, digital twins, pre-buy inspections, and expert cross-checks.",
    tools: "N-Lookup · Digital Twin · Pre-Buy",
  },
  {
    label: "API",
    path: "/api",
    Icon: CodeIcon,
    accent: "#8B5CF6",
    description: "Core API, MCP server, developer marketplace, integration kit, and tiered access plans.",
    tools: "Core API · MCP · Marketplace · SDKs",
  },
];

export default function HubGrid() {
  return (
    <section className="border-b border-border" style={{ background: "var(--brand-background)" }}>
      <div className="mx-auto max-w-[1500px] px-4 py-12 md:px-8 md:py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-1 abos-badge-category">Explore the platform</p>
            <h2 className="text-2xl text-foreground md:text-3xl">Four hubs. One mission.</h2>
          </div>
          <Link to="/pricing" className="abos-btn-outline hidden sm:inline-flex">
            View Pricing
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HUBS.map((hub) => {
            const { Icon } = hub;
            return (
              <Link
                key={hub.label}
                to={hub.path}
                className="group glass-card flex flex-col p-5 no-underline"
              >
                {/* Icon */}
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{ background: `${hub.accent}14`, border: `1px solid ${hub.accent}30` }}
                >
                  <Icon color={hub.accent} />
                </div>

                {/* Title */}
                <h3 className="mb-2 text-base text-foreground">{hub.label}</h3>

                {/* Description */}
                <p className="mb-4 flex-1 text-xs text-muted-foreground" style={{ lineHeight: "1.6" }}>
                  {hub.description}
                </p>

                {/* Tools list */}
                <span className="mb-3 abos-badge-category">{hub.tools}</span>

                {/* Arrow */}
                <div className="flex items-center gap-1.5 text-xs font-bold opacity-0 transition-opacity duration-150 group-hover:opacity-100" style={{ color: "var(--brand-primary)" }}>
                  <span>Enter hub</span>
                  <ArrowRightIcon />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}