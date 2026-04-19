import { useMediaPlayer } from "@/lib/MediaPlayerContext";
import { Play, Pause, Minimize2, Maximize2, Music } from "lucide-react";

/**
 * Persistent background player — mounted once at the app root.
 * Iframe is ALWAYS mounted (even when minimized) so audio keeps playing
 * across route changes. YT Iframe API enabled via `enablejsapi=1` so we
 * can command play/pause from anywhere (UI button, spacebar, etc).
 */
export default function GlobalMediaPlayer() {
  const { station, playing, expanded, toggle, toggleExpanded, iframeRef } = useMediaPlayer();

  const src = `https://www.youtube.com/embed/videoseries?list=${station.id}&rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;

  return (
    <div className="fixed z-[60] bottom-[84px] md:bottom-4 right-4 w-[min(340px,calc(100vw-2rem))] bg-[#111113] text-white rounded-xl shadow-2xl border border-white/10 overflow-hidden transition-all">
      {/* Iframe always mounted — hidden when minimized (height:0) so audio still plays */}
      <div
        className="relative w-full bg-black"
        style={{
          paddingBottom: expanded ? "56.25%" : 0,
          height: expanded ? "auto" : 0,
        }}
      >
        <iframe
          ref={iframeRef}
          src={src}
          title={station.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>

      {/* Control bar */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="w-9 h-9 rounded-md bg-[#E8A83A]/20 flex items-center justify-center shrink-0">
          <Music className="w-4 h-4 text-[#E8A83A]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-black truncate">{station.title}</p>
          <p className="text-[10px] text-white/60 truncate">
            {playing ? "Playing · press Space to stop" : "Paused · press Space to play"}
          </p>
        </div>
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-full bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] flex items-center justify-center shrink-0"
          title={playing ? "Stop (Space)" : "Play (Space)"}
          aria-label={playing ? "Stop" : "Play"}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <button
          onClick={toggleExpanded}
          className="p-1.5 text-white/60 hover:text-white"
          title={expanded ? "Minimize" : "Show video"}
        >
          {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}