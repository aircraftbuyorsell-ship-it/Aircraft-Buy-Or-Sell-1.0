# Screenshot evidence matrix

Status: **capture pending host/Fable preview**. This file defines evidence; it is not a claim that screenshots were captured.

| Viewport | Primary state | Fixture scenario | Required evidence |
|---|---|---|---|
| 1440 × 1000 | Success | `success` | Hero, natural query, three-column grid, fixture intelligence label |
| 1024 × 900 | Partial | `partial` | Two-column layout, missing-value language, partial warning |
| 390 × 844 | Loading | adapter latency | Single-column search control, loading announcement/skeleton |
| 390 × 844 | Empty | `empty` | Empty guidance without layout shift |
| 390 × 844 | Unauthorized | `unauthorized` | Alert copy and no leaked technical details |
| 390 × 844 | Rate limited | `rate_limited` | Clearly fixture-only timing example and stable focus order |
| 1440 × 1000 | Structured input | any | Four-field desktop controls and statement that they compose `query` |
| 390 × 844 | Structured input | any | One-column controls and 44px targets |

Keyboard evidence must additionally record Tab order, Enter submission, focus visibility, mode switching and screen-reader announcements for result count, loading and errors.
