import { useNavigate } from "react-router-dom";
import { Search, BarChart2, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Score any aircraft",
    desc: "Run an 8-dimension ATI Intelligence score on any aircraft in the register. Get market value, risk flags, and deal rating instantly.",
    linkLabel: "Open ATI Quick Score",
    route: "/ati-quick-score",
  },
  {
    icon: BarChart2,
    title: "Compare & shortlist",
    desc: "Browse 247+ verified listings. Filter by type, hours, price, and ATI score. Shortlist candidates and discard noise in one click.",
    linkLabel: "Open Aircraft Register",
    route: "/listings",
  },
  {
    icon: ShieldCheck,
    title: "Close with confidence",
    desc: "Connect with sellers through ABOS IntraZone. Run pre-buy coordination and proceed to secure escrow — all in one platform.",
    linkLabel: "Open Escrow",
    route: "/escrow",
  },
];

const GOLD = "#E8A83A";

export default function PlatformTour() {
  const navigate = useNavigate();

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 md:p-10"
      style={{
        background: "#0B1220",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
      }}
    >
      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative z-10">
        {/* Heading */}
        <div className="text-center mb-8">
          <h2 className="font-bold text-white" style={{ fontSize: 28 }}>
            How ABOS works
          </h2>
          <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            From first search to closed deal — in three steps.
          </p>
        </div>

        {/* Three steps */}
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 24 }}>
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex flex-col">
              {/* Step number badge */}
              <div
                className="flex items-center justify-center rounded-full font-extrabold"
                style={{
                  width: 32,
                  height: 32,
                  border: "1px solid rgba(232,168,58,0.35)",
                  background: "rgba(232,168,58,0.08)",
                  color: GOLD,
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                {i + 1}
              </div>

              {/* Icon */}
              <step.icon className="mt-4" size={32} style={{ color: GOLD }} strokeWidth={2} />

              {/* Title */}
              <h3 className="mt-3 text-white" style={{ fontSize: 16, fontWeight: 700 }}>
                {step.title}
              </h3>

              {/* Description */}
              <p
                className="mt-2"
                style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}
              >
                {step.desc}
              </p>

              {/* Link */}
              <button
                onClick={() => navigate(step.route)}
                className="mt-4 text-left font-bold transition-opacity hover:opacity-70"
                style={{ color: GOLD, fontSize: 13 }}
              >
                → {step.linkLabel}
              </button>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="my-8 h-px w-full" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* CTA row */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => navigate("/listings")}
            className="px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
            style={{
              color: GOLD,
              border: `1px solid ${GOLD}`,
              background: "transparent",
            }}
          >
            Explore Aircraft Register →
          </button>
          <button
            onClick={() => navigate("/ati-quick-score")}
            className="px-3 py-2.5 font-bold text-sm transition-opacity hover:opacity-70"
            style={{ color: GOLD, background: "transparent" }}
          >
            View ATI scoring →
          </button>
        </div>
      </div>
    </div>
  );
}