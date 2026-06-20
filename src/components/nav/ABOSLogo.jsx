import { Link } from "react-router-dom";
import { BRAND } from "@/lib/brandAssets";

const AMBER = "#f5c242";
const INK = "#0d1117";

// ABOS Marketspace logo — amber mark + ABOS / Marketspace wordmark
export default function ABOSLogo({ to = "/" }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 shrink-0 group">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden transition-transform group-hover:scale-105"
        style={{ background: AMBER, boxShadow: "0 2px 12px rgba(245,194,66,0.32)" }}
      >
        <img src={BRAND.markDark} alt="ABOS" className="w-5 h-5 object-contain" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[14px] font-black tracking-[-0.02em] text-white">ABOS</span>
        <span
          className="text-[9px] font-semibold tracking-[0.14em] uppercase"
          style={{ color: "rgba(255,255,255,0.40)" }}
        >
          Marketspace
        </span>
      </div>
    </Link>
  );
}