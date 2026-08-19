import { Link } from "react-router-dom";

export default function NavItem({ to, icon: Icon, label, active, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className="abos-retro-nav-item flex min-h-11 items-center gap-2 border-l-2 px-3.5 text-[12px] font-semibold no-underline transition-colors"
      style={{
        color: active ? "var(--brand-primary)" : "var(--brand-muted-foreground)",
        background: active ? "rgba(224,176,52,0.10)" : "transparent",
        borderLeftColor: active ? "var(--brand-primary)" : "transparent",
      }}
    >
      <Icon size={14} style={{ color: "currentColor", flexShrink: 0 }} />
      <span>{label}</span>
    </Link>
  );
}