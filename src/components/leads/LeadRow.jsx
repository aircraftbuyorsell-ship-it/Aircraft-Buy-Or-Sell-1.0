import { useState } from "react";
import { ChevronDown, Mail, Lock, Unlock, Plane, Sparkles } from "lucide-react";
import LeadMatchModal from "@/components/leads/LeadMatchModal";

const STATUS_CONFIG = {
  new:         { label: "New",         bg: "rgba(24,95,165,0.1)",   text: "#185FA5",  border: "rgba(24,95,165,0.2)" },
  contacted:   { label: "Contacted",   bg: "rgba(166,124,0,0.1)",   text: "#A67C00",  border: "rgba(166,124,0,0.25)" },
  qualified:   { label: "Qualified",   bg: "rgba(212,160,23,0.12)", text: "#D4A017",  border: "rgba(212,160,23,0.3)" },
  negotiating: { label: "Negotiating", bg: "rgba(101,60,180,0.1)",  text: "#6533BE",  border: "rgba(101,60,180,0.2)" },
  closed:      { label: "Closed",      bg: "rgba(15,122,86,0.1)",   text: "#0F7A56",  border: "rgba(15,122,86,0.2)" },
  lost:        { label: "Lost",        bg: "rgba(192,57,43,0.1)",   text: "#C0392B",  border: "rgba(192,57,43,0.2)" },
};

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border whitespace-nowrap"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}>
      {c.label}
    </span>
  );
}

function initials(name) {
  return (name || "?").split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

function maskEmail(email) {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return "••••••••";
  return `${local[0] || ""}•••@${domain[0] || ""}•••.${domain.split(".").pop()}`;
}

function maskName(name) {
  if (!name) return "Verified buyer";
  const parts = name.split(" ");
  return parts.map(p => (p[0] || "") + "•••").join(" ");
}

export { STATUS_CONFIG };

export default function LeadRow({ lead, unlocked, onUnlock, onStatusChange, unlockCost = 10 }) {
  const [open, setOpen] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);

  return (
    <>
    <LeadMatchModal open={matchOpen} onClose={() => setMatchOpen(false)} lead={lead} />
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 md:px-6 py-4 hover:bg-[#F7F4EF] transition-colors border-b border-black/[0.05] last:border-0">
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${unlocked ? "bg-[#0F7A56]/10 border-[#0F7A56]/20" : "bg-black/5 border-black/10"}`}>
        {unlocked ? (
          <span className="text-[11px] font-black text-[#0F7A56]">{initials(lead.name)}</span>
        ) : (
          <Lock className="w-3.5 h-3.5 text-[#AAA49C]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${unlocked ? "text-[#1A1814]" : "text-[#6B6560] select-none"}`}>
          {unlocked ? lead.name : maskName(lead.name)}
        </p>
        <p className={`text-[11px] truncate ${unlocked ? "text-[#AAA49C]" : "text-[#AAA49C] select-none blur-[0.2px]"}`}>
          {unlocked ? lead.email : maskEmail(lead.email)}
        </p>
        {lead.aircraft_preference && (
          <p className="text-[11px] text-[#6B6560] mt-0.5 truncate max-w-xs">{lead.aircraft_preference}</p>
        )}
        {lead.listing_label && (
          <p className="text-[10px] text-[#0B2D5B] mt-0.5 truncate max-w-xs flex items-center gap-1 font-semibold">
            <Plane className="w-2.5 h-2.5 shrink-0" /> {lead.listing_label}
          </p>
        )}
      </div>

      {/* Budget */}
      <div className="shrink-0 text-center hidden md:block">
        <p className="text-[9px] text-[#AAA49C] uppercase tracking-wider mb-0.5">Budget</p>
        <p className="text-sm font-bold text-[#1A1814]">{lead.budget || "—"}</p>
      </div>

      {/* Status dropdown — only when unlocked */}
      {unlocked ? (
        <div className="relative shrink-0">
          <button onClick={() => setOpen(v => !v)} className="flex items-center gap-1.5">
            <StatusBadge status={lead.status || "new"} />
            <ChevronDown className="w-3 h-3 text-[#AAA49C]" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-black/10 rounded-xl shadow-lg z-20 py-1 min-w-[130px]">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => { onStatusChange(lead.id, key); setOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-[#F7F4EF] transition-colors"
                  style={{ color: cfg.text }}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border bg-black/5 text-[#AAA49C] border-black/10">
          Locked
        </span>
      )}

      {/* Action */}
      {unlocked ? (
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={() => setMatchOpen(true)}
            title="Find matching aircraft"
            className="flex items-center justify-center text-[#4e8ef7] hover:text-[#0B2D5B] transition-colors"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <a
            href={`mailto:${lead.email}`}
            className="flex items-center gap-1 text-[#0F7A56] hover:text-[#0B2D5B] transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <Mail className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <button
          onClick={() => onUnlock(lead)}
          className="shrink-0 flex items-center gap-1.5 bg-[#E8A83A] hover:bg-[#d49a2f] text-[#0B2D5B] text-[11px] uppercase tracking-wider font-black px-3 py-1.5 rounded-full transition-colors"
        >
          <Unlock className="w-3.5 h-3.5" />
          Unlock · {unlockCost} cr
        </button>
      )}
    </div>
    </>
  );
}