---
phase: 3
plan: 1
title: Authorability Contract And Packet Provenance
status: complete
completed: 2026-07-03
---

# Summary: 03-01 Authorability Contract And Packet Provenance

## Completed

- Enforced `buildCiCurationBatches()` so it rejects non-ready raw queue items.
- Updated CI pipeline contract text to state that authoring packets originate from authorability-ready targets.
- Strengthened tests proving raw queue items can be non-authorable, batch construction rejects the raw queue, and authoring packets are built from ready targets.
- Updated `.planning/BASELINE.md` with the current CI authoring contract and counts.

## Verification

```powershell
npm.cmd test
```

Result: passed, 45 tests.

## Key Files

- `src/ciEngine.ts`
- `src/ciPipeline.ts`
- `tests/engine.test.ts`
- `.planning/BASELINE.md`

## Deviations

- The plan allowed contract clarification as metadata; implementation also made the contract executable by rejecting non-ready queue items at batch construction.
