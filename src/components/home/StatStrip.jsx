import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/* Brand icons */
const PlaneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  </svg>
);
const BadgeCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="m9 12 2 2 4-4" />
  </svg>
);
const TrendingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
);
const DollarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

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
        const scored = listings.filter((l) => l.ati_score != null);
        const avgAti = scored.length > 0
          ? Math.round(scored.reduce((a, l) => a + (l.ati_score || 0), 0) / scored.length)
          : 0;
        const totalValue = listings.filter((l) => l.asking_price).reduce((a, l) => a + (l.asking_price || 0), 0);
        return { listingCount, passportCount, avgAti, totalValue };
      } catch {
        return { listingCount: 0, passportCount: 0, avgAti: 0, totalValue: 0 };
      }
    },
    staleTime: 60000,
  });

  const ITEMS = [
    { icon: <PlaneIcon />, label: "Active Listings", value: stats?.listingCount ?? 0, suffix: "" },
    { icon: <BadgeCheckIcon />, label: "Digital Twins", value: stats?.passportCount ?? 0, suffix: "" },
    { icon: <TrendingIcon />, label: "Avg ATI Score", value: stats?.avgAti ?? 0, suffix: "/120" },
    {
      icon: <DollarIcon />,
      label: "Market Value",
      value: stats?.totalValue ? `$${(stats.totalValue / 1_000_000).toFixed(1)}M` : "—",
      suffix: "",
    },
  ];

  return (
    <section className="border-b border-border" style={{ background: "var(--brand-surface)" }}>
      <div className="mx-auto max-w-[1500px] px-4 py-6 md:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {ITEMS.map((item) => (
            <div key={item.label} className="glass-card flex items-center gap-3 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/[0.06]">
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg text-foreground tabular-nums">
                  {isLoading ? "…" : item.value}
                  {item.suffix && <span className="text-xs text-muted-foreground">{item.suffix}</span>}
                </p>
                <p className="truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}