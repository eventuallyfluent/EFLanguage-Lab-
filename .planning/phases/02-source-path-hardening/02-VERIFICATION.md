---
phase: 2
status: passed
verified: 2026-07-03
---

# Verification: Phase 2 Source Path Hardening

## Result

Passed.

## Phase Goal

Keep the 10k vocabulary path honest, source-backed, and resilient as pan-Mandarin ranking and parser work continues.

## Must-Have Checks

- Source audit outputs clearly show import mode for each source family: passed.
- Tests catch candidate-count, uniqueness, source-membership, parser, ranking, and variant regressions: passed.
- Parser changes preserve deterministic ranking and expose warnings when sources are missing or partial: passed.
- Documentation distinguishes permission/reference sources from ranking sources: passed.

## Automated Verification

- `npm.cmd test`: passed, 45 tests, 0 failures.
- `npm.cmd run web:build`: passed after rerunning outside the filesystem sandbox.

## Notes

- The initial sandboxed web build failed because Vite/esbuild could not read parent directories and could not resolve `vite.config.ts`.
- The escalated rerun passed and produced `web-dist/` successfully.
- Missing weighted sources remain visible: `SPOKEN_CORPUS` and `BALANCED_WRITTEN`.
- Legacy fixture-backed sources remain visible: `MOVIE_FREQUENCY` and `BOOK_FREQUENCY`.
