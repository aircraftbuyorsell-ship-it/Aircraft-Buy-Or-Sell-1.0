import { Link } from "react-router-dom";
import { Plane } from "lucide-react";

export default function LatestVerifiedListings({ listings, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-black/[0.05]" />)}
      </div>
    );
  }
  if (!listings?.length) {
    return <p className="rounded-xl border border-dashed border-black/[0.12] p-8 text-center text-[13px] text-[#999]">No verified listings yet.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {listings.map((l) => (
        <Link key={l.id} to="/listings" className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-white p-3 shadow-sm transition-all hover:border-[#D4A017]/40">
          <div className="h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-[#eceae4]">
            {l.photo_url ? (
              <img src={l.photo_url} alt={`${l.make} ${l.model}`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center"><Plane size={16} className="text-[#c9c4b8]" /></div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[12px] font-bold text-[#1a1a1a]">{l.make} {l.model}</div>
            <div className="text-[11px] text-[#999]">{l.registration || "—"}</div>
            <div className="text-[12px] font-bold text-[#1a1a1a]">
              {l.asking_price ? `$${l.asking_price.toLocaleString()}` : "POA"}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}