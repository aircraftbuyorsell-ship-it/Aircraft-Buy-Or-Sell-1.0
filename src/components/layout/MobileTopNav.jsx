import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Search } from "lucide-react";

export default function MobileTopNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#111113] border-b border-[#333]">
      {/* Top bar — logo + search + menu */}
      <div className="flex items-center justify-between px-4 py-3 gap-2">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 shrink-0">
          <div className="w-5 h-5 text-[#f5c242]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="12 3 20 7 20 17 12 21 4 17 4 7 12 3"></polyline>
            </svg>
          </div>
          <span className="font-bold text-xs text-[#f5c242] tracking-wider">ABOS</span>
          <span className="text-[9px] text-[#666] font-medium">Marketplace</span>
        </Link>

        {/* Search bar — compact */}
        <div className="flex-1 flex items-center gap-1 bg-[#1a1a2e]/80 rounded-lg px-3 py-1.5 border border-[#333] min-w-0">
          <Search className="w-3.5 h-3.5 text-[#666] shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-xs placeholder-[#555] outline-none text-white min-w-0 flex-1"
          />
        </div>

        {/* Menu button */}
        <button className="p-1.5 text-[#666] hover:text-[#f5c242] transition-colors shrink-0">
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}