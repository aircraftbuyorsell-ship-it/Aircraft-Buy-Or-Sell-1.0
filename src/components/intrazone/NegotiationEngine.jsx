import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText } from "lucide-react";
import MiniGlobe from "@/components/MiniGlobe";

const GOLD = "#D4A017";
const MUTED = "rgba(255,255,255,0.45)";
const WHITE = "#fff";

export default function NegotiationEngine() {
  const [selectedListing, setSelectedListing] = useState("");
  const [side, setSide] = useState("SELLER");
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: listings = [] } = useQuery({
    queryKey: ["intrazone-listings"],
    queryFn: () => base44.entities.AircraftListing.list("-ati_score", 100),
  });

  const generate = async () => {
    const listing = listings.find(l => l.id === selectedListing);
    if (!listing) return;
    setLoading(true);
    setBrief(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert aircraft sales negotiation advisor.

Generate a detailed negotiation brief for this aircraft:
- Registration: ${listing.registration || "N/A"}
- Aircraft: ${listing.year || ""} ${listing.make} ${listing.model}
- Asking Price: $${listing.asking_price?.toLocaleString() || "N/A"}
- ATI Score: ${listing.ati_score || "N/A"}/120
- Deal Label: ${listing.deal_label || "unknown"}
- Discount vs Market: ${listing.discount_pct != null ? listing.discount_pct + "%" : "unknown"}
- Engine Hours: ${listing.engine_hours || "N/A"}
- TBO: ${listing.tbo || "N/A"}
- Last Annual: ${listing.last_annual || "N/A"}
- Avionics: ${listing.avionics || "N/A"}

Side: ${side}

Respond with a structured negotiation brief including:
1. Summary of position (2-3 sentences)
2. Key arguments (3-4 bullet points)
3. Suggested strategy: Opening / Target / Walk-away prices
4. Timeline tactic (1 sentence)
5. If buyer pushes back: 3 counter-tactics`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            arguments: { type: "array", items: { type: "string" } },
            opening_price: { type: "number" },
            target_price: { type: "number" },
            walkaway_price: { type: "number" },
            timeline_tactic: { type: "string" },
            counter_tactics: { type: "array", items: { type: "string" } },
          },
        },
      });
      setBrief({ ...res, listing, side });
    } catch (e) {
      setBrief({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const listing = listings.find(l => l.id === selectedListing);

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.18em] font-black" style={{ color: GOLD }}>Negotiation Engine</p>
        <h2 className="text-lg font-black mt-1" style={{ color: WHITE }}>AI-Generated Negotiation Briefs</h2>
      </div>

      <div className="rounded-xl p-5 space-y-4 mb-5" style={{
        background: "rgba(255,255,255,0.07)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: "1px solid rgba(255,255,255,0.11)",
      }}>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: MUTED }}>Select Aircraft</label>
          <select
            value={selectedListing}
            onChange={e => { setSelectedListing(e.target.value); setBrief(null); }}
            className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: WHITE }}>
            <option value="">— Choose a listing —</option>
            {listings.map(l => (
              <option key={l.id} value={l.id} style={{ color: "#000" }}>
                {l.registration ? `${l.registration} · ` : ""}{l.year || ""} {l.make} {l.model}{l.asking_price ? ` · $${l.asking_price.toLocaleString()}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: MUTED }}>Your Side</label>
          <div className="flex gap-2">
            {["SELLER", "BUYER"].map(s => (
              <button key={s} onClick={() => setSide(s)}
                className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all"
                style={{
                  color: side === s ? "#0a1628" : MUTED,
                  background: side === s ? `linear-gradient(135deg,${GOLD},#f48120)` : "rgba(255,255,255,0.05)",
                  border: side === s ? "none" : "1px solid rgba(255,255,255,0.12)",
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {listing && (
          <div className="rounded-xl p-3.5 grid grid-cols-3 gap-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              ["Asking", listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : "—"],
              ["ATI", listing.ati_score ? `${listing.ati_score}/120` : "—"],
              ["Deal", listing.deal_label || "—"],
            ].map(([k, v]) => (
              <div key={k} className="text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>{k}</p>
                <p className="text-sm font-black" style={{ color: WHITE }}>{v}</p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={generate}
          disabled={!selectedListing || loading}
          className="w-full py-3 rounded-xl font-black text-[13px] transition-colors flex items-center justify-center gap-2 disabled:opacity-40 uppercase tracking-wider"
          style={{
            background: `linear-gradient(135deg,${GOLD},#f48120)`,
            color: "#0a1628",
          }}>
          {loading ? (
            <><MiniGlobe size={18} color={GOLD} inline={true} /> Generating brief…</>
          ) : (
            <><FileText className="w-4 h-4" /> Generate Negotiation Brief</>
          )}
        </button>
      </div>

      {brief?.error && (
        <div className="rounded-xl p-4 text-sm font-semibold"
          style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
          Error: {brief.error}
        </div>
      )}

      {brief && !brief.error && (
        <div className="rounded-xl overflow-hidden" style={{
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          border: `1px solid ${GOLD}40`,
        }}>
          {/* Brief header */}
          <div className="px-5 py-4" style={{ background: "rgba(10,22,40,0.6)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: GOLD }}>Negotiation Brief</p>
            <p className="font-black text-lg" style={{ color: WHITE }}>
              {brief.listing.registration || `${brief.listing.make} ${brief.listing.model}`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>Side: {brief.side} · Generated by AI</p>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: MUTED }}>Position Summary</p>
              <p className="text-sm leading-relaxed" style={{ color: WHITE }}>{brief.summary}</p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: MUTED }}>Price Strategy</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Opening", value: brief.opening_price, color: "#3b82f6" },
                  { label: "Target",  value: brief.target_price,  color: GOLD },
                  { label: "Walk-away", value: brief.walkaway_price, color: "#ef4444" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center p-3 rounded-xl" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color }}>{label}</p>
                    <p className="font-black" style={{ color: WHITE }}>{value ? `$${Math.round(value).toLocaleString()}` : "—"}</p>
                  </div>
                ))}
              </div>
            </div>

            {brief.arguments?.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: MUTED }}>Your Key Arguments</p>
                <ul className="space-y-1.5">
                  {brief.arguments.map((arg, i) => (
                    <li key={i} className="flex gap-2 text-sm" style={{ color: WHITE }}>
                      <span className="font-black shrink-0" style={{ color: "#22c55e" }}>{i + 1}.</span>
                      {arg}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {brief.timeline_tactic && (
              <div className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: MUTED }}>Timeline Tactic</p>
                <p className="text-sm italic" style={{ color: WHITE }}>"{brief.timeline_tactic}"</p>
              </div>
            )}

            {brief.counter_tactics?.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: MUTED }}>If They Push Back</p>
                <ul className="space-y-1.5">
                  {brief.counter_tactics.map((t, i) => (
                    <li key={i} className="flex gap-2 text-sm" style={{ color: WHITE }}>
                      <span className="font-black shrink-0" style={{ color: GOLD }}>→</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}