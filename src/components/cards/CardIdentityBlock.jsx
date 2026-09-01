import { useState } from "react";
import { Fingerprint, Copy, Check, Share2, BadgeCheck, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { STATUS_META, CARD_TYPE_META } from "@/lib/atiCard";

/**
 * Identity block shown on the ATI Passport page — makes the card feel like a
 * tradeable, uniquely-identified asset (not just a report).
 */
export default function CardIdentityBlock({ card }) {
  const [copied, setCopied] = useState(false);
  if (!card) return null;

  const status = STATUS_META[card.status] || STATUS_META.issued;
  const type = CARD_TYPE_META[card.card_type] || CARD_TYPE_META.basic;
  const publicUrl = `${window.location.origin}/c/${card.public_card_code}`;

  const copy = async () => {
    await navigator.clipboard.writeText(card.public_card_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="bg-white border border-[#0B2D5B]/20 rounded-2xl p-5 md:p-6">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="w-11 h-11 rounded-md bg-[#0B2D5B] flex items-center justify-center shrink-0">
          <Fingerprint className="w-5 h-5 text-[#E8A83A]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#E8A83A]">ATI Card · Registry ID</p>
            <span
              className="text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full"
              style={{ backgroundColor: status.bg, color: status.color }}
            >
              {status.label}
            </span>
            <span className="text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full border border-black/10 text-[#6B6560]">
              {type.label} · v{card.card_version}
            </span>
          </div>
          <p className="font-mono text-base md:text-lg font-black text-[#1A1814] tracking-tight mt-1 break-all">
            {card.public_card_code}
          </p>
          <p className="text-[11px] text-[#6B6560] mt-0.5">
            Issued by {card.issuer_entity || "ABOS"} · Sequence #{String(card.sequence_number).padStart(6, "0")} · Attribution: first verified source
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {/* Verified by Owner badge */}
          {card.owner_verified && (
            <span
              className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-black px-2.5 py-1.5 rounded-full border"
              style={{ background: "rgba(212,160,23,0.08)", borderColor: "rgba(212,160,23,0.3)", color: "#A67C00" }}
            >
              <BadgeCheck className="w-3.5 h-3.5 text-[#D4A017]" />
              Verified by Owner
            </span>
          )}
          {!card.owner_verified && (
            <span
              className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1.5 rounded-full border border-dashed"
              style={{ color: "rgba(0,0,0,0.25)", borderColor: "rgba(0,0,0,0.12)" }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Ownership Unverified
            </span>
          )}
          <button onClick={copy}
            className="flex items-center gap-1.5 bg-[#F7F4EF] hover:bg-[#0B2D5B] hover:text-white border border-black/10 text-[#1A1814] text-[11px] uppercase tracking-wider font-black px-3 py-2 rounded-md transition-colors">
            {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy ID</>}
          </button>
          <Link to={`/c/${card.public_card_code}`}
            className="flex items-center gap-1.5 bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] text-[11px] uppercase tracking-wider font-black px-3 py-2 rounded-md transition-colors">
            <Share2 className="w-3.5 h-3.5" /> Public
          </Link>
        </div>
      </div>

      {/* Card role badges — emails masked for privacy */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5 pt-5 border-t border-black/[0.06]">
        {[
          { label: "Issuer", value: card.issuer_entity || "ABOS" },
          { label: "Card Owner", value: card.card_owner_email ? "●●●●●@●●●●●" : "—" },
          { label: "Distribution", value: card.distribution_owner_email ? "●●●●●@●●●●●" : "—" },
        ].map(r => (
          <div key={r.label}>
            <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">{r.label}</p>
            <p className="text-[12px] font-semibold text-[#1A1814] mt-0.5 truncate">{r.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}