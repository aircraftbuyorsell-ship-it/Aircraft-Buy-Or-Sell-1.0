import { Play, Pause, Music } from "lucide-react";
import { useMediaPlayer } from "@/lib/MediaPlayerContext";

export default function RockRadio() {
  const { station, playing, toggle } = useMediaPlayer();

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-4">
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Focus Mode · Background Music</p>
        <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight uppercase mt-1">Jazz For Focus & Work</h1>
        <p className="text-[#6B6560] text-sm mt-0.5">Plays in the background across the whole app — independent of the page you're on.</p>
      </div>

      <div className="px-4 md:px-8 pb-12 max-w-2xl">
        <div className="bg-white border border-black/[0.07] rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-[#E8A83A]/15 flex items-center justify-center shrink-0">
              <Music className="w-8 h-8 text-[#E8A83A]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-black text-[#1A1814] truncate">{station.title}</p>
              <p className="text-sm text-[#6B6560] truncate">{station.channel}</p>
              <p className="text-[11px] text-[#AAA49C] mt-0.5">{station.desc}</p>
            </div>
          </div>

          <button
            onClick={toggle}
            className="mt-6 w-full bg-[#0B2D5B] hover:bg-[#143C75] text-white font-black uppercase tracking-wider text-sm py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {playing ? <><Pause className="w-5 h-5" /> Stop music</> : <><Play className="w-5 h-5" /> Play music</>}
          </button>

          <div className="mt-5 pt-5 border-t border-black/[0.06] text-center">
            <p className="text-[11px] uppercase tracking-wider text-[#6B6560] font-semibold">
              Keyboard shortcut
            </p>
            <p className="text-sm text-[#1A1814] mt-1">
              Press <kbd className="px-2 py-1 bg-[#F7F4EF] border border-black/10 rounded text-xs font-mono font-bold mx-1">Space</kbd>
              anywhere to play / stop
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}