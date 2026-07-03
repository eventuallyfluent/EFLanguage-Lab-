---
phase: 04-curriculum-islands-and-review-queues
plan: 01
subsystem: testing
tags: [curriculum, curated-output, draft-output, review-only]
requires:
  - phase: 03-ci-authoring-quality-expansion
    provides: authoring boundary separation between raw deficits and learner-facing content
provides:
  - full-generation regression coverage for active, locked, draft, and review-only content surfaces
  - duplicate active/locked sentence mapping fix for the light transport pack
affects: [curriculum, generator, phase-04]
tech-stack:
  added: []
  patterns: [generator output boundary regression tests]
key-files:
  created:
    - .planning/phases/04-curriculum-islands-and-review-queues/04-01-SUMMARY.md
  modified:
    - tests/engine.test.ts
    - src/data/curriculumContent.ts
    - .planning/BASELINE.md
key-decisions:
  - "Active and locked sentence exports must not share sentence IDs."
  - "Draft sentence IDs can remain template-local, but draft lines must not be pack-backed or learner-facing."
patterns-established:
  - "Full generation tests should assert surface boundaries together, not only individual helper outputs."
requirements-completed: [CURR-01, CURR-02]
duration: 35min
completed: 2026-07-03
---

# Phase 4 Plan 01: Learner-Facing Curriculum Boundary Hardening Summary

**Full-generation regression tests for curated active packs, locked packs, draft material, and review-only sentence-stream report separation**

## Performance

- **Duration:** 35 min
- **Started:** 2026-07-03T12:45:00Z
- **Completed:** 2026-07-03T13:20:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Added full-generation coverage proving active learner-facing sentences and active packs remain curated and pack-backed.
- Added draft-only coverage proving generated draft sentences stay untracked by packs and marked not learner-facing.
- Fixed a real active/locked content boundary leak: `pack-300-transit-light` no longer reuses active 100-tier sentence `curated-050`.

## Task Commits

1. **Tasks 1-3: Boundary audit, regression coverage, baseline refresh** - `c3f9412` (test)

## Files Created/Modified

- `tests/engine.test.ts` - Adds generator boundary tests for active, locked, draft, and review-only surfaces.
- `src/data/curriculumContent.ts` - Replaces duplicate locked-pack sentence `curated-050` with transport/location line `curated-081`.
- `.planning/BASELINE.md` - Records updated test count and Phase 4 boundary notes.

## Decisions Made

- Active and locked exports must not share sentence IDs. This keeps current lessons and future locked lessons distinct for downstream consumers.
- Review-only sentence-stream report items can reference curated source sentences, but they must not enter the active CI stream.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Duplicate active/locked curriculum sentence mapping**
- **Found during:** Task 2 (Add curated-only regression coverage)
- **Issue:** `curated-050` appeared in both active 100-tier output and locked `pack-300-transit-light` output.
- **Fix:** Replaced `curated-050` with existing transport/location sentence `curated-081` in the locked light transport pack.
- **Files modified:** `src/data/curriculumContent.ts`
- **Verification:** `npm.cmd test` passed with 49/49 tests.
- **Committed in:** `c3f9412`

---

**Total deviations:** 1 auto-fixed bug.
**Impact on plan:** The auto-fix was required to satisfy the boundary contract. No unrelated scope was added.

## Issues Encountered

- Initial test assertion assumed review-only report item IDs could not overlap active curated source IDs. The model correctly uses curated source sentence IDs for known-only review lines, so the assertion was narrowed to the actual contract: review-only report items must not enter the active CI sentence stream or draft pool.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for `04-02`: Reading And Tier Policy Regression Gates.

---
*Phase: 04-curriculum-islands-and-review-queues*
*Completed: 2026-07-03*
