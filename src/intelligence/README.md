# ABOS Intelligence Layer

Phase 1 foundation of the master product plan: the provider-neutral backbone
that turns many aviation data sources into one explainable aircraft decision.

> ABOS must never become "a website that has 30 aviation APIs". It must become
> "the place where those aviation data sources become one explainable aircraft
> decision."

## The rule

**The frontend never talks to a provider.** It calls this layer:

```js
import { resolveAircraft, screen, assess, commit, POLICY } from "@/intelligence";

const aircraft = await resolveAircraft("N7692J", { policy: POLICY.ASSESS });
const verdict  = screen(aircraft);
const pricing  = assess(aircraft);
const exposure = commit(aircraft, pricing, { annualHours: 180, holdYears: 3 });
```

If a screen needs something this layer cannot express, the layer is missing a
capability. Add it here — do not reach around it into a provider.

## Files

| File | Responsibility |
| --- | --- |
| `provenance.js` | The trust model. `dataPoint`, six data states, confidence bands, `explain()`. |
| `schema.js` | The canonical Aircraft object and its field registry. `toApiShape()` for the public API. |
| `registry.js` | Provider descriptors: category, region, tier, cost, confidence, `enabled`. |
| `router.js` | Policies and the call plan. Decides who gets asked, in what order, and when to stop. |
| `conflict.js` | Reconciles competing values. Agreement earns VERIFIED; disagreement produces a conflict. |
| `resolve.js` | Orchestration + cache + identity confidence + gap list. |
| `adapters/` | One translator per provider. Payload in, canonical candidates out. Nothing else. |
| `decision/screen.js` | GO / INVESTIGATE / STOP. |
| `decision/assess.js` | Price defensibility and the synthesized range. |
| `decision/commit.js` | CAPEX, OPEX, reserves, 36-month MRO calendar, four scenarios. |

## Four rules that must not be broken

1. **Absence is never a negative fact.** A field with no data is `UNAVAILABLE`
   or `NOT_APPLICABLE` — never `0`, never "No", never a red flag. This matters
   most for European aircraft, where FAA data simply does not exist. Say "no
   accident data was found in the sources checked", never "no accident history".

2. **Never silently overwrite.** Two sources that disagree produce a conflict
   with both values, the gap, the likely reason and the action that settles it.
   The user decides; ABOS does not pick a winner quietly.

3. **Every number shows its work.** value / source / date / status / confidence
   / calculation. If a figure cannot answer "why do you say this?", it does not
   belong on a screen.

4. **Commercial terms stay internal.** `cost_per_call_eur`, `pricing_model` and
   `commercial_use` drive routing economics and never render publicly. Use
   `publicProviderView()` for anything a visitor can see.

## Adding a provider

1. Add a descriptor to `PROVIDERS` in `registry.js` with `enabled: false`.
   `provides` lists the canonical field keys it can fill.
2. Write an adapter in `adapters/` that returns
   `{ candidates: [{ field, value, source, dataClass? }], freshnessH, costEur }`.
3. Register it in `adapters/index.js`.
4. Flip `enabled: true`. No UI change is needed — the router will route to it
   and the provenance UI will attribute it automatically.

VREF, JETNET and FlightAware are already wired this way and are waiting on
contracts and keys.

## Adding a canonical field

Add it to `FIELD_REGISTRY` in `schema.js` with a section, label and unit. Add
tolerance rules to `TOLERANCE` in `conflict.js` if two sources could report it
slightly differently (hours, prices, registry strings). `setField` throws on an
unregistered key on purpose — that is the abstraction holding.

## Routing policies

| Policy | Max tier | Budget | Used by |
| --- | --- | --- | --- |
| `SCREEN` | open | €0 | Every search. Must stay free. |
| `ASSESS` | premium | €8 | Paid price assessment. |
| `COMMIT` | live lookup | €40 | Paid ownership exposure model. |
| `API` | licensed | €2 | Partner API responses. |

The ladder is always: cache → free/open → licensed → premium → live lookup.
A premium provider is skipped when every field it offers is already verified
from a free one (`stillWorthCalling`).

## Tests

`test/abos-intelligence-layer.test.mjs` locks in the behaviour, not the
implementation: the absence rule, conflict handling, routing economics,
registry applicability, and that public views never leak pricing.

```bash
node --test test/abos-intelligence-layer.test.mjs
```

## Routes

`/screen`, `/assess`, `/commit` — each accepts `?registration=`. They are
navigation, not a funnel: a professional can enter at any stage.

## Not yet built (later phases)

Document intelligence (OCR → extract → cross-check), the services
recommendation engine, financing and insurance abstractions, the partner API
surface, and white-label embedding. The architecture has slots for all of them;
none of it requires changing what is here.
