import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";

// Single fixed station: smooth jazz for focus & work
export const JAZZ_STATION = {
  type: "playlist",
  id: "PL55713C70BA91BD6E",
  title: "Jazz for Focus & Work",
  channel: "Cafe Music BGM",
  desc: "Smooth jazz background — 24/7",
};

const MediaPlayerContext = createContext(null);

export function MediaPlayerProvider({ children }) {
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const iframeRef = useRef(null);

  // Send commands to the YouTube iframe via postMessage (YT Iframe API)
  const post = useCallback((func) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");
  }, []);

  const start = useCallback(() => { post("playVideo"); setPlaying(true); }, [post]);
  const stop  = useCallback(() => { post("pauseVideo"); setPlaying(false); }, [post]);
  const toggle = useCallback(() => { playing ? stop() : start(); }, [playing, start, stop]);
  const toggleExpanded = useCallback(() => setExpanded(v => !v), []);

  // Global spacebar shortcut (ignored while typing in inputs)
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== "Space") return;
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || e.target?.isContentEditable) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <MediaPlayerContext.Provider
      value={{ station: JAZZ_STATION, playing, expanded, start, stop, toggle, toggleExpanded, iframeRef }}
    >
      {children}
    </MediaPlayerContext.Provider>
  );
}

export function useMediaPlayer() {
  const ctx = useContext(MediaPlayerContext);
  if (!ctx) throw new Error("useMediaPlayer must be used within MediaPlayerProvider");
  return ctx;
}