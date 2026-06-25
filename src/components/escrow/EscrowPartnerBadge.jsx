import { ShieldCheck, Lock } from "lucide-react";

const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";
const BORDER = "rgba(255,255,255,0.08)";
const ESCROW_BLUE = "#4e8ef7";
const TEAL = "#5dcaa5";

export function EscrowPartnerBadgeInline() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full pl-2 pr-3 py-1" style={{ background: "rgba(78,142,247,0.06)", border: `0.5px solid rgba(78,142,247,0.20)` }}>
      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: ESCROW_BLUE }}>
        <ShieldCheck className="w-3 h-3 text-white" strokeWidth={3} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: W3 }}>Powered by</span>
        <span className="text-[12px] font-black tracking-tight" style={{ color: ESCROW_BLUE }}>Escrow.com</span>
      </div>
    </div>
  );
}

export default function EscrowPartnerBadge() {
  return (
    <div className="rounded-2xl p-5 md:p-6" style={{ background: "rgba(78,142,247,0.04)", border: "0.5px solid rgba(78,142,247,0.20)" }}>
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: ESCROW_BLUE }}>
            <ShieldCheck className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold" style={{ color: W3 }}>Official Partner</p>
            <p className="text-2xl font-black tracking-tight leading-none" style={{ color: ESCROW_BLUE }}>Escrow.com</p>
            <p className="text-[10px] mt-0.5" style={{ color: W3 }}>Licensed · Regulated · Since 1999</p>
          </div>
        </div>

        <div className="hidden md:block w-px h-16" style={{ background: BORDER }} />

        <div className="flex-1 text-center md:text-left">
          <p className="text-sm font-black uppercase tracking-tight" style={{ color: W1 }}>
            ABOS IntraZone × Escrow.com
          </p>
          <p className="text-[12px] mt-1 leading-relaxed" style={{ color: W2 }}>
            Every transaction in the IntraZone is secured by <span className="font-bold" style={{ color: ESCROW_BLUE }}>Escrow.com</span> —
            the world's most trusted online escrow service. Your funds are held in a licensed, regulated trust account until all parties are satisfied.
          </p>
        </div>

        <div className="flex md:flex-col gap-2 shrink-0">
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: "rgba(78,142,247,0.09)", border: "0.5px solid rgba(78,142,247,0.22)" }}>
            <Lock className="w-3 h-3" style={{ color: ESCROW_BLUE }} />
            <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: ESCROW_BLUE }}>SOC 2</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: "rgba(93,202,165,0.09)", border: "0.5px solid rgba(93,202,165,0.22)" }}>
            <ShieldCheck className="w-3 h-3" style={{ color: TEAL }} />
            <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: TEAL }}>FDIC Insured</span>
          </div>
        </div>
      </div>
    </div>
  );
}