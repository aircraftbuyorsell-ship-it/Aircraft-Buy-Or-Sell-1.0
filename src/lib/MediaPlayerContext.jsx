import { createContext, useContext, useState, useCallback } from "react";

const MediaPlayerContext = createContext(null);

export function MediaPlayerProvider({ children }) {
  const [item, setItem] = useState(null);      // { type, id, title, channel }
  const [expanded, setExpanded] = useState(false); // true = full video, false = audio-only mini-bar

  const play = useCallback((nextItem) => {
    setItem(nextItem);
    setExpanded(true);
  }, []);

  const close = useCallback(() => {
    setItem(null);
    setExpanded(false);
  }, []);

  const toggleExpanded = useCallback(() => setExpanded((v) => !v), []);

  return (
    <MediaPlayerContext.Provider value={{ item, expanded, play, close, toggleExpanded }}>
      {children}
    </MediaPlayerContext.Provider>
  );
}

export function useMediaPlayer() {
  const ctx = useContext(MediaPlayerContext);
  if (!ctx) throw new Error("useMediaPlayer must be used within MediaPlayerProvider");
  return ctx;
}