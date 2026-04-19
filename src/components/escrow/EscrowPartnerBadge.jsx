import { ShieldCheck, Lock } from "lucide-react";

// Compact inline badge — e.g. in headers
export function EscrowPartnerBadgeInline() {
  return (
    <div className="inline-flex items-center gap-2 bg-white border-2 border-[#00ADEF] rounded-full pl-2 pr-3 py-1 shadow-sm">
      <div className="w-5 h-5 rounded-full bg-[#00ADEF] flex items-center justify-center">
        <ShieldCheck className="w-3 h-3 text-white" strokeWidth={3} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[9px] uppercase tracking-wider font-bold text-[#6B6560]">Powered by</span>
        <span className="text-[12px] font-black text-[#00ADEF] tracking-tight">Escrow.com</span>
      </div>
    </div>
  );
}

// Full trust strip — for page footer / prominent placement
export default function EscrowPartnerBadge() {
  return (
    <div className="bg-white border-2 border-[#00ADEF] rounded-2xl p-5 md:p-6">
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
        {/* Logo lockup */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-14 h-14 rounded-xl bg-[#00ADEF] flex items-center justify-center shadow-md">
            <ShieldCheck className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#6B6560]">Official Partner</p>
            <p className="text-2xl font-black text-[#00ADEF] tracking-tight leading-none">Escrow.com</p>
            <p className="text-[10px] text-[#AAA49C] mt-0.5">Licensed · Regulated · Since 1999</p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-16 bg-black/10" />

        {/* Copy */}
        <div className="flex-1 text-center md:text-left">
          <p className="text-sm font-black text-[#1A1814] uppercase tracking-tight">
            ABOS IntraZone × Escrow.com
          </p>
          <p className="text-[12px] text-[#4A4845] mt-1 leading-relaxed">
            Every transaction in the IntraZone is secured by <span className="font-bold text-[#00ADEF]">Escrow.com</span> —
            the world's most trusted online escrow service. Your funds are held in a licensed, regulated trust account until all parties are satisfied.
          </p>
        </div>

        {/* Trust chips */}
        <div className="flex md:flex-col gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-[rgba(0,173,239,0.08)] border border-[rgba(0,173,239,0.25)] rounded-full px-2.5 py-1">
            <Lock className="w-3 h-3 text-[#00ADEF]" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#00ADEF]">SOC 2</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[rgba(15,122,86,0.08)] border border-[rgba(15,122,86,0.25)] rounded-full px-2.5 py-1">
            <ShieldCheck className="w-3 h-3 text-[#0F7A56]" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#0F7A56]">FDIC Insured</span>
          </div>
        </div>
      </div>
    </div>
  );
}