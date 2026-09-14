import { ChevronLeft, ChevronRight, History, Pause, Play, Radio } from "lucide-react";

export default function TrafficTimeline({ snapshots, index, active, playing, onToggle, onChange, onPlay }) {
  const selected = snapshots[index];
  const move = (delta) => onChange(Math.max(0, Math.min(snapshots.length - 1, index + delta)));
  return <section className="ig-timeline" aria-label="Historical traffic timeline">
    <button className={active ? "is-active" : ""} onClick={onToggle}><History />{active ? "Return live" : "History"}</button>
    {active && <>
      <button onClick={() => move(-1)} disabled={index === 0} aria-label="Previous snapshot"><ChevronLeft /></button>
      <button onClick={onPlay} disabled={snapshots.length < 2} aria-label={playing ? "Pause replay" : "Play replay"}>{playing ? <Pause /> : <Play />}</button>
      <input type="range" min="0" max={Math.max(0, snapshots.length - 1)} value={index} onChange={(event) => onChange(Number(event.target.value))} aria-label="Snapshot time" />
      <button onClick={() => move(1)} disabled={index >= snapshots.length - 1} aria-label="Next snapshot"><ChevronRight /></button>
      <div className="ig-time"><Radio /><span>{selected?.refreshed_at ? new Date(selected.refreshed_at).toLocaleString() : "No stored snapshots"}</span></div>
    </>}
  </section>;
}