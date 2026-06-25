import { Card } from "@/components/ui/card";

/**
 * CoreCard — Core Platform surface primitive.
 * Dark navy card (#111827) with subtle border, no glassmorphism.
 * Use this for ALL Core Platform pages instead of GlassCard/DashboardCard.
 */
export default function CoreCard({ className = "", children, style, ...props }) {
  return (
    <Card
      className={`rounded-xl ${className}`}
      style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", ...style }}
      {...props}
    >
      {children}
    </Card>
  );
}