import { useState } from "react";

export default function GuidedToolCard({ item, description, featured = false, onClick }) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;
  const lit = featured || hovered;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="min-h-[104px] w-full rounded-xl p-3 text-left transition-all duration-200"
      style={{
        background: lit
          ? "radial-gradient(circle at 18% 12%, rgba(212,160,23,0.20), rgba(212,160,23,0.06) 48%, rgba(255,255,255,0.03))"
          : "rgba(255,255,255,0.03)",
        border: lit ? "1px solid rgba(212,160,23,0.42)" : "1px solid rgba(255,255,255,0.07)",
        boxShadow: lit ? "0 0 20px rgba(212,160,23,0.13), inset 0 1px rgba(255,255,255,0.05)" : "none",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        {Icon && <Icon size={16} className="text-gold" />}
        <span className="text-[11px] font-bold leading-tight text-white">{item.label}</span>
        {featured && <span className="ml-auto rounded-full bg-gold/10 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-gold">Recommended</span>}
      </div>
      <p className="m-0 text-[9px] leading-[1.45] text-white/45">{description}</p>
    </button>
  );
}