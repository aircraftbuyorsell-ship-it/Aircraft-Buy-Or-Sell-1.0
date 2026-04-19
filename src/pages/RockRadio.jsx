import { useState, useRef, useEffect } from "react";
import { Play, Pause, Loader2, Shuffle, Music } from "lucide-react";

// Free, publicly-listed internet radio streams (no API key needed).
// Sources: SomaFM (CC-licensed) + Radio Paradise. All free to stream.
const ROCK_STATIONS = [
  { id: "somafm-metal",      name: "Metal Detector",     tagline: "From black to doom to post-metal",       url: "https://ice1.somafm.com/metal-128-mp3" },
  { id: "somafm-indie",      name: "Indie Pop Rocks!",   tagline: "New and classic indie rock",              url: "https://ice1.somafm.com/indiepop-128-mp3" },
  { id: "somafm-bagel",      name: "BAGeL Radio",        tagline: "What alt-rock radio should sound like",   url: "https://ice1.somafm.com/bagel-128-mp3" },
  { id: "somafm-u80s",       name: "Underground 80s",    tagline: "Early 80s UK Synthpunk & New Wave",       url: "https://ice1.somafm.com/u80s-128-mp3" },
  { id: "somafm-7soul",      name: "Seven Inch Soul",    tagline: "Vintage soul & rock 45s",                 url: "https://ice1.somafm.com/7soul-128-mp3" },
  { id: "rp-main",           name: "Radio Paradise",     tagline: "Eclectic rock mix — listener-supported",  url: "https://stream.radioparadise.com/mp3-192" },
  { id: "rp-rock",           name: "RP Rock Mix",        tagline: "Rock-heavy selection from RP",            url: "https://stream.radioparadise.com/rock-192" },
  { id: "somafm-thetrip",    name: "The Trip",           tagline: "Progressive & psychedelic",               url: "https://ice1.somafm.com/thetrip-128-mp3" },
];

export default function RockRadio() {
  const audioRef = useRef(null);
  const [station, setStation] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlaying = () => { setPlaying(true); setLoading(false); setError(null); };
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onError = () => { setPlaying(false); setLoading(false); setError("Stream unavailable"); };
    el.addEventListener("playing", onPlaying);
    el.addEventListener("pause", onPause);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("error", onError);
    };
  }, []);

  const play = (s) => {
    const el = audioRef.current;
    if (!el) return;
    if (station?.id !== s.id) {
      el.src = s.url;
      setStation(s);
      setLoading(true);
      setError(null);
    }
    el.play().catch(() => setError("Playback blocked"));
  };

  const toggle = () => {
    const el = audioRef.current;
    if (!el || !station) return;
    if (playing) el.pause();
    else el.play().catch(() => setError("Playback blocked"));
  };

  const shuffle = () => {
    const pool = ROCK_STATIONS.filter((s) => s.id !== station?.id);
    play(pool[Math.floor(Math.random() * pool.length)]);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <audio ref={audioRef} preload="none" />

      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Background · Free Rock Stations</p>
        <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight uppercase mt-1">Rock Radio</h1>
        <p className="text-[#6B6560] text-sm mt-0.5">Free internet rock streams — no account, no ads from us.</p>
      </div>

      <div className="px-4 md:px-8 pb-4">
        <button
          onClick={shuffle}
          className="flex items-center gap-2 bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] font-black uppercase tracking-wider text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          <Shuffle className="w-4 h-4" /> Surprise me
        </button>
      </div>

      <div className="px-4 md:px-8 pb-28">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ROCK_STATIONS.map((s) => {
            const isActive = station?.id === s.id;
            return (
              <div
                key={s.id}
                className={`bg-white border rounded-xl p-4 transition-all ${isActive ? "border-[#E8A83A] shadow-md" : "border-black/[0.07] hover:border-[#0B2D5B]/30"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md bg-[#E8A83A]/15 flex items-center justify-center shrink-0">
                    <Music className="w-5 h-5 text-[#E8A83A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-[#1A1814] truncate">{s.name}</p>
                    <p className="text-[11px] text-[#6B6560] truncate">{s.tagline}</p>
                  </div>
                  <button
                    onClick={() => isActive ? toggle() : play(s)}
                    className="w-9 h-9 rounded-full bg-[#0B2D5B] hover:bg-[#143C75] text-white flex items-center justify-center shrink-0"
                    aria-label={isActive && playing ? "Pause" : "Play"}
                  >
                    {isActive && loading ? <Loader2 className="w-4 h-4 animate-spin" />
                      : isActive && playing ? <Pause className="w-4 h-4" />
                      : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-[#C0392B]">{error} — try another station.</p>
        )}
      </div>

      {station && (
        <div className="fixed bottom-[72px] md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40 bg-[#111113] text-white rounded-xl shadow-2xl border border-white/10 px-3 py-2.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#E8A83A]/20 flex items-center justify-center shrink-0">
            <Music className="w-4 h-4 text-[#E8A83A]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black truncate">{station.name}</p>
            <p className="text-[10px] text-white/60 truncate">
              {loading ? "Connecting…" : playing ? "Now playing" : "Paused"}
            </p>
          </div>
          <button
            onClick={toggle}
            className="w-8 h-8 rounded-full bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] flex items-center justify-center shrink-0"
            aria-label={playing ? "Pause" : "Play"}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" />
              : playing ? <Pause className="w-4 h-4" />
              : <Play className="w-4 h-4 ml-0.5" />}
          </button>
        </div>
      )}
    </div>
  );
}