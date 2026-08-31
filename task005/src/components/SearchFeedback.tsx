import type { Ref } from "react";
import type { SearchViewState } from "../search-model.js";

export interface SearchFeedbackProps {
  state: SearchViewState;
  onRetry?: () => void;
  onRequestAuthentication?: () => void;
  onRequestAccess?: () => void;
  focusRef?: Ref<HTMLElement>;
}

const FAILURE_TITLES = {
  unauthorized: "Authentication required",
  forbidden: "Access denied",
  rate_limited: "Too many searches",
  offline: "You are offline",
  recoverable: "Search interrupted",
  fatal: "Search unavailable",
} as const;

export function SearchFeedback({ state, onRetry, onRequestAuthentication, onRequestAccess, focusRef }: SearchFeedbackProps) {
  if (state.kind === "initial" || state.kind === "success" || state.kind === "partial") return null;
  if (state.kind === "loading") {
    return (
      <section className="abos-feedback" aria-live="polite" aria-busy="true">
        <div className="abos-skeleton" />
        <p>Searching authorized aircraft listings for “{state.query}”…</p>
      </section>
    );
  }
  if (state.kind === "invalid") {
    return (
      <section ref={focusRef} tabIndex={-1} className="abos-feedback abos-feedback--invalid" role="alert">
        <h2>Check your search</h2>
        <p>{state.message}</p>
      </section>
    );
  }
  if (state.kind === "empty") {
    return (
      <section ref={focusRef} tabIndex={-1} className="abos-feedback" role="status">
        <h2>No aircraft matched</h2>
        <p>Try a broader aircraft description or remove a budget or region.</p>
      </section>
    );
  }
  return (
    <section ref={focusRef} tabIndex={-1} className={`abos-feedback abos-feedback--${state.failure}`} role="alert">
      <h2>{FAILURE_TITLES[state.failure]}</h2>
      <p>{state.message}</p>
      {state.retryAfterSeconds !== null && <p>Fixture timing example: {state.retryAfterSeconds} seconds.</p>}
      {(state.failure === "recoverable" || state.failure === "offline") && onRetry && (
        <button type="button" onClick={onRetry}>Try again</button>
      )}
      {state.failure === "unauthorized" && onRequestAuthentication && <button type="button" onClick={onRequestAuthentication}>Sign in</button>}
      {state.failure === "forbidden" && onRequestAccess && <button type="button" onClick={onRequestAccess}>Request access</button>}
    </section>
  );
}
