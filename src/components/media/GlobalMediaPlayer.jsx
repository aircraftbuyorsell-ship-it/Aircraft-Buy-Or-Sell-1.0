import { useMediaPlayer } from "@/lib/MediaPlayerContext";
import { X, Minimize2, Maximize2, ExternalLink, Music } from "lucide-react";

function embedUrl(item) {
  if (!item) return "";
  if (item.type === "playlist") {
    return `https://www.youtube.com/embed/videoseries?list=${item.id}&rel=0&autoplay=1`;
  }
  return `https://www.youtube.com/embed/${item.id}?rel=0&autoplay=1`;
}
function watchUrl(item) {
  if (!item) return "";
  if (item.type === "playlist") return `https://www.youtube.com/playlist?list=${item.id}`;
  return `https://www.youtube.com/watch?v=${item.id}`;
}

/**
 * Persistent media player — mounted once at the app root, never unmounts on
 * route changes, so audio/video keeps playing wherever the user navigates.
 * Two modes:
 *  - expanded: floating 320px video card (bottom-right)
 *  - minimized: audio-only bar (iframe still plays, just hidden)
 */
export default function GlobalMediaPlayer() {
  const { item, expanded, close, toggleExpanded } = useMediaPlayer();
  if (!item) return null;

  return (
    <div
      className={`fixed z-[60] bg-[#111113] text-white rounded-xl shadow-2xl border border-white/10 overflow-hidden transition-all
        ${expanded
          ? "bottom-[84px] md:bottom-4 right-4 w-[min(360px,calc(100vw-2rem))]"
          : "bottom-[84px] md:bottom-4 right-4 w-[min(320px,calc(100vw-2rem))]"}
      `}
    >
      {/* Iframe — ALWAYS mounted so audio keeps playing.
          When minimized we hide it via height:0 (still plays).  */}
      <div
        className="relative w-full bg-black"
        style={{
          paddingBottom: expanded ? "56.25%" : 0,
          height: expanded ? "auto" : 0,
        }}
      >
        <iframe
          src={embedUrl(item)}
          title={item.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>

      {/* Control bar */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="w-8 h-8 rounded-md bg-[#E8A83A]/20 flex items-center justify-center shrink-0">
          <Music className="w-4 h-4 text-[#E8A83A]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-black truncate">{item.title}</p>
          <p className="text-[10px] text-white/60 truncate">{item.channel}</p>
        </div>
        <a
          href={watchUrl(item)}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 text-white/60 hover:text-[#E8A83A]"
          title="Open on YouTube"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
        <button
          onClick={toggleExpanded}
          className="p-1.5 text-white/60 hover:text-white"
          title={expanded ? "Minimize" : "Expand video"}
        >
          {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        <button
          onClick={close}
          className="p-1.5 text-white/60 hover:text-[#C0392B]"
          title="Stop & close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}