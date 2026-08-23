# Current search UI audit

Scope: current source at `/tmp/abos-src`, issue #9, and TASK-001 canonical OpenAPI. This is a read-only audit; the legacy source was not changed.

## Existing surfaces

| Surface | Current behavior | Architecture/accessibility finding | Preserve strategy |
|---|---|---|---|
| `/listings` (`src/pages/Listings.jsx`) | Loads up to 5,000 active public Base44 listings, then filters make/model/registration, make, ATI and registration region in the browser. | Page owns retrieval and business/filter logic; presentation calls Base44 directly; query has no canonical request/response seam; search input relies on placeholder rather than a visible label. | Keep untouched. Add `/search-v2` beside it and cut over only after Mode-B SDK validation. |
| `GlobalSearch` | Loads active Base44 listings, filters locally after two characters and navigates to a legacy ATI passport by Base44 ID. | Direct data access; trigger is visually hidden; popup lacks combobox/listbox semantics and arrow-key result navigation; query omits the listings page's explicit public-visibility predicate. | Keep untouched; later adopt the shared `SearchBar` interaction without reusing Base44 DTOs or identifiers. |
| Dashboard `AircraftSearch` / `DashboardNRegSearch` | Registration-only registry lookup through the legacy `nregSearch` Base44 function. | This is aircraft registry lookup, not canonical marketplace search. It has a distinct contract and must not be silently replaced by listing search. | Keep as a separate legacy capability until Aircraft Retrieval has an approved adapter. |
| `ListingFilters` and listing cards | Local price/year/ATI controls and rich Base44 listing fields. | Several displayed fields are not in the approved SearchResponse; these cannot be carried into v2 as API assumptions. | V2 cards render only TASK-001 fields. Intelligence is nullable and fixture-marked. |

## Key risks addressed by the draft

1. The new page receives an injected `AircraftSearchAdapter`; no presentation component imports Base44, Supabase or transport code.
2. Aircraft identity and listing identity remain nested and distinct (`ac_` versus `lst_`).
3. Structured filters demonstrate proposed fixture-only composition into the contract-approved `query` field instead of adding request fields.
4. Nullable contract fields render as unavailable rather than being inferred.
5. Fixture intelligence has a visible “Fixture — not live” label plus limitations.
6. Initial, loading, success, empty, partial, recoverable error, fatal error, unauthorized, forbidden, rate-limited and offline states have deterministic presentation paths.

## Accessibility baseline

- Visible labels are connected to search inputs.
- Natural-language input uses a native search form and Enter submission.
- Search modes use a labelled native radio group with browser-provided arrow-key behavior.
- Results use labelled articles; count changes use a polite live region.
- Completed searches focus the result heading or error/empty summary without trapping focus.
- Loading uses `aria-busy`; failures use `role=alert`; empty and partial states use status semantics.
- Every interactive element has a 44px minimum target and visible focus treatment.
- Layout remains one column on mobile, two on tablet and three on desktop.
- Reduced-motion users do not receive the loading animation.
- Local validation uses `aria-invalid` and `aria-errormessage` and never offers a meaningless retry.

## Remaining visual evidence

Actual screenshots require the Fable 5/host preview or a separately approved browser runner. The required capture matrix is defined in `evidence/screenshot-matrix.md`; no screenshot is falsely claimed by this local package.
