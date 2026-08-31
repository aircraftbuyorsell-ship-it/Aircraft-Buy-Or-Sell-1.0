import { Link } from "react-router-dom";
import { Users, MessageCircle, TrendingUp, ArrowRight } from "lucide-react";
import SectionShell from "./SectionShell";

export default function CommunitySection() {
  return (
    <SectionShell
      eyebrow="Community"
      title="Join 250,000 Aviation Professionals"
      subtitle="The largest aircraft trading community in the world. Buy, sell, learn, and connect with dealers, brokers, and pilots across 150+ countries."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users, value: "285,000+", label: "Community Members", color: "#D4A017" },
          { icon: MessageCircle, value: "4,200+", label: "Posts per Year", color: "#5dcaa5" },
          { icon: TrendingUp, value: "11.5M+", label: "Monthly Impressions", color: "#4e8ef7" },
        ].map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="rounded-xl p-7 text-center bg-card border border-border">
            <div className="w-11 h-11 rounded-[10px] flex items-center justify-center mx-auto mb-4"
              style={{ background: `${color}12`, border: `1px solid ${color}28` }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div className="text-[28px] font-bold tracking-[-0.03em] mb-1" style={{ color }}>
              {value}
            </div>
            <div className="text-[11px] uppercase tracking-[0.1em] font-semibold text-muted-foreground">
              {label}
            </div>
          </div>
        ))}
      </div>
      <div className="text-center">
        <Link to="/community"
          className="inline-flex items-center gap-2 bg-gold-official text-[#0B1220] px-7 py-3.5 rounded-[10px] text-sm font-bold no-underline hover:opacity-90">
          Join the Community <ArrowRight size={16} />
        </Link>
      </div>
    </SectionShell>
  );
}