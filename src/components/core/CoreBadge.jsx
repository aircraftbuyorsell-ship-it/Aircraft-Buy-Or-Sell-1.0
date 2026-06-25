import { Badge } from "@/components/ui/badge";

/**
 * CoreBadge — Core Platform status/label primitive.
 * variant: "gold" | "blue" | "neutral" | "success" | "danger"
 */
const VARIANTS = {
  gold: "bg-primary/15 text-primary border-primary/30",
  blue: "bg-accent/15 text-accent border-accent/30",
  neutral: "bg-secondary text-muted-foreground border-border",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  danger: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function CoreBadge({ variant = "gold", className = "", children }) {
  return (
    <Badge
      className={`${VARIANTS[variant] || VARIANTS.gold} border font-semibold ${className}`}
    >
      {children}
    </Badge>
  );
}