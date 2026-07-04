import { Link } from "react-router-dom";

export default function SkillCard({ skill }) {
  const { icon: Icon, title, description, path, badge, color } = skill;
  return (
    <Link to={path}
      className="group relative rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 block"
      style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      <span className="absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded-full"
        style={{ color: "#8ab4ff", background: "rgba(78,142,247,0.12)", border: "0.5px solid rgba(78,142,247,0.25)" }}>
        {badge}
      </span>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-shadow group-hover:shadow-lg"
        style={{ background: `${color}14`, border: `0.5px solid ${color}30`, boxShadow: `0 0 0px ${color}00` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <h3 className="text-[14px] font-black text-[rgba(255,255,255,0.92)] mb-1.5">{title}</h3>
      <p className="text-[11.5px] leading-relaxed text-[rgba(255,255,255,0.45)] line-clamp-3">{description}</p>
    </Link>
  );
}