import { ChevronDown } from "lucide-react";
import NavItem from "./NavItem";

export default function SidebarSection({ section, pathname, collapsed, expanded, onToggle, onNavigate }) {
  const Icon = section.icon;
  const isActive = section.items.some((item) => pathname === item.path);

  // Collapsed sidebar: show only the section icon
  if (collapsed) {
    return (
      <button
        title={section.label}
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          margin: "3px auto",
          background: isActive ? `${section.color}14` : "transparent",
          border: "none",
          cursor: "pointer",
          color: isActive ? section.color : "rgba(255,255,255,0.40)",
          transition: "background 150ms, color 150ms",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `${section.color}10`; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? `${section.color}14` : "transparent"; }}
      >
        <Icon size={16} />
      </button>
    );
  }

  // Expanded sidebar: full accordion section
  return (
    <div style={{ marginBottom: "2px" }}>
      <button
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          padding: "9px 16px 7px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: section.color,
        }}
      >
        <Icon size={13} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: "left" }}>{section.label}</span>
        <ChevronDown
          size={12}
          style={{
            flexShrink: 0,
            transition: "transform 200ms ease",
            transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
            opacity: 0.5,
          }}
        />
      </button>
      {expanded &&
        section.items.map((item) => (
          <NavItem
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={item.label}
            active={pathname === item.path}
            onClick={onNavigate}
            accentColor={section.color}
          />
        ))}
    </div>
  );
}