import { Link } from "react-router-dom";
import { BadgeCheck, Plane } from "lucide-react";

function formatPrice(listing) {
  if (!listing.asking_price) return "Price on request";
  return `${listing.currency === "EUR" ? "€" : "$"}${listing.asking_price.toLocaleString()}`;
}

export default function FeaturedAircraftGrid({ listings, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid gap-5 md:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-black/[0.05]" />)}
      </div>
    );
  }
  if (!listings?.length) {
    return <p className="rounded-2xl border border-dashed border-black/[0.12] p-10 text-center text-[13px] text-[#999]">No featured aircraft available right now.</p>;
  }
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {listings.map((l) => (
        <Link key={l.id} to="/listings" className="group overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-sm transition-all hover:shadow-lg">
          <div className="relative h-44 overflow-hidden bg-[#eceae4]">
            {l.photo_url ? (
              <img src={l.photo_url} alt={`${l.make} ${l.model}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="flex h-full items-center justify-center"><Plane size={32} className="text-[#c9c4b8]" /></div>
            )}
            {l.ati_score != null && (
              <span className="absolute right-3 top-3 rounded-full bg-[#111]/80 px-2.5 py-1 text-[10px] font-bold text-[#F5C842] backdrop-blur">ATI {Math.round(l.ati_score)}</span>
            )}
          </div>
          <div className="p-5">
            <div className="text-[14px] font-bold text-[#1a1a1a]">{l.year ? `${l.year} ` : ""}{l.make} {l.model}</div>
            <div className="mt-1 text-[12px] text-[#888]">{l.registration || "Registration on file"}</div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[15px] font-black text-[#1a1a1a]">{formatPrice(l)}</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"><BadgeCheck size={12} /> Verified listing</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}