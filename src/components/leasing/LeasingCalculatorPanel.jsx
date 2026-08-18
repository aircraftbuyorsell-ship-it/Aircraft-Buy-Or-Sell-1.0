import { useState, useMemo } from "react";
import { Calculator, TrendingUp, DollarSign, Percent, Calendar, Info, ShieldCheck, Gauge, FileText } from "lucide-react";
import { Link } from "react-router-dom";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: "#f5c242" }}>{children}</p>;
}

function Slider({ label, value, onChange, min, max, step, hint, suffix = "", format }) {
  const display = format ? format(value) : value.toLocaleString();
  return (
    <div>
      <div className="flex justify-between items-baseline">
        <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.60)" }}>{label}</label>
        <span className="text-sm font-black" style={{ color: "rgba(255,255,255,0.90)" }}>{display}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} className="w-full mt-1 accent-[#f5c242]" />
      {hint && <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: "rgba(255,255,255,0.35)" }}><Info className="w-2.5 h-2.5" /> {hint}</p>}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent = "#4e8ef7" }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
      </div>
      <p className="text-xl font-black" style={{ color: "rgba(255,255,255,0.90)" }}>{value}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.60)" }}>{sub}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-2.5 pb-3" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#4e8ef7" }}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-[13px] font-black uppercase tracking-tight" style={{ color: "rgba(255,255,255,0.90)" }}>{title}</p>
        {desc && <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.60)" }}>{desc}</p>}
      </div>
    </div>
  );
}

function Row({ label, value, sub, bold, accent, muted }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs" style={{ color: muted ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.65)" }}>{label}</p>
        {sub && <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</p>}
      </div>
      <p className={`font-${bold ? "black" : "semibold"} text-sm`} style={{ color: accent || "rgba(255,255,255,0.90)" }}>{value}</p>
    </div>
  );
}

