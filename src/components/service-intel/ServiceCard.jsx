import { Star, MapPin, Phone, Globe, Fuel, Wrench, GraduationCap, Building2, Users, Brush, Plane } from "lucide-react";

const GOLD = "#f5c242";
const GREEN = "#5dcaa5";
const BLUE = "#4e8ef7";
const MUTED = "rgba(255,255,255,0.60)";
const WHITE = "rgba(255,255,255,0.90)";

export const CAT_COLORS = {
  mechanic: BLUE,
  ap_mechanic: "#8b5cf6",
  flight_school: GREEN,
  refueling_fbo: GOLD,
  dealer: "#ec4899",
  broker: "#06b6d4",
  paint_shop: "#f97316",
};

export const CAT_LABELS = {
  mechanic: "Mechanic / MRO",
  ap_mechanic: "A&P Mechanic",
  flight_school: "Flight School",
  refueling_fbo: "FBO / Fuel",
  dealer: "Dealer",
  broker: "Broker",
  paint_shop: "Paint Shop",
};

export const CAT_ICONS = {
  mechanic: Wrench,
  ap_mechanic: Wrench,
  flight_school: GraduationCap,
  refueling_fbo: Fuel,
  dealer: Building2,
  broker: Users,
  paint_shop: Brush,
};

function StarRow({ rating, size = 12 }) {
  if (rating == null) return null;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          style={{
            color: n <= Math.round(rating) ? GOLD : "rgba(255,255,255,0.15)",
            fill: n <= Math.round(rating) ? GOLD : "transparent",
          }}
        />
      ))}
      <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, marginLeft: 2 }}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export default function ServiceCard({ service, onClick }) {
  const color = CAT_COLORS[service.category] || GOLD;
  const CatIcon = CAT_ICONS[service.category] || Plane;
  const isPending = !service.is_active;

  return (
    <button
      onClick={() => onClick(service)}
      className="w-full text-left rounded-xl overflow-hidden transition-all group"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        borderLeft: `3px solid ${color}`,
        minHeight: 44,
      }}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CatIcon size={13} style={{ color, flexShrink: 0 }} />
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: WHITE,
                  letterSpacing: "-0.03em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {service.name}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="rounded-md"
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  padding: "1px 6px",
                  background: `${color}15`,
                  color,
                  border: `0.5px solid ${color}30`,
                }}
              >
                {CAT_LABELS[service.category] || service.category}
              </span>
              {service.source === "api" && (
                <span
                  className="rounded-md"
                  style={{
                    fontSize: 7,
                    fontWeight: 700,
                    padding: "1px 5px",
                    background: "rgba(78,142,247,0.09)",
                    color: BLUE,
                    border: "0.5px solid rgba(78,142,247,0.20)",
                  }}
                >
                  API
                </span>
              )}
              {service.source === "hybrid" && (
                <span
                  className="rounded-md"
                  style={{
                    fontSize: 7,
                    fontWeight: 700,
                    padding: "1px 5px",
                    background: "rgba(93,202,165,0.09)",
                    color: GREEN,
                    border: "0.5px solid rgba(93,202,165,0.20)",
                  }}
                >
                  HYBRID
                </span>
              )}
              {isPending && (
                <span
                  className="rounded-md"
                  style={{
                    fontSize: 7,
                    fontWeight: 700,
                    padding: "1px 5px",
                    background: "rgba(245,194,66,0.09)",
                    color: GOLD,
                    border: "0.5px solid rgba(245,194,66,0.22)",
                  }}
                >
                  PENDING
                </span>
              )}
              {service.price_range && (
                <span
                  className="rounded-md"
                  style={{
                    fontSize: 7,
                    fontWeight: 700,
                    padding: "1px 5px",
                    background: "rgba(255,255,255,0.06)",
                    color: MUTED,
                    border: "0.5px solid rgba(255,255,255,0.08)",
                    textTransform: "uppercase",
                  }}
                >
                  {service.price_range}
                </span>
              )}
            </div>
          </div>
          {service.rating != null && (
            <div className="shrink-0">
              <StarRow rating={service.rating} />
            </div>
          )}
        </div>

        {/* Location */}
        {(service.city || service.state || service.country) && (
          <div className="flex items-center gap-1 mb-2">
            <MapPin size={10} style={{ color: "rgba(255,255,255,0.35)" }} />
            <span style={{ fontSize: 10, color: MUTED }}>
              {[service.city, service.state, service.country].filter(Boolean).join(", ")}
            </span>
          </div>
        )}

        {/* Fuel prices preview (FBO only) */}
        {service.fuel_prices && Object.values(service.fuel_prices).some((v) => v != null) && (
          <div className="flex gap-2 mb-2">
            {Object.entries(service.fuel_prices)
              .filter(([_, v]) => v != null)
              .slice(0, 3)
              .map(([fuel, price]) => (
                <div
                  key={fuel}
                  className="rounded-lg px-2 py-1"
                  style={{ background: "rgba(245,194,66,0.06)", border: "0.5px solid rgba(245,194,66,0.15)" }}
                >
                  <p style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{fuel}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>${price.toFixed(2)}</p>
                </div>
              ))}
          </div>
        )}

        {/* Contact quick row */}
        <div className="flex items-center gap-3">
          {service.phone && (
            <span className="flex items-center gap-1" style={{ fontSize: 10, color: BLUE }}>
              <Phone size={10} /> {service.phone}
            </span>
          )}
          {service.website && (
            <span className="flex items-center gap-1" style={{ fontSize: 10, color: BLUE }}>
              <Globe size={10} /> Website
            </span>
          )}
        </div>
      </div>
    </button>
  );
}