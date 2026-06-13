import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/lib/useTheme";
import { base44 } from "@/api/base44Client";
import { Newspaper, ArrowRight } from "lucide-react";

const HEADLINES = [
  { cat: "GA Market", text: "Single-engine piston prices hold steady as inventory tightens across North America" },
  { cat: "BizJet", text: "Pre-owned midsize jet transactions surge 18% YoY, driven by first-time buyers" },
  { cat: "Regulatory", text: "FAA proposes new ADS-B mandate for certain Part 91 operations by 2028" },
  { cat: "Fuel Market", text: "Jet-A spot prices decline 7% as crude fundamentals weaken; operators see relief" },
  { cat: "Aviation Finance", text: "Aircraft loan rates tick downward as central banks signal potential rate adjustment" },
  { cat: "Industry Stocks", text: "Textron Aviation reports record backlog; Gulfstream deliveries accelerate in Q2" },
  { cat: "Sustainability", text: "SAF production capacity doubles year-over-year; major FBO networks commit to availability" },
  { cat: "EASA News", text: "EASA certifies new Garmin avionics suite for legacy piston fleet retrofits across Europe" },
  { cat: "Hangar Market", text: "Hangar waitlists extend past 24 months at major US airports; new construction ramps up" },
  { cat: "Pre-Owned", text: "Used Cirrus SR22 market sees 12% price appreciation as demand outpaces listings" },
];

export default function AviationNewsTicker() {
  const isDark = useTheme();
  const [isSubscriber, setIsSubscriber] = useState(false);

  useEffect(() => {
    base44.auth.me().then(user => {
      base44.entities.UserProfile.filter({ user_email: user.email }).then(profiles => {
        if (profiles.length > 0) {
          const tier = profiles[0].tier;
          setIsSubscriber(tier === "pro" || tier === "enterprise");
        }
      });
    }).catch(() => {});
  }, []);

  const bg = isDark ? "rgba(20,22,34,0.92)" : "#f8fafc";
  const border = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const accent = isDark ? "#60a5fa" : "#3b82f6";
  const textMuted = isDark ? "rgba(255,255,255,0.55)" : "#64748b";

  const doubled = [...HEADLINES, ...HEADLINES];

  return (
    <div style={{ background: bg, borderBottom: `1px solid ${border}` }}>
      <div className="flex items-center h-7">
        {/* Label */}
        <Link
          to={isSubscriber ? "/weekly-briefing" : "/pricing"}
          className="flex items-center gap-1.5 px-3 h-full shrink-0 border-r hover:opacity-80 transition-opacity"
          style={{ borderColor: border }}
        >
          <Newspaper className="w-3 h-3" style={{ color: accent }} />
          <span className="text-[9px] font-semibold tracking-wide whitespace-nowrap" style={{ color: accent }}>
            {isSubscriber ? "WEEKLY BRIEFING" : "MARKET PULSE"}
          </span>
        </Link>

        {/* Scrolling marquee */}
        <div className="flex-1 overflow-hidden relative h-full">
          <div className="animate-marquee inline-flex items-center h-full whitespace-nowrap"
            style={{ animation: "marquee 45s linear infinite" }}>
            {doubled.map((h, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 mx-3">
                <span className="text-[8px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-sm"
                  style={{ color: accent, background: `${accent}12`, whiteSpace: "nowrap" }}>
                  {h.cat}
                </span>
                <span className="text-[10px] leading-none" style={{ color: textMuted, whiteSpace: "nowrap" }}>
                  {h.text}
                </span>
                <span className="text-[10px] mx-1 opacity-20" style={{ color: textMuted }}>•</span>
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link
          to={isSubscriber ? "/weekly-briefing" : "/pricing"}
          className="flex items-center gap-1 px-3 h-full shrink-0 border-l hover:opacity-80 transition-opacity"
          style={{ borderColor: border }}
        >
          <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: accent }}>
            {isSubscriber ? "Full Report" : "Subscribe"}
          </span>
          <ArrowRight className="w-2.5 h-2.5" style={{ color: accent }} />
        </Link>
      </div>

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee { animation: marquee 45s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}