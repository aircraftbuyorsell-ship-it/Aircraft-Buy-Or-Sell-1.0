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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BROKERS.map((b) => (
          <div key={b.name} className="rounded-xl p-5 bg-card border border-border transition-colors hover:border-gold-official/30">
            <div className="flex items-center justify-between mb-3.5">
              <div className="w-11 h-11 rounded-[10px] flex items-center justify-center"
                style={{ background: "rgba(212,160,23,0.10)", border: "1px solid rgba(212,160,23,0.22)" }}>
                <Shield size={20} className="text-gold-official" />
              </div>
              {b.verified && (
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-600 dark:text-[#22c55e] px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.22)" }}>
                  <BadgeCheck size={11} /> Verified
                </span>
              )}
            </div>
            <h3 className="text-[15px] font-bold text-foreground mb-0.5">{b.name}</h3>
            <p className="text-[11px] text-muted-foreground mb-2.5">{b.location}</p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{b.specialty}</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-gold-official">
                <Star size={12} fill="#D4A017" /> {b.rating}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <Link to="/community" className="inline-flex items-center gap-1.5 text-[13px] text-gold-official font-semibold no-underline">
          Join our broker network <ArrowRight size={14} />
        </Link>
      </div>
    </SectionShell>
  );
}