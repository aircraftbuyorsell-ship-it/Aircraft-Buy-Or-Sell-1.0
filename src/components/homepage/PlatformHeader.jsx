import { Link } from "react-router-dom";
import { ChevronDown, Search, LayoutGrid } from "lucide-react";

const NAV = [
{ label: "Marketspace", to: "/marketplace" },
{ label: "Intelligence", to: "/ati-center" },
{ label: "Verify", to: "/ati-verify" }];


function LogoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect width="44" height="44" rx="12" fill="rgba(212,160,23,0.10)" stroke="rgba(212,160,23,0.35)" strokeWidth="1" />
      <polyline points="7,33 15,14 19,33" fill="none" stroke="#1a1a1a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="19,33 24,20 28,26 36,9" fill="none" stroke="#D4A017" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="35,8 39,11 35,14" fill="#D4A017" />
    </svg>);

}

export default function PlatformHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-[#fbfaf7]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoIcon />
          <div className="flex flex-col leading-none">
            <span className="text-lg font-black tracking-tighter text-slate-900 [font-family:'-apple-system',_BlinkMacSystemFont,_SF_Pro_Display,_SF_Pro_Text,_Inter,_system-ui,_sans-serif]">ABOS™

            </span>
            <span className="text-[8px] font-bold uppercase tracking-[0.22em] text-[#D4A017] pb-2 text-left [font-family:'-apple-system',_BlinkMacSystemFont,_SF_Pro_Display,_SF_Pro_Text,_Inter,_system-ui,_sans-serif] underline">AVIATION MARKETSPACE INTELLIGENCE™

            </span>
          </div>
        </Link>

        <nav className="hidden items-center md:flex">
          {NAV.map((item) =>
          <Link
            key={item.label}
            to={item.to}
            className="flex items-center gap-1 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900">
            
              {item.label}
              <ChevronDown size={12} className="text-slate-400" />
            </Link>
          )}
          <Link to="/pricing" className="px-3 text-xs font-semibold text-slate-600 hover:text-slate-900">
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <button
            aria-label="Search"
            className="border border-slate-200 bg-white p-2 rounded-lg shadow-xs hover:bg-slate-50">
            
            <Search size={14} className="text-slate-600" />
          </button>
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 border border-slate-200 bg-white px-3 py-2 rounded-lg text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50">
            
            <LayoutGrid size={13} className="text-slate-600" />
            Workspace
          </Link>
        </div>
      </div>
    </header>);

}