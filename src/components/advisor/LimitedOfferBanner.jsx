import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

export default function LimitedOfferBanner({ expiresAt }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Date.parse(expiresAt || 0) - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  if (!expiresAt || left <= 0) return null;
  const minutes = String(Math.floor(left / 60000)).padStart(2, "0");
  const seconds = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
  return (
    <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-primary/40 bg-card px-5 py-4 text-card-foreground shadow-sm">
      <div><p className="text-xs font-bold uppercase text-primary">30% First Report Offer</p><p className="mt-1 text-sm text-muted-foreground">Complete the purchase before this verified offer expires.</p></div>
      <div className="flex items-center gap-2 font-mono text-xl font-bold tabular-nums text-navy"><Clock3 className="h-5 w-5 text-primary" />{minutes}:{seconds}</div>
    </div>
  );
}