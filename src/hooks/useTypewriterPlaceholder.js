import { useEffect, useState } from "react";

export default function useTypewriterPlaceholder(phrases, { typeMs = 70, deleteMs = 30, pauseMs = 1800 } = {}) {
  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[phraseIndex % phrases.length];
    let delay = deleting ? deleteMs : typeMs;
    if (!deleting && text === phrase) delay = pauseMs;

    const timer = setTimeout(() => {
      if (!deleting && text === phrase) { setDeleting(true); return; }
      if (deleting && text === "") { setDeleting(false); setPhraseIndex((i) => i + 1); return; }
      setText(phrase.slice(0, text.length + (deleting ? -1 : 1)));
    }, delay);
    return () => clearTimeout(timer);
  }, [text, deleting, phraseIndex, phrases, typeMs, deleteMs, pauseMs]);

  return text;
}