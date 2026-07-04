import {
  LayoutDashboard, Users, Database, BarChart2, Megaphone, Globe,
  Plug, Shield, Code, Bot, Zap, ScrollText, Key, Settings, GitBranch,
} from "lucide-react";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "data", label: "Data", icon: Database },
  { id: "analytics", label: "Analytics", icon: BarChart2, isNew: true },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "domains", label: "Domains", icon: Globe },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "security", label: "Security", icon: Shield },
  { id: "code", label: "Code", icon: Code },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "workflows", label: "Workflows", icon: Zap, isNew: true },
  { id: "automations", label: "Automations", icon: GitBranch },
  { id: "logs", label: "Logs", icon: ScrollText },
  { id: "api", label: "API", icon: Key },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "secrets", label: "Secrets", icon: Shield },
];

export default function WorkflowSidebar({ activeSection, onSectionChange }) {
  return (
    <aside
      className="w-60 shrink-0 hidden lg:flex flex-col"
      style={{
        background: "#080a0f",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #f5c242, #d9a22c)" }}
        >
          <Zap className="w-4 h-4 text-[#04060a]" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-black text-white tracking-tight">ABOS</span>
          <span className="text-[8px] font-bold uppercase tracking-[0.15em]" style={{ color: "rgba(245,194,66,0.6)" }}>
            Workflows
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {SECTIONS.map((s) => {
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSectionChange(s.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all mb-0.5 group"
              style={
                isActive
                  ? { background: "rgba(245,194,66,0.10)", color: "#f5c242" }
                  : { color: "rgba(255,255,255,0.50)" }
              }
            >
              <s.icon className="w-4 h-4 shrink-0" style={{ opacity: isActive ? 1 : 0.6 }} />
              <span className="flex-1 text-left">{s.label}</span>
              {s.isNew && (
                <span
                  className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(245,194,66,0.15)",
                    color: "#f5c242",
                    border: "0.5px solid rgba(245,194,66,0.3)",
                  }}
                >
                  New
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div
          className="rounded-lg p-3"
          style={{ background: "rgba(245,194,66,0.04)", border: "0.5px solid rgba(245,194,66,0.12)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#f5c242" }}>
            Automation Engine
          </p>
          <p className="text-[10px] leading-snug" style={{ color: "rgba(255,255,255,0.40)" }}>
            15 active workflows orchestrating your aviation intelligence platform
          </p>
        </div>
      </div>
    </aside>
  );
}