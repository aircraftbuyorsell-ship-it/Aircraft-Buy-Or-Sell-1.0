import { Input } from "@/components/ui/input";

/**
 * CoreInput — Privacy Policy / Legal Ink style.
 * Translucent surface, thin border, 8px radius.
 */
export default function CoreInput({ className = "", style, ...props }) {
  return (
    <Input
      className={`rounded-lg focus-visible:ring-0 ${className}`}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.90)",
        ...style,
      }}
      {...props}
    />
  );
}