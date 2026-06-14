import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { motion } from "framer-motion";
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

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

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
  const accentPurple = isDark ? "#a78bfa" : "#7c3aed";

  // Glass panel style — stronger frosted glass
  const glassBg = isDark
    ? "linear-gradient(135deg, rgba(12,16,30,0.82), rgba(18,22,40,0.78))"
    : "linear-gradient(135deg, rgba(255,255,255,0.75), rgba(248,250,252,0.70))";
  const glassBorder = isDark
    ? "1px solid rgba(0,245,255,0.10)"
    : "1px solid rgba(37,99,235,0.10)";
  const glassShadow = isDark
    ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(0,245,255,0.06)"
    : "0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.60)";

  const glassStyle = {
    background: glassBg,
    border: glassBorder,
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    boxShadow: glassShadow,
  };

  const stats = useMemo(() => {
    const syncedLocal = faaAircraft.length;
    const total = faaTotalRegistry;
    const unsynced = total - syncedLocal;

    const ageMap = {};
    faaAircraft.forEach((a) => {
      const year = a.year_mfr;
      if (!year || year < 1940) return;
      const decade = Math.floor(year / 10) * 10;
      ageMap[`${decade}s`] = (ageMap[`${decade}s`] || 0) + 1;
    });
    const ageData = Object.entries(ageMap)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([name, value]) => ({ name, value }));

    const classData = countByField(faaAircraft, "type_aircraft", 8);
    const statusData = countByField(faaAircraft, "status_code", 8);
    const engineTypeData = countByField(faaAircraft, "engine_type", 6);
    const enrichedEngines = faaAircraft.filter((a) => a.engine_mfr).length;

    const validReg = faaAircraft.filter((a) => {
      if (!a.expiration_date) return false;
      try {
        const d = new Date(a.expiration_date.substring(0, 4) + "-" + a.expiration_date.substring(4, 6) + "-" + a.expiration_date.substring(6, 8));
        return d > new Date();
      } catch { return false; }
    }).length;
    const expiredReg = total - validReg - faaAircraft.filter((a) => !a.expiration_date).length;
    const noExpiry = faaAircraft.filter((a) => !a.expiration_date).length;

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
    const syncPct = total > 0 ? Math.round((syncedLocal / total) * 100) : 0;
    const enrichPct = syncedLocal > 0 ? Math.round((enrichedEngines / syncedLocal) * 100) : 0;

    return {
      syncedLocal, total, unsynced, ageData, classData, statusData,
      engineTypeData, enrichedEngines, regStatusData,
      validReg, expiredReg, noExpiry, faaTableData, faaTotalRows,
      syncPct, enrichPct,
    };
  }, [faaAircraft, matchedCount, faaTotalRegistry, faaAcftrefTotal, faaAdTotal, faaDealersTotal, faaEngineTotal, isDark, mutedColor]);

  // ─── Animated bar for progress ──────────────────
  const ProgressRing = ({ pct, color, size = 56 }) => {
    const r = 20, circ = 2 * Math.PI * r;
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"} strokeWidth="3" />
        <motion.circle
          cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${circ} ${circ}`}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (circ * pct) / 100 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
        />
        <text x="24" y="27" textAnchor="middle" fill={textColor} fontSize="9" fontWeight="bold" className="rotate-90" style={{ transformOrigin: "center" }}>{pct}%</text>
      </svg>
    );
  };

  if (faaAircraft.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl p-8 text-center" style={glassStyle}
      >
        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm" style={{ color: mutedColor }}>No FAA data synced yet. Go to Supabase Sync to import.</p>
      </motion.div>
    );
  }

  const cards = [
    // 0 — FAA Database Overview (compact)
    <div key="faa" className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <Database className="w-3.5 h-3.5" style={{ color: accentCyan }} />
        <p className="text-[9px] font-semibold tracking-wider uppercase" style={{ color: accentCyan }}>FAA Tables</p>
      </div>
      <motion.p
        className="text-lg font-black text-center mb-1"
        style={{ color: accentCyan }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
      >
        {stats.faaTotalRows.toLocaleString()}
      </motion.p>
      <p className="text-[9px] text-center font-semibold mb-2" style={{ color: mutedColor }}>Total FAA records</p>
      <div className="space-y-1">
        {stats.faaTableData.map((t) => (
          <div key={t.name} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: t.color }} />
            <span className="text-[9px] flex-1" style={{ color: mutedColor }}>{t.name}</span>
            <span className="text-[9px] font-bold tabular-nums" style={{ color: textColor }}>{t.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>,

    // 1 — Sync Coverage (featured, bigger)
    <div key="sync" className="flex flex-col items-center justify-center h-full gap-2">
      <div className="flex items-center gap-2">
        <PieChartIcon className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
        <p className="text-[9px] font-semibold tracking-wider uppercase" style={{ color: mutedColor }}>Sync Coverage</p>
      </div>
      <ProgressRing pct={stats.syncPct} color="#22c55e" size={64} />
      <p className="text-xs font-black" style={{ color: "#22c55e" }}>{stats.syncedLocal.toLocaleString()} <span style={{ color: mutedColor, fontWeight: 400 }}>of {stats.total.toLocaleString()}</span></p>
      <div className="grid grid-cols-2 gap-2 w-full text-center">
        <div><p className="text-[10px] font-bold" style={{ color: "#22c55e" }}>{stats.syncedLocal.toLocaleString()}</p><p className="text-[8px]" style={{ color: mutedColor }}>Synced</p></div>
        <div><p className="text-[10px] font-bold" style={{ color: mutedColor }}>{stats.unsynced.toLocaleString()}</p><p className="text-[8px]" style={{ color: mutedColor }}>Remaining</p></div>
      </div>
    </div>,

    // 2 — Age Distribution (wide)
    <div key="age" className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-3.5 h-3.5" style={{ color: mutedColor }} />
        <p className="text-[9px] font-semibold tracking-wider uppercase" style={{ color: mutedColor }}>Age Distribution</p>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={stats.ageData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="name" tick={{ fontSize: 8, fill: mutedColor }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 8, fill: mutedColor }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: isDark ? "#1a1f3a" : "#fff", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`, borderRadius: 8, fontSize: 11 }} labelStyle={{ color: textColor, fontWeight: 700 }} />
          <Bar dataKey="value" radius={[3, 3, 0, 0]} fill="#2563eb" name="Aircraft">
            {stats.ageData.map((_, i) => (
              <Cell key={i}><animate attributeName="opacity" from="0" to="1" dur={`${0.3 + i * 0.05}s`} /></Cell>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>,

    // 3 — Registration Status (compact donut)
    <div key="reg" className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-1">
        <Layers className="w-3.5 h-3.5" style={{ color: mutedColor }} />
        <p className="text-[9px] font-semibold tracking-wider uppercase" style={{ color: mutedColor }}>Reg Status</p>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <PieChart>
          <Pie data={stats.regStatusData} cx="50%" cy="50%" innerRadius={22} outerRadius={44} dataKey="value" strokeWidth={0}>
            {stats.regStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Legend wrapperStyle={{ fontSize: 8 }} iconType="circle" iconSize={5} formatter={(value) => <span style={{ color: mutedColor, fontSize: 8 }}>{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>,

    // 4 — Aircraft Class (horizontal bars)
    <div key="class" className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-3.5 h-3.5" style={{ color: mutedColor }} />
        <p className="text-[9px] font-semibold tracking-wider uppercase" style={{ color: mutedColor }}>Aircraft Class</p>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={stats.classData} layout="vertical" margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 8, fill: mutedColor }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={50} tick={{ fontSize: 8, fill: mutedColor }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: isDark ? "#1a1f3a" : "#fff", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`, borderRadius: 8, fontSize: 11 }} />
          <Bar dataKey="value" radius={[0, 3, 3, 0]} fill="#8b5cf6" name="Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>,

    // 5 — Data Enrichment (featured)
    <div key="enrich" className="flex flex-col items-center justify-center h-full gap-2">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-3.5 h-3.5" style={{ color: accentPurple }} />
        <p className="text-[9px] font-semibold tracking-wider uppercase" style={{ color: mutedColor }}>Data Enrichment</p>
      </div>
      <ProgressRing pct={stats.enrichPct} color="#8b5cf6" size={64} />
      <p className="text-xs font-black" style={{ color: "#8b5cf6" }}>{stats.enrichedEngines.toLocaleString()} <span style={{ color: mutedColor, fontWeight: 400 }}>enriched</span></p>
      <div className="grid grid-cols-3 gap-1 w-full text-center mt-1">
        {stats.engineTypeData.slice(0, 3).map((e) => (
          <div key={e.name}>
            <p className="text-[9px] font-bold" style={{ color: textColor }}>{e.value.toLocaleString()}</p>
            <p className="text-[7px]" style={{ color: mutedColor }}>{e.name}</p>
          </div>
        ))}
      </div>
    </div>,

    // 6 — Status Codes (compact list)
    <div key="status" className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <Layers className="w-3.5 h-3.5" style={{ color: mutedColor }} />
        <p className="text-[9px] font-semibold tracking-wider uppercase" style={{ color: mutedColor }}>Status Codes</p>
      </div>
      <div className="flex flex-col gap-1" style={{ maxHeight: 140, overflowY: "auto" }}>
        {stats.statusData.map((s, i) => (
          <div key={s.name} className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-[9px] flex-1 truncate" style={{ color: textColor }}>{s.name || "Unknown"}</span>
            <span className="text-[9px] font-bold tabular-nums" style={{ color: mutedColor }}>{s.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>,
  ];

  const spans = [1, 1, 2, 1, 2, 1, 1]; // FAA, Sync, Age, Reg, Class, Enrich, Status

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          custom={i}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.015, boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,245,255,0.10)" : "0 8px 28px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.70)" }}
          className="rounded-xl p-4 cursor-default"
          style={{
            ...glassStyle,
            gridColumn: `span ${spans[i]}`,
          }}
        >
          {card}
        </motion.div>
      ))}
    </div>
  );
}