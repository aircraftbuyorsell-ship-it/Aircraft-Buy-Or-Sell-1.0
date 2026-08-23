import { useId, type FormEvent } from "react";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
  errorMessage?: string | null;
}

/** Shared natural-language search-bar pattern for ABOS surfaces. */
export function SearchBar({
  value,
  onChange,
  onSubmit,
  disabled = false,
  label = "Describe the aircraft you are looking for",
  hint = "Example: Citation Latitude under 8M in Europe",
  errorMessage = null,
}: SearchBarProps) {
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="abos-search-bar" role="search" onSubmit={submit}>
      <label htmlFor={inputId}>{label}</label>
      <div className="abos-search-bar__row">
        <input
          id={inputId}
          type="search"
          value={value}
          maxLength={500}
          autoComplete="off"
          aria-describedby={`${hintId}${errorMessage ? ` ${errorId}` : ""}`}
          aria-invalid={errorMessage ? true : undefined}
          aria-errormessage={errorMessage ? errorId : undefined}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder="Make, model, budget, region…"
          disabled={disabled}
        />
        <button type="submit" disabled={disabled || value.trim().length === 0}>
          {disabled ? "Searching…" : "Search aircraft"}
        </button>
      </div>
      <p id={hintId} className="abos-search-hint">{hint}</p>
      {errorMessage && <p id={errorId} className="abos-search-error">{errorMessage}</p>}
    </form>
  );
}
