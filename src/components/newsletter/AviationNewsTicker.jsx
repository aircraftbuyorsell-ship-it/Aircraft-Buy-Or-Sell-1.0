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

  const ringBg = isDark
    ? "rgba(0,245,255,0.04)"
    : "rgba(37,99,235,0.04)";
  const ringBorder = isDark
    ? "rgba(0,245,255,0.18)"
    : "rgba(37,99,235,0.15)";
  const accent = isDark ? "#00f5ff" : "#2563eb";
  const textMuted = isDark ? "rgba(255,255,255,0.60)" : "#4b5563";
  const textHeadline = isDark ? "rgba(255,255,255,0.82)" : "#1e293b";
  const sentPositive = "#22c55e";
  const sentNegative = "#ef4444";

  const headlines = newsItems.length > 0
    ? newsItems.map(n => ({ category: n.category, headline: n.headline, sentiment: n.sentiment }))
    : FALLBACK_HEADLINES;

  const doubled = [...headlines, ...headlines];

  return (
    <div
      className="w-full rounded-xl overflow-hidden"
      style={{
        background: ringBg,
        border: `1px solid ${ringBorder}`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: isDark
          ? `0 0 30px rgba(0,245,255,0.06), inset 0 0 20px rgba(0,245,255,0.04)`
          : `0 0 20px rgba(37,99,235,0.04), inset 0 0 10px rgba(37,99,235,0.03)`,
      }}
    >
      <div className="flex items-center h-9">
        {/* Left label — stays as is */}
        <Link
          to={isSubscriber ? "/weekly-briefing" : "/pricing"}
          className="flex items-center gap-1.5 px-4 h-full shrink-0 border-r hover:opacity-80 transition-opacity"
          style={{ borderColor: ringBorder }}
        >
          <Newspaper className="w-3.5 h-3.5" style={{ color: accent }} />
          <span className="text-[9px] font-bold tracking-[0.12em] uppercase whitespace-nowrap" style={{ color: accent }}>
            {isSubscriber ? "Weekly Briefing" : "Market Pulse"}
          </span>
        </Link>

        {/* Scrolling marquee — entire area links to /pricing */}
        <Link to="/pricing" className="flex-1 overflow-hidden relative h-full cursor-pointer group">
          <div
            className="inline-flex items-center h-full whitespace-nowrap"
            style={{
              animation: "marquee-ring 50s linear infinite",
              animationPlayState: "running",
            }}
          >
            {doubled.map((h, i) => {
              const sentColor = h.sentiment === "positive" ? sentPositive : h.sentiment === "negative" ? sentNegative : textMuted;
              return (
                <span key={i} className="inline-flex items-center gap-1.5 mx-4 group-hover:[animation-play-state:paused]">
                  <span
                    className="text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                    style={{ color: accent, background: `${accent}14`, whiteSpace: "nowrap" }}
                  >
                    {h.category}
                  </span>
                  <span className="text-[10px] leading-none flex items-center gap-1.5" style={{ color: textHeadline, whiteSpace: "nowrap" }}>
                    <span className="inline-block w-1 h-1 rounded-full shrink-0" style={{ background: sentColor }} />
                    {h.headline}
                  </span>
                  <span className="text-[10px] opacity-15 mx-0.5" style={{ color: textMuted }}>•</span>
                </span>
              );
            })}
          </div>
          {/* Hover glow effect */}
          <div
            className="absolute inset-y-0 right-0 w-12 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: isDark
                ? "linear-gradient(to right, transparent, rgba(0,245,255,0.06))"
                : "linear-gradient(to right, transparent, rgba(37,99,235,0.06))",
            }}
          />
        </Link>

        {/* Right CTA */}
        <Link
          to={isSubscriber ? "/weekly-briefing" : "/pricing"}
          className="flex items-center gap-1 px-4 h-full shrink-0 border-l hover:opacity-80 transition-opacity group/cta"
          style={{ borderColor: ringBorder }}
        >
          <span className="text-[9px] font-bold whitespace-nowrap" style={{ color: accent }}>
            {isSubscriber ? "Full Report" : "Upgrade"}
          </span>
          <ArrowRight className="w-3 h-3 group-hover/cta:translate-x-0.5 transition-transform" style={{ color: accent }} />
        </Link>
      </div>

      <style>{`
        @keyframes marquee-ring {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}