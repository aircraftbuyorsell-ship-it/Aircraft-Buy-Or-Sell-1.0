import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

/**
 * CoreSelect — Privacy Policy / Legal Ink style.
 * Translucent surface, thin border, 8px radius.
 */
const SURFACE = {
  background: "rgba(255,255,255,0.04)",
  border: "0.5px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.90)",
};

export default function CoreSelect({
  options = [],
  value,
  onValueChange,
  placeholder = "Select…",
  className = "",
  style,
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={`rounded-lg ${className}`}
        style={{ ...SURFACE, ...style }}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        className="rounded-lg"
        style={{
          background: "rgba(13,17,23,0.98)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.90)",
        }}
      >
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}