const fmt = (n) => (n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmtMoney = (n) => `$${fmt(n)}`;

/**
 * Reusable leasing calculator body — inputs, results, amortization, cross-links.
 * Used both by the standalone LeasingCalculator page and the inline dashboard modal.
 */
export default function LeasingCalculatorPanel({
  initialPrice,
  make = "",
  model = "",
  year = "",
  registration = "",
}) {
  const [aircraftPrice, setAircraftPrice] = useState(() => {
    const p = parseFloat(initialPrice);
    return p > 0 ? p : 850000;
  });
  const [downPaymentPct, setDownPaymentPct] = useState(15);
  const [interestRate, setInterestRate] = useState(7.5);
  const [termMonths, setTermMonths] = useState(60);
  const [residualPct, setResidualPct] = useState(45);
  const [salesTaxPct, setSalesTaxPct] = useState(0);

  const aircraftLabel = [year, make, model].filter(Boolean).join(" ") || "Aircraft";

  const calc = useMemo(() => {
    const downPayment = aircraftPrice * (downPaymentPct / 100);
    const financedAmount = aircraftPrice - downPayment;
    const residualValue = aircraftPrice * (residualPct / 100);
    const monthlyRate = interestRate / 100 / 12;
    const depreciationFinanced = financedAmount - residualValue;
    const depreciationMonthly = depreciationFinanced / termMonths;
    const avgBalance = (financedAmount + residualValue) / 2;
    const interestMonthly = avgBalance * monthlyRate;
    const baseMonthly = depreciationMonthly + interestMonthly;
    const taxMonthly = baseMonthly * (salesTaxPct / 100);
    const totalMonthly = baseMonthly + taxMonthly;
    const totalPayments = totalMonthly * termMonths;
    const totalCost = totalPayments + downPayment + residualValue;
    const totalInterest = totalPayments - depreciationFinanced;

    let balance = financedAmount;
    const schedule = [];
    for (let m = 1; m <= Math.min(termMonths, 12); m++) {
      const interest = balance * monthlyRate;
      const principal = depreciationMonthly;
      balance -= principal;
      schedule.push({ month: m, principal, interest, balance: Math.max(balance, residualValue) });
    }

    return {
      downPayment, financedAmount, residualValue,
      depreciationMonthly, interestMonthly, baseMonthly, taxMonthly, totalMonthly,
      totalPayments, totalCost, totalInterest, schedule,
    };
  }, [aircraftPrice, downPaymentPct, interestRate, termMonths, residualPct, salesTaxPct]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* ── Inputs ── */}
      <div className="lg:col-span-2 rounded-2xl p-5 space-y-5" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
        <SectionHeader icon={Calculator} title="Lease Parameters" desc="Adjust to model your financing scenario" />

        <div>
          <GoldLabel>Aircraft Price</GoldLabel>
          <div className="flex items-center gap-2 mt-1.5">
            <DollarSign className="w-4 h-4" style={{ color: "rgba(255,255,255,0.40)" }} />
            <input
              type="number"
              value={aircraftPrice}
              onChange={e => setAircraftPrice(Math.max(0, +e.target.value))}
              className="flex-1 bg-transparent text-lg font-black outline-none"
              style={{ color: "rgba(255,255,255,0.90)" }}
            />
          </div>
          <input type="range" min={50000} max={50000000} step={25000} value={aircraftPrice} onChange={e => setAircraftPrice(+e.target.value)} className="w-full mt-2 accent-[#f5c242]" />
        </div>

        <Slider label="Down Payment" value={downPaymentPct} onChange={setDownPaymentPct} min={0} max={50} step={1} suffix="%" hint={`${fmtMoney(calc.downPayment)} upfront`} />
        <Slider label="Interest Rate (APR)" value={interestRate} onChange={setInterestRate} min={0} max={20} step={0.1} suffix="%" format={(v) => v.toFixed(1)} />
        <Slider label="Lease Term" value={termMonths} onChange={setTermMonths} min={12} max={120} step={6} suffix=" mo" hint={`${(termMonths / 12).toFixed(1)} years`} />
        <Slider label="Residual Value" value={residualPct} onChange={setResidualPct} min={0} max={80} step={5} suffix="%" hint={`Balloon: ${fmtMoney(calc.residualValue)} at end`} />
        <Slider label="Sales Tax" value={salesTaxPct} onChange={setSalesTaxPct} min={0} max={10} step={0.5} suffix="%" format={(v) => v.toFixed(1)} />
      </div>

      {/* ── Results ── */}
      <div className="lg:col-span-3 space-y-5">
        {/* Headline monthly payment */}
        <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, rgba(245,194,66,0.10), rgba(78,142,247,0.06))", border: "0.5px solid rgba(245,194,66,0.25)" }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4" style={{ color: "#f5c242" }} />
            <GoldLabel>Estimated Monthly Payment</GoldLabel>
          </div>
          <p className="text-4xl sm:text-5xl font-black" style={{ color: "#f5c242" }}>
            {fmtMoney(calc.totalMonthly)}
            <span className="text-base font-semibold ml-1" style={{ color: "rgba(255,255,255,0.50)" }}>/mo</span>
          </p>
          <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
            <div>
              <p style={{ color: "rgba(255,255,255,0.45)" }}>Depreciation</p>
              <p className="font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>{fmtMoney(calc.depreciationMonthly)}</p>
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.45)" }}>Interest</p>
              <p className="font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>{fmtMoney(calc.interestMonthly)}</p>
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.45)" }}>Tax</p>
              <p className="font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>{fmtMoney(calc.taxMonthly)}</p>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Down Payment" value={fmtMoney(calc.downPayment)} icon={DollarSign} accent="#f5c242" />
          <StatCard label="Financed" value={fmtMoney(calc.financedAmount)} icon={Calculator} accent="#4e8ef7" />
          <StatCard label="Residual" value={fmtMoney(calc.residualValue)} sub="End of term" icon={Gauge} accent="#22c55e" />
          <StatCard label="Total Interest" value={fmtMoney(calc.totalInterest)} icon={Percent} accent="#ef4444" />
        </div>

        {/* Total cost summary */}
        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
          <SectionHeader icon={FileText} title="Total Cost Summary" />
          <div className="space-y-2.5 mt-4">
            <Row label="Down Payment" value={fmtMoney(calc.downPayment)} />
            <Row label={`Monthly Payments (${termMonths} mo)`} value={fmtMoney(calc.totalPayments)} />
            <Row label="Residual / Buyout" value={fmtMoney(calc.residualValue)} />
            <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.10)", margin: "6px 0" }} />
            <Row label="Total Cost of Lease" value={fmtMoney(calc.totalCost)} bold accent="#f5c242" />
            <Row label="Effective $/Flight Hour" value={fmtMoney(calc.totalMonthly / 30)} sub="Assuming 30 hrs/mo" muted />
          </div>
        </div>

        {/* Amortization preview */}
        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
          <SectionHeader icon={Calendar} title="First 12 Months" desc="Principal vs interest breakdown" />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: "rgba(255,255,255,0.40)" }}>
                  <th className="text-left font-semibold pb-2">Month</th>
                  <th className="text-right font-semibold pb-2">Principal</th>
                  <th className="text-right font-semibold pb-2">Interest</th>
                  <th className="text-right font-semibold pb-2">Balance</th>
                </tr>
              </thead>
              <tbody>
                {calc.schedule.map((row) => (
                  <tr key={row.month} style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
                    <td className="py-2 font-bold" style={{ color: "rgba(255,255,255,0.70)" }}>{row.month}</td>
                    <td className="py-2 text-right" style={{ color: "#22c55e" }}>{fmtMoney(row.principal)}</td>
                    <td className="py-2 text-right" style={{ color: "#ef4444" }}>{fmtMoney(row.interest)}</td>
                    <td className="py-2 text-right font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{fmtMoney(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cross-links */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to={`/valuation-studio?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}&asking_price=${aircraftPrice}`}
            className="rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wider transition-all hover:scale-[1.02]"
            style={{ background: "rgba(168,85,247,0.10)", border: "1px solid rgba(168,85,247,0.25)", color: "#a855f7" }}>
            <TrendingUp className="w-4 h-4" /> OMVM Estimate
          </Link>
          <Link
            to={`/opex-calculator?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`}
            className="rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wider transition-all hover:scale-[1.02]"
            style={{ background: "rgba(249,115,22,0.10)", border: "1px solid rgba(249,115,22,0.25)", color: "#f97316" }}>
            <Gauge className="w-4 h-4" /> Opex Calculator
          </Link>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
          <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "rgba(255,255,255,0.35)" }} />
          <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.40)" }}>
            Estimates only. Actual lease terms depend on credit, aircraft condition, lender, and jurisdiction. Consult an aviation finance specialist for binding quotes.
          </p>
        </div>
      </div>
    </div>
  );
}