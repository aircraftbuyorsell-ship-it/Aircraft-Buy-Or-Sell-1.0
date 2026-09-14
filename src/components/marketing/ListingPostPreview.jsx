import { Plane } from "lucide-react";

export default function ListingPostPreview({ listing, copy }) {
  if (!listing) return <div className="social-empty">Choose an active listing to preview its post.</div>;
  return <article className="social-preview"><div className="social-preview-head"><span><Plane className="h-4 w-4"/> ABOS Aircraft Marketspace</span><small>Sponsored-ready preview</small></div>{listing.photo_url ? <img src={listing.photo_url} alt={`${listing.make || "Aircraft"} ${listing.model || "listing"}`} /> : <div className="social-photo-empty"><Plane className="h-8 w-8"/><span>No listing photo</span></div>}<p>{copy || "Your generated post copy appears here."}</p></article>;
}