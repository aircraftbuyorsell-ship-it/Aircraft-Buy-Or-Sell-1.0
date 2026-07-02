import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Wrench, GraduationCap, Fuel, Plane, Brush, Users, Building2,
  Search, Star, Phone, Globe, MapPin, RefreshCw, ChevronDown,
} from "lucide-react";

const GOLD = "#f5c242";
const GREEN = "#5dcaa5";
const BLUE = "#4e8ef7";
const MUTED = "rgba(255,255,255,0.60)";
const WHITE = "rgba(255,255,255,0.90)";

const CATEGORIES = [
  { id: "all",           label: "All Services",    icon: Search },
  { id: "mechanic",      label: "Mechanics / MRO", icon: Wrench },
  { id: "ap_mechanic",   label: "A&P Mechanics",   icon: Wrench },
  { id: "flight_school", label: "Flight Schools",  icon: GraduationCap },
  { id: "refueling_fbo", label: "FBOs / Fuel",     icon: Fuel },
  { id: "dealer",        label: "Dealers",         icon: Building2 },
  { id: "broker",        label: "Brokers",         icon: Users },
  { id: "paint_shop",    label: "Paint Shops",     icon: Brush },
];

const CAT_COLORS = {
  mechanic: BLUE, ap_mechanic: "#8b5cf6", flight_school: GREEN,
  refueling_fbo: GOLD, dealer: "#ec4899", broker: "#06b6d4", paint_shop: "#f97316",
};

