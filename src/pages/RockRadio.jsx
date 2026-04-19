import { useState } from "react";
import { Play, Newspaper, Music, Mic } from "lucide-react";
import { useMediaPlayer } from "@/lib/MediaPlayerContext";

// Curated YouTube content — free, no login, embeddable.
const TABS = [
  {
    id: "news",
    label: "Aviation News",
    icon: Newspaper,
    accent: "#0B2D5B",
    items: [
      { type: "video",    id: "1L2yNlhe3bk", title: "AINtv — Aviation International News", channel: "AIN", desc: "Latest business aviation headlines" },
      { type: "playlist", id: "PLsXBPpNGRkHRa0T0KnfZ7EyOC5aHfMtcf", title: "FlightGlobal News", channel: "FlightGlobal", desc: "Industry news & analysis" },
      { type: "playlist", id: "PLqkvdKJnxAtLfuECDoVAYuU2YBrOsDyqr", title: "Blancolirio — Breaking Aviation", channel: "Juan Browne", desc: "Incident analysis by an airline captain" },
      { type: "playlist", id: "PLaGae0T2JIO2gY9OW5yLUYDN-TG2cUQGu", title: "Mentour Now! — Industry News", channel: "Mentour Now!", desc: "Weekly aviation industry updates" },
      { type: "playlist", id: "PLiVBrRcnTT0gZtZsX04Fv1m8g-ZUkM_vc", title: "AVweb — GA News", channel: "AVweb", desc: "General aviation news" },
      { type: "playlist", id: "PLsw5BY2HZFNJh_dCvJJBkHBrj-vNT5L6i", title: "Flightradar24 — Updates", channel: "Flightradar24", desc: "Tracking & flight data news" },
    ],
  },
  {
    id: "music",
    label: "Music",
    icon: Music,
    accent: "#E8A83A",
    items: [
      { type: "video",    id: "jfKfPfyJRdk", title: "Lofi Hip Hop — Beats To Work To", channel: "Lofi Girl", desc: "24/7 live chill beats" },
      { type: "video",    id: "4xDzrJKXOOY", title: "Synthwave Radio — Beats to Chill", channel: "Lofi Girl", desc: "24/7 live synthwave" },
      { type: "playlist", id: "PLQbr50XMrNRrRAEp1BQIP2jfHrzeLGEK7", title: "Classic Rock Anthems", channel: "YouTube Music", desc: "Greatest rock hits" },
      { type: "playlist", id: "PL55713C70BA91BD6E", title: "Jazz for Work & Focus", channel: "Cafe Music BGM", desc: "Smooth jazz background" },
      { type: "playlist", id: "PLlrATfBNZ98dudnM48yfGUldqGD0S4FFb", title: "Top Hits 2020s", channel: "VEVO", desc: "Modern pop hits" },
      { type: "video",    id: "DWcJFNfaw9c", title: "Deep Focus — Ambient Study", channel: "Chillhop Music", desc: "Long-form deep focus music" },
    ],
  },
  {
    id: "podcasts",
    label: "Aviation Podcasts",
    icon: Mic,
    accent: "#0F7A56",
    items: [
      { type: "playlist", id: "PLIioz9YoTGVxjsv2XcyIIM9DAsp2-gYgn", title: "Mentour Pilot", channel: "Mentour Pilot", desc: "Deep-dive pilot storytelling" },
      { type: "playlist", id: "PL4obLxidsIRuE7UBvvQsspd0JcgeiApMh", title: "74 Gear", channel: "74 Gear", desc: "Long-haul captain Q&A" },
      { type: "playlist", id: "PLdP3nbmCIRaHTtVLEvaEKikTUysgbgqj1", title: "Pilot Debrief", channel: "Pilot Debrief", desc: "Accident analysis episodes" },
      { type: "playlist", id: "PLsXBPpNGRkHSbbI4kqSWFwYWL2X1iPJTZ", title: "AVweb Podcast", channel: "AVweb", desc: "GA conversations & interviews" },
      { type: "playlist", id: "PLaGae0T2JIO3QKiT-e5lp4Y9Fb0fk8Tbz", title: "Mentour Now! Podcast", channel: "Mentour Now!", desc: "Industry deep-dives" },
      { type: "playlist", id: "PLMcXxB4gnyEkJVLvp4YPgGDwPPhL7pREG", title: "Airline Pilot Guy", channel: "APG", desc: "Weekly pilot talk show" },
    ],
  },
];

function thumbUrl(item) {
  if (item.type === "video") return `https://img.youtube.com/vi/${item.id}/mqdefault.jpg`;
  return null;
}

export default function RockRadio() {
  const [tab, setTab] = useState(TABS[0]);
  const { item: activeItem, play } = useMediaPlayer();

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-4">
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Media Hub · Free · No Login</p>
        <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight uppercase mt-1">Aviation News, Music & Podcasts</h1>
        <p className="text-[#6B6560] text-sm mt-0.5">Plays in background — keeps going wherever you navigate in ABOS.</p>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-8 pb-4 flex gap-2 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab.id === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-colors whitespace-nowrap ${
                isActive ? "text-white" : "bg-white border border-black/10 text-[#6B6560] hover:border-[#0B2D5B]/30"
              }`}
              style={isActive ? { backgroundColor: t.accent, color: t.accent === "#E8A83A" ? "#0B2D5B" : "#fff" } : {}}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="px-4 md:px-8 pb-28">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tab.items.map(it => {
            const Icon = tab.icon;
            const isActive = activeItem?.id === it.id;
            const thumb = thumbUrl(it);
            return (
              <button
                key={it.id}
                onClick={() => play(it)}
                className={`group text-left bg-white border rounded-xl overflow-hidden transition-all ${
                  isActive ? "border-[#E8A83A] shadow-md" : "border-black/[0.07] hover:border-[#0B2D5B]/30 hover:shadow-sm"
                }`}
              >
                <div className="relative aspect-video bg-[#111113] overflow-hidden">
                  {thumb ? (
                    <img src={thumb} alt={it.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: tab.accent + "20" }}>
                      <Icon className="w-10 h-10" style={{ color: tab.accent }} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[#E8A83A] flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-5 h-5 text-[#0B2D5B] ml-0.5" />
                    </div>
                  </div>
                  {it.type === "playlist" && (
                    <span className="absolute top-2 right-2 bg-black/80 text-white text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded">
                      Playlist
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute top-2 left-2 bg-[#E8A83A] text-[#0B2D5B] text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded">
                      Playing
                    </span>
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-sm font-black text-[#1A1814] line-clamp-1">{it.title}</p>
                  <p className="text-[11px] text-[#6B6560] mt-0.5">{it.channel}</p>
                  <p className="text-[11px] text-[#AAA49C] mt-1 line-clamp-1">{it.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}