import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, FileText } from "lucide-react";

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
        <h2 className="font-black text-[#0B2D5B] text-lg">Negotiation Engine</h2>
        <p className="text-sm text-[#6B6560]">AI-generated data-backed negotiation briefs</p>
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.07] p-5 space-y-4 mb-5">
        <div>
          <label className="text-[10px] font-bold text-[#6B6560] uppercase tracking-wider">Select Aircraft</label>
          <select
            value={selectedListing}
            onChange={e => { setSelectedListing(e.target.value); setBrief(null); }}
            className="w-full mt-1 px-3 py-2.5 border border-black/[0.1] rounded-xl text-sm focus:outline-none focus:border-[#0B2D5B]"
          >
            <option value="">— Choose a listing —</option>
            {listings.map(l => (
              <option key={l.id} value={l.id}>
                {l.registration ? `${l.registration} · ` : ""}{l.year || ""} {l.make} {l.model}{l.asking_price ? ` · $${l.asking_price.toLocaleString()}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-[#6B6560] uppercase tracking-wider">Your Side</label>
          <div className="flex gap-2 mt-1">
            {["SELLER", "BUYER"].map(s => (
              <button key={s} onClick={() => setSide(s)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black border transition-all ${side === s ? "bg-[#0B2D5B] text-white border-[#0B2D5B]" : "bg-white text-[#6B6560] border-black/[0.1] hover:border-[#0B2D5B]"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {listing && (
          <div className="bg-[#F7F4EF] rounded-xl p-3.5 grid grid-cols-3 gap-2">
            {[
              ["Asking", listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : "—"],
              ["ATI", listing.ati_score ? `${listing.ati_score}/120` : "—"],
              ["Deal", listing.deal_label || "—"],
            ].map(([k, v]) => (
              <div key={k} className="text-center">
                <p className="text-[9px] font-bold text-[#AAA49C] uppercase tracking-wider">{k}</p>
                <p className="text-sm font-black text-[#1A1814]">{v}</p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={generate}
          disabled={!selectedListing || loading}
          className="w-full py-3 bg-[#0B2D5B] hover:bg-[#0a2650] disabled:opacity-40 text-white font-black rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating brief…</> : <><FileText className="w-4 h-4" /> Generate Negotiation Brief</>}
        </button>
      </div>

      {brief?.error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm font-semibold">
          Error: {brief.error}
        </div>
      )}

      {brief && !brief.error && (
        <div className="bg-white rounded-2xl border-2 border-[#0B2D5B]/20 overflow-hidden">
          {/* Brief header */}
          <div className="bg-[#0B2D5B] px-5 py-4">
            <p className="text-[#E8A83A] text-[10px] font-black uppercase tracking-widest mb-1">Negotiation Brief</p>
            <p className="text-white font-black text-lg">
              {brief.listing.registration || `${brief.listing.make} ${brief.listing.model}`}
            </p>
            <p className="text-white/50 text-xs mt-0.5">Side: {brief.side} · Generated by AI</p>
          </div>

          <div className="p-5 space-y-5">
            {/* Summary */}
            <div>
              <p className="text-[10px] font-black text-[#AAA49C] uppercase tracking-wider mb-1.5">Position Summary</p>
              <p className="text-sm text-[#1A1814] leading-relaxed">{brief.summary}</p>
            </div>

            {/* Price strategy */}
            <div>
              <p className="text-[10px] font-black text-[#AAA49C] uppercase tracking-wider mb-2">Price Strategy</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Opening", value: brief.opening_price, color: "#185FA5" },
                  { label: "Target",  value: brief.target_price,  color: "#D4A017" },
                  { label: "Walk-away", value: brief.walkaway_price, color: "#C0392B" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center p-3 rounded-xl" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color }}>{label}</p>
                    <p className="font-black text-[#1A1814]">{value ? `$${Math.round(value).toLocaleString()}` : "—"}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Arguments */}
            {brief.arguments?.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-[#AAA49C] uppercase tracking-wider mb-2">Your Key Arguments</p>
                <ul className="space-y-1.5">
                  {brief.arguments.map((arg, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[#1A1814]">
                      <span className="text-[#0F7A56] font-black shrink-0">{i + 1}.</span>
                      {arg}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timeline tactic */}
            {brief.timeline_tactic && (
              <div className="bg-[#F7F4EF] rounded-xl p-3.5">
                <p className="text-[10px] font-black text-[#AAA49C] uppercase tracking-wider mb-1">Timeline Tactic</p>
                <p className="text-sm text-[#1A1814] italic">"{brief.timeline_tactic}"</p>
              </div>
            )}

            {/* Counter-tactics */}
            {brief.counter_tactics?.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-[#AAA49C] uppercase tracking-wider mb-2">If They Push Back</p>
                <ul className="space-y-1.5">
                  {brief.counter_tactics.map((t, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[#1A1814]">
                      <span className="text-[#D4A017] font-black shrink-0">→</span>
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