import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

/**
 * CoreSelect — Core Platform select primitive.
 * Props: options=[{value,label}], value, onValueChange, placeholder.
 */
export default function CoreSelect({
  options = [],
  value,
  onValueChange,
  placeholder = "Select…",
  className = "",
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={`bg-card border-border/60 rounded-lg ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-card border-border/60 rounded-lg">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}