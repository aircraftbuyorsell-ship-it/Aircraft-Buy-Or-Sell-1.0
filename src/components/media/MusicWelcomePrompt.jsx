import { useEffect, useState } from "react";
import { Music, Play, X } from "lucide-react";
import { useMediaPlayer } from "@/lib/MediaPlayerContext";

const STORAGE_KEY = "abos_music_prompt_shown";

/**
 * First-visit welcome prompt — appears 5s after a brand new visitor arrives,
 * offering to start the background jazz station. Shown once per browser.
 */
export default function MusicWelcomePrompt() {
  const [open, setOpen] = useState(false);
  const { station, start } = useMediaPlayer();

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setOpen(true), 5000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };
  const handlePlay = () => { start(); dismiss(); };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[70] animate-in fade-in" onClick={dismiss} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[71] w-[min(420px,calc(100vw-2rem))] bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden animate-in zoom-in-95 fade-in">
        <div className="bg-[#111113] text-white px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#E8A83A]/20 flex items-center justify-center shrink-0">
            <Music className="w-5 h-5 text-[#E8A83A]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#E8A83A] font-black">Focus Mode</p>
            <p className="text-sm font-black">Want some background jazz?</p>
          </div>
          <button onClick={dismiss} className="p-1.5 text-white/60 hover:text-white" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5">
          <p className="text-sm text-[#4A4845] leading-relaxed">
            ABOS can play <b>{station.title}</b> softly in the background while you work —
            keeps going wherever you navigate. You can stop it anytime with the player or by
            pressing <kbd className="px-1.5 py-0.5 bg-[#F7F4EF] border border-black/10 rounded text-[10px] font-mono font-bold">Space</kbd>.
          </p>
          <div className="mt-5 flex gap-2">
            <button
              onClick={dismiss}
              className="flex-1 bg-white border border-black/10 hover:bg-[#F7F4EF] text-[#1A1814] font-bold text-sm py-2.5 rounded-xl"
            >
              No thanks
            </button>
            <button
              onClick={handlePlay}
              className="flex-1 bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] font-black uppercase tracking-wider text-sm py-2.5 rounded-xl flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> Start music
            </button>
          </div>
        </div>
      </div>
    </>
  );
}