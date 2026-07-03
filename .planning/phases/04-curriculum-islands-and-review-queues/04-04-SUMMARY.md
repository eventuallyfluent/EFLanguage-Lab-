---
phase: 04-curriculum-islands-and-review-queues
plan: 04
subsystem: data
tags: [curriculum-contract, public-data, web-build]
requires:
  - phase: 04-curriculum-islands-and-review-queues
    provides: review queue metadata and staged curriculum gates
provides:
  - generated curriculum content contract
  - public data copy for web consumers
  - tests for active, locked, draft, review-only, and support surface roles
affects: [generator, public-data, web-app, phase-04]
tech-stack:
  added: []
  patterns: [generated contract for content-surface policy]
key-files:
  created:
    - .planning/phases/04-curriculum-islands-and-review-queues/04-04-SUMMARY.md
  modified:
    - src/generator.ts
    - src/models.ts
    - tests/engine.test.ts
    - .planning/BASELINE.md
key-decisions:
  - "The engine publishes the content-surface contract instead of making the web app duplicate policy logic."
  - "Generated JSON remains ignored; source code owns the contract."
patterns-established:
  - "New generated data contracts should be written to both output/ and public/data/."
requirements-completed: [CURR-01, CURR-02, CURR-03, CURR-04, CURR-05, CURR-06]
duration: 35min
completed: 2026-07-03
---

# Phase 4 Plan 04: Curriculum Output Contract And Web Data Alignment Summary

**Generated curriculum content contract distinguishing learner-facing, locked-future, draft-review, review-only, and support surfaces**

## Performance

- **Duration:** 35 min
- **Started:** 2026-07-03T14:25:00Z
- **Completed:** 2026-07-03T15:00:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Added `CurriculumContentContract` model types.
- Generated `curriculum-content-contract.json` to both `output/` and `public/data/`.
- Added contract tests proving surface roles, counts, allowed statuses, and output/public paths.
- Verified `npm.cmd test`: 52 passed, 0 failed.
- Verified `npm.cmd run web:build`: passed after sandbox-escalated rerun.

## Task Commits

1. **Tasks 1-3: Output contract and web data alignment** - `97739b7` (feat)

## Files Created/Modified

- `src/models.ts` - Adds curriculum content contract types.
- `src/generator.ts` - Builds and writes the contract to engine and public data outputs.
- `tests/engine.test.ts` - Adds generated contract assertions.
- `.planning/BASELINE.md` - Records final Phase 4 verification and contract note.

## Decisions Made

- The generated contract is the source of truth for consumer-facing content surfaces. The web app receives it through `public/data/` and does not need separate policy constants.
- The contract includes support surfaces such as `srs-support` to make clear that SRS is downstream of CI exposure, not primary learner-facing curriculum.

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

- `npm.cmd run web:build` failed inside the sandbox because Vite/esbuild could not read parent directories or resolve `vite.config.ts`. The same command passed on the required escalated rerun.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 4 is ready for phase-level verification and completion.

---
*Phase: 04-curriculum-islands-and-review-queues*
*Completed: 2026-07-03*
