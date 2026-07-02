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
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32,
      }}>
        {[
          { icon: Users, value: "250,000+", label: "Community Members", color: "#D4A017" },
          { icon: MessageCircle, value: "4,200+", label: "Posts per Year", color: "#5dcaa5" },
          { icon: TrendingUp, value: "11.5M+", label: "Monthly Impressions", color: "#4e8ef7" },
        ].map(({ icon: Icon, value, label, color }) => (
          <div key={label} style={{
            background: "rgba(255,255,255,0.03)",
            border: "0.5px solid rgba(255,255,255,0.07)",
            borderRadius: 12, padding: 28, textAlign: "center",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: `${color}12`, border: `1px solid ${color}28`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: "-0.03em", marginBottom: 4 }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
              {label}
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center" }}>
        <Link to="/community"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#D4A017", color: "#0B1220",
            padding: "14px 28px", borderRadius: 10,
            fontSize: 14, fontWeight: 700, textDecoration: "none",
          }}>
          Join the Community <ArrowRight size={16} />
        </Link>
      </div>
    </SectionShell>
  );
}