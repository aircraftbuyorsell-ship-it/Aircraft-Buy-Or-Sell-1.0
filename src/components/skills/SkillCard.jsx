import { Link } from "react-router-dom";
import { ArrowUpRight, Calculator } from "lucide-react";

export default function SkillCard({ skill }) {
  const { title, description, path, badge, color } = skill;
  // Defensive: if an icon fails to resolve we still render instead of crashing the page.
  const Icon = skill.icon || Calculator;
  const ariaLabel = title + " — " + badge + ". " + description;

  return (
    <Link
      to={path}
      aria-label={ariaLabel}
      className="group relative flex h-full flex-col rounded-2xl p-5 outline-none transition-all duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-[#f5c242] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a12]"
      style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}
    >
      <span
        className="absolute top-4 right-4 rounded-full px-2 py-0.5 text-[9px] font-bold"
        style={{ color: "#8ab4ff", background: "rgba(78,142,247,0.12)", border: "0.5px solid rgba(78,142,247,0.25)" }}
      >
        {badge}
      </span>

      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-shadow group-hover:shadow-lg"
        style={{
          background: color + "14",
          border: "0.5px solid " + color + "30",
          boxShadow: "0 0 0px " + color + "00"
        }}
      >
        <Icon className="w-5 h-5" style={{ color: color }} aria-hidden="true" />
      </div>

      <h3 className="mb-1.5 pr-20 text-[14px] font-black text-[rgba(255,255,255,0.92)]">{title}</h3>

      <p className="text-[11.5px] leading-relaxed text-[rgba(255,255,255,0.45)] line-clamp-3">{description}</p>

      <span
        aria-hidden="true"
        className="mt-auto pt-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.25)] transition-colors group-hover:text-[#f5c242]"
      >
        Open
        <ArrowUpRight className="w-3 h-3" />
      </span>
    </Link>
  );
}
