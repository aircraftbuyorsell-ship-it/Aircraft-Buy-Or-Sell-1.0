import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/lib/useTheme";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Newspaper, ArrowRight } from "lucide-react";

const FALLBACK_HEADLINES = [
  { category: "market", headline: "Single-engine piston prices hold steady as inventory tightens across North America", sentiment: "neutral" },
  { category: "market", headline: "Pre-owned midsize jet transactions surge 18% YoY, driven by first-time buyers", sentiment: "positive" },
  { category: "regulatory", headline: "FAA proposes new ADS-B mandate for certain Part 91 operations by 2028", sentiment: "neutral" },
  { category: "fuel", headline: "Jet-A spot prices decline 7% as crude fundamentals weaken; operators see relief", sentiment: "positive" },
  { category: "finance", headline: "Aircraft loan rates tick downward as central banks signal potential rate adjustment", sentiment: "positive" },
  { category: "market", headline: "Textron Aviation reports record backlog; Gulfstream deliveries accelerate in Q2", sentiment: "positive" },
  { category: "tech", headline: "SAF production capacity doubles year-over-year; major FBO networks commit to availability", sentiment: "positive" },
  { category: "regulatory", headline: "EASA certifies new Garmin avionics suite for legacy piston fleet retrofits across Europe", sentiment: "positive" },
  { category: "market", headline: "Hangar waitlists extend past 24 months at major US airports; new construction ramps up", sentiment: "neutral" },
  { category: "market", headline: "Used Cirrus SR22 market sees 12% price appreciation as demand outpaces listings", sentiment: "positive" },
];

export default function AviationNewsTicker() {
  const isDark = useTheme();
  const [isSubscriber, setIsSubscriber] = useState(false);

  const { data: newsItems = [] } = useQuery({
    queryKey: ["aviation-news"],
    queryFn: () => base44.entities.AviationNewsItem.list("-created_date", 20),
    staleTime: 1000 * 60 * 15,
  });

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
  const sentPositive = "#22c55e";
  const sentNegative = "#ef4444";

  const headlines = newsItems.length > 0
    ? newsItems.map(n => ({ category: n.category, headline: n.headline, sentiment: n.sentiment }))
    : FALLBACK_HEADLINES;

  const doubled = [...headlines, ...headlines];

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
            {doubled.map((h, i) => {
              const sentimentColor = h.sentiment === "positive" ? sentPositive : h.sentiment === "negative" ? sentNegative : textMuted;
              return (
                <span key={i} className="inline-flex items-center gap-1.5 mx-3">
                  <span className="text-[8px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-sm"
                    style={{ color: accent, background: `${accent}12`, whiteSpace: "nowrap" }}>
                    {h.category}
                  </span>
                  <span className="text-[10px] leading-none flex items-center gap-1" style={{ color: textMuted, whiteSpace: "nowrap" }}>
                    <span className="inline-block w-1 h-1 rounded-full shrink-0" style={{ background: sentimentColor }} />
                    {h.headline}
                  </span>
                  <span className="text-[10px] mx-1 opacity-20" style={{ color: textMuted }}>•</span>
                </span>
              );
            })}
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