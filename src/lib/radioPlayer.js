// Tiny global radio player store (no deps).
// Holds a single <audio> element shared across the app.

let audioEl = null;
const listeners = new Set();
let state = { station: null, playing: false, loading: false, error: null };

function ensureAudio() {
  if (audioEl) return audioEl;
  audioEl = new Audio();
  audioEl.preload = "none";
  audioEl.crossOrigin = "anonymous";
  audioEl.addEventListener("playing", () => update({ playing: true, loading: false, error: null }));
  audioEl.addEventListener("pause", () => update({ playing: false }));
  audioEl.addEventListener("waiting", () => update({ loading: true }));
  audioEl.addEventListener("error", () => update({ playing: false, loading: false, error: "Stream unavailable" }));
  return audioEl;
}

function update(patch) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn(state));
}

function pickStream(station) {
  const streams = station?.streams || [];
  const https = streams.find((s) => s.isHttps);
  return (https || streams[0])?.url || null;
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