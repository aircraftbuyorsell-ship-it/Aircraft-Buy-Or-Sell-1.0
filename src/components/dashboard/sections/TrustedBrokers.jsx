import { Link } from "react-router-dom";
import { BadgeCheck, Shield, Star, ArrowRight } from "lucide-react";
import SectionShell from "./SectionShell";

const BROKERS = [
  { name: "Jet Aviation", location: "Geneva, CH", specialty: "Business Jets", rating: 4.9, verified: true },
  { name: "Aeroplex LLC", location: "Dallas, TX", specialty: "Turboprops", rating: 4.8, verified: true },
  { name: "SkyBroker Intl.", location: "London, UK", specialty: "Light Jets", rating: 4.9, verified: true },
  { name: "Cessna Pro", location: "Wichita, KS", specialty: "Single Engine", rating: 4.7, verified: true },
  { name: "PropTrade EU", location: "Prague, CZ", specialty: "GA & Piston", rating: 4.8, verified: true },
  { name: "Atlantic Aviation", location: "Teterboro, NJ", specialty: "Large Jets", rating: 5.0, verified: true },
];

export default function TrustedBrokers() {
  return (
    <SectionShell
      eyebrow="Trusted Brokers"
      title="Verified Professionals, Not Strangers"
      subtitle="Every broker on ABOS is identity-verified and ATI-scored. Buy and sell with confidence through vetted aviation professionals."
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {BROKERS.map((b) => (
          <div key={b.name}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: 20,
              transition: "border-color 0.2s ease",
            }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: "rgba(212,160,23,0.10)",
                border: "1px solid rgba(212,160,23,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Shield size={20} style={{ color: "#D4A017" }} />
              </div>
              {b.verified && (
                <span style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                  color: "#22c55e",
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.22)",
                  padding: "3px 8px", borderRadius: 999,
                }}>
                  <BadgeCheck size={11} /> Verified
                </span>
              )}
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{b.name}</h3>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>{b.location}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{b.specialty}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600, color: "#D4A017" }}>
                <Star size={12} fill="#D4A017" /> {b.rating}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link to="/community"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "#D4A017", textDecoration: "none", fontWeight: 600,
          }}>
          Join our broker network <ArrowRight size={14} />
        </Link>
      </div>
    </SectionShell>
  );
}