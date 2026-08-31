import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Radar } from "lucide-react";
import { Link } from "react-router-dom";

const REFRESH_INTERVAL = 60 * 1000; // 60s

export default function LiveTrafficBadge() {
  const [count, setCount] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [pulse, setPulse] = useState(false);
  const timerRef = useRef(null);

  const fetchCount = async () => {
    try {
      const snaps = await base44.entities.TrafficSnapshot.list("-refreshed_at", 1);
      const snap = snaps?.[0];
      if (snap?.total_raw != null) {
        setCount(snap.total_raw);
        setLastUpdate(snap.refreshed_at ? new Date(snap.refreshed_at) : new Date());
        setPulse(true);
        setTimeout(() => setPulse(false), 1000);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchCount();
    timerRef.current = setInterval(fetchCount, REFRESH_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <Link
      to="/traffic"
      className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
      style={{
        background: "rgba(11,45,91,0.06)",
        border: "1px solid rgba(11,45,91,0.12)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="relative">
        <Radar className="w-4 h-4 text-[#E8A83A]" />
        <span
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-400"
          style={{ boxShadow: "0 0 6px rgba(74,222,128,0.8)", animation: pulse ? "ping 0.6s ease-out" : "pulse 2s infinite" }}
        />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#6B6560]">Live Traffic</span>
        <span
          className="text-lg font-black text-[#0B2D5B] leading-tight"
          style={{ transition: "color 0.3s", color: pulse ? "#E8A83A" : "#0B2D5B" }}
        >
          {count != null ? count.toLocaleString() : "—"}
          <span className="text-[10px] font-semibold text-[#AAA49C] ml-1">aircraft</span>
        </span>
      </div>
      {lastUpdate && (
        <span className="text-[9px] text-[#AAA49C] self-end ml-1 hidden sm:block">
          {lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </Link>
  );
}