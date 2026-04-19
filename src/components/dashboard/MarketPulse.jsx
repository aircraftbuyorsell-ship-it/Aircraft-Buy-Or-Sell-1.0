import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { TrendingUp, Plane, Handshake, Activity } from "lucide-react";

// Build an array of the last N month buckets: { key, label, start, end }
function buildMonthBuckets(count = 6) {
  const buckets = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-US", { month: "short" }),
      start: d,
      end: next,
    });
  }
  return buckets;
}

const fmtMoney = (n) => {
  if (n == null || isNaN(n)) return "—";
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n)}`;
};

function TooltipBox({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-black/10 rounded-md shadow-md px-3 py-2 text-xs">
      <p className="font-black text-[#0B2D5B] uppercase tracking-wider text-[10px]">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold mt-0.5">
          {valueFormatter ? valueFormatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

function ChartCard({ icon: Icon, title, subtitle, children, accent = "#0B2D5B" }) {
  return (
    <div className="bg-white border border-black/[0.08] rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}15` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.15em] font-black" style={{ color: accent }}>{title}</p>
          <p className="text-[10px] text-[#6B6560] truncate">{subtitle}</p>
        </div>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function MarketPulse() {
  const buckets = useMemo(() => buildMonthBuckets(6), []);
  const sixMonthsAgoISO = buckets[0].start.toISOString();

  const { data: listings = [] } = useQuery({
    queryKey: ["pulse-listings"],
    queryFn: () => base44.entities.AircraftListing.filter({}, "-created_date", 500),
  });

  const { data: escrows = [] } = useQuery({
    queryKey: ["pulse-escrows"],
    queryFn: () => base44.entities.EscrowTransaction.list("-created_date", 500),
  });

  const { valueSeries, volumeSeries, escrowSeries } = useMemo(() => {
    const inRange = (d) => d && new Date(d) >= new Date(sixMonthsAgoISO);

    const valueSeries = buckets.map(b => {
      const items = listings.filter(l => {
        const dt = new Date(l.created_date);
        return dt >= b.start && dt < b.end && l.asking_price > 0;
      });
      const avg = items.length > 0
        ? items.reduce((s, l) => s + (l.asking_price || 0), 0) / items.length
        : 0;
      return { label: b.label, value: Math.round(avg) };
    });

    const volumeSeries = buckets.map(b => {
      const count = listings.filter(l => {
        const dt = new Date(l.created_date);
        return dt >= b.start && dt < b.end;
      }).length;
      return { label: b.label, count };
    });

    const CLOSED = new Set(["closed", "released"]);
    const FAILED = new Set(["cancelled", "disputed"]);
    const escrowSeries = buckets.map(b => {
      const items = escrows.filter(e => {
        const dt = new Date(e.created_date);
        return dt >= b.start && dt < b.end;
      });
      const total = items.length;
      const closed = items.filter(e => CLOSED.has(e.status)).length;
      const failed = items.filter(e => FAILED.has(e.status)).length;
      const resolved = closed + failed;
      const rate = resolved > 0 ? Math.round((closed / resolved) * 100) : 0;
      return { label: b.label, rate, total };
    });

    // suppress unused warning
    void inRange;

    return { valueSeries, volumeSeries, escrowSeries };
  }, [buckets, listings, escrows, sixMonthsAgoISO]);

  const hasAnyData = listings.length > 0 || escrows.length > 0;

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16 border-t border-black/[0.06]">
      <div className="flex items-center gap-2 justify-center mb-2">
        <Activity className="w-4 h-4 text-[#E8A83A]" />
        <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#E8A83A]">Market Pulse · Last 6 Months</p>
      </div>
      <h2 className="text-2xl md:text-3xl font-black text-[#1A1814] text-center uppercase tracking-tight">
        The Zone At A Glance
      </h2>
      <p className="text-sm text-[#4A4845] text-center mt-2 max-w-2xl mx-auto">
        Track average market values, listing volumes, and escrow success rates — so you know exactly when to buy, sell, or wait.
      </p>

      {!hasAnyData ? (
        <div className="mt-10 bg-white border border-black/[0.08] rounded-lg p-10 text-center text-[#AAA49C]">
          <Activity className="w-10 h-10 mx-auto opacity-30 mb-3" />
          <p className="text-sm">Not enough market data yet — pulse charts will populate as listings & escrows flow in.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <ChartCard
            icon={TrendingUp}
            title="Avg Market Value"
            subtitle="Asking price · monthly avg"
            accent="#0B2D5B"
          >
            <AreaChart data={valueSeries} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B2D5B" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0B2D5B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6B6560" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6B6560" }} tickFormatter={fmtMoney} width={45} />
              <Tooltip content={<TooltipBox valueFormatter={fmtMoney} />} />
              <Area type="monotone" dataKey="value" stroke="#0B2D5B" strokeWidth={2} fill="url(#valueGrad)" />
            </AreaChart>
          </ChartCard>

          <ChartCard
            icon={Plane}
            title="Listing Volume"
            subtitle="New listings per month"
            accent="#E8A83A"
          >
            <BarChart data={volumeSeries} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6B6560" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6B6560" }} width={30} allowDecimals={false} />
              <Tooltip content={<TooltipBox valueFormatter={(v) => `${v} listings`} />} />
              <Bar dataKey="count" fill="#E8A83A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartCard>

          <ChartCard
            icon={Handshake}
            title="Escrow Success Rate"
            subtitle="Closed / resolved · %"
            accent="#0F7A56"
          >
            <LineChart data={escrowSeries} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6B6560" }} />
              <YAxis
                axisLine={false} tickLine={false}
                tick={{ fontSize: 10, fill: "#6B6560" }}
                domain={[0, 100]} tickFormatter={(v) => `${v}%`} width={35}
              />
              <Tooltip content={<TooltipBox valueFormatter={(v) => `${v}% success`} />} />
              <Line type="monotone" dataKey="rate" stroke="#0F7A56" strokeWidth={2.5} dot={{ fill: "#0F7A56", r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ChartCard>
        </div>
      )}
    </section>
  );
}