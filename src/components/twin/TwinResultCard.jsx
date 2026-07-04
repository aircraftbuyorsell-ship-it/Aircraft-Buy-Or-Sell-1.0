import { Lock, CheckCircle, FileText } from "lucide-react";

const AMBER = "#f5c242";

export default function TwinResultCard({ result, onGetReport }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(245,194,66,0.25)" }}>
      {/* Found banner */}
      <div className="px-5 py-3 flex items-center gap-2"
        style={{ background: "rgba(93,202,165,0.08)", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
        <CheckCircle className="w-4 h-4 text-[#5dcaa5]" />
        <span className="text-[12px] font-black text-[#5dcaa5]">
          ATI record found for {result.registration}
        </span>
      </div>

      <div className="px-5 py-5">
        <h2 className="text-xl font-black text-[rgba(255,255,255,0.92)]">
          {result.year || ""} {result.make || ""} {result.model || ""}
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-[13px]">
          <Row label="Registration" value={result.registration} mono />
          <Row label="Status" value={result.registration_status} />
          <Row label="Owner" value={result.owner_masked || "—"} />
          <Row label="State" value={result.owner_state || "—"} />
          <Row label="Serial" value={result.serial_number_masked || "—"} mono />
          <Row label="For Sale" value={result.is_for_sale ? "Yes — listed on ABOS" : "Not listed"} />
        </div>

        {/* Locked score */}
        <div className="mt-5 rounded-xl px-4 py-4 flex items-center justify-between"
          style={{ background: "rgba(245,194,66,0.06)", border: "0.5px solid rgba(245,194,66,0.2)" }}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] font-black" style={{ color: AMBER }}>
              ATI Score
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Lock className="w-4 h-4 text-[rgba(255,255,255,0.5)]" />
              <span className="text-lg font-black text-[rgba(255,255,255,0.35)] tracking-widest">•• / 120</span>
              {result.score_label && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                  style={{ color: AMBER, background: "rgba(245,194,66,0.1)" }}>
                  {result.score_label}
                </span>
              )}
            </div>
          </div>
        </div>

        {result.data_points_available?.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {result.data_points_available.map((dp) => (
              <li key={dp} className="flex items-center gap-2 text-[12px] text-[rgba(255,255,255,0.6)]">
                <CheckCircle className="w-3.5 h-3.5 text-[#5dcaa5] shrink-0" /> {dp}
              </li>
            ))}
          </ul>
        )}

        <button onClick={onGetReport}
          className="w-full mt-5 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2"
          style={{ background: AMBER, color: "#0B1220" }}>
          <FileText className="w-4 h-4" />
          Get Full Report — €{result.report_price_eur} · PDF to your email
        </button>
        <p className="text-[10px] text-center text-[rgba(255,255,255,0.35)] mt-2">
          No account required. Independent verification — not a sales listing.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-[rgba(255,255,255,0.4)] text-[11px] uppercase tracking-wider">{label}</span>
      <span className={`text-[rgba(255,255,255,0.85)] font-semibold ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}