function ServiceCard({ service }) {
  const color = CAT_COLORS[service.category] || GOLD;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden transition-all"
      style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div style={{ height: 2, background: color }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 style={{ fontSize: 13, fontWeight: 600, color: WHITE, letterSpacing: "-0.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {service.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="rounded-md" style={{ fontSize: 8, fontWeight: 700, padding: "1px 6px", background: `${color}15`, color, border: `0.5px solid ${color}30` }}>
                {CATEGORIES.find(c => c.id === service.category)?.label || service.category}
              </span>
              {service.icao_code && (
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{service.icao_code}</span>
              )}
              {service.source === "api" && (
                <span className="rounded-md" style={{ fontSize: 7, fontWeight: 700, padding: "1px 5px", background: "rgba(78,142,247,0.09)", color: BLUE, border: "0.5px solid rgba(78,142,247,0.20)" }}>
                  LIVE
                </span>
              )}
            </div>
          </div>
          {service.rating != null && (
            <div className="flex items-center gap-1 shrink-0">
              <Star size={12} style={{ color: GOLD }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{service.rating?.toFixed(1)}</span>
            </div>
          )}
        </div>

        {service.description && (
          <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.4, marginBottom: 8 }}>{service.description}</p>
        )}

        {/* Location */}
        {(service.city || service.state || service.country) && (
          <div className="flex items-center gap-1 mb-2">
            <MapPin size={10} style={{ color: "rgba(255,255,255,0.35)" }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.60)" }}>
              {[service.city, service.state, service.country].filter(Boolean).join(", ")}
            </span>
          </div>
        )}

        {/* Fuel prices (FBO only) */}
        {service.fuel_prices && Object.values(service.fuel_prices).some(v => v != null) && (
          <div className="flex gap-2 mb-2">
            {Object.entries(service.fuel_prices).filter(([_, v]) => v != null).map(([fuel, price]) => (
              <div key={fuel} className="rounded-lg px-2 py-1" style={{ background: "rgba(245,194,66,0.06)", border: "0.5px solid rgba(245,194,66,0.15)" }}>
                <p style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{fuel}</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>${price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Expandable details */}
        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-2"
          style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", background: "none", border: "none", cursor: "pointer" }}>
          Details <ChevronDown size={12} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            {service.certifications?.length > 0 && (
              <div>
                <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Certifications</p>
                <div className="flex flex-wrap gap-1">
                  {service.certifications.map((c, i) => (
                    <span key={i} className="rounded-md" style={{ fontSize: 8, fontWeight: 600, padding: "1px 5px", background: "rgba(93,202,165,0.09)", color: GREEN, border: "0.5px solid rgba(93,202,165,0.20)" }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {service.services_offered?.length > 0 && (
              <div>
                <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Services</p>
                <div className="flex flex-wrap gap-1">
                  {service.services_offered.map((s, i) => (
                    <span key={i} className="rounded-md" style={{ fontSize: 8, fontWeight: 600, padding: "1px 5px", background: "rgba(255,255,255,0.06)", color: MUTED, border: "0.5px solid rgba(255,255,255,0.08)" }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 pt-1">
              {service.phone && (
                <a href={`tel:${service.phone}`} className="flex items-center gap-1" style={{ fontSize: 10, color: BLUE, textDecoration: "none" }}>
                  <Phone size={11} /> {service.phone}
                </a>
              )}
              {service.website && (
                <a href={service.website} target="_blank" rel="noopener" className="flex items-center gap-1" style={{ fontSize: 10, color: BLUE, textDecoration: "none" }}>
                  <Globe size={11} /> Website
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ServiceDirectory() {
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [liveSearch, setLiveSearch] = useState("");
  const [liveLoading, setLiveLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["aviation-services-all"],
    queryFn: () => base44.entities.AviationService.list("-created_date", 500),
  });

  const filtered = useMemo(() => {
    let result = services;
    if (activeCat !== "all") result = result.filter(s => s.category === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.icao_code?.toLowerCase().includes(q) ||
        s.country?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [services, activeCat, search]);

  const searchLive = async () => {
    if (!liveSearch.trim()) return;
    setLiveLoading(true);
    try {
      const res = await base44.functions.invoke("aviationServiceIntel", {
        action: "search_services",
        category: activeCat !== "all" ? activeCat : undefined,
        icao: liveSearch.trim().toUpperCase(),
      });
      const data = res.data;
      if (data?.services?.length > 0) {
        // Save API results to entity for persistence
        await base44.entities.AviationService.bulkCreate(
          data.services.map(s => ({
            name: s.name,
            category: s.category || activeCat !== "all" ? activeCat : "mechanic",
            address: s.address,
            city: s.city,
            state: s.state,
            country: s.country || "US",
            phone: s.phone,
            website: s.website,
            certifications: s.certifications || [],
            services_offered: s.services_offered || [],
            rating: s.rating,
            icao_code: s.icao_code || liveSearch.trim().toUpperCase(),
            source: "api",
            is_active: true,
          }))
        );
        queryClient.invalidateQueries({ queryKey: ["aviation-services-all"] });
      }
    } catch (e) {
      console.error("Live search failed:", e);
    } finally {
      setLiveLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Live search bar */}
      <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(78,142,247,0.80)", marginBottom: 10 }}>
          Live API Search — Enrich Directory
        </p>
        <div className="flex gap-2 flex-wrap">
          <input
            value={liveSearch}
            onChange={(e) => setLiveSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchLive()}
            placeholder="Enter airport ICAO code (e.g. KJFK, KLAX, EGLL)…"
            className="flex-1 min-w-[200px]"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              color: WHITE,
              fontSize: 13,
              padding: "10px 14px",
              minHeight: 40,
            }}
          />
          <button
            onClick={searchLive}
            disabled={liveLoading || !liveSearch.trim()}
            className="flex items-center gap-2 rounded-lg transition-all shrink-0"
            style={{
              background: liveLoading || !liveSearch.trim() ? "rgba(255,255,255,0.04)" : "rgba(78,142,247,0.09)",
              border: liveLoading || !liveSearch.trim() ? "0.5px solid rgba(255,255,255,0.08)" : "0.5px solid rgba(78,142,247,0.22)",
              color: liveLoading || !liveSearch.trim() ? "rgba(255,255,255,0.25)" : BLUE,
              fontSize: 12,
              fontWeight: 600,
              padding: "0 16px",
              minHeight: 40,
            }}
          >
            {liveLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            {liveLoading ? "Searching…" : "Search Live"}
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = activeCat === cat.id;
          const count = cat.id === "all" ? services.length : services.filter(s => s.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap"
              style={{
                background: active ? "rgba(245,194,66,0.09)" : "rgba(255,255,255,0.04)",
                border: active ? "0.5px solid rgba(245,194,66,0.22)" : "0.5px solid rgba(255,255,255,0.08)",
                color: active ? GOLD : MUTED,
                fontSize: 11,
                fontWeight: 600,
                minHeight: 36,
              }}
            >
              <Icon size={13} />
              {cat.label}
              <span style={{ fontSize: 9, opacity: 0.6 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Text search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, city, ICAO, or country…"
        className="w-full"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          color: WHITE,
          fontSize: 13,
          padding: "10px 14px",
          minHeight: 40,
        }}
      />

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 rounded-full animate-spin"
            style={{ borderColor: "rgba(245,194,66,0.20)", borderTopColor: "#f5c242" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Plane size={32} style={{ color: "rgba(255,255,255,0.15)", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: WHITE }}>No services found</p>
          <p style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>
            Try the live API search above to find and import services near an airport.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => <ServiceCard key={s.id} service={s} />)}
        </div>
      )}
    </div>
  );
}