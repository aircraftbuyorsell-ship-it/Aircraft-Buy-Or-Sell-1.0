import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Users, GraduationCap, Plane, Loader2, Sparkles, TrendingUp,
  DollarSign, Clock, ArrowRightLeft, CheckCircle2, AlertTriangle
} from "lucide-react";

const TABS = [
  { id: "fractional", label: "Fractional Ownership", icon: Users, skill: "abos.skill.fractional_ownership.v1" },
  { id: "timebuilding", label: "Timebuilding Buy", icon: GraduationCap, skill: "abos.skill.timebuilding_buy.v1" },
  { id: "fleet", label: "Fleet Change (JIT)", icon: ArrowRightLeft, skill: "abos.skill.fleet_change.v1" },
];

function Field({ label, value, onChange, placeholder, type = "number" }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider font-semibold text-white/60 block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(type === "number" ? +e.target.value : e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm font-bold"
        style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: "white" }}
      />
    </div>
  );
}

function StatCard({ label, value, sub, color = "#f5c242", icon = null }) {
  const Icon = icon;
  return (
    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon className="w-3 h-3" style={{ color }} />}
        <p className="text-[9px] uppercase tracking-wider text-white/40">{label}</p>
      </div>
      <p className="text-sm font-black text-white/90">{value}</p>
      {sub && <p className="text-[10px] text-white/40 mt-0.5">{sub}</p>}
    </div>
  );
}

function MoneyRow({ label, amount, positive }) {
  const isNum = typeof amount === "number";
  const color = !isNum ? "rgba(255,255,255,0.60)" : positive ? "#5dcaa5" : "rgba(255,255,255,0.90)";
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
      <span className="text-xs text-white/60">{label}</span>
      <span className="text-sm font-bold" style={{ color }}>
        {isNum ? `$${Math.round(amount).toLocaleString()}` : amount}
      </span>
    </div>
  );
}

