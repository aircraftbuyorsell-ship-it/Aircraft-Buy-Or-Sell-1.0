import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import { useTheme } from "@/lib/useTheme";
import {
  BarChart3, PieChartIcon, TrendingUp, Layers, Database
} from "lucide-react";

const COLORS = ["#2563eb", "#06b6d4", "#8b5cf6", "#f59e0b", "#22c55e", "#ef4444", "#ec4899", "#14b8a6", "#f97316", "#6366f1"];

function countByField(data, field, limit = 10) {
  const map = {};
  data.forEach((item) => {
    const val = item[field];
    if (!val) return;
    const key = String(val).trim();
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));
}

export default function DatabaseCharts({
  faaAircraft = [], listings = [], matchedCount = 0,
  faaTotalRegistry = 308985,
  faaAcftrefTotal = 93572,
  faaAdTotal = 187,
  faaDealersTotal = 12507,
  faaEngineTotal = 4743,
}) {
  const isDark = useTheme();

  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const accentCyan = isDark ? "#00f5ff" : "#2563eb";
  const panelBg = isDark ? "rgba(15,15,28,0.72)" : "rgba(255,255,255,0.78)";
  const panelBorder = isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)";
  const panelStyle = { background: panelBg, border: panelBorder, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" };

  // Computed stats
  const stats = useMemo(() => {
    const syncedLocal = faaAircraft.length;
    const syncedAbos = matchedCount;
    const total = faaTotalRegistry;
    const unsynced = total - syncedLocal;

    // Age distribution (by decade)
    const ageMap = {};
    faaAircraft.forEach((a) => {
      const year = a.year_mfr;
      if (!year || year < 1940) return;
      const decade = Math.floor(year / 10) * 10;
      const label = `${decade}s`;
      ageMap[label] = (ageMap[label] || 0) + 1;
    });
    const ageData = Object.entries(ageMap)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([name, value]) => ({ name, value }));

    // Class distribution (type_aircraft)
    const classData = countByField(faaAircraft, "type_aircraft", 8);

    // Status distribution
    const statusData = countByField(faaAircraft, "status_code", 8);

    // Engine type distribution
    const engineTypeData = countByField(faaAircraft, "engine_type", 6);
    const enrichedEngines = faaAircraft.filter((a) => a.engine_mfr).length;

    // Registration validity
    const validReg = faaAircraft.filter((a) => {
      if (!a.expiration_date) return false;
      try {
        const d = new Date(a.expiration_date.substring(0, 4) + "-" + a.expiration_date.substring(4, 6) + "-" + a.expiration_date.substring(6, 8));
        return d > new Date();
      } catch { return false; }
    }).length;
    const expiredReg = total - validReg - faaAircraft.filter((a) => !a.expiration_date).length;
    const noExpiry = faaAircraft.filter((a) => !a.expiration_date).length;

    const syncData = [
      { name: "Synced to DB", value: syncedLocal, color: "#22c55e" },
      { name: "Remaining FAA", value: unsynced, color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)" },
    ];

    const regStatusData = [
      { name: "Valid", value: validReg, color: "#22c55e" },
      { name: "Expired", value: expiredReg, color: "#ef4444" },
      { name: "No expiry", value: noExpiry, color: mutedColor },
    ];

    const faaTableData = [
      { name: "Registry", value: faaTotalRegistry, color: "#2563eb" },
      { name: "ACFTREF", value: faaAcftrefTotal, color: "#f59e0b" },
      { name: "Dealers", value: faaDealersTotal, color: "#06b6d4" },
      { name: "Engine", value: faaEngineTotal, color: "#8b5cf6" },
      { name: "AD", value: faaAdTotal, color: "#ec4899" },
    ];
    const faaTotalRows = faaTableData.reduce((s, t) => s + t.value, 0);

    return {
      syncedLocal, syncedAbos, total, unsynced, ageData, classData, statusData,
      engineTypeData, enrichedEngines, syncData, regStatusData,
      validReg, expiredReg, noExpiry, faaTableData, faaTotalRows,
    };
  }, [faaAircraft, matchedCount, faaTotalRegistry, faaAcftrefTotal, faaAdTotal, faaDealersTotal, faaEngineTotal, isDark, mutedColor]);

  const ChartCard = ({ title, icon: Icon, children, span = 1 }) => (
    <div className="rounded-xl p-4" style={{ ...panelStyle, gridColumn: `span ${span}` }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color: mutedColor }} />
        <p className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: mutedColor }}>{title}</p>
      </div>
      {children}
    </div>
  );

  if (faaAircraft.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={panelStyle}>
        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm" style={{ color: mutedColor }}>No FAA data synced yet. Go to Supabase Sync to import.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* FAA Database Overview */}
      <ChartCard title="FAA Tables" icon={Database} span={1}>
        <div className="text-center mb-2">
          <p className="text-2xl font-black" style={{ color: accentCyan }}>{stats.faaTotalRows.toLocaleString()}</p>
          <p className="text-[9px] font-semibold" style={{ color: mutedColor }}>Total FAA records</p>
        </div>
        <div className="space-y-1.5">
          {stats.faaTableData.map((t) => (
            <div key={t.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: t.color }} />
              <span className="text-[9px] flex-1" style={{ color: mutedColor }}>{t.name}</span>
              <span className="text-[10px] font-bold tabular-nums" style={{ color: textColor }}>{t.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Total vs Synced */}
      <ChartCard title="Sync Coverage" icon={PieChartIcon} span={1}>
        <div className="flex items-center justify-center mb-2">
          <div className="text-center">
            <p className="text-2xl font-black" style={{ color: "#22c55e" }}>{stats.syncedLocal.toLocaleString()}</p>
            <p className="text-[9px] font-semibold" style={{ color: mutedColor }}>of {stats.total.toLocaleString()} FAA records</p>
            <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)", width: 120, margin: "0 auto" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((stats.syncedLocal / stats.total) * 100, 100)}%`, background: "#22c55e" }} />
            </div>
            <p className="text-[10px] mt-1 font-bold" style={{ color: "#22c55e" }}>
              {stats.total > 0 ? Math.round((stats.syncedLocal / stats.total) * 100) : 0}%
            </p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1 text-center">
          <div>
            <p className="text-[10px] font-bold" style={{ color: textColor }}>{stats.syncedLocal.toLocaleString()}</p>
            <p className="text-[8px]" style={{ color: mutedColor }}>Synced</p>
          </div>
          <div>
            <p className="text-[10px] font-bold" style={{ color: mutedColor }}>{stats.unsynced.toLocaleString()}</p>
            <p className="text-[8px]" style={{ color: mutedColor }}>Remaining</p>
          </div>
        </div>
      </ChartCard>

      {/* Age Distribution */}
      <ChartCard title="Age Distribution" icon={TrendingUp} span={2}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stats.ageData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: mutedColor }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: mutedColor }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: isDark ? "#1a1f3a" : "#fff",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                borderRadius: 8, fontSize: 11,
              }}
              labelStyle={{ color: textColor, fontWeight: 700 }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#2563eb" name="Aircraft" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Registration Status */}
      <ChartCard title="Registration Status" icon={Layers} span={1}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={stats.regStatusData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" strokeWidth={0}>
              {stats.regStatusData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Legend
              wrapperStyle={{ fontSize: 9 }}
              iconType="circle" iconSize={6}
              formatter={(value) => <span style={{ color: mutedColor, fontSize: 9 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Aircraft Class */}
      <ChartCard title="Aircraft Class" icon={BarChart3} span={2}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stats.classData} layout="vertical" margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 9, fill: mutedColor }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 9, fill: mutedColor }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: isDark ? "#1a1f3a" : "#fff",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                borderRadius: 8, fontSize: 11,
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#8b5cf6" name="Count" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Engine Data Enrichment */}
      <ChartCard title="Data Enrichment" icon={TrendingUp} span={1}>
        <div className="flex flex-col items-center justify-center h-[180px] gap-3">
          <div className="text-center">
            <p className="text-2xl font-black" style={{ color: "#8b5cf6" }}>{stats.enrichedEngines.toLocaleString()}</p>
            <p className="text-[9px] font-semibold" style={{ color: mutedColor }}>engine records enriched</p>
          </div>
          <div className="w-full px-4">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)" }}>
              <div className="h-full rounded-full" style={{
                width: `${Math.min((stats.enrichedEngines / stats.syncedLocal) * 100, 100)}%`,
                background: "linear-gradient(90deg, #8b5cf6, #06b6d4)",
              }} />
            </div>
            <p className="text-[10px] mt-1 text-center font-bold" style={{ color: "#8b5cf6" }}>
              {stats.syncedLocal > 0 ? Math.round((stats.enrichedEngines / stats.syncedLocal) * 100) : 0}%
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 w-full text-center mt-1">
            {stats.engineTypeData.slice(0, 3).map((e) => (
              <div key={e.name}>
                <p className="text-[10px] font-bold" style={{ color: textColor }}>{e.value.toLocaleString()}</p>
                <p className="text-[8px]" style={{ color: mutedColor }}>{e.name}</p>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>

      {/* Status Distribution */}
      <ChartCard title="Status Codes" icon={Layers} span={1}>
        <div className="flex flex-col gap-1.5" style={{ maxHeight: 180, overflowY: "auto" }}>
          {stats.statusData.map((s, i) => (
            <div key={s.name} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-[10px] flex-1 truncate" style={{ color: textColor }}>{s.name || "Unknown"}</span>
              <span className="text-[10px] font-bold tabular-nums" style={{ color: mutedColor }}>{s.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}