import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/** Shared marketing layout for /solutions/* role landing pages. */
export default function SolutionLanding({ eyebrow, title, accent, subtitle, features, primary, secondary }) {
  return (
    <div className="min-h-screen px-4 sm:px-8 pt-28 pb-24" style={{ color: "#fff" }}>
      <div className="max-w-[1080px] mx-auto">
        <div className="max-w-[680px]">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#f5c242" }} />
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: "#f5c242" }}>
              {eyebrow}
            </span>
          </div>

          <h1 className="tracking-[-0.03em] leading-[1.06] mb-5"
            style={{ fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 500 }}>
            {title} <span style={{ color: "#f5c242", fontWeight: 700 }}>{accent}</span>
          </h1>

          <p className="text-[15px] leading-relaxed mb-8 max-w-[540px]" style={{ color: "rgba(255,255,255,0.60)" }}>
            {subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-16">
            <Link to={primary.to}
              className="px-6 py-3 rounded-xl text-[13px] font-bold transition-all hover:scale-[1.02] inline-flex items-center gap-2"
              style={{ background: "#f5c242", color: "#04060a", textDecoration: "none" }}>
              {primary.label} <ArrowRight size={14} />
            </Link>
            <Link to={secondary.to}
              className="px-6 py-3 rounded-xl text-[13px] font-bold transition-colors"
              style={{
                background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.14)",
                color: "rgba(255,255,255,0.85)", textDecoration: "none",
              }}>
              {secondary.label}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(245,194,66,0.10)", border: "0.5px solid rgba(245,194,66,0.25)" }}>
                  <Icon size={16} style={{ color: "#f5c242" }} />
                </div>
                <h3 className="text-[14px] font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.92)" }}>
                  {f.title}
                </h3>
                <p className="text-[12px] leading-relaxed m-0" style={{ color: "rgba(255,255,255,0.50)" }}>
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}