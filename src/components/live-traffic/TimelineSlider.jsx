import { useState } from "react";
import { Clock, Play, Pause, SkipBack, ChevronRight } from "lucide-react";

// Generates hourly tick marks between start and end unix timestamps
function buildTicks(startTs, endTs, count = 12) {
  const ticks = [];
  const step = Math.floor((endTs - startTs) / (count - 1));
  for (let i = 0; i < count; i++) {
    ticks.push(startTs + step * i);
  }
  return ticks;
}

function fmtTime(unix) {
  return new Date(unix * 1000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}
function fmtDate(unix) {
  return new Date(unix * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function TimelineSlider({ onFetchSnapshot, isLoading, preset }) {
  const now = Math.floor(Date.now() / 1000);

  // Default: yesterday 08:00–18:00 local
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() - 1);
  const yyyy = defaultDate.getFullYear();
  const mm = String(defaultDate.getMonth() + 1).padStart(2, "0");
  const dd = String(defaultDate.getDate()).padStart(2, "0");
  const defaultDateStr = `${yyyy}-${mm}-${dd}`;

  const [dateStr, setDateStr] = useState(defaultDateStr);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(18);
  const [sliderValue, setSliderValue] = useState(8); // hours from midnight
  const [isPlaying, setIsPlaying] = useState(false);
  const [playIntervalRef] = useState({ current: null });
  const [selectedTs, setSelectedTs] = useState(null);

  const dateBase = new Date(`${dateStr}T00:00:00`).getTime() / 1000;
  const rangeStart = dateBase + startHour * 3600;
  const rangeEnd = dateBase + endHour * 3600;
  const currentTs = dateBase + sliderValue * 3600;

  const ticks = buildTicks(rangeStart, rangeEnd, Math.min(endHour - startHour + 1, 11));

  const fetchAt = (ts) => {
    setSelectedTs(ts);
    if (preset) {
      onFetchSnapshot({ ts, bbox: preset.bbox });
    }
  };

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setSliderValue(val);
  };

  const handleSliderRelease = () => {
    fetchAt(currentTs);
  };

  const handlePlay = () => {
    if (isPlaying) {
      clearInterval(playIntervalRef.current);
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    let cur = sliderValue;
    playIntervalRef.current = setInterval(() => {
      cur += 0.25; // advance 15 min each step
      if (cur > endHour) {
        clearInterval(playIntervalRef.current);
        setIsPlaying(false);
        return;
      }
      setSliderValue(cur);
      const ts = dateBase + cur * 3600;
      setSelectedTs(ts);
      if (preset) onFetchSnapshot({ ts, bbox: preset.bbox });
    }, 3000);
  };

  const handleReset = () => {
    clearInterval(playIntervalRef.current);
    setIsPlaying(false);
    setSliderValue(startHour);
    setSelectedTs(null);
  };

  const pct = ((sliderValue - startHour) / (endHour - startHour)) * 100;

  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[rgba(11,45,91,0.08)] flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-[#0B2D5B]" />
          </div>
          <div>
            <p className="text-[11px] font-black text-[#0B2D5B] uppercase tracking-wider">Historical Replay</p>
            {selectedTs && (
              <p className="text-[10px] text-[#E8A83A] font-bold">
                {fmtDate(selectedTs)} · {fmtTime(selectedTs)}
              </p>
            )}
          </div>
        </div>
        {!preset && (
          <span className="text-[10px] text-[#AAA49C] bg-[#F7F4EF] px-2.5 py-1 rounded-full border border-black/[0.06]">
            Select a preset first
          </span>
        )}
      </div>

      {/* Date + hour range pickers */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-bold">Date</label>
          <input
            type="date"
            value={dateStr}
            max={new Date(Date.now() - 86400000).toISOString().split("T")[0]}
            onChange={e => { setDateStr(e.target.value); setSelectedTs(null); }}
            className="text-[12px] font-mono border border-black/[0.08] bg-[#F7F4EF] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0B2D5B]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-bold">From (h)</label>
          <input
            type="number" min={0} max={endHour - 1} value={startHour}
            onChange={e => setStartHour(Math.max(0, Math.min(endHour - 1, +e.target.value)))}
            className="w-16 text-[12px] font-mono border border-black/[0.08] bg-[#F7F4EF] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0B2D5B]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-bold">To (h)</label>
          <input
            type="number" min={startHour + 1} max={23} value={endHour}
            onChange={e => setEndHour(Math.max(startHour + 1, Math.min(23, +e.target.value)))}
            className="w-16 text-[12px] font-mono border border-black/[0.08] bg-[#F7F4EF] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0B2D5B]"
          />
        </div>
      </div>

      {/* Slider */}
      <div className="relative mb-2">
        <div className="relative h-2 bg-[#F0EDE6] rounded-full overflow-hidden mb-1">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#0B2D5B] to-[#E8A83A] rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={startHour}
          max={endHour}
          step={0.25}
          value={sliderValue}
          onChange={handleSliderChange}
          onMouseUp={handleSliderRelease}
          onTouchEnd={handleSliderRelease}
          disabled={!preset || isLoading}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2 disabled:cursor-not-allowed"
        />
        {/* Tick labels */}
        <div className="flex justify-between mt-1">
          {ticks.map((ts, i) => (
            <span key={i} className="text-[8px] text-[#AAA49C] font-mono">{fmtTime(ts)}</span>
          ))}
        </div>
      </div>

      {/* Current time indicator */}
      <div className="flex items-center justify-between mt-3">
        <div className="text-[13px] font-black text-[#0B2D5B] font-mono tabular-nums">
          {fmtDate(currentTs)} &nbsp; {fmtTime(currentTs)}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={!preset}
            className="w-8 h-8 rounded-lg bg-[#F0EDE6] hover:bg-[#e0dcd5] disabled:opacity-40 flex items-center justify-center transition-colors"
            title="Reset"
          >
            <SkipBack className="w-3.5 h-3.5 text-[#6B6560]" />
          </button>
          <button
            onClick={handlePlay}
            disabled={!preset || isLoading}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black transition-colors disabled:opacity-40 ${
              isPlaying
                ? "bg-[#C0392B] text-white hover:bg-[#a93226]"
                : "bg-[#0B2D5B] text-white hover:bg-[#143C75]"
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => fetchAt(currentTs)}
            disabled={!preset || isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] disabled:opacity-40 transition-colors"
          >
            {isLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-[#0B2D5B]/30 border-t-[#0B2D5B] rounded-full animate-spin inline-block" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            Fetch
          </button>
        </div>
      </div>

      <p className="text-[9px] text-[#AAA49C] mt-3">
        OpenSky historical data · authenticated users only · up to 30 days back
      </p>
    </div>
  );
}