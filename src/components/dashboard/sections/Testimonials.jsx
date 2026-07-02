import { Star, Quote } from "lucide-react";
import SectionShell from "./SectionShell";

const TESTIMONIALS = [
  {
    quote: "ABOS changed how we evaluate aircraft. The ATI score gives us instant confidence before we even pick up the phone. We've closed 12 deals this year using Deal Radar alone.",
    name: "Michael Reyes",
    role: "Director of Acquisitions",
    company: "Reyes Aviation Group",
    rating: 5,
  },
  {
    quote: "The OMVM valuation model is scary accurate. It flagged an underpriced Citation in 20 minutes — we closed that deal before anyone else even saw it.",
    name: "Sarah Chen",
    role: "Broker",
    company: "SkyBroker Intl.",
    rating: 5,
  },
  {
    quote: "As a first-time buyer, the ATI Passport gave me the trust I needed. Document verification, ownership history, blockchain proof — everything was transparent.",
    name: "James Whitfield",
    role: "Private Owner",
    company: "Cirrus SR22 Owner",
    rating: 5,
  },
  {
    quote: "We list our entire fleet on ABOS. The verification process attracts serious buyers and weed out the tire-kickers. Best platform for professional dealers.",
    name: "Patricia Lombardi",
    role: "CEO",
    company: "Aeroplex LLC",
    rating: 5,
  },
  {
    quote: "The community is incredible. 250,000 professionals sharing market insights, deals, and expertise. I learn something new every single day.",
    name: "David Kowalski",
    role: "CFI & Aircraft Owner",
    company: "Cessna 182T",
    rating: 5,
  },
  {
    quote: "ATI Verify is a game-changer for international transactions. We verified a German-registered aircraft from Dallas — blockchain-anchored, tamper-proof.",
    name: "Elena Fischer",
    role: "International Broker",
    company: "PropTrade EU",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <SectionShell
      eyebrow="Testimonials"
      title="Trusted by Professionals Worldwide"
      subtitle="Dealers, brokers, and owners rely on ABOS for every aircraft transaction."
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        {TESTIMONIALS.map((t, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.03)",
            border: "0.5px solid rgba(255,255,255,0.07)",
            borderRadius: 12, padding: 24,
            display: "flex", flexDirection: "column",
          }}>
            <Quote size={24} style={{ color: "rgba(212,160,23,0.4)", marginBottom: 12 }} />
            <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} size={13} fill="#D4A017" style={{ color: "#D4A017" }} />
              ))}
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 20, flex: 1 }}>
              "{t.quote}"
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16, borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(212,160,23,0.10)",
                border: "1px solid rgba(212,160,23,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "#D4A017",
              }}>
                {t.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{t.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{t.role} · {t.company}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}