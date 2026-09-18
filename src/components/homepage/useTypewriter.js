import { useEffect, useState } from "react";

// Aviation-themed search prompts cycled as a typewriter placeholder.
const PHRASES = [
  "Verify N7692J before you buy…",
  "Is OK-PES a fair deal?",
  "Check damage history of N123AB…",
  "ATI score for this Cessna…",
  "Market value of a Piper Arrow…",
  "Who owns N789BC?",
  "EASA compliance for D-ERFA…",
  "Engine hours since TBO…",
  "Compare two aircraft deals…",
  "Registry evidence for G-ABCD…",
];

export default function useTypewriter({
  phrases = PHRASES,
  typeSpeed = 55,
  eraseSpeed = 28,
  holdFull = 1500,
  holdEmpty = 450,
} = {}) {
  const [text, setText] = useState("");
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduced) {
      setText(phrases[0]);
      return;
    }
    let phraseIdx = 0;
    let charIdx = 0;
    let mode = "typing"; // typing | holding | erasing | paused
    let timer;

    const tick = () => {
      if (mode === "typing") {
        charIdx++;
        setText(phrases[phraseIdx].slice(0, charIdx));
        if (charIdx >= phrases[phraseIdx].length) {
          mode = "holding";
          timer = setTimeout(tick, holdFull);
          return;
        }
        timer = setTimeout(tick, typeSpeed);
      } else if (mode === "holding") {
        mode = "erasing";
        timer = setTimeout(tick, holdEmpty);
      } else if (mode === "erasing") {
        charIdx--;
        setText(phrases[phraseIdx].slice(0, charIdx));
        if (charIdx <= 0) {
          phraseIdx = (phraseIdx + 1) % phrases.length;
          charIdx = 0;
          mode = "typing";
          timer = setTimeout(tick, holdEmpty);
          return;
        }
        timer = setTimeout(tick, eraseSpeed);
      }
    };

    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [reduced, phrases, typeSpeed, eraseSpeed, holdFull, holdEmpty]);

  return text;
}