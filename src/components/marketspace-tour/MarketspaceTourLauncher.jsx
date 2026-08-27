import { Play } from "lucide-react";
import { openMarketspaceTour } from "@/components/marketspace-tour/MarketspaceTour";

/**
 * "Play Tour" CTA — launches the cinematic Marketspace guided tour.
 * Compact pill button, gold accent, works on any page.
 */
export default function MarketspaceTourLauncher({ className = "" }) {
  return (
    <button
      type="button"
      onClick={openMarketspaceTour}
      className={`inline-flex items-center gap-2 rounded-full border border-[#D4A017]/40 bg-[#D4A017]/[0.08] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#A67C00] shadow-sm transition hover:bg-[#D4A017]/[0.14] hover:shadow-md dark:text-[#F5C842] ${className}`}
    >
      <Play className="h-3.5 w-3.5 fill-current" />
      Play Tour
    </button>
  );
}