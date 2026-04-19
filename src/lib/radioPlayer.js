// Tiny global radio player store (no deps).
// Holds a single <audio> element shared across the app.

let audioEl = null;
const listeners = new Set();
let state = { station: null, playing: false, loading: false, error: null };

function ensureAudio() {
  if (audioEl) return audioEl;
  audioEl = new Audio();
  audioEl.preload = "none";
  // NOTE: no crossOrigin — most radio streams don't send CORS headers.
  // We only play, not read samples, so CORS is not needed.
  audioEl.addEventListener("playing", () => update({ playing: true, loading: false, error: null }));
  audioEl.addEventListener("pause", () => update({ playing: false }));
  audioEl.addEventListener("waiting", () => update({ loading: true }));
  audioEl.addEventListener("error", () => {
    console.warn("Radio stream error:", audioEl?.error?.code, audioEl?.src);
    update({ playing: false, loading: false, error: "Stream unavailable" });
  });
  return audioEl;
}

function update(patch) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn(state));
}

function pickStream(station) {
  if (!station) return null;
  // Try the various shapes the 50K Radio Stations API can return
  const streams = station.streams || station.urls || [];
  const candidates = [];
  for (const s of streams) {
    if (!s) continue;
    if (typeof s === "string") candidates.push(s);
    else candidates.push(s.url || s.stream || s.src);
  }
  if (station.url) candidates.push(station.url);
  if (station.stream) candidates.push(station.stream);
  if (station.streamUrl) candidates.push(station.streamUrl);
  const valid = candidates.filter(Boolean);
  // Prefer HTTPS to avoid mixed-content blocking
  const https = valid.find((u) => u.startsWith("https://"));
  return https || valid[0] || null;
}

export const radioPlayer = {
  subscribe(fn) {
    listeners.add(fn);
    fn(state);
    return () => listeners.delete(fn);
  },
  getState() { return state; },
  play(station) {
    const url = pickStream(station);
    if (!url) { update({ error: "No playable stream", playing: false, loading: false }); return; }
    const el = ensureAudio();
    if (state.station?.id !== station.id) {
      el.src = url;
      update({ station, loading: true, error: null });
    }
    el.play().catch(() => update({ error: "Playback blocked", playing: false, loading: false }));
  },
  pause() {
    if (audioEl) audioEl.pause();
  },
  toggle() {
    if (!state.station) return;
    if (state.playing) this.pause();
    else this.play(state.station);
  },
  setVolume(v) {
    const el = ensureAudio();
    el.volume = Math.max(0, Math.min(1, v));
  },
  stop() {
    if (audioEl) { audioEl.pause(); audioEl.src = ""; }
    update({ station: null, playing: false, loading: false, error: null });
  },
};