import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Wrench, GraduationCap, Fuel, Plane, Brush, Users, Star, Building2, TrendingUp } from "lucide-react";

const GOLD = "#f5c242";
const GREEN = "#5dcaa5";
const BLUE = "#4e8ef7";
const RED = "#e24b4a";
const MUTED = "rgba(255,255,255,0.60)";
const WHITE = "rgba(255,255,255,0.90)";

const CATEGORY_META = {
  mechanic:      { label: "Mechanics / MRO",    icon: Wrench,       color: BLUE },
  ap_mechanic:   { label: "A&P Mechanics",       icon: Wrench,       color: "#8b5cf6" },
  flight_school: { label: "Flight Schools",      icon: GraduationCap, color: GREEN },
  refueling_fbo: { label: "FBOs / Refueling",    icon: Fuel,         color: GOLD },
  dealer:        { label: "Dealers",             icon: Building2,    color: "#ec4899" },
  broker:        { label: "Brokers",             icon: Users,        color: "#06b6d4" },
  paint_shop:    { label: "Paint Shops",         icon: Brush,        color: "#f97316" },
};

function KpiTile({ icon: Icon, label, value, sub, color = GOLD }) {
  return (
    <div className="rounded-xl p-4 flex items-center gap-3"
      style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, border: `0.5px solid ${color}30` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p style={{ fontSize: 22, fontWeight: 700, color: WHITE, letterSpacing: "-0.03em", lineHeight: 1 }}>
          {value}
        </p>
        <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
          {label}
        </p>
        {sub && <p style={{ fontSize: 9, color: MUTED, marginTop: 1 }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function ServiceOverview() {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["aviation-services-all"],
    queryFn: () => base44.entities.AviationService.list("-created_date", 500),
  });

  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter(s => s.is_active !== false).length;
    const byCategory = {};
    Object.keys(CATEGORY_META).forEach(cat => {
      byCategory[cat] = services.filter(s => s.category === cat).length;
    });
    const ratedServices = services.filter(s => s.rating != null);
    const avgRating = ratedServices.length > 0
      ? (ratedServices.reduce((sum, s) => sum + s.rating, 0) / ratedServices.length).toFixed(1)
      : "—";
    const countries = [...new Set(services.map(s => s.country).filter(Boolean))];
    const withFuel = services.filter(s => s.fuel_prices && Object.values(s.fuel_prices).some(v => v != null));
    return { total, active, byCategory, avgRating, countries: countries.length, withFuel: withFuel.length };
  }, [services]);

  const pieData = useMemo(() =>
    Object.entries(stats.byCategory)
      .filter(([_, count]) => count > 0)
      .map(([cat, count]) => ({
        name: CATEGORY_META[cat]?.label || cat,
        value: count,
        fill: CATEGORY_META[cat]?.color || "#888",
      })),
    [stats.byCategory]
  );

  const topRated = useMemo(() =>
    [...services].filter(s => s.rating != null).sort((a, b) => b.rating - a.rating).slice(0, 5),
    [services]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: "rgba(245,194,66,0.20)", borderTopColor: "#f5c242" }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiTile icon={Building2} label="Total Services" value={stats.total} color={BLUE} />
        <KpiTile icon={TrendingUp} label="Active" value={stats.active} color={GREEN} />
        <KpiTile icon={Star} label="Avg Rating" value={stats.avgRating} color={GOLD} />
        <KpiTile icon={Fuel} label="FBOs w/ Fuel" value={stats.withFuel} color={GOLD} />
        <KpiTile icon={Wrench} label="Categories" value={Object.values(stats.byCategory).filter(v => v > 0).length} color="#8b5cf6" />
        <KpiTile icon={Plane} label="Countries" value={stats.countries} color="#ec4899" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribution pie */}
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,194,66,0.70)", marginBottom: 16 }}>
            Service Distribution by Category
          </p>
          {pieData.length === 0 ? (
            <p style={{ fontSize: 12, color: MUTED, textAlign: "center", padding: "40px 0" }}>No services tracked yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}
                  style={{ fontSize: 10 }}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, background: "#0d1117", border: "1px solid rgba(255,255,255,0.10)", color: WHITE }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category bar chart */}
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,194,66,0.70)", marginBottom: 16 }}>
            Services per Category
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pieData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: MUTED }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, background: "#0d1117", border: "1px solid rgba(255,255,255,0.10)", color: WHITE }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={20}>
                {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top rated + Category grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top rated */}
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,194,66,0.70)", marginBottom: 12 }}>
            Top-Rated Providers
          </p>
          {topRated.length === 0 ? (
            <p style={{ fontSize: 12, color: MUTED, textAlign: "center", padding: "24px 0" }}>No rated services yet</p>
          ) : (
            <div className="space-y-2">
              {topRated.map((s, i) => {
                const meta = CATEGORY_META[s.category];
                return (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.30)", width: 20 }}>#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 12, fontWeight: 600, color: WHITE, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.name}
                      </p>
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>
                        {meta?.label || s.category} {s.city ? `· ${s.city}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star size={12} style={{ color: GOLD }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{s.rating?.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category quick-nav */}
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,194,66,0.70)", marginBottom: 12 }}>
            Category Coverage
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(CATEGORY_META).map(([cat, meta]) => {
              const count = stats.byCategory[cat] || 0;
              return (
                <div key={cat} className="flex items-center gap-2 p-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${meta.color}15`, border: `0.5px solid ${meta.color}30` }}>
                    <meta.icon size={14} style={{ color: meta.color }} />
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontSize: 11, fontWeight: 600, color: WHITE, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {meta.label}
                    </p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{count} tracked</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}