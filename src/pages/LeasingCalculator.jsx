import { Plane } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAutoTrack } from "@/lib/useBehavior";
import LeasingCalculatorPanel from "@/components/leasing/LeasingCalculatorPanel";
import CalculatorPricingBadge from "@/components/calculators/CalculatorPricingBadge";

const readParam = (key) => new URLSearchParams(window.location.search).get(key) || "";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: "#f5c242" }}>{children}</p>;
}

export default function LeasingCalculator() {
  useAutoTrack("leasing_calculator");

  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const make = readParam("make");
  const model = readParam("model");
  const year = readParam("year");
  const registration = readParam("registration");
  const askingPrice = readParam("asking_price");
  const aircraftLabel = [year, make, model].filter(Boolean).join(" ") || "Aircraft";

  return (
    <div className="min-h-screen pb-16" style={{ background: "transparent", color: "#fff", fontFamily: "Inter, -apple-system, sans-serif" }}>
      {/* Hero */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-6 max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <GoldLabel>ABOS Aviation Finance · Leasing</GoldLabel>
            <h1 className="text-2xl sm:text-3xl font-black mt-1" style={{ color: "rgba(255,255,255,0.95)" }}>
              Aircraft Leasing Calculator
            </h1>
            <p className="text-sm mt-1.5 max-w-2xl" style={{ color: "rgba(255,255,255,0.55)" }}>
              Estimate monthly lease payments, residual value, and total cost of ownership for any aircraft. Adjust down payment, rate, and term to model your deal.
            </p>
          </div>
          <div className="shrink-0 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: "rgba(255,255,255,0.40)" }}>Pricing</p>
            <CalculatorPricingBadge featureId="leasing_calculator" />
          </div>
        </div>
        {registration && (
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full" style={{ background: "rgba(78,142,247,0.10)", border: "0.5px solid rgba(78,142,247,0.25)" }}>
            <Plane className="w-3.5 h-3.5" style={{ color: "#4e8ef7" }} />
            <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>{aircraftLabel}</span>
            <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.50)" }}>{registration}</span>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <LeasingCalculatorPanel
          initialPrice={askingPrice}
          make={make}
          model={model}
          year={year}
          registration={registration}
        />
      </div>
    </div>
  );
}