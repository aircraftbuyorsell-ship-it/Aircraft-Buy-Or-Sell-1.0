import { Link } from "react-router-dom";
import { Fingerprint, ShieldCheck, ArrowRight, GitBranch } from "lucide-react";

// ABOS ATI Card identity block — unique card ID + ATI score + Sales Pipeline CTA
export default function ATICardBlock({ registration, atiCard, passport }) {
  const reg = (registration || "").toUpperCase();
  const cardId = atiCard?.public_card_code || `ABOS-ATI-${reg.replace(/[^A-Z0-9]/g, "")}`;
  const issued = !!atiCard;
  const score = passport?.ati_total;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(212,160,23,0.35)", background: "linear-gradient(135deg, rgba(212,160,23,0.10) 0%, rgba(212,160,23,0.03) 60%)" }}>
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(212,160,23,0.15)", border: "1px solid rgba(212,160,23,0.35)" }}>
              <Fingerprint className="w-5 h-5" style={{ color: "#D4A017" }} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: "#D4A017" }}>
                ABOS ATI Card {issued ? "· Issued" : "· Preview"}
              </p>
              <p className="text-[15px] md:text-[17px] font-black font-mono tracking-tight truncate" style={{ color: "#D4A017" }}>
                {cardId}
              </p>
            </div>
          </div>

          {typeof score === "number" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0"
              style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.30)" }}>
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span className="text-[12px] font-black text-green-500">ATI {score}/120</span>
            </div>
          )}
        </div>

        <Link to={`/sales-pipeline/${encodeURIComponent(reg)}`}
          className="mt-5 w-full rounded-xl py-4 px-6 flex items-center justify-center gap-2.5 text-[13px] font-black uppercase tracking-wider transition-all hover:scale-[1.01]"
          style={{ background: "#D4A017", color: "#04060a", boxShadow: "0 8px 24px rgba(212,160,23,0.3)" }}>
          <GitBranch className="w-4 h-4" />
          Start Sales Pipeline
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-center text-[10px] mt-2.5" style={{ color: "rgba(255,255,255,0.40)" }}>
          Digital Twin → verification → valuation → contract → closing — end to end
        </p>
      </div>
    </div>
  );
}