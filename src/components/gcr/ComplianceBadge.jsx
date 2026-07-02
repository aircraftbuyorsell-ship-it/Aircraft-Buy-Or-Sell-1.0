import { useComplianceBadge } from "@/hooks/useGCR";
import { useExpertVerified } from "@/hooks/useExpert";
import { BadgeCheck } from "lucide-react";

const GREEN = "#22c55e";
const AMBER = "#f5c242";
const RED = "#ef4444";

export function gcrColor(score) {
  if (score == null) return AMBER;
  if (score >= 75) return GREEN;
  if (score >= 40) return AMBER;
  return RED;
}

export default function ComplianceBadge({ registration, size = "sm" }) {
  const { data, isLoading } = useComplianceBadge(registration);
  const { data: expertVerified } = useExpertVerified(registration);

  if (!registration) return null;

  const fontSize = size === "lg" ? 11 : 10;
  const dotSize = size === "lg" ? 7 : 6;
  const padding = size === "lg" ? "3px 8px" : "2px 7px";
  const iconSize = size === "lg" ? 12 : 10;

  // Skeleton while loading
  if (isLoading || !data) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full animate-pulse"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          padding,
        }}
      >
        <span style={{ width: dotSize, height: dotSize, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
        <span style={{ fontSize, fontWeight: 700, color: "rgba(255,255,255,0.20)" }}>GCR: —</span>
      </span>
    );
  }

  const score = data.score;
  const color = gcrColor(score);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full transition-all"
      style={{
        background: `${color}12`,
        border: `0.5px solid ${color}30`,
        padding,
      }}
      title={`Global Compliance Report — Score: ${score}/100 (${data.score_label})`}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}80`,
        }}
      />
      <span style={{ fontSize, fontWeight: 800, color, letterSpacing: "0.02em" }}>
        GCR: {score}
      </span>
      {expertVerified && (
        <span
          className="inline-flex items-center gap-0.5 ml-0.5 pl-1"
          style={{ borderLeft: "0.5px solid rgba(34,197,94,0.25)" }}
          title="Independently verified by a certified aviation professional"
        >
          <BadgeCheck size={iconSize} style={{ color: "#22c55e" }} />
        </span>
      )}
    </span>
  );
}