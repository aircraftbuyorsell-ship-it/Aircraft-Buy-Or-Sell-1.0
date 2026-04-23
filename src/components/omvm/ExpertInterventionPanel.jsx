import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { UserCheck, Plus, Loader2, TestTube2 } from "lucide-react";

const FACTORS = ["engine", "avionics", "airframe", "damage", "market_timing", "region", "paint_interior", "stc_mods", "usage", "other"];

export default function ExpertInterventionPanel({ target, modelOMVM, calibration }) {
  const qc = useQueryClient();
  const [expertOMVM, setExpertOMVM] = useState("");
  const [rationale, setRationale] = useState("");
  const [factors, setFactors] = useState([]);
  const [confidence, setConfidence] = useState("medium");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const { data: reviews = [] } = useQuery({
    queryKey: ["expert-valuations", target?.id],
    enabled: !!target?.id,
    queryFn: () => base44.entities.ExpertValuation.filter({ listing: target.id }, "-created_date", 20),
  });

  const toggleFactor = (f) =>
    setFactors((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const submit = async () => {
    if (!target?.id || !expertOMVM) return;
    setSaving(true);
    setErr(null);
    try {
      const me = await base44.auth.me();
      const expert = Number(expertOMVM);
      const delta_pct = modelOMVM ? Math.round(((expert - modelOMVM) / modelOMVM) * 10000) / 100 : 0;
      await base44.entities.ExpertValuation.create({
        listing: target.id,
        aircraft_label: target.label,
        model_omvm: modelOMVM || null,
        expert_omvm: expert,
        delta_pct,
        expert_email: me?.email,
        expert_role: me?.role === "admin" ? "admin" : "appraiser",
        rationale,
        factors_tagged: factors,
        confidence,
        status: "pending",
      });
      setExpertOMVM("");
      setRationale("");
      setFactors([]);
      qc.invalidateQueries({ queryKey: ["expert-valuations", target.id] });
      qc.invalidateQueries({ queryKey: ["omvm-analytics"] });
    } catch (e) {
      setErr(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <TestTube2 className="w-4 h-4 text-[#E8A83A]" />
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Expert Intervention · Calibration Loop</p>
      </div>

      {/* Calibration status */}
      <div className="bg-[#F7F4EF] rounded-xl p-3 mb-4 grid grid-cols-3 gap-2">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Avg Δ (all experts)</p>
          <p className="text-sm font-black" style={{ color: (calibration?.avg_delta_pct || 0) >= 0 ? "#0F7A56" : "#C0392B" }}>
            {(calibration?.avg_delta_pct || 0) >= 0 ? "+" : ""}{calibration?.avg_delta_pct ?? 0}%
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Multiplier</p>
          <p className="text-sm font-black text-[#0B2D5B]">×{calibration?.multiplier ?? 1}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Sample</p>
          <p className="text-sm font-black text-[#1A1814]">{calibration?.sample ?? 0}</p>
        </div>
      </div>

      {!target ? (
        <p className="text-sm text-[#AAA49C] text-center py-4">Select a target listing to submit an expert valuation.</p>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-[#6B6560] mb-1">Model OMVM</label>
              <p className="px-3 py-2 bg-[#F7F4EF] rounded-lg text-sm font-mono text-[#1A1814]">
                {modelOMVM ? `$${modelOMVM.toLocaleString()}` : "—"}
              </p>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-[#6B6560] mb-1">Your Expert OMVM (USD)</label>
              <input
                type="number"
                value={expertOMVM}
                onChange={(e) => setExpertOMVM(e.target.value)}
                placeholder="e.g. 225000"
                className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#0B2D5B]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-wider font-bold text-[#6B6560] mb-1">Rationale</label>
              <textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                rows={2}
                placeholder="Why does your estimate differ from the model?"
                className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm resize-none focus:outline-none focus:border-[#0B2D5B]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-wider font-bold text-[#6B6560] mb-1">Factors</label>
              <div className="flex flex-wrap gap-1.5">
                {FACTORS.map((f) => (
                  <button
                    key={f}
                    onClick={() => toggleFactor(f)}
                    className={`text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-full border transition-colors ${
                      factors.includes(f)
                        ? "bg-[#0B2D5B] text-white border-[#0B2D5B]"
                        : "bg-white text-[#6B6560] border-black/10 hover:border-[#0B2D5B]"
                    }`}
                  >
                    {f.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-[#6B6560] mb-1">Confidence</label>
              <select
                value={confidence}
                onChange={(e) => setConfidence(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {err && <p className="text-xs text-[#C0392B] mt-2">{err}</p>}

          <button
            onClick={submit}
            disabled={saving || !expertOMVM}
            className="mt-4 w-full flex items-center justify-center gap-1.5 bg-[#E8A83A] hover:bg-[#f5bb4e] disabled:opacity-50 text-[#0B2D5B] text-[11px] uppercase tracking-wider font-black px-3 py-2.5 rounded-md"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Submit Expert Valuation
          </button>
        </>
      )}

      {/* Recent reviews */}
      {reviews.length > 0 && (
        <div className="mt-5 pt-4 border-t border-black/[0.06]">
          <p className="text-[10px] uppercase tracking-wider font-bold text-[#6B6560] mb-2">Recent expert reviews for this listing</p>
          <div className="space-y-2">
            {reviews.slice(0, 5).map((r) => (
              <div key={r.id} className="border border-black/[0.06] rounded-lg p-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-[#0B2D5B]" />
                    <span className="text-[11px] font-bold text-[#1A1814]">${r.expert_omvm?.toLocaleString()}</span>
                    <span className="text-[10px] font-black" style={{ color: (r.delta_pct || 0) >= 0 ? "#0F7A56" : "#C0392B" }}>
                      {(r.delta_pct || 0) >= 0 ? "+" : ""}{r.delta_pct}%
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded-full bg-black/5 text-[#6B6560]">
                      {r.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#AAA49C]">{r.expert_email}</span>
                </div>
                {r.rationale && <p className="text-[11px] text-[#6B6560] mt-1">{r.rationale}</p>}
                {r.factors_tagged?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {r.factors_tagged.map((f) => (
                      <span key={f} className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full bg-[#F7F4EF] text-[#6B6560]">
                        {f.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}