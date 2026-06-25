import { Card } from "@/components/ui/card";

/**
 * CoreCard — Core Platform surface primitive.
 * Dark navy card (#111827) with subtle border, no glassmorphism.
 * Use this for ALL Core Platform pages instead of GlassCard/DashboardCard.
 */
export default function CoreCard({ className = "", children, ...props }) {
  return (
    <Card
      className={`bg-card border-border/60 rounded-xl shadow-sm ${className}`}
      {...props}
    >
      {children}
    </Card>
  );
}