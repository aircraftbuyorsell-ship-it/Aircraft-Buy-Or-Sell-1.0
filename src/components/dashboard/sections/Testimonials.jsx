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
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="glass-card p-6 flex flex-col">
            <Quote size={24} className="text-gold-official/40 mb-3" />
            <div className="flex gap-0.5 mb-3.5">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} size={13} fill="#D4A017" className="text-gold-official" />
              ))}
            </div>
            <p className="text-[13px] text-foreground/80 leading-[1.7] mb-5 flex-1">
              "{t.quote}"
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border border-gold-official/25 bg-gold-bg text-gold-official">
                {t.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-foreground">{t.name}</div>
                <div className="text-[11px] text-muted-foreground/70">{t.role} · {t.company}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}