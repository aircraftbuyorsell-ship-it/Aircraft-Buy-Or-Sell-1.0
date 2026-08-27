import ProPlansSection from "@/components/plans/ProPlansSection";
import MarketplacePlansSection from "@/components/plans/MarketplacePlansSection";

export default function Plans() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-12 space-y-14">
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            ABOS Plans &amp; Pricing
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
            Free FAA registry checks and basic value estimates for everyone. Subscribe to unlock the full
            aviation intelligence suite — in the app and from your AI assistant.
          </p>
        </header>

        <ProPlansSection />
        <MarketplacePlansSection />

        <p className="text-center text-xs text-muted-foreground">
          Prices in EUR excluding VAT. Payments processed securely by Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );
}