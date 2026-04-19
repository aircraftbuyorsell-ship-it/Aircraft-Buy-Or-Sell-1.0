import { useState } from "react";
import { Play, Newspaper, Music, Mic, ExternalLink } from "lucide-react";

// Curated YouTube content — free, no login, embeddable.
// IDs are YouTube video or playlist IDs. Mix of live channels, playlists, and popular videos.
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

function embedUrl(item) {
  if (item.type === "playlist") {
    return `https://www.youtube.com/embed/videoseries?list=${item.id}&rel=0`;
  }
  return `https://www.youtube.com/embed/${item.id}?rel=0`;
}
function watchUrl(item) {
  if (item.type === "playlist") return `https://www.youtube.com/playlist?list=${item.id}`;
  return `https://www.youtube.com/watch?v=${item.id}`;
}
function thumbUrl(item) {
  // For playlists we still get a thumbnail from the first video by using the item id for videos;
  // for playlists, YouTube provides one via the videoseries endpoint — fall back gracefully.
  if (item.type === "video") return `https://img.youtube.com/vi/${item.id}/mqdefault.jpg`;
  return null;
}

export default function RockRadio() {
  const [tab, setTab] = useState(TABS[0]);
  const [active, setActive] = useState(null);

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-4">
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Media Hub · Free · No Login</p>
        <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight uppercase mt-1">Aviation News, Music & Podcasts</h1>
        <p className="text-[#6B6560] text-sm mt-0.5">Curated YouTube channels and playlists. Play anything instantly.</p>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-8 pb-4 flex gap-2 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab.id === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t); setActive(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-colors whitespace-nowrap ${
                isActive ? "bg-[#0B2D5B] text-white" : "bg-white border border-black/10 text-[#6B6560] hover:border-[#0B2D5B]/30"
              }`}
              style={isActive ? { backgroundColor: t.accent, color: t.accent === "#E8A83A" ? "#0B2D5B" : "#fff" } : {}}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Active player */}
      {active && (
        <div className="px-4 md:px-8 pb-4">
          <div className="bg-black rounded-2xl overflow-hidden shadow-xl">
            <div className="relative" style={{ paddingBottom: "56.25%" }}>
              <iframe
                key={active.id}
                src={embedUrl(active) + "&autoplay=1"}
                title={active.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
            <div className="bg-[#111113] text-white px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black truncate">{active.title}</p>
                <p className="text-[11px] text-white/60 truncate">{active.channel}</p>
              </div>
              <a href={watchUrl(active)} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#E8A83A] hover:text-white shrink-0">
                YouTube <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="px-4 md:px-8 pb-28">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tab.items.map(item => {
            const Icon = tab.icon;
            const isActive = active?.id === item.id;
            const thumb = thumbUrl(item);
            return (
              <button
                key={item.id}
                onClick={() => setActive(item)}
                className={`group text-left bg-white border rounded-xl overflow-hidden transition-all ${
                  isActive ? "border-[#E8A83A] shadow-md" : "border-black/[0.07] hover:border-[#0B2D5B]/30 hover:shadow-sm"
                }`}
              >
                <div className="relative aspect-video bg-[#111113] overflow-hidden">
                  {thumb ? (
                    <img src={thumb} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
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
                  {item.type === "playlist" && (
                    <span className="absolute top-2 right-2 bg-black/80 text-white text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded">
                      Playlist
                    </span>
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-sm font-black text-[#1A1814] line-clamp-1">{item.title}</p>
                  <p className="text-[11px] text-[#6B6560] mt-0.5">{item.channel}</p>
                  <p className="text-[11px] text-[#AAA49C] mt-1 line-clamp-1">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}