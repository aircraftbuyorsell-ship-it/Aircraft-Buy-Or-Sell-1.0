import { Check, Layers } from "lucide-react";
import { MARKETPLACE_PLANS, formatEur } from "@/lib/plans";
import PlanCheckoutButton from "./PlanCheckoutButton";

export default function MarketplacePlansSection() {
  return (
    <section>
      <div className="text-center mb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Marketplaces &amp; Dealers</p>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-2">Volume-based pricing</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Priced by active listing volume, billed monthly.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {MARKETPLACE_PLANS.map((plan) => (
          <div
            key={plan.plan_type}
            className={`glass-card p-6 flex flex-col ${plan.popular ? "border-primary" : ""}`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground">{plan.label}</h3>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">
              {formatEur(plan.price_eur)}
              <span className="text-sm font-normal text-muted-foreground"> / {plan.interval}</span>
            </p>
            <p className="mt-1 text-xs font-medium text-primary">{plan.volume}</p>
            <ul className="mt-5 space-y-2 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <PlanCheckoutButton
                planType={plan.plan_type}
                label="Subscribe"
                variant={plan.popular ? "default" : "outline"}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}