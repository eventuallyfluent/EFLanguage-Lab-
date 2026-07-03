---
phase: 3
plan: 3
title: Coverage Deficit Reporting Without Forced Authoring
status: complete
completed: 2026-07-03
---

# Summary: 03-03 Coverage Deficit Reporting Without Forced Authoring

## Completed

- Added `authorabilitySummary` to `ci-coverage-report.json`.
- Report now separates ready deficits from bootstrap-only and needs-more-known-vocabulary deficits.
- Updated CI pipeline contract text to mention authorability-aware deficit reporting.
- Updated the local web app data type and engine metrics to display ready exposure deficit.
- Added tests reconciling authorability buckets with total curation targets and total exposure deficit.
- Updated `.planning/BASELINE.md` with current Phase 3 output counts.

## Verification

```powershell
npm.cmd test
C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe -Command "npm.cmd run web:build"
```

Result: passed, 47 tests. Web build passed outside the sandbox.

## Key Files

- `src/ciEngine.ts`
- `src/models.ts`
- `src/ciPipeline.ts`
- `src/web/App.tsx`
- `tests/engine.test.ts`
- `.planning/BASELINE.md`

## Notes

- A sandboxed `web:build` rerun hit the known Vite/esbuild parent-directory access issue. An earlier attempt also hit a transient Windows `EBUSY` lock on `dist/src/generator.js`. The elevated rerun passed.
