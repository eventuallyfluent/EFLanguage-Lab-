---
phase: 04-curriculum-islands-and-review-queues
plan: 02
subsystem: testing
tags: [curriculum, readings, ci-plus-one, tier-policy]
requires:
  - phase: 04-curriculum-islands-and-review-queues
    provides: curated active/locked/draft boundary tests
provides:
  - negative regression tests for reading coverage and new-word load
  - sentence/dialogue/reading theme validation for early curriculum tiers
  - corrected pre-2000 pack mappings away from work/health source lines
affects: [curriculum, readings, progression, phase-04]
tech-stack:
  added: []
  patterns: [negative validator tests before curriculum expansion]
key-files:
  created:
    - .planning/phases/04-curriculum-islands-and-review-queues/04-02-SUMMARY.md
  modified:
    - src/curriculum.ts
    - src/data/curriculumContent.ts
    - tests/engine.test.ts
    - .planning/BASELINE.md
key-decisions:
  - "1000-tier practical bridge content also forbids work themes, not only health themes."
  - "Resolved pack sentences preserve source sentence themes in addition to pack themes."
patterns-established:
  - "Curriculum validators must reject hidden forbidden themes below the allowed tier."
requirements-completed: [CURR-03, CURR-04, CURR-05]
duration: 40min
completed: 2026-07-03
---

# Phase 4 Plan 02: Reading And Tier Policy Regression Gates Summary

**CI+1 reading math and early-tier adult-theme validators with corrected pre-2000 curriculum mappings**

## Performance

- **Duration:** 40 min
- **Started:** 2026-07-03T13:20:00Z
- **Completed:** 2026-07-03T14:00:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Added negative tests for invalid reading coverage, excessive new-word load, and zero-new-word placeholder readings.
- Added negative tests for hidden early work/health themes even when pack-level tags look benign.
- Tightened `validateCurriculumPack()` to check reading coverage, controlled new-word presence, max new words per line, and forbidden themes on sentences, dialogues, and readings.
- Preserved source sentence theme tags during pack resolution so adult-theme source lines cannot be masked by pack tags.
- Replaced work/health-tagged source sentences in 300-tier and 1000-tier packs with existing reviewed time/transport/school-safe lines.

## Task Commits

1. **Tasks 1-3: Reading and tier policy gates** - `206a98a` (test)

## Files Created/Modified

- `src/curriculum.ts` - Adds stricter reading and theme validation; forbids work in 1000-tier.
- `src/data/curriculumContent.ts` - Preserves source themes and replaces early work/health sentence mappings.
- `tests/engine.test.ts` - Adds negative validator regression tests.
- `.planning/BASELINE.md` - Records updated counts after stricter staging.

## Decisions Made

- Work content belongs at 2000+ even for practical bridge packs. The 1000-tier policy now explicitly forbids both work and health.
- Pack-resolved sentence `themeTags` are now the union of source sentence tags and pack tags. This makes validation honest instead of hiding source semantics.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Early packs masked work/health source sentence themes**
- **Found during:** Task 2 (Add staged theme rejection tests)
- **Issue:** Pack resolution overwrote sentence tags, hiding health/work source lines inside 300-tier and 1000-tier packs.
- **Fix:** Preserve source sentence tags and replace early work/health source mappings with existing reviewed time/transport/school-safe lines.
- **Files modified:** `src/data/curriculumContent.ts`, `src/curriculum.ts`
- **Verification:** `npm.cmd test` passed with 51/51 tests.
- **Committed in:** `206a98a`

---

**Total deviations:** 1 auto-fixed bug.
**Impact on plan:** The auto-fix was necessary to make staged theme validation meaningful. No new content was hand-authored.

## Issues Encountered

None - tests and generation passed after tightening the validator and correcting mappings.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for `04-03`: Pan-Mandarin Review Queue Metadata.

---
*Phase: 04-curriculum-islands-and-review-queues*
*Completed: 2026-07-03*
