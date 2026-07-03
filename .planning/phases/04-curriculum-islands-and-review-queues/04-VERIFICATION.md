---
phase: 04-curriculum-islands-and-review-queues
status: passed
verified: 2026-07-03
automated_checks:
  - npm.cmd test
  - npm.cmd run web:build
---

# Phase 4 Verification: Curriculum, Islands, And Review Queues

## Goal

Strengthen staged learner-facing content and review-only content flows without letting raw generated content bypass curation.

## Result

Passed.

## Must-Haves

- **Learner-facing sentence and pack outputs remain curated-only:** Verified by full-generation boundary tests and generated `curriculum-content-contract.json`.
- **Reading and curriculum tests enforce CI+1 coverage and staged complexity:** Verified by negative reading math tests and stricter `validateCurriculumPack()` checks.
- **Island/story outputs stay review-only until curated:** Verified by pan-Mandarin island/story queue tests and review queue metadata checks.
- **Review queues provide enough metadata for human curation decisions:** Verified by source item metadata, max rank, coverage target, suggested curation action, blocking reasons, and review reasons on each review queue item.

## Verification Commands

- `npm.cmd test`: passed, 52/52 tests.
- `npm.cmd run web:build`: passed after sandbox-escalated rerun; sandboxed run failed with the known Vite/esbuild parent-directory access issue.

## Evidence

- `output/curriculum-content-contract.json` and `public/data/curriculum-content-contract.json` are generated during `generateAll("output")`.
- Active learner-facing surfaces allow only curated content.
- Draft and review-only surfaces are explicitly marked as not learner-facing or human-curation-required.
- Pre-2000 curriculum validation rejects hidden work/health themes and invalid CI+1 reading math.

## Human Verification

None required for this phase.
