---
phase: 2
plan: 2
status: complete
completed: 2026-07-03
---

# Summary 02-02: Parser And Ranking Regression Hardening

## One-Liner

Added deterministic parser and ranking invariants for the pan-Mandarin 10k vocabulary path.

## Completed Tasks

- Strengthened parser tests for TUBELEX, SUBTLEX-CH, HSK, and TOCFL raw source fields.
- Added deterministic first-page concept ID assertions for `buildPanMandarinVocab()`.
- Verified `communicationPathRank` uniqueness across all 10000 concepts.
- Added representative source-membership and variant metadata assertions for high-priority entries.

## Verification

- `npm.cmd test`: passed, 44 tests, 0 failures.

## Key Files

- `tests/engine.test.ts`

## Deviations

- No production ranking formula changes were needed; this plan was completed as regression coverage only.

## Self-Check: PASSED
