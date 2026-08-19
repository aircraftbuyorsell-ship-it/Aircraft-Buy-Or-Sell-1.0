import { Link } from "react-router-dom";

/* Brand icons from DESIGN_SYSTEM.md */
const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);
const PlaneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>
);
const RadarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/></svg>
);
const BadgeCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>
);
const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);

const HUBS = [
  {
    label: "Marketspace",
    path: "/marketspace",
    Icon: PlaneIcon,
    description: "Browse listings, manage sales pipelines, track deals, and connect with verified sellers.",
    tools: "Listings · Pipeline · Escrow · Leads",
  },
  {
    label: "Intelligence",
    path: "/intelligence",
    Icon: RadarIcon,
    description: "Valuations, market analytics, calculators, and AI-generated reports for every aircraft.",
    tools: "Valuation Studio · Analytics · Reports",
  },
  {
    label: "Verify",
    path: "/verify",
    Icon: BadgeCheckIcon,
    description: "Registry lookups, digital twins, pre-buy inspections, and expert cross-checks.",
    tools: "N-Lookup · Digital Twin · Pre-Buy",
  },
  {
    label: "API",
    path: "/api",
    Icon: InfoIcon,
    description: "Core API, MCP server, developer marketplace, integration kit, and tiered access plans.",
    tools: "Core API · MCP · Marketplace · SDKs",
  },
];

export default function HubGrid() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-[1500px] px-4 py-12 md:px-8 md:py-16">
        <div className="mb-6 flex items-end justify-between">
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
                className="group glass-card flex flex-col p-4 md:p-5 no-underline"
              >
                {/* Icon */}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/[0.06]">
                  <Icon />
                </div>

                {/* Title */}
                <h3 className="mb-2 text-base text-foreground">{hub.label}</h3>

                {/* Description */}
                <p className="mb-4 flex-1 text-xs text-muted-foreground" style={{ lineHeight: "1.6" }}>
                  {hub.description}
                </p>

                {/* Tools list */}
                <span className="mb-3 abos-badge-category">{hub.tools}</span>

                {/* Arrow — always visible on mobile, hover-reveal on desktop */}
                <div className="flex items-center gap-1.5 text-xs font-bold opacity-100 lg:opacity-0 transition-opacity duration-150 lg:group-hover:opacity-100" style={{ color: "var(--brand-primary)" }}>
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