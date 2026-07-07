import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine,
} from "recharts";
import { Activity, TrendingUp, Database, BarChart3 } from "lucide-react";
import SectionShell from "@/components/dashboard/sections/SectionShell";

const MAKES = ["Cessna", "Piper", "Beechcraft", "Cirrus", "Mooney"];

const fmtPrice = (n) => {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
};

function SkeletonCard() {
  return (
    <div className="glass-card p-6">
      <div className="h-3 w-[120px] bg-muted rounded mb-4" />
      <div className="h-[180px] bg-muted/50 rounded-lg" />
    </div>
  );
}

function ChartCard({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-gold-official" />
        <span className="text-[10px] tracking-[0.12em] uppercase font-semibold text-muted-foreground">{title}</span>
      </div>
      {subtitle && <p className="text-[11px] text-muted-foreground/70 mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

// Theme-neutral chart colors (readable on both light and dark card surfaces)
const TICK = { fill: "#8a8f98", fontSize: 10 };
const TICK_SM = { fill: "#8a8f98", fontSize: 9 };
const AXIS_LINE = { stroke: "rgba(128,128,128,0.25)" };
const GRID_STROKE = "rgba(128,128,128,0.15)";

const tooltipStyle = {
  background: "rgba(10,15,26,0.95)",
  border: "0.5px solid rgba(245,194,66,0.2)",
  borderRadius: 8,
  fontSize: 11,
  color: "#fff",
};

export default function LiveMarketIntelligence() {
  const { data: marketData, isLoading } = useQuery({
    queryKey: ["live-market-intelligence"],
    queryFn: async () => {
      const results = await Promise.all(
        MAKES.map((make) =>
          base44.functions.invoke("piloterrTradeProxy", { make }).then(
            (res) => res.data,
            () => null
          )
        )
      );
      return MAKES.map((make, i) => ({ make, data: results[i] })).filter(
        (r) => r.data && r.data.avg_price != null
      );
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: internalListings = [] } = useQuery({
    queryKey: ["listings-market-intel"],
    queryFn: () =>
      base44.entities.AircraftListing.filter(
        { status: "active", visibility: "public" },
        "-created_date",
        200
      ),
    staleTime: 60000,
  });

  const shell = (children) => (
    <SectionShell
      eyebrow="Market Intelligence · Live"
      title="Real-Time Market Data Feed"
      subtitle="Live market pricing and availability across top manufacturers. Data automatically recalibrates OMVM valuations and ATI scoring."
    >
      {children}
    </SectionShell>
  );

  if (isLoading) {
    return shell(
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const market = marketData || [];
  const allStale = market.length > 0 && market.every((m) => m.data._source === "cached" || m.data.is_stale);
  const lastUpdated = market.length > 0
    ? market
        .map((m) => new Date(m.data.fetched_at).getTime())
        .sort((a, b) => b - a)[0]
    : null;

  // Chart 1: Availability by Make (bar)
  const availabilityData = market.map((m) => ({
    make: m.make,
    listings: m.data.listings_count || 0,
  }));

  // Chart 2: Price Distribution (histogram across all makes)
  const allPrices = market.flatMap((m) => m.data.price_samples || []);
  const bucketSize = 50000;
  const buckets = {};
  for (const p of allPrices) {
    const bucket = Math.floor(p / bucketSize) * bucketSize;
    buckets[bucket] = (buckets[bucket] || 0) + 1;
  }
  const histogramData = Object.entries(buckets)
    .map(([k, v]) => ({ range: `${fmtPrice(Number(k))}`, count: v, sortKey: Number(k) }))
    .sort((a, b) => a.sortKey - b.sortKey);

  // Chart 3: Live Market Avg vs OMVM (area)
  const avgVsOmvmData = market.map((m) => {
    const internal = internalListings.filter(
      (l) => l.make && l.make.toLowerCase().includes(m.make.toLowerCase())
    );
    const omvmAvg = internal.length > 0
      ? Math.round(internal.reduce((s, l) => s + (l.omvm_value || 0), 0) / internal.length)
      : 0;
    return {
      make: m.make,
      live_avg: m.data.avg_price || 0,
      omvm_avg: omvmAvg || 0,
    };
  });

  // Chart 4: Top Models ranked table
  const topModels = market
    .map((m) => ({
      make: m.make,
      avg_price: m.data.avg_price,
      min_price: m.data.min_price,
      max_price: m.data.max_price,
      listings: m.data.listings_count,
      source: m.data._source || "live",
    }))
    .sort((a, b) => (b.avg_price || 0) - (a.avg_price || 0));

  // Feed unavailable — hide the whole section rather than showing an error card
  if (market.length === 0) return null;

  return shell(
    <div>
      {/* Stale indicator + last updated */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {allStale && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold-official" />
              <span className="text-[10px] tracking-wide text-gold-official/80">Using cached data</span>
            </div>
          )}
        </div>
        {lastUpdated && (
          <span className="text-[10px] text-muted-foreground/60">
            Last updated {new Date(lastUpdated).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {/* Chart 1: Availability by Make */}
        <ChartCard icon={BarChart3} title="Availability by Make" subtitle="Live listing count per manufacturer">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={availabilityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="make" tick={TICK} axisLine={AXIS_LINE} />
              <YAxis tick={TICK} axisLine={AXIS_LINE} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(212,160,23,0.05)" }} />
              <Bar dataKey="listings" fill="#D4A017" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 2: Price Distribution */}
        <ChartCard icon={Activity} title="Price Distribution" subtitle="Histogram of live market prices">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={histogramData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="range" tick={TICK_SM} axisLine={AXIS_LINE} />
              <YAxis tick={TICK} axisLine={AXIS_LINE} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(212,160,23,0.05)" }} />
              <Bar dataKey="count" fill="#5dcaa5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 3: Live Market Avg vs OMVM */}
        <ChartCard icon={TrendingUp} title="Live Market Avg vs OMVM" subtitle="External feed vs internal valuation model">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={avgVsOmvmData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="liveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4A017" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#D4A017" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="omvmGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4e8ef7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4e8ef7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="make" tick={TICK} axisLine={AXIS_LINE} />
              <YAxis tick={TICK} axisLine={AXIS_LINE} tickFormatter={fmtPrice} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtPrice(v)} />
              <Area type="monotone" dataKey="live_avg" stroke="#D4A017" strokeWidth={2} fill="url(#liveGrad)" name="Live Avg" />
              <Area type="monotone" dataKey="omvm_avg" stroke="#4e8ef7" strokeWidth={2} fill="url(#omvmGrad)" name="OMVM Avg" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 4: Top Models ranked table */}
        <ChartCard icon={Database} title="Top Models — Market Ranking" subtitle="Ranked by average market price">
          <div style={{ fontSize: 11 }}>
            <div className="grid gap-2 pb-2 border-b border-border text-muted-foreground/70 text-[9px] uppercase tracking-[0.08em]"
              style={{ gridTemplateColumns: "1fr 80px 60px" }}>
              <span>Make</span>
              <span className="text-right">Avg Price</span>
              <span className="text-right">Listings</span>
            </div>
            {topModels.map((m) => (
              <div key={m.make} className="grid gap-2 py-2 border-b border-border/50 items-center"
                style={{ gridTemplateColumns: "1fr 80px 60px" }}>
                <span className="text-foreground/80 font-medium">{m.make}</span>
                <span className="text-right text-gold-official font-semibold">{fmtPrice(m.avg_price)}</span>
                <span className="text-right text-muted-foreground">{m.listings || 0}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}