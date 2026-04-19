import { useState, useMemo } from "react";
import { MapPin, Search, Phone, Globe, Mail, Filter, Wrench, Shield, Fuel, FileCheck, Plane } from "lucide-react";
import { useAutoTrack } from "@/lib/useBehavior";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#D4A017]">{children}</p>;
}

const CATEGORIES = [
  { id: "mro", label: "MRO / Maintenance", icon: Wrench, color: "#185FA5" },
  { id: "avionics", label: "Avionics shops", icon: Plane, color: "#A67C00" },
  { id: "insurance", label: "Insurance brokers", icon: Shield, color: "#0F7A56" },
  { id: "fbo", label: "FBO / Fuel", icon: Fuel, color: "#C0392B" },
  { id: "broker", label: "Dealers & brokers", icon: FileCheck, color: "#6B6560" },
];

// Seed sample dataset — represents aggregated public FAA + web-scraped data
const SERVICES = [
  { id: 1, name: "Duncan Aviation", category: "mro", city: "Lincoln, NE", country: "USA", phone: "+1 402-475-2611", website: "duncanaviation.aero", email: "contact@duncanaviation.aero", rating: 4.8, distance_km: 120, source: "FAA Part 145 + Google" },
  { id: 2, name: "Garmin Aviation Service", category: "avionics", city: "Olathe, KS", country: "USA", phone: "+1 913-397-8200", website: "garmin.com/aviation", rating: 4.7, distance_km: 280, source: "Manufacturer directory" },
  { id: 3, name: "Avemco Insurance", category: "insurance", city: "Frederick, MD", country: "USA", phone: "+1 888-241-7891", website: "avemco.com", rating: 4.6, distance_km: 450, source: "NBAA verified" },
  { id: 4, name: "Signature Flight Support", category: "fbo", city: "Orlando, FL", country: "USA", phone: "+1 407-851-1234", website: "signatureflight.com", rating: 4.5, distance_km: 890, source: "FBO directory" },
  { id: 5, name: "Textron Aviation", category: "mro", city: "Wichita, KS", country: "USA", phone: "+1 316-517-6000", website: "txtav.com", rating: 4.9, distance_km: 320, source: "FAA Part 145" },
  { id: 6, name: "AssuredPartners Aerospace", category: "insurance", city: "Lake Mary, FL", country: "USA", phone: "+1 407-562-2000", website: "assuredpartnersaerospace.com", rating: 4.4, distance_km: 950, source: "NBAA verified" },
  { id: 7, name: "JetBrokers Inc.", category: "broker", city: "St. Louis, MO", country: "USA", phone: "+1 636-449-2099", website: "jetbrokers.com", rating: 4.3, distance_km: 380, source: "IADA member" },
  { id: 8, name: "Sarasota Avionics", category: "avionics", city: "Sarasota, FL", country: "USA", phone: "+1 941-355-9585", website: "sarasotaavionics.com", rating: 4.6, distance_km: 920, source: "FAA CRS" },
  { id: 9, name: "Atlantic Aviation", category: "fbo", city: "Multiple locations", country: "USA", phone: "+1 877-359-2967", website: "atlanticaviation.com", rating: 4.5, distance_km: 50, source: "FBO directory" },
  { id: 10, name: "Mente Group", category: "broker", city: "Dallas, TX", country: "USA", phone: "+1 972-387-8060", website: "mentegroup.com", rating: 4.7, distance_km: 620, source: "IADA member" },
];

function ServiceCard({ s }) {
  const cat = CATEGORIES.find(c => c.id === s.category);
  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-4 hover:border-[#D4A017] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}1A` }}>
            <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-[#1A1814] truncate">{s.name}</p>
            <p className="text-[11px] text-[#6B6560] flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {s.city} · {s.distance_km} km
            </p>
            <p className="text-[10px] text-[#AAA49C] mt-1">{cat.label}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-[#D4A017]">★ {s.rating}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-black/[0.05] flex flex-wrap gap-2">
        {s.phone && (
          <a href={`tel:${s.phone}`} className="flex items-center gap-1 text-[11px] text-[#1A1814] bg-[#F7F4EF] px-2 py-1 rounded-lg hover:bg-[rgba(212,160,23,0.08)]">
            <Phone className="w-3 h-3" /> {s.phone}
          </a>
        )}
        {s.website && (
          <a href={`https://${s.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-[#185FA5] bg-[rgba(24,95,165,0.06)] px-2 py-1 rounded-lg hover:bg-[rgba(24,95,165,0.12)]">
            <Globe className="w-3 h-3" /> {s.website}
          </a>
        )}
        {s.email && (
          <a href={`mailto:${s.email}`} className="flex items-center gap-1 text-[11px] text-[#6B6560] bg-[#F7F4EF] px-2 py-1 rounded-lg hover:bg-black/5">
            <Mail className="w-3 h-3" /> Email
          </a>
        )}
      </div>
      <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] mt-2">Source: {s.source}</p>
    </div>
  );
}

export default function ServiceFinder() {
  useAutoTrack("service_finder");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [radius, setRadius] = useState(1000);

  const filtered = useMemo(() => SERVICES.filter(s => {
    if (cat !== "all" && s.category !== cat) return false;
    if (s.distance_km > radius) return false;
    if (search && !`${s.name} ${s.city}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [search, cat, radius]);

  return (
    <div className="min-h-screen bg-[#F7F4EF] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <GoldLabel>Aviation Services · Directory</GoldLabel>
        <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight mt-1">Service Finder</h1>
        <p className="text-[#6B6560] text-sm mt-1">FAA-registered providers, dealers & brokers — aggregated from public registries and verified web sources.</p>

        {/* Map placeholder */}
        <div className="mt-5 bg-gradient-to-br from-[#1A1814] to-[#2A2825] rounded-2xl p-8 text-center border border-[#D4A017]/20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, #D4A017 2px, transparent 2px), radial-gradient(circle at 70% 60%, #F5C842 2px, transparent 2px), radial-gradient(circle at 50% 30%, #D4A017 2px, transparent 2px)", backgroundSize: "80px 80px" }} />
          <div className="relative">
            <MapPin className="w-10 h-10 text-[#D4A017] mx-auto mb-2" />
            <p className="text-white font-black text-lg">Interactive map view</p>
            <p className="text-[#8A8780] text-[11px] mt-1">{filtered.length} providers within {radius} km · Full map requires Pro plan</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 bg-white border border-black/[0.07] rounded-2xl p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAA49C]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search provider or city…"
              className="w-full pl-9 pr-4 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#D4A017]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#AAA49C]" />
            <select value={cat} onChange={e => setCat(e.target.value)} className="text-sm border border-black/10 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#D4A017]">
              <option value="all">All categories</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-[#6B6560]">Radius: <span className="text-[#D4A017]">{radius} km</span></label>
            <input type="range" min={50} max={2000} step={50} value={radius} onChange={e => setRadius(+e.target.value)} className="w-32 accent-[#D4A017]" />
          </div>
        </div>

        {/* Category quick chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setCat("all")} className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${cat === "all" ? "border-[#D4A017] bg-[#D4A017] text-white" : "border-black/10 bg-white text-[#6B6560]"}`}>All</button>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`text-[11px] font-bold px-3 py-1.5 rounded-full border flex items-center gap-1 ${cat === c.id ? "border-[#D4A017] bg-[#D4A017] text-white" : "border-black/10 bg-white text-[#6B6560]"}`}>
              <c.icon className="w-3 h-3" /> {c.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="mt-5 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-[#AAA49C]">
              <MapPin className="w-10 h-10 mx-auto opacity-30 mb-2" />
              <p className="text-sm">No providers match your filters</p>
            </div>
          ) : (
            filtered.map(s => <ServiceCard key={s.id} s={s} />)
          )}
        </div>
      </div>
    </div>
  );
}