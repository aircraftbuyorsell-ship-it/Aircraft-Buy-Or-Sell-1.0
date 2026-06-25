import { Button } from "@/components/ui/button";

/**
 * CoreButton — Core Platform button primitive.
 * variant: "default" (gold #D4A017) | "secondary" | "outline" | "ghost" | "destructive"
 * accent=true → secondary accent blue (#2563EB)
 */
export default function CoreButton({
  accent = false,
  variant = "default",
  className = "",
  children,
  ...props
}) {
  return (
    <Button
      variant={accent ? "default" : variant}
      className={
        accent
          ? `bg-accent text-accent-foreground hover:bg-accent/90 border-transparent ${className}`
          : className
      }
      {...props}
    >
      {children}
    </Button>
  );
}