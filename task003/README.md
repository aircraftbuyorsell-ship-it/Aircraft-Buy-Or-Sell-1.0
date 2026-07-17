# TASK-003 — Quality Baseline Ledger

## Outcome

This package records the evidence-backed quality baseline for ABOS and provides a two-checkout comparator. It does not change application source, root package scripts, CI, or deployment configuration.

The historical control-plane evidence says:

| Gate | Recorded state | Available category evidence |
|---|---|---|
| Build | PASS | No diagnostics |
| Lint | FAIL — 140 errors | 140 unused-import errors; configured error rule is `unused-imports/no-unused-imports` |
| Typecheck | FAIL | Multiple application type errors; raw count, TypeScript codes and file categories were not preserved |

Unknown TypeScript categories are intentionally recorded as `unclassified_application_type_error` in `quality-baseline.json`. They must not be guessed.

## Files

- `quality-baseline.json` — machine-readable historical ledger with immutable source SHAs and limitations.
- `scripts/capture-quality.mjs` — captures build state and normalized lint/typecheck diagnostic fingerprints.
- `scripts/check-regressions.mjs` — compares baseline and candidate captures as multisets.
- `test/check-regressions.test.mjs` — covers unchanged debt, new diagnostics, build regression and unavailable evidence.

No raw command output is stored. This avoids treating logs as durable truth and limits accidental disclosure. Normalized fingerprints contain relative file, rule/error code and normalized diagnostic message.

## Regression semantics

The comparator uses the same installed toolchain in two checkouts:

- exit `0`: no new diagnostic fingerprint or multiplicity;
- exit `1`: a new regression exists;
- exit `2`: evidence is unavailable or invalid, so the result is indeterminate.

Exit `1` is reserved for demonstrated new regressions. Missing tools, unparsable output, or incomplete captures return exit `2`, not a false regression.

A fingerprint excludes line and column positions so harmless line movement does not create a new error. Counts are compared as a multiset so an additional occurrence of an existing error still fails.

## Runbook

Prerequisites:

- Node.js and npm compatible with the repository lockfile;
- two clean checkouts;
- dependencies installed independently in both checkouts;
- baseline checkout pinned to `5112f7f43113627b2fa1c1d8495c52d6b0fbca30`.

Example from the candidate repository:

```bash
git worktree add ../abos-quality-baseline 5112f7f43113627b2fa1c1d8495c52d6b0fbca30
npm ci
npm --prefix ../abos-quality-baseline ci

node task003/scripts/capture-quality.mjs \
  --root ../abos-quality-baseline \
  --out /tmp/abos-quality-main.json \
  --ref 5112f7f43113627b2fa1c1d8495c52d6b0fbca30

node task003/scripts/capture-quality.mjs \
  --root . \
  --out /tmp/abos-quality-candidate.json \
  --ref candidate

node task003/scripts/check-regressions.mjs \
  --baseline /tmp/abos-quality-main.json \
  --candidate /tmp/abos-quality-candidate.json
```

Run the task-local tests with:

```bash
node --test task003/test/check-regressions.test.mjs
```

The builder used the GitHub connector only. These commands were not executed in the builder environment and no pass claim is made.

## Clean-gate plan

1. **Make the baseline reproducible.** Run the capture script on the pinned main commit and archive the normalized JSON as CI evidence. Record Node/npm versions and resolve any `indeterminate` result before enforcement.
2. **Freeze regressions.** Run the comparator for every migration branch. New lint/typecheck diagnostics and a newly failing build block integration while existing debt remains visible.
3. **Remove the known lint debt.** Fix the 140 unused-import errors in bounded, reviewable batches. Refresh the pinned baseline only after each accepted cleanup; never increase a fingerprint count.
4. **Classify TypeScript debt from evidence.** Use the first successful typecheck capture to group errors by TypeScript code and domain/file. Assign cleanup batches only after those real categories exist.
5. **Reach clean gates.** Require build PASS plus zero lint and zero typecheck diagnostics. At that point retire debt comparison and make all three root commands strict required checks.
6. **Prevent baseline laundering.** Baseline updates require an explicit reviewed commit SHA, generated capture evidence, and a decrease or documented toolchain migration. A feature branch cannot update its own baseline to conceal regressions.

## Limitations and recommendation

The historical lint total is usable for planning but not file-level regression detection. Historical TypeScript evidence is too coarse for numeric or code-level categorization. Therefore the static ledger is descriptive; enforcement must use fresh paired captures from the pinned baseline and candidate.

Recommendation: **CONDITIONAL GO** for independent validation. The package is suitable for review, but integration enforcement should not be enabled until the task-local tests and one real paired capture have executed in an authenticated checkout with dependencies installed.
