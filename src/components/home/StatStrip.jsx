import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plane, BadgeCheck, TrendingUp, DollarSign } from "lucide-react";

export default function StatStrip() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      try {
        const [listings, passports] = await Promise.all([
          base44.entities.AircraftListing.filter({ status: "active", visibility: "public" }, "-created_date", 1),
          base44.entities.ATIPassport.list("-created_date", 1).catch(() => []),
        ]);
        const listingCount = listings.length;
        const passportCount = Array.isArray(passports) ? passports.length : 0;
        const avgAti = listings.length > 0
          ? Math.round(listings.filter(l => l.ati_score != null).reduce((a, l) => a + (l.ati_score || 0), 0) / Math.max(1, listings.filter(l => l.ati_score != null).length))
          : 0;
        const totalValue = listings.filter(l => l.asking_price).reduce((a, l) => a + (l.asking_price || 0), 0);
        return { listingCount, passportCount, avgAti, totalValue };
      } catch {
        return { listingCount: 0, passportCount: 0, avgAti: 0, totalValue: 0 };
      }
    },
    staleTime: 60000,
  });

  const ITEMS = [
    { icon: Plane, label: "Active Listings", value: stats?.listingCount ?? 0, suffix: "" },
    { icon: BadgeCheck, label: "Digital Twins", value: stats?.passportCount ?? 0, suffix: "" },
    { icon: TrendingUp, label: "Avg ATI Score", value: stats?.avgAti ?? 0, suffix: "/120" },
    {
      icon: DollarSign,
      label: "Market Value",
      value: stats?.totalValue ? `$${(stats.totalValue / 1_000_000).toFixed(1)}M` : "—",
      suffix: "",
    },
  ];

  return (
    <section className="border-b border-border bg-card/50">
      <div className="mx-auto max-w-[1500px] px-4 py-6 md:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D4A017]/10">
                  <Icon className="h-4 w-4 text-[#D4A017]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-foreground tabular-nums">
                    {isLoading ? "…" : item.value}
                    {item.suffix && <span className="text-xs text-muted-foreground">{item.suffix}</span>}
                  </p>
                  <p className="truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}