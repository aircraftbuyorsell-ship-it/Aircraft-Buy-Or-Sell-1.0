import { Link } from "react-router-dom";
import { ChevronDown, Search, LayoutGrid } from "lucide-react";

const NAV = [
  { label: "Marketspace", to: "/marketplace" },
  { label: "Intelligence", to: "/ati-center" },
  { label: "Verify", to: "/ati-verify" },
];

function LogoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M3 17L9 11L13 15L21 7" stroke="#D4A017" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 7H15M21 7V13" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 21H21" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="11" r="1.6" fill="#3b82f6" />
    </svg>
  );
}

export default function PlatformHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-[#fbfaf7]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-1.5 text-xl font-black tracking-tighter text-slate-900">
          <LogoIcon /> ABOS
        </Link>

        <nav className="hidden items-center md:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="flex items-center gap-1 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              {item.label}
              <ChevronDown size={12} className="text-slate-400" />
            </Link>
          ))}
          <Link to="/pricing" className="px-3 text-xs font-semibold text-slate-600 hover:text-slate-900">
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <button
            aria-label="Search"
            className="border border-slate-200 bg-white p-2 rounded-lg shadow-xs hover:bg-slate-50"
          >
            <Search size={14} className="text-slate-600" />
          </button>
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 border border-slate-200 bg-white px-3 py-2 rounded-lg text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50"
          >
            <LayoutGrid size={13} className="text-slate-600" />
            Workspace
          </Link>
        </div>
      </div>
    </header>
  );
}