import { Play, Pause, X, Loader2, Radio } from "lucide-react";
import { useRadioPlayer } from "@/lib/useRadioPlayer";

export default function MiniPlayer() {
  const { station, playing, loading, error, player } = useRadioPlayer();
  if (!station) return null;

  const country = station.location?.countryName || station.location?.countryCode?.toUpperCase() || "";

  return (
    <div className="fixed bottom-[72px] md:bottom-4 right-4 z-50 w-[300px] max-w-[calc(100vw-2rem)] bg-[#111113] border border-[#E8A83A]/40 rounded-xl shadow-2xl overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        {station.logo ? (
          <img src={station.logo} alt="" className="w-10 h-10 rounded-md object-cover bg-white/5 shrink-0" onError={(e) => e.currentTarget.style.display = "none"} />
        ) : (
          <div className="w-10 h-10 rounded-md bg-[#E8A83A]/15 flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 text-[#E8A83A]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black text-[#F0EDE6] truncate">{station.name}</p>
          <p className="text-[10px] text-[#8A8780] uppercase tracking-wider truncate">
            {error ? <span className="text-[#C0392B]">{error}</span> : (country || station.genre?.text || "Live")}
          </p>
        </div>
        <button
          onClick={() => player.toggle()}
          className="w-9 h-9 rounded-full bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] flex items-center justify-center shrink-0"
          aria-label={playing ? "Pause" : "Play"}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <button
          onClick={() => player.stop()}
          className="text-[#8A8780] hover:text-white shrink-0"
          aria-label="Close player"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}