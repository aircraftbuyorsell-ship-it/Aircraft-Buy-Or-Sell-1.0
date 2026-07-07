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
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {BROKERS.map((b) => (
          <div key={b.name} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="w-11 h-11 rounded-[10px] flex items-center justify-center border border-gold-official/25 bg-gold-bg">
                <Shield size={20} className="text-gold-official" />
              </div>
              {b.verified && (
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-[3px] rounded-full">
                  <BadgeCheck size={11} /> Verified
                </span>
              )}
            </div>
            <h3 className="text-[15px] font-bold text-foreground mb-0.5">{b.name}</h3>
            <p className="text-[11px] text-muted-foreground/70 mb-2.5">{b.location}</p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{b.specialty}</span>
              <span className="flex items-center gap-[3px] text-xs font-semibold text-gold-official">
                <Star size={12} fill="currentColor" /> {b.rating}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <Link to="/community" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gold-official hover:underline">
          Join our broker network <ArrowRight size={14} />
        </Link>
      </div>
    </SectionShell>
  );
}