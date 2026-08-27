import { Link } from "react-router-dom";
import { Sparkles, CheckCircle2, ArrowRight, Zap } from "lucide-react";
import { PRODUCT_CATALOG, formatPrice } from "@/lib/products";

export default function MonetizationCTA({ user }) {
  const isRegistered = !!user?.email;

  const byKey = (key) => PRODUCT_CATALOG.find((p) => p.key === key);

  const featuredTools = [
    byKey("ATI_SCORE"),
    byKey("ATI_BASIC_REPORT"),
    byKey("ATI_PRO"),
    byKey("ATI_PRO_TAX"),
  ].filter(Boolean).map((p) => ({
    label: p.name,
    desc: p.tagline,
    free: !!p.free,
    price: p.price_usd ?? p.price_eur,
    currency: p.currency,
  }));

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 md:px-8 py-6">
      <div
        className="rounded-3xl p-6 md:p-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(245,194,66,0.08) 0%, rgba(78,142,247,0.06) 50%, rgba(168,85,247,0.05) 100%)",
          border: "0.5px solid rgba(245,194,66,0.20)",
        }}
      >
        <div
          className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(245,194,66,0.10) 0%, transparent 70%)" }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-gold-official" />
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-gold-official">
              Unlock Premium Intelligence
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-black tracking-tight mb-2 text-foreground">
            {isRegistered ? "Your Aviation Intelligence Toolkit" : "Aircraft Intelligence, Priced Per Aircraft"}
          </h2>

          <p className="text-sm mb-5 max-w-2xl text-muted-foreground">
            {isRegistered
              ? "Start with a free ATI Score, then buy the report or brief you need per aircraft."
              : "Register free to get started. Pay per aircraft — no subscription required."}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {featuredTools.map((tool, i) => (
              <div key={i} className="rounded-xl p-3 flex flex-col bg-card border border-border">
                <p className="text-[10px] uppercase tracking-wider font-bold mb-1 text-muted-foreground">
                  {tool.label}
                </p>
                {tool.free ? (
                  <p className="text-lg font-black text-emerald-600 dark:text-[#5dcaa5]">Free</p>
                ) : (
                  <span className="text-lg font-black text-foreground">
                    {formatPrice(tool.price, tool.currency)}
                  </span>
                )}
                <p className="text-[10px] mt-1 line-clamp-2 text-muted-foreground">
                  {tool.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {!isRegistered ? (
              <Link to="/pricing"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-opacity hover:opacity-90"
                style={{ background: "#f5c242", color: "#04060a" }}>
                Register Free <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link to="/pricing"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-opacity hover:opacity-90"
                style={{ background: "#f5c242", color: "#04060a" }}>
                <Zap className="w-4 h-4" /> Get an ATI Report
              </Link>
            )}
            <Link to="/pricing"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 border border-border text-muted-foreground hover:text-foreground">
              View All Pricing
            </Link>
          </div>

          <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-border">
            {["Free ATI Score", "FAA + EASA verified", "Pay per aircraft", "No subscription required"].map((badge) => (
              <div key={badge} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-[#5dcaa5]" />
                <span className="text-[11px] text-muted-foreground">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}