import { useState, useEffect } from "react";

export default function PragueClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString("en-GB", { timeZone: "Europe/Prague", day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-GB", { timeZone: "Europe/Prague", hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="hidden sm:flex flex-col items-end" style={{ lineHeight: 1.2 }}>
      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand-primary)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}>
        {timeStr}
      </span>
      <span style={{ fontSize: "9px", color: "var(--brand-muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {dateStr} · Prague
      </span>
    </div>
  );
}