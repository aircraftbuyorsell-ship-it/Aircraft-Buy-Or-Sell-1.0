import { Plane } from "lucide-react";

export default function PostPreview({ listing, customNote }) {
  if (!listing) {
    return (
      <div className="text-center py-6 px-4">
        <Plane className="w-6 h-6 text-white/20 mx-auto mb-2" />
        <p className="text-[11px] text-white/35">Select a listing to preview the Facebook post.</p>
      </div>
    );
  }

  const title = [listing.year, listing.make, listing.model].filter(Boolean).join(" ");
  const lines = [];
  lines.push(`✈️ ${title}`);
  if (listing.registration) lines.push(`Registration: ${listing.registration}`);
  if (listing.asking_price != null) lines.push(`Price: ${listing.currency || "USD"} ${Number(listing.asking_price).toLocaleString()}`);
  if (listing.total_time != null) lines.push(`Total Time: ${listing.total_time} hrs`);
  if (listing.engine_hours != null) lines.push(`Engine SMOH: ${listing.engine_hours} hrs`);
  if (listing.avionics) lines.push(`Avionics: ${listing.avionics}`);
  if (customNote) lines.push(`\n${customNote}`);
  lines.push(`\nView on ABOS Marketspace`);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}
    >
      <p className="text-[9px] uppercase tracking-wider font-bold text-white/30 mb-2">Post Preview</p>
      {listing.photo_url && (
        <img src={listing.photo_url} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
      )}
      <pre className="text-[11px] text-white/60 whitespace-pre-wrap font-sans leading-relaxed">{lines.join("\n")}</pre>
    </div>
  );
}