import { Input } from "@/components/ui/input";

/**
 * CoreInput — Core Platform input primitive.
 * Dark surface, subtle border, no glassmorphism.
 */
export default function CoreInput({ className = "", ...props }) {
  return (
    <Input
      className={`bg-card border-border/60 rounded-lg focus-visible:ring-accent ${className}`}
      {...props}
    />
  );
}