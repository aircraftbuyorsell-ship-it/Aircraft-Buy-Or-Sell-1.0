import { Link } from "react-router-dom";
import { ChevronDown, Grid2X2, Search } from "lucide-react";

const NAV = [
  {
    label: "Marketspace",
    items: [
      ["Browse Aircraft", "/listings"],
      ["Featured Aircraft", "/listings"],
      ["Compare", "/compare"],
      ["Sell Aircraft", "/listings"],
      ["Deal Radar", "/deal-radar"],
    ],
  },
  {
    label: "Intelligence",
    items: [
      ["Aircraft Intelligence", "/ati-center"],
      ["ATI Report", "/ati-full-report"],
      ["Market Valuation", "/valuation"],
      ["Market Intelligence", "/market-reports"],
      ["IntraZone", "/intrazone"],
    ],
  },
  {
    label: "Verification",
    items: [
      ["Verify Aircraft", "/ati-verify"],
      ["Registry Lookup", "/n-lookup"],
      ["Ownership Context", "/registry-comparator"],
      ["Document Verification", "/ati-verify"],
      ["ATI Passport", "/listings"],
    ],
  },
  {
    label: "Services",
    items: [
      ["Aircraft Transactions", "/escrow"],
      ["Inspection & Verification", "/pre-buy-inspection"],
      ["Operations & Maintenance", "/service-intelligence"],
      ["Finance, Legal & Cross-Border", "/cross-border-bridge"],
    ],
  },
];

export default function HomePageHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#fbfaf7]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1360px] items-center gap-4 px-5 sm:px-8">
        <Link to="/1PAGE" className="flex items-center gap-2 font-bold tracking-tight text-[#1a1a1a]">
          <span className="flex h-7 w-7 items-center justify-center rounded border border-[#D4A017]/40 text-sm italic text-[#D4A017]">A</span>
          <span>ABOS</span>
        </Link>

        <nav className="hidden items-center gap-1 text-xs font-medium text-[#3a3a3a] lg:flex">
          {NAV.map((group) => (
            <div key={group.label} className="group relative">
              <button className="flex items-center gap-1 rounded-lg px-3 py-2 hover:bg-black/[0.04] hover:text-[#1a1a1a]">
                {group.label} <ChevronDown size={12} className="opacity-50 transition-transform group-hover:rotate-180" />
              </button>
              <div className="invisible absolute left-0 top-full w-60 rounded-xl border border-black/[0.07] bg-white p-2 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                {group.items.map(([label, path]) => (
                  <Link key={label} to={path} className="block rounded-lg px-3 py-2 text-[#3a3a3a] hover:bg-[#D4A017]/[0.08] hover:text-[#1a1a1a]">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <Link to="/pricing" className="rounded-lg px-3 py-2 hover:bg-black/[0.04] hover:text-[#1a1a1a]">Pricing</Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/listings"
            className="hidden h-9 w-64 items-center gap-2 rounded-lg border border-black/[0.09] bg-white px-3 text-[11px] text-[#888] hover:border-[#D4A017]/40 md:flex"
          >
            <Search size={13} /> Search aircraft, N-Reg, serial, owner…
          </Link>
          <Link to="/listings" aria-label="Search aircraft" className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/[0.09] text-[#3a3a3a] hover:bg-black/[0.04] md:hidden">
            <Search size={15} />
          </Link>
          <Link to="/intrazone" className="flex h-9 items-center gap-2 rounded-lg bg-[#D4A017] px-4 text-xs font-bold text-white hover:opacity-90">
            <Grid2X2 size={14} /> Workspace
          </Link>
        </div>
      </div>
    </header>
  );
}