import { useEffect, useId, useRef, useState } from "react";
import type { AircraftSearchAdapter } from "../adapter.js";
import type { AircraftListing, SearchResponse } from "../contract.js";
import { assertSafeSearchResponse } from "../response-guard.js";
import {
  buildStructuredQuery,
  createSearchRequest,
  EMPTY_STRUCTURED_SEARCH,
  mergeSearchResponses,
  stateFromError,
  stateFromResponse,
  type LoadMoreState,
  type SearchViewState,
  type StructuredSearchDraft,
} from "../search-model.js";
import { SearchBar } from "./SearchBar.js";
import { SearchFeedback } from "./SearchFeedback.js";
import { SearchResultCard } from "./SearchResultCard.js";
import { StructuredFilters } from "./StructuredFilters.js";

export interface AircraftSearchV2Props {
  adapter: AircraftSearchAdapter;
  approvedImageHosts?: readonly string[];
  onOpenListing?: (listing: AircraftListing) => void;
  onRequestAuthentication?: () => void;
  onRequestAccess?: () => void;
  initialQuery?: string;
}

type SearchMode = "natural" | "structured";

export function AircraftSearchV2({
  adapter,
  approvedImageHosts = [],
  onOpenListing,
  onRequestAuthentication,
  onRequestAccess,
  initialQuery = "",
}: AircraftSearchV2Props) {
  const [mode, setMode] = useState<SearchMode>("natural");
  const [query, setQuery] = useState(initialQuery);
  const [structured, setStructured] = useState<StructuredSearchDraft>(EMPTY_STRUCTURED_SEARCH);
  const [state, setState] = useState<SearchViewState>({ kind: "initial" });
  const [loadMoreState, setLoadMoreState] = useState<LoadMoreState>({ kind: "idle" });
  const abortController = useRef<AbortController | null>(null);
  const feedbackFocusRef = useRef<HTMLElement | null>(null);
  const resultsFocusRef = useRef<HTMLDivElement | null>(null);
  const modeGroupName = useId();

  useEffect(() => () => abortController.current?.abort(), []);

  useEffect(() => {
    if (state.kind === "success" || state.kind === "partial") {
      queueMicrotask(() => resultsFocusRef.current?.focus());
    } else if (state.kind === "invalid" || state.kind === "empty" || state.kind === "failure") {
      queueMicrotask(() => feedbackFocusRef.current?.focus());
    }
  }, [state.kind]);

  const executeRequest = async (request: ReturnType<typeof createSearchRequest>) => {
    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;
    setLoadMoreState({ kind: "idle" });
    setState({ kind: "loading", query: request.query });
    try {
      const response = assertSafeSearchResponse(await adapter.search(request, { signal: controller.signal }));
      if (!controller.signal.aborted) setState(stateFromResponse(response));
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setState(stateFromError(error, request));
    }
  };

  const submitQuery = (nextQuery: string) => {
    try {
      void executeRequest(createSearchRequest(nextQuery));
    } catch (error) {
      setLoadMoreState({ kind: "idle" });
      setState({ kind: "invalid", message: error instanceof Error ? error.message : "Enter a valid query." });
    }
  };

  const executeLoadMore = async (previous: SearchResponse, retryRequest?: ReturnType<typeof createSearchRequest>) => {
    const request = retryRequest ?? createSearchRequest(previous.query, previous.page.next_cursor);
    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;
    setLoadMoreState({ kind: "loadingMore" });
    try {
      const next = assertSafeSearchResponse(await adapter.search(request, { signal: controller.signal }));
      if (!controller.signal.aborted) {
        setState(stateFromResponse(mergeSearchResponses(previous, next)));
        setLoadMoreState({ kind: "idle" });
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        const failure = stateFromError(error, request);
        setLoadMoreState({
          kind: "loadMoreError",
          message: failure.kind === "failure" ? failure.message : "Additional results are unavailable.",
          request,
        });
      }
    }
  };

  const submitNatural = () => submitQuery(query);
  const submitStructured = () => {
    const composed = buildStructuredQuery(structured);
    setQuery(composed);
    submitQuery(composed);
  };
  const response = state.kind === "success" || state.kind === "partial" || state.kind === "empty" ? state.response : null;
  const queryError = state.kind === "invalid" ? state.message : null;
  const setNaturalQuery = (value: string) => {
    setQuery(value);
    if (state.kind === "invalid") setState({ kind: "initial" });
  };

  return (
    <section className="abos-search-page" aria-labelledby="abos-search-v2-title">
      <header className="abos-search-hero">
        <p className="abos-eyebrow">ABOS Aircraft Search</p>
        <h1 id="abos-search-v2-title">Find the right aircraft with a traceable result.</h1>
        <p>Search authoritative listing fixtures in natural language, or use structured controls as a secondary input mode.</p>
        <div className="abos-mode-notice" role="note">Visual draft · typed fixture data · no live API connection</div>
      </header>

      <section className="abos-search-panel" aria-label="Aircraft search controls">
        <fieldset className="abos-mode-switch">
          <legend>Search input mode</legend>
          <label><input type="radio" name={modeGroupName} value="natural" checked={mode === "natural"} onChange={() => setMode("natural")} />Natural language</label>
          <label><input type="radio" name={modeGroupName} value="structured" checked={mode === "structured"} onChange={() => setMode("structured")} />Structured filters</label>
        </fieldset>
        {mode === "natural" ? (
          <SearchBar value={query} onChange={setNaturalQuery} onSubmit={submitNatural} disabled={state.kind === "loading"} errorMessage={queryError} />
        ) : (
          <StructuredFilters value={structured} onChange={setStructured} onSubmit={submitStructured} disabled={state.kind === "loading"} />
        )}
      </section>

      <div className="abos-live-region" aria-live="polite" aria-atomic="true">
        {response && `${response.results.length} aircraft result${response.results.length === 1 ? "" : "s"}.`}
      </div>

      <SearchFeedback
        state={state}
        focusRef={feedbackFocusRef}
        {...(state.kind === "failure" ? { onRetry: () => void executeRequest(state.request) } : {})}
        {...(onRequestAuthentication ? { onRequestAuthentication } : {})}
        {...(onRequestAccess ? { onRequestAccess } : {})}
      />

      {state.kind === "partial" && (
        <aside className="abos-partial" role="status">
          Some approved fields are unavailable. Missing values are shown explicitly; no values were inferred.
        </aside>
      )}

      {response && response.results.length > 0 && (
        <section aria-label="Aircraft search results" aria-busy={loadMoreState.kind === "loadingMore"}>
          <div className="abos-results-heading" ref={resultsFocusRef} tabIndex={-1}>
            <div>
              <p className="abos-eyebrow">Results</p>
              <h2>{response.results.length} aircraft found</h2>
            </div>
            <p>{response.explanation}</p>
          </div>
          <div className="abos-results-grid">
            {response.results.map((listing) => (
              <SearchResultCard
                key={listing.listing_id}
                listing={listing}
                approvedImageHosts={approvedImageHosts}
                {...(onOpenListing ? { onOpen: onOpenListing } : {})}
              />
            ))}
          </div>
          {response.page.has_more && response.page.next_cursor && (
            <button
              className="abos-load-more"
              type="button"
              disabled={loadMoreState.kind === "loadingMore"}
              onClick={() => void executeLoadMore(response)}
            >
              {loadMoreState.kind === "loadingMore" ? "Loading more…" : "Load more aircraft"}
            </button>
          )}
          {loadMoreState.kind === "loadMoreError" && (
            <div className="abos-load-more-error" role="alert">
              <p>{loadMoreState.message} Existing results are still available.</p>
              <button type="button" onClick={() => void executeLoadMore(response, loadMoreState.request)}>Retry additional results</button>
            </div>
          )}
        </section>
      )}
    </section>
  );
}
