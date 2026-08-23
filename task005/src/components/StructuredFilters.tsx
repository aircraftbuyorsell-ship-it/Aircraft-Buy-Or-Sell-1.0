import { useId, type FormEvent } from "react";
import type { StructuredSearchDraft } from "../search-model.js";

export interface StructuredFiltersProps {
  value: StructuredSearchDraft;
  onChange: (value: StructuredSearchDraft) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function StructuredFilters({ value, onChange, onSubmit, disabled = false }: StructuredFiltersProps) {
  const legendId = useId();
  const set = (key: keyof StructuredSearchDraft, nextValue: string) => onChange({ ...value, [key]: nextValue });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="abos-structured" onSubmit={submit} aria-labelledby={legendId}>
      <h2 id={legendId}>Structured search</h2>
      <p>In this fixture-only visual draft, these controls propose a natural-language query. They do not add API fields.</p>
      <div className="abos-structured__grid">
        <label>
          Manufacturer
          <input value={value.manufacturer} onChange={(event) => set("manufacturer", event.currentTarget.value)} />
        </label>
        <label>
          Model
          <input value={value.model} onChange={(event) => set("model", event.currentTarget.value)} />
        </label>
        <label>
          Maximum price
          <input value={value.maximumPrice} inputMode="decimal" placeholder="8M" onChange={(event) => set("maximumPrice", event.currentTarget.value)} />
        </label>
        <label>
          Region
          <input value={value.region} placeholder="Europe" onChange={(event) => set("region", event.currentTarget.value)} />
        </label>
      </div>
      <button type="submit" disabled={disabled}>Search with filters</button>
    </form>
  );
}
