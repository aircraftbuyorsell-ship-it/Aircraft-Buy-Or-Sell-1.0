import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, ExternalLink } from "lucide-react";

// External photo / spotting databases — lookup by registration
function lookupLinks(registration, make, model) {
  const reg = encodeURIComponent(registration || "");
  const q = encodeURIComponent(`${registration || ""} ${make || ""} ${model || ""} aircraft`.trim());
  return [
    { label: "Planespotters", url: `https://www.planespotters.net/search?q=${reg}` },
    { label: "JetPhotos", url: `https://www.jetphotos.com/registration/${reg}` },
    { label: "FlightRadar24", url: `https://www.flightradar24.com/data/aircraft/${reg.toLowerCase()}` },
    { label: "Google Images", url: `https://www.google.com/search?tbm=isch&q=${q}` },
  ];
}

// Free public Planespotters API — photo by registration, no key needed
async function fetchPlanespottersPhoto(registration) {
  const res = await fetch(`https://api.planespotters.net/pub/photos/reg/${encodeURIComponent(registration)}`);
  if (!res.ok) return null;
  const data = await res.json();
  const p = data?.photos?.[0];
  if (!p) return null;
  return {
    src: p.thumbnail_large?.src || p.thumbnail?.src,
    photographer: p.photographer,
    link: p.link,
  };
}

function LookupLinksRow({ registration, make, model, light = false }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {lookupLinks(registration, make, model).map(l => (
        <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
            light
              ? "bg-white/10 border-white/20 text-white/70 hover:text-white hover:bg-white/20"
              : "bg-[#F7F4EF] border-black/[0.08] text-[#6B6560] hover:text-[#0B2D5B] hover:border-[#0B2D5B]/30"
          }`}>
          {l.label} <ExternalLink className="w-2.5 h-2.5" />
        </a>
      ))}
    </div>
  );
}

export default function AircraftPhotoBlock({ registration, make, model, year, photos = [] }) {
  const [activeIdx, setActiveIdx] = useState(0);

  // Only query external DB when no uploaded photos and we have a registration
  const { data: extPhoto } = useQuery({
    queryKey: ["planespotters-photo", registration],
    queryFn: () => fetchPlanespottersPhoto(registration),
    enabled: photos.length === 0 && !!registration,
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  const title = `${year || ""} ${make || ""} ${model || ""}`.trim();

  // ── Mode 1: uploaded photos gallery ──
  if (photos.length > 0) {
    return (
      <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden shadow-sm">
        <div className="relative aspect-[16/9] bg-[#0B2D5B]">
          <img src={photos[activeIdx]} alt={title} className="w-full h-full object-cover" />
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-black text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <Camera className="w-3 h-3" /> {activeIdx + 1} / {photos.length}
          </span>
        </div>
        {photos.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto">
            {photos.map((p, i) => (
              <button key={i} onClick={() => setActiveIdx(i)}
                className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${i === activeIdx ? "border-[#E8A83A]" : "border-transparent opacity-60 hover:opacity-100"}`}>
                <img src={p} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Mode 2: external database photo found ──
  if (extPhoto?.src) {
    return (
      <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden shadow-sm">
        <div className="relative aspect-[16/9] bg-[#0B2D5B]">
          <img src={extPhoto.src} alt={title} className="w-full h-full object-cover" />
          <a href={extPhoto.link} target="_blank" rel="noopener noreferrer"
            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 text-[9px] font-bold text-white bg-black/55 backdrop-blur-sm px-2.5 py-1 rounded-full hover:bg-black/75 transition-colors">
            <Camera className="w-3 h-3" /> © {extPhoto.photographer} · Planespotters.net
          </a>
        </div>
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] text-[#AAA49C] font-semibold">Photo sourced from public spotting database</p>
          <LookupLinksRow registration={registration} make={make} model={model} />
        </div>
      </div>
    );
  }

  // No verified photo found — omit the section entirely.
  return null;
}