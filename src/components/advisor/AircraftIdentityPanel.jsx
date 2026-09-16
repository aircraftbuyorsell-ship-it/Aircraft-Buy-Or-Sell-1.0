import { BadgeCheck, Camera, MapPin, Plane } from "lucide-react";

export default function AircraftIdentityPanel({ registration, data, photo }) {
  const ac = data?.aircraft || {};
  const title = [ac.make || ac.manufacturer, ac.model].filter(Boolean).join(" ") || "Aircraft identity";
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid md:grid-cols-[minmax(300px,.85fr)_1.15fr]">
      <div className="relative min-h-64 bg-muted">
        {photo?.photo_url ? <img src={photo.photo_url} alt={`${registration} ${title}`} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center"><Plane className="h-20 w-20 text-muted-foreground/30" /></div>}
        {photo?.source && <div className="absolute bottom-3 left-3 rounded-md bg-black/70 px-2 py-1 text-[10px] text-white"><Camera className="mr-1 inline h-3 w-3" />{photo.photographer ? `${photo.photographer} · ` : ""}{photo.photo_link ? <a href={photo.photo_link} target="_blank" rel="noreferrer" className="underline">{photo.source}</a> : photo.source}</div>}
      </div>
      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{data?.origin_label || "Registry source"}</span><span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><BadgeCheck className="h-4 w-4" /> Identity evidence found</span></div>
        <p className="mt-5 font-mono text-sm font-bold text-primary">{registration}</p><h2 className="mt-1 text-3xl font-bold text-card-foreground">{title}</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm"><div><span className="block text-xs text-muted-foreground">Year</span><b>{ac.year || "Not published"}</b></div><div><span className="block text-xs text-muted-foreground">Serial number</span><b>{ac.serial_number || "Not published"}</b></div><div><span className="block text-xs text-muted-foreground">Status</span><b>{ac.status || "Unconfirmed"}</b></div><div><span className="block text-xs text-muted-foreground">Location</span><b className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" />{[ac.state, ac.country].filter(Boolean).join(", ") || "Not published"}</b></div></div>
      </div>
    </section>
  );
}