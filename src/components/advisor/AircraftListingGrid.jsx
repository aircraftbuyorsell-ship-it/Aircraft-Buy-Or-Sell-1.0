import { ArrowRight, Plane } from "lucide-react";
import { Link } from "react-router-dom";

const money = (value, currency = "USD") => value ? new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value) : "Price on request";

export default function AircraftListingGrid({ listings, title = "Aircraft currently on the market" }) {
  if (!listings.length) return null;
  return (
    <section className="mt-8"><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase text-primary">Live market evidence</p><h2 className="mt-1 text-2xl font-bold">{title}</h2></div><Link to="/listings" className="hidden items-center gap-1 text-xs font-bold text-navy hover:underline sm:flex">All listings <ArrowRight className="h-4 w-4" /></Link></div>
      <div className="grid gap-4 md:grid-cols-3">{listings.slice(0, 3).map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="flex aspect-[16/9] items-center justify-center bg-muted">{item.photo_url ? <img src={item.photo_url} alt={`${item.make} ${item.model}`} className="h-full w-full object-cover" /> : <Plane className="h-12 w-12 text-muted-foreground/30" />}</div><div className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-bold text-primary">{item.registration || "REG PENDING"}</p><h3 className="mt-1 font-bold">{[item.year, item.make, item.model].filter(Boolean).join(" ")}</h3></div>{item.ati_score != null && <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary">ATI {item.ati_score}</span>}</div><p className="mt-4 text-lg font-bold">{money(item.asking_price, item.currency)}</p></div></article>)}</div>
    </section>
  );
}