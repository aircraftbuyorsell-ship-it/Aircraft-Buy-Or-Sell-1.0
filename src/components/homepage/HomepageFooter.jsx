import { Link } from "react-router-dom";

const COLUMNS = [
  {
    title: "Products",
    links: [["Marketspace", "/listings"], ["Aircraft Intelligence", "/ati-center"], ["IntraZone", "/intrazone"], ["Verification", "/ati-verify"], ["Services", "/service-intelligence"]],
  },
  {
    title: "Platform",
    links: [["Core API", "/developers/core-api"], ["SDK", "/developers"], ["MCP", "/developers"], ["Developers", "/developers"], ["Documentation", "/developers/core-api"], ["Integrations", "/integration-kit"]],
  },
  {
    title: "Protocols",
    links: [["APL", "/developers"], ["ADL", "/developers"], ["Capability Registry", "/developers"], ["Tool Validation", "/developers"]],
  },
  {
    title: "Trust",
    links: [["Governance", "/legal/ai-transparency"], ["Security", "/legal/dsa"], ["Privacy", "/privacy-policy"], ["AI Transparency", "/legal/ai-transparency"], ["Data Sources", "/legal/ip-notice"]],
  },
  {
    title: "Company",
    links: [["Community", "/community"], ["Partners", "/integration-kit"], ["Pricing", "/pricing"], ["Contact", "/community"], ["Terms", "/terms-of-service"]],
  },
];

export default function HomepageFooter() {
  return (
    <footer className="border-t border-black/[0.07] bg-[#fbfaf7]">
      <div className="mx-auto max-w-[1360px] px-5 py-16 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(5,1fr)]">
          <div>
            <div className="flex items-center gap-2 font-bold tracking-tight text-[#1a1a1a]">
              <span className="flex h-7 w-7 items-center justify-center rounded border border-[#D4A017]/40 text-sm italic text-[#D4A017]">A</span>
              ABOS
            </div>
            <p className="mt-2 text-[11px] font-semibold text-[#999]">AircraftBuyOrSell.com</p>
            <p className="mt-4 max-w-xs text-[12px] leading-6 text-[#888]">
              Aviation intelligence infrastructure connecting aircraft data, market participants, professional workflows, applications and authorized agents.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">{col.title}</div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, path]) => (
                  <li key={label}>
                    <Link to={path} className="text-[12px] text-[#777] hover:text-[#D4A017]">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-6 text-[11px] text-[#999]">
          <span>© {new Date().getFullYear()} ABOS — AircraftBuyOrSell.com</span>
          <span>Europe · English</span>
        </div>
      </div>
    </footer>
  );
}