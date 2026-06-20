import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import AircraftCard from "@/components/marketspace/AircraftCard";

const AMBER = "#F8C73E";

export default function FeaturedStrip({ listings = [] }) {
  if (!listings.length) return null;

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: AMBER }}>Featured Inventory</p>
          <h2 className="text-xl font-black text-white tracking-tight mt-0.5">Recently verified aircraft</h2>
        </div>
        <Link
          to="/listings"
          className="flex items-center gap-1 text-[13px] font-bold transition-opacity hover:opacity-80"
          style={{ color: AMBER }}
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible -mx-1 px-1">
        {listings.slice(0, 4).map((l) => (
          <AircraftCard key={l.id} listing={l} className="min-w-[260px] md:min-w-0" />
        ))}
      </div>
    </div>
  );
}