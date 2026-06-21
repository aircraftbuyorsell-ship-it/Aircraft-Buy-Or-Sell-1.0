import { useState } from "react";
import { X, Save, Power, RefreshCw, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Checks for duplicate N-reg / EASA registration marks (excluding this listing).
async function regIsDuplicate(reg, selfId) {
  const clean = (reg || "").trim().toUpperCase();
  if (!clean) return false;
  const matches = await base44.entities.AircraftListing.filter({ registration: clean });
  return matches.some((m) => m.id !== selfId);
}

export default function CardAdminEditor({ listing: l, onClose }) {
  const [name, setName] = useState(`${l.year || ""} ${l.make || ""} ${l.model || ""}`.trim());
  const [price, setPrice] = useState(l.asking_price ?? "");
  const [registration, setRegistration] = useState(l.registration || "");
  const [active, setActive] = useState((l.status || "active") !== "draft");
  const [rescore, setRescore] = useState(false);
  const [marketplaceText, setMarketplaceText] = useState(l.marketplace_text || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hasScoreCard = l.ati_score != null && l.ati_score > 0;

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      if (registration.trim() && registration.trim().toUpperCase() !== (l.registration || "").toUpperCase()) {
        if (await regIsDuplicate(registration, l.id)) {
          setError(`Registration ${registration.trim().toUpperCase()} already exists. Duplicates are not allowed.`);
          setSaving(false);
          return;
        }
      }

      const parts = name.trim().split(/\s+/);
      const year = parts[0] && /^\d{4}$/.test(parts[0]) ? Number(parts[0]) : l.year;
      const make = parts[0] && /^\d{4}$/.test(parts[0]) ? parts[1] : parts[0];
      const model = parts.slice(/^\d{4}$/.test(parts[0]) ? 2 : 1).join(" ");

      const payload = {
        year,
        make: make || l.make,
        model: model || l.model,
        asking_price: price === "" ? null : Number(price),
        registration: registration.trim().toUpperCase() || l.registration,
        status: active ? "active" : "draft",
      };

      if (rescore && hasScoreCard) {
        payload.card_level = "ati_pass";
        payload.marketplace_text = marketplaceText;
      } else if (marketplaceText !== (l.marketplace_text || "")) {
        payload.marketplace_text = marketplaceText;
      }

      await base44.entities.AircraftListing.update(l.id, payload);
      window.location.reload();
    } catch (err) {
      setError("Save failed: " + (err?.message || "Unknown error"));
      setSaving(false);
    }
  };

  const field = "w-full bg-white border border-black/15 rounded-lg px-3 py-2 text-[13px] text-[#1A1814] outline-none focus:border-[#E8A83A]";
  const lbl = "text-[9px] uppercase tracking-wider font-black text-[#4a4550] mb-1 block";

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 bg-white flex flex-col" style={{ borderRadius: 15 }} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.08]">
        <p className="text-[#0B2D5B] text-[11px] uppercase tracking-[0.18em] font-black">Admin · Edit Card</p>
        <button onClick={onClose} className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center text-[#1A1814] hover:bg-black/10">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <div>
          <label className={lbl}>Header name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="2018 Cessna 172" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Asking price ($)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={field} placeholder="285000" />
          </div>
          <div>
            <label className={lbl}>Registration</label>
            <input value={registration} onChange={(e) => setRegistration(e.target.value.toUpperCase())} className={`${field} font-mono`} placeholder="N12345 / OK-XXX" />
          </div>
        </div>

        <button
          onClick={() => setActive((v) => !v)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border ${active ? "bg-[#0F7A56]/10 border-[#0F7A56]/30 text-[#0F7A56]" : "bg-black/5 border-black/10 text-[#4a4550]"}`}>
          <span className="flex items-center gap-2 text-[12px] font-black"><Power className="w-4 h-4" /> Card {active ? "ON (active)" : "OFF (draft)"}</span>
          <span className={`w-9 h-5 rounded-full relative transition-colors ${active ? "bg-[#0F7A56]" : "bg-black/20"}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${active ? "left-[18px]" : "left-0.5"}`} />
          </span>
        </button>

        {hasScoreCard &&
          <div className={`rounded-lg border p-3 ${rescore ? "bg-[#E8A83A]/10 border-[#E8A83A]/40" : "bg-black/5 border-black/10"}`}>
            <button onClick={() => setRescore((v) => !v)} className="w-full flex items-center gap-2 text-[12px] font-black text-[#A67C00]">
              <RefreshCw className="w-4 h-4" /> Re-score → degrade to ATI Pass
            </button>
            {rescore &&
              <div className="mt-2">
                <label className={lbl}>Marketplace listing text (additional input)</label>
                <textarea value={marketplaceText} onChange={(e) => setMarketplaceText(e.target.value)} rows={4} className={`${field} resize-none`} placeholder="Paste additional marketplace listing details to re-score the card components…" />
              </div>
            }
          </div>
        }

        {error && <p className="text-[11px] text-[#C0392B] font-bold">{error}</p>}
      </div>

      <div className="px-4 py-3 border-t border-black/[0.08]">
        <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-[#0B2D5B] text-white font-black text-[13px] py-2.5 rounded-lg hover:bg-[#093] disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}