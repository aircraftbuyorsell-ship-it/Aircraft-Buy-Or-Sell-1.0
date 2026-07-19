import { Loader2, Shield, ChevronDown } from "lucide-react";
import moment from "moment";

export default function PassportPicker({ passports, selectedId, onSelect, loading }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-white/40 py-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading passports...
      </div>
    );
  }

  if (passports.length === 0) {
    return (
      <p className="text-[11px] text-white/35 py-2">
        No ATI passports found. Generate one from the ATI Passport page first.
      </p>
    );
  }

  return (
    <div className="relative">
      <select
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full appearance-none pl-3 pr-9 py-2.5 rounded-lg text-xs outline-none cursor-pointer"
        style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: "white" }}
      >
        {passports.map((p) => (
          <option key={p.id} value={p.id} style={{ background: "#1a1a2e", color: "white" }}>
            {p.registration} — ATI {p.ati_total || "?"}/120 {p.score_label ? `(${p.score_label})` : ""} · {moment(p.created_date).format("MMM D")}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
    </div>
  );
}