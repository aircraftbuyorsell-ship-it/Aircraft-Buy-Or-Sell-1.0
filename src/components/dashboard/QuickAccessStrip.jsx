import { Zap, ShieldCheck, Briefcase, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/lib/useTheme";

const ITEMS = [
  {
    icon: Zap,
    label: "ATI Quick Score",
    desc: "Instant 8-dimension aircraft scorecard from listing text or N-number.",
    link: "/ati-quick-score",
    color: "#E8A83A",
  },
  {
    icon: ShieldCheck,
    label: "ATI Verify",
    desc: "Remote document identity verification with blockchain anchoring.",
    link: "/ati-verify",
    color: "#22c55e",
  },
  {
    icon: Briefcase,
    label: "Escrow",
    desc: "Secure transaction management for aircraft sales and purchases.",
    link: "/escrow",
    color: "#2563eb",
  },
];

export default function QuickAccessStrip() {
  const isDark = useTheme();
  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.50)";
  const panelBg = isDark ? "rgba(15,15,28,0.72)" : "rgba(255,255,255,0.78)";
  const panelBorder = isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)";

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ITEMS.map((item) => (
          <Link key={item.label} to={item.link}>
            <div
              className="rounded-xl p-4 h-full hover:scale-[1.02] transition-transform cursor-pointer group"
              style={{
                background: panelBg,
                border: panelBorder,
                backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
              }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${item.color}12`, border: `1px solid ${item.color}30` }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: item.color }}>
                  {item.label}
                </p>
              </div>
              <p className="text-[10px] leading-relaxed mb-2" style={{ color: mutedColor }}>{item.desc}</p>
              <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: item.color }}>
                Open <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}