import { Check } from "lucide-react";
import { PRO_PLANS, PRO_FEATURES, formatEur } from "@/lib/plans";
import PlanCheckoutButton from "./PlanCheckoutButton";

export default function ProPlansSection() {
  return (
    <section>
      <div className="text-center mb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Buyers &amp; Sellers</p>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-2">One plan. Everything unlocked.</h2>
        <p className="text-sm text-muted-foreground mt-2">
          The same ABOS Pro plan whether you are buying or selling an aircraft.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PRO_PLANS.map((plan) => (
          <div
            key={plan.plan_type}
            className={`glass-card p-6 flex flex-col ${plan.popular ? "border-primary" : ""}`}
          >
            {plan.popular && (
              <span className="self-start mb-3 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                Best value
              </span>
            )}
            <h3 className="text-base font-semibold text-foreground">{plan.label}</h3>
            <p className="mt-3 text-3xl font-bold text-foreground">
              {formatEur(plan.price_eur)}
              <span className="text-sm font-normal text-muted-foreground"> / {plan.interval}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{plan.billing_note}</p>
            <ul className="mt-5 space-y-2 flex-1">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <PlanCheckoutButton
                planType={plan.plan_type}
                label={`Subscribe — ${formatEur(plan.price_eur)}/${plan.interval}`}
                variant={plan.popular ? "default" : "outline"}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}