import { useState, useEffect } from "react";
import { X, Star, Phone, Globe, Mail, MapPin, Fuel, CheckCircle2, Circle, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { CAT_COLORS, CAT_LABELS, CAT_ICONS } from "./ServiceCard";

const GOLD = "#f5c242";
const GREEN = "#5dcaa5";
const BLUE = "#4e8ef7";
const RED = "#f87171";
const MUTED = "rgba(255,255,255,0.60)";
const WHITE = "rgba(255,255,255,0.90)";

export default function ServiceDetailSheet({ service, onClose, isAdmin, onRefresh }) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  useEffect(() => {
    if (service) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [service]);

  if (!service) return null;

  const color = CAT_COLORS[service.category] || GOLD;
  const CatIcon = CAT_ICONS[service.category] || Fuel;

  const submitRating = async () => {
    if (!selectedRating) return;
    setSubmitting(true);
    try {
      const newRating = service.rating
        ? Math.round(((service.rating + selectedRating) / 2) * 10) / 10
        : selectedRating;
      await base44.entities.AviationService.update(service.id, { rating: newRating });
      onRefresh?.();
      setSelectedRating(0);
      setComment("");
      onClose();
    } catch (e) {
      console.error("Rating submit failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async () => {
    setTogglingActive(true);
    try {
      await base44.entities.AviationService.update(service.id, { is_active: !service.is_active });
      onRefresh?.();
      onClose();
    } catch (e) {
      console.error("Toggle failed:", e);
    } finally {
      setTogglingActive(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        onClick={onClose}
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      />

      {/* Bottom sheet */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 animate-slide-up"
        style={{
          maxHeight: "92dvh",
          background: "#0a0d14",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          border: "0.5px solid rgba(255,255,255,0.10)",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.6)",
          overflowY: "auto",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex items-center justify-center rounded-lg transition-all"
          style={{
            width: 32,
            height: 32,
            background: "rgba(255,255,255,0.06)",
            border: "0.5px solid rgba(255,255,255,0.08)",
            color: MUTED,
          }}
        >
          <X size={16} />
        </button>

        <div className="px-5 pb-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4 mt-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}15`, border: `0.5px solid ${color}30` }}
            >
              <CatIcon size={18} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 style={{ fontSize: 16, fontWeight: 600, color: WHITE, letterSpacing: "-0.03em" }}>
                {service.name}
              </h2>
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
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
                    API SOURCE
                  </span>
                )}
                {!service.is_active && (
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
                    PENDING REVIEW
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rating display */}
          {service.rating != null && (
            <div className="flex items-center gap-1.5 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={16}
                  style={{
                    color: n <= Math.round(service.rating) ? GOLD : "rgba(255,255,255,0.15)",
                    fill: n <= Math.round(service.rating) ? GOLD : "transparent",
                  }}
                />
              ))}
              <span style={{ fontSize: 14, fontWeight: 700, color: GOLD, marginLeft: 4 }}>
                {service.rating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Description */}
          {service.description && (
            <div className="mb-4">
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{service.description}</p>
            </div>
          )}

          {/* Location */}
          {(service.address || service.city || service.state || service.country) && (
            <div className="mb-4 flex items-start gap-2">
              <MapPin size={14} style={{ color: "rgba(255,255,255,0.35)", marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
                {[service.address, service.city, service.state, service.country].filter(Boolean).join(", ")}
                {service.icao_code && (
                  <span style={{ color: "rgba(255,255,255,0.35)" }}> · {service.icao_code}</span>
                )}
              </p>
            </div>
          )}

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            {service.phone && (
              <a
                href={`tel:${service.phone}`}
                className="flex items-center gap-2 rounded-lg p-3 transition-all"
                style={{ background: "rgba(78,142,247,0.06)", border: "0.5px solid rgba(78,142,247,0.18)", color: BLUE, fontSize: 12, fontWeight: 600 }}
              >
                <Phone size={14} /> {service.phone}
              </a>
            )}
            {service.email && (
              <a
                href={`mailto:${service.email}`}
                className="flex items-center gap-2 rounded-lg p-3 transition-all"
                style={{ background: "rgba(78,142,247,0.06)", border: "0.5px solid rgba(78,142,247,0.18)", color: BLUE, fontSize: 12, fontWeight: 600 }}
              >
                <Mail size={14} /> Email
              </a>
            )}
            {service.website && (
              <a
                href={service.website}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 rounded-lg p-3 transition-all"
                style={{ background: "rgba(78,142,247,0.06)", border: "0.5px solid rgba(78,142,247,0.18)", color: BLUE, fontSize: 12, fontWeight: 600 }}
              >
                <Globe size={14} /> Website
              </a>
            )}
          </div>

          {/* Certifications */}
          {service.certifications?.length > 0 && (
            <div className="mb-4">
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>
                Certifications
              </p>
              <div className="flex flex-wrap gap-1.5">
                {service.certifications.map((c, i) => (
                  <span
                    key={i}
                    className="rounded-md"
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      padding: "3px 8px",
                      background: "rgba(93,202,165,0.09)",
                      color: GREEN,
                      border: "0.5px solid rgba(93,202,165,0.20)",
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Fuel prices (FBO only) */}
          {service.fuel_prices && Object.values(service.fuel_prices).some((v) => v != null) && (
            <div className="mb-4">
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>
                Fuel Prices
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(service.fuel_prices)
                  .filter(([_, v]) => v != null)
                  .map(([fuel, price]) => (
                    <div
                      key={fuel}
                      className="rounded-lg px-3 py-2"
                      style={{ background: "rgba(245,194,66,0.06)", border: "0.5px solid rgba(245,194,66,0.15)" }}
                    >
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{fuel}</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: GOLD }}>${price.toFixed(2)}/gal</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Services offered */}
          {service.services_offered?.length > 0 && (
            <div className="mb-4">
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>
                Services Offered
              </p>
              <div className="flex flex-wrap gap-1.5">
                {service.services_offered.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-md"
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      padding: "3px 8px",
                      background: "rgba(255,255,255,0.06)",
                      color: MUTED,
                      border: "0.5px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Price range */}
          {service.price_range && (
            <div className="mb-4 flex items-center gap-2">
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                Price Tier:
              </p>
              <span
                className="rounded-md"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "3px 8px",
                  background: "rgba(255,255,255,0.06)",
                  color: WHITE,
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  textTransform: "uppercase",
                }}
              >
                {service.price_range}
              </span>
            </div>
          )}

          {/* Star rating submission form */}
          <div
            className="rounded-xl p-4 mb-4"
            style={{ background: "rgba(245,194,66,0.04)", border: "0.5px solid rgba(245,194,66,0.15)" }}
          >
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(245,194,66,0.70)", marginBottom: 8 }}>
              Rate This Provider
            </p>
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setSelectedRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                >
                  <Star
                    size={24}
                    style={{
                      color: n <= (hoverRating || selectedRating) ? GOLD : "rgba(255,255,255,0.15)",
                      fill: n <= (hoverRating || selectedRating) ? GOLD : "transparent",
                      transition: "all 0.15s",
                    }}
                  />
                </button>
              ))}
              {selectedRating > 0 && (
                <span style={{ fontSize: 12, fontWeight: 600, color: GOLD, marginLeft: 6 }}>
                  {selectedRating}/5
                </span>
              )}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional comment about your experience…"
              rows={2}
              className="w-full mb-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: WHITE,
                fontSize: 12,
                padding: "10px 12px",
                resize: "vertical",
              }}
            />
            <button
              onClick={submitRating}
              disabled={!selectedRating || submitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg transition-all"
              style={{
                background: !selectedRating || submitting ? "rgba(245,194,66,0.05)" : "rgba(245,194,66,0.12)",
                border: "0.5px solid rgba(245,194,66,0.22)",
                color: GOLD,
                fontSize: 12,
                fontWeight: 600,
                padding: "10px 0",
                minHeight: 40,
                opacity: !selectedRating || submitting ? 0.5 : 1,
              }}
            >
              <Send size={13} />
              {submitting ? "Submitting…" : "Submit Rating"}
            </button>
          </div>

          {/* Admin: toggle is_active */}
          {isAdmin && (
            <button
              onClick={toggleActive}
              disabled={togglingActive}
              className="w-full flex items-center justify-center gap-2 rounded-lg transition-all"
              style={{
                background: service.is_active ? "rgba(248,113,113,0.08)" : "rgba(93,202,165,0.08)",
                border: service.is_active ? "0.5px solid rgba(248,113,113,0.22)" : "0.5px solid rgba(93,202,165,0.22)",
                color: service.is_active ? RED : GREEN,
                fontSize: 12,
                fontWeight: 600,
                padding: "10px 0",
                minHeight: 40,
              }}
            >
              {service.is_active ? <Circle size={14} /> : <CheckCircle2 size={14} />}
              {togglingActive
                ? "Updating…"
                : service.is_active
                  ? "Unpublish (set inactive)"
                  : "Publish (set active)"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}