/* ── Fractional Ownership Panel ── */
function FractionalPanel() {
  const [inputs, setInputs] = useState({
    aircraft_price: 350000, num_owners: 4, annual_hours_per_owner: 100,
    down_payment_pct: 20, financing_rate_pct: 6, loan_term_years: 10,
    fuel_burn_gph: 10, fuel_price: 2.5, annual_maintenance: 8000,
    annual_insurance: 4000, annual_hangar: 6000, resale_value_pct: 60,
    ownership_years: 5, rental_rate_hourly: 180,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await base44.functions.invoke("invokeSkill", { skill_id: "abos.skill.fractional_ownership.v1", inputs });
      setResult(res.data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [inputs]);

  const r = result?.result;
  const set = (k) => (v) => setInputs(p => ({ ...p, [k]: v }));

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="rounded-2xl p-5 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Aircraft Price $" value={inputs.aircraft_price} onChange={set("aircraft_price")} />
          <Field label="Number of Owners" value={inputs.num_owners} onChange={set("num_owners")} />
          <Field label="Hours / Owner / Yr" value={inputs.annual_hours_per_owner} onChange={set("annual_hours_per_owner")} />
          <Field label="Ownership Years" value={inputs.ownership_years} onChange={set("ownership_years")} />
          <Field label="Down Payment %" value={inputs.down_payment_pct} onChange={set("down_payment_pct")} />
          <Field label="Financing Rate %" value={inputs.financing_rate_pct} onChange={set("financing_rate_pct")} />
          <Field label="Loan Term (yrs)" value={inputs.loan_term_years} onChange={set("loan_term_years")} />
          <Field label="Resale Value %" value={inputs.resale_value_pct} onChange={set("resale_value_pct")} />
          <Field label="Fuel Burn GPH" value={inputs.fuel_burn_gph} onChange={set("fuel_burn_gph")} />
          <Field label="Fuel $/gal" value={inputs.fuel_price} onChange={set("fuel_price")} />
          <Field label="Maintenance $/yr" value={inputs.annual_maintenance} onChange={set("annual_maintenance")} />
          <Field label="Insurance $/yr" value={inputs.annual_insurance} onChange={set("annual_insurance")} />
          <Field label="Hangar $/yr" value={inputs.annual_hangar} onChange={set("annual_hangar")} />
          <Field label="Rental Rate $/hr" value={inputs.rental_rate_hourly} onChange={set("rental_rate_hourly")} />
        </div>
        <button onClick={run} disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
          style={{ background: "#f5c242", color: "#04060a" }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
          {loading ? "Calculating..." : "Calculate Fractional Cost"}
        </button>
      </div>

      <div>
        {error && <div className="rounded-xl p-4 flex items-start gap-2 mb-3" style={{ background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.25)" }}>
          <AlertTriangle className="w-4 h-4 text-[#e24b4a] shrink-0 mt-0.5" /><p className="text-sm text-[#e24b4a]">{error}</p>
        </div>}
        {r && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Share Purchase" value={`$${r.share_purchase.toLocaleString()}`} sub={`${r.share_pct}% of $${inputs.aircraft_price.toLocaleString()}`} icon={DollarSign} />
              <StatCard label="Monthly Financing" value={`$${r.monthly_financing.toLocaleString()}`} sub={`${r.ownership_years} yr term`} color="#4e8ef7" icon={Clock} />
              <StatCard label="Net Hourly Cost" value={`$${r.net_hourly}/hr`} sub="after resale credit" color="#5dcaa5" icon={TrendingUp} />
              <StatCard label="Total Net Cost" value={`$${r.net_cost.toLocaleString()}`} sub={`over ${r.total_hours} hrs`} color="#a855f7" icon={DollarSign} />
            </div>
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
              <MoneyRow label="Share purchase price" amount={r.share_purchase} />
              <MoneyRow label="Down payment" amount={r.down_payment} />
              <MoneyRow label="Financed amount" amount={r.financed_amount} />
              <MoneyRow label="Annual financing" amount={r.annual_financing} />
              <MoneyRow label="Share of fixed costs / yr" amount={r.share_fixed_annual} />
              <MoneyRow label="Variable (fuel) / yr" amount={r.annual_variable} />
              <MoneyRow label="Total annual per owner" amount={r.total_annual_per_owner} />
              <MoneyRow label="Total cost over period" amount={r.total_cost_over_period} />
              <MoneyRow label="Resale credit (share)" amount={-r.resale_share} positive />
              <div className="flex items-center justify-between py-2 mt-1">
                <span className="text-sm font-bold text-white/80">Net cost (after resale)</span>
                <span className="text-lg font-black text-[#f5c242]">${r.net_cost.toLocaleString()}</span>
              </div>
            </div>
            {r.rental_comparison != null && (
              <div className="rounded-xl p-4" style={{ background: r.savings_vs_rental > 0 ? "rgba(93,202,165,0.08)" : "rgba(226,75,74,0.08)", border: `0.5px solid ${r.savings_vs_rental > 0 ? "rgba(93,202,165,0.25)" : "rgba(226,75,74,0.25)"}` }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white/80">vs Rental (${inputs.rental_rate_hourly}/hr)</span>
                  <span className="text-lg font-black" style={{ color: r.savings_vs_rental > 0 ? "#5dcaa5" : "#e24b4a" }}>
                    {r.savings_vs_rental > 0 ? "Save" : "Cost"} ${Math.abs(r.savings_vs_rental).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: r.savings_vs_rental > 0 ? "#5dcaa5" : "#e24b4a" }}>{r.recommendation}</p>
              </div>
            )}
          </div>
        )}
        {!r && !error && (
          <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
            <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/40">Enter aircraft details and calculate fractional ownership costs</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Timebuilding Panel ── */
function TimebuildingPanel() {
  const [inputs, setInputs] = useState({
    total_hours_needed: 250, annual_hours: 150, aircraft_price: 120000,
    fractional_shares: 2, rental_rate_hourly: 180, fuel_burn_gph: 10,
    fuel_price: 2.5, annual_fixed: 18000, resale_value_pct: 65,
    financing_rate_pct: 6, down_payment_pct: 20, loan_term_years: 10,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await base44.functions.invoke("invokeSkill", { skill_id: "abos.skill.timebuilding_buy.v1", inputs });
      setResult(res.data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [inputs]);

  const r = result?.result;
  const set = (k) => (v) => setInputs(p => ({ ...p, [k]: v }));

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="rounded-2xl p-5 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Total Hours Needed" value={inputs.total_hours_needed} onChange={set("total_hours_needed")} />
          <Field label="Annual Hours" value={inputs.annual_hours} onChange={set("annual_hours")} />
          <Field label="Aircraft Price $" value={inputs.aircraft_price} onChange={set("aircraft_price")} />
          <Field label="Fractional Shares" value={inputs.fractional_shares} onChange={set("fractional_shares")} />
          <Field label="Rental Rate $/hr" value={inputs.rental_rate_hourly} onChange={set("rental_rate_hourly")} />
          <Field label="Fuel Burn GPH" value={inputs.fuel_burn_gph} onChange={set("fuel_burn_gph")} />
          <Field label="Fuel $/gal" value={inputs.fuel_price} onChange={set("fuel_price")} />
          <Field label="Annual Fixed (whole)" value={inputs.annual_fixed} onChange={set("annual_fixed")} />
          <Field label="Resale Value %" value={inputs.resale_value_pct} onChange={set("resale_value_pct")} />
          <Field label="Financing Rate %" value={inputs.financing_rate_pct} onChange={set("financing_rate_pct")} />
          <Field label="Down Payment %" value={inputs.down_payment_pct} onChange={set("down_payment_pct")} />
          <Field label="Loan Term (yrs)" value={inputs.loan_term_years} onChange={set("loan_term_years")} />
        </div>
        <button onClick={run} disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
          style={{ background: "#f5c242", color: "#04060a" }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
          {loading ? "Calculating..." : "Compare Buy vs Rent"}
        </button>
      </div>

      <div>
        {error && <div className="rounded-xl p-4 flex items-start gap-2 mb-3" style={{ background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.25)" }}>
          <AlertTriangle className="w-4 h-4 text-[#e24b4a] shrink-0 mt-0.5" /><p className="text-sm text-[#e24b4a]">{error}</p>
        </div>}
        {r && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Years to Build" value={`${r.years_to_build}`} sub={`${r.total_hours_needed} hrs`} icon={Clock} />
              <StatCard label="Savings vs Rent" value={`$${r.savings_vs_rent.toLocaleString()}`} color="#5dcaa5" icon={TrendingUp} />
              <StatCard label="Break-even" value={`${r.break_even_hours_whole ?? "N/A"}h`} sub="whole ownership" color="#a855f7" icon={Clock} />
            </div>
            <div className="space-y-2">
              <div className="rounded-xl p-4" style={{ background: r.recommendation === "Buy Whole" ? "rgba(245,194,66,0.08)" : "rgba(255,255,255,0.03)", border: `0.5px solid ${r.recommendation === "Buy Whole" ? "rgba(245,194,66,0.30)" : "rgba(255,255,255,0.08)"}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {r.recommendation === "Buy Whole" && <CheckCircle2 className="w-4 h-4 text-[#f5c242]" />}
                    <span className="text-sm font-black text-white/90">Buy Whole</span>
                  </div>
                  <span className="text-lg font-black text-[#f5c242]">${r.buy_whole.net_cost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>${r.buy_whole.net_hourly}/hr net</span>
                  <span>Purchase: ${r.buy_whole.share_purchase.toLocaleString()}</span>
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ background: r.recommendation.startsWith("Buy Fractional") ? "rgba(245,194,66,0.08)" : "rgba(255,255,255,0.03)", border: `0.5px solid ${r.recommendation.startsWith("Buy Fractional") ? "rgba(245,194,66,0.30)" : "rgba(255,255,255,0.08)"}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {r.recommendation.startsWith("Buy Fractional") && <CheckCircle2 className="w-4 h-4 text-[#f5c242]" />}
                    <span className="text-sm font-black text-white/90">Buy 1/{r.buy_fractional.shares} Share</span>
                  </div>
                  <span className="text-lg font-black text-[#f5c242]">${r.buy_fractional.net_cost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>${r.buy_fractional.net_hourly}/hr net</span>
                  <span>Purchase: ${r.buy_fractional.share_purchase.toLocaleString()}</span>
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ background: r.recommendation === "Rent" ? "rgba(245,194,66,0.08)" : "rgba(255,255,255,0.03)", border: `0.5px solid ${r.recommendation === "Rent" ? "rgba(245,194,66,0.30)" : "rgba(255,255,255,0.08)"}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {r.recommendation === "Rent" && <CheckCircle2 className="w-4 h-4 text-[#f5c242]" />}
                    <span className="text-sm font-black text-white/90">Rent</span>
                  </div>
                  <span className="text-lg font-black text-[#f5c242]">${r.rent.total_cost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>${r.rent.hourly_rate}/hr</span>
                  <span>No resale risk</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {!r && !error && (
          <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
            <GraduationCap className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/40">Compare buying (whole or fractional) vs renting for hour-building</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Fleet Change Panel ── */
function FleetPanel() {
  const [inputs, setInputs] = useState({
    aircraft_price: 350000, lease_pausal_monthly: 3500, jit_service_fee_monthly: 800,
    tbo_hours: 2000, annual_hours_per_aircraft: 600, resale_value_at_tbo_pct: 55,
    num_aircraft: 3, fuel_burn_gph: 10, fuel_price: 2.5,
    annual_maintenance_per_aircraft: 12000, annual_insurance_per_aircraft: 8000,
    rental_rate_charged: 220, engine_overhaul_cost: 30000,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await base44.functions.invoke("invokeSkill", { skill_id: "abos.skill.fleet_change.v1", inputs });
      setResult(res.data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [inputs]);

  const r = result?.result;
  const set = (k) => (v) => setInputs(p => ({ ...p, [k]: v }));

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="rounded-2xl p-5 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Aircraft Price $" value={inputs.aircraft_price} onChange={set("aircraft_price")} />
          <Field label="Number of Aircraft" value={inputs.num_aircraft} onChange={set("num_aircraft")} />
          <Field label="Lease Paušal $/mo" value={inputs.lease_pausal_monthly} onChange={set("lease_pausal_monthly")} />
          <Field label="JIT Service Fee $/mo" value={inputs.jit_service_fee_monthly} onChange={set("jit_service_fee_monthly")} />
          <Field label="TBO Hours" value={inputs.tbo_hours} onChange={set("tbo_hours")} />
          <Field label="Hours / Aircraft / Yr" value={inputs.annual_hours_per_aircraft} onChange={set("annual_hours_per_aircraft")} />
          <Field label="Resale at TBO %" value={inputs.resale_value_at_tbo_pct} onChange={set("resale_value_at_tbo_pct")} />
          <Field label="Engine Overhaul $" value={inputs.engine_overhaul_cost} onChange={set("engine_overhaul_cost")} />
          <Field label="Fuel Burn GPH" value={inputs.fuel_burn_gph} onChange={set("fuel_burn_gph")} />
          <Field label="Fuel $/gal" value={inputs.fuel_price} onChange={set("fuel_price")} />
          <Field label="Maintenance $/ac/yr" value={inputs.annual_maintenance_per_aircraft} onChange={set("annual_maintenance_per_aircraft")} />
          <Field label="Insurance $/ac/yr" value={inputs.annual_insurance_per_aircraft} onChange={set("annual_insurance_per_aircraft")} />
          <Field label="Rate Charged $/hr" value={inputs.rental_rate_charged} onChange={set("rental_rate_charged")} />
        </div>
        <button onClick={run} disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
          style={{ background: "#f5c242", color: "#04060a" }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
          {loading ? "Calculating..." : "Calculate Fleet JIT Model"}
        </button>
      </div>

      <div>
        {error && <div className="rounded-xl p-4 flex items-start gap-2 mb-3" style={{ background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.25)" }}>
          <AlertTriangle className="w-4 h-4 text-[#e24b4a] shrink-0 mt-0.5" /><p className="text-sm text-[#e24b4a]">{error}</p>
        </div>}
        {r && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Rotation Interval" value={`${r.jit_model.rotation_interval_years} yrs`} sub={`${r.fleet.aircraft_replaced_per_year} replaced/yr`} icon={ArrowRightLeft} />
              <StatCard label="JIT Net Cost / hr" value={`$${r.jit_model.cost_per_hour_net}`} sub="after resale credit" color="#5dcaa5" icon={TrendingUp} />
              <StatCard label="Annual Revenue" value={`$${r.jit_model.annual_revenue.toLocaleString()}`} sub={`${r.fleet.total_annual_hours} hrs billed`} color="#4e8ef7" icon={DollarSign} />
              <StatCard label="JIT Profit Margin" value={`${r.jit_model.margin_pct}%`} sub={`$${r.jit_model.profit.toLocaleString()}/yr`} color="#a855f7" icon={TrendingUp} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4" style={{ background: "rgba(93,202,165,0.06)", border: "0.5px solid rgba(93,202,165,0.20)" }}>
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#5dcaa5] mb-2">JIT Fleet Rotation</p>
                <MoneyRow label="Paušal / yr" amount={r.jit_model.total_annual_pausal} />
                <MoneyRow label="Fuel / yr" amount={r.jit_model.total_annual_fuel} />
                <MoneyRow label="Maintenance" amount={r.jit_model.total_annual_maintenance} />
                <MoneyRow label="Insurance" amount={r.jit_model.total_annual_insurance} />
                <MoneyRow label="Resale credit" amount={-r.jit_model.annualized_resale_credit} positive />
                <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/10">
                  <span className="text-sm font-bold text-white/80">Net / yr</span>
                  <span className="text-sm font-black text-[#5dcaa5]">${r.jit_model.net_annual_cost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-white/50">Net $/hr</span>
                  <span className="text-sm font-bold text-[#5dcaa5]">${r.jit_model.cost_per_hour_net}/hr</span>
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                <p className="text-[10px] uppercase tracking-wider font-bold text-white/60 mb-2">Traditional Own</p>
                <MoneyRow label="Aircraft cost / yr" amount={r.traditional_model.annualized_aircraft_cost} />
                <MoneyRow label="Overhaul / yr" amount={r.traditional_model.annualized_overhaul_cost} />
                <MoneyRow label="Resale credit" amount={-r.jit_model.annualized_resale_credit} positive />
                <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/10">
                  <span className="text-sm font-bold text-white/80">Net / yr</span>
                  <span className="text-sm font-black text-white/90">${r.traditional_model.net_annual_cost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-white/50">Net $/hr</span>
                  <span className="text-sm font-bold text-white/90">${r.traditional_model.cost_per_hour_net}/hr</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-white/50">Margin</span>
                  <span className="text-sm font-bold text-white/70">{r.traditional_model.margin_pct}%</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ background: r.comparison.savings_per_hour > 0 ? "rgba(93,202,165,0.08)" : "rgba(226,75,74,0.08)", border: `0.5px solid ${r.comparison.savings_per_hour > 0 ? "rgba(93,202,165,0.25)" : "rgba(226,75,74,0.25)"}` }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white/80">JIT vs Traditional</span>
                <span className="text-lg font-black" style={{ color: r.comparison.savings_per_hour > 0 ? "#5dcaa5" : "#e24b4a" }}>
                  {r.comparison.savings_per_hour > 0 ? "Save" : "Extra"} ${Math.abs(r.comparison.annual_savings).toLocaleString()}/yr
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: r.comparison.savings_per_hour > 0 ? "#5dcaa5" : "#e24b4a" }}>{r.comparison.jit_advantage}</p>
            </div>
          </div>
        )}
        {!r && !error && (
          <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
            <ArrowRightLeft className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/40">Configure your fleet and calculate JIT rotation costs</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FractionalCalculators() {
  const [activeTab, setActiveTab] = useState("fractional");

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: "#f5c242" }}>Aviation Investment OS · Batch D Skills</p>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-1 uppercase flex items-center gap-2" style={{ color: "rgba(255,255,255,0.90)" }}>
          <Users className="w-7 h-7 text-[#f5c242]" /> Fractional & Fleet Calculators
        </h1>
        <p className="text-sm mt-1 max-w-3xl" style={{ color: "rgba(255,255,255,0.60)" }}>
          Ownership economics: fractional shares, timebuilding buy-vs-rent, and just-in-time flight school fleet rotation.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer"
                style={{
                  background: active ? "#f5c242" : "rgba(255,255,255,0.04)",
                  color: active ? "#04060a" : "rgba(255,255,255,0.60)",
                  border: `0.5px solid ${active ? "#f5c242" : "rgba(255,255,255,0.10)"}`,
                }}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          {activeTab === "fractional" && <FractionalPanel />}
          {activeTab === "timebuilding" && <TimebuildingPanel />}
          {activeTab === "fleet" && <FleetPanel />}
        </div>
      </div>
    </div>
  );
}