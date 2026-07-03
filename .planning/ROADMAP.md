# Roadmap: Eventually Fluent Mandarin

**Milestone:** v0.1 Stabilize the 10k CI Engine
**Created:** 2026-07-03

## Phase 1: Baseline And Verification

**Goal:** Restore durable GSD project state and verify the current engine baseline before expanding content or product surfaces.

**Requirements:** BASE-01, BASE-02, BASE-03, BASE-04

**Success Criteria:**

1. `.planning/` includes project, requirements, roadmap, state, config, and codebase map files.
2. `npm test` passes and regenerates required outputs.
3. `npm run web:build` passes or any failure is documented with exact cause.
4. A baseline summary records current key generated counts and known concerns.

## Phase 2: Source Path Hardening

**Status:** Complete - 2026-07-03

**Goal:** Keep the 10k vocabulary path honest, source-backed, and resilient as pan-Mandarin ranking and parser work continues.

**Requirements:** SRC-01, SRC-02, SRC-03, SRC-04

**Success Criteria:**

1. Source audit outputs clearly show import mode for each source family.
2. Path tests catch candidate-count, uniqueness, source-membership, and variant regressions.
3. Parser changes preserve deterministic ranking and expose warnings when sources are missing or partial.
4. Documentation distinguishes permission/reference sources from ranking sources.

## Phase 3: CI Authoring Quality Expansion

**Status:** Planned - 2026-07-03

**Goal:** Increase useful CI authoring throughput while preserving strict separation between raw exposure deficits and learner-facing authored lines.

**Requirements:** CI-01, CI-02, CI-03, CI-04, CI-05

**Success Criteria:**

1. Authorable queue remains the source for authoring packets.
2. Bootstrap-only and needs-more-known-vocabulary targets are documented and excluded from normal CI authoring packets.
3. New authored lines pass slot, vocabulary, and naturalness validation before promotion.
4. Coverage reports show deficits without weakening validation.

**Execution Plans:**

- `.planning/phases/03-ci-authoring-quality-expansion/03-01-PLAN.md`: Authorability Contract And Packet Provenance.
- `.planning/phases/03-ci-authoring-quality-expansion/03-02-PLAN.md`: Naturalness Gate Expansion.
- `.planning/phases/03-ci-authoring-quality-expansion/03-03-PLAN.md`: Coverage Deficit Reporting Without Forced Authoring.

## Phase 4: Curriculum, Islands, And Review Queues

**Goal:** Strengthen staged learner-facing content and review-only content flows without letting raw generated content bypass curation.

**Requirements:** CURR-01, CURR-02, CURR-03, CURR-04, CURR-05, CURR-06

**Success Criteria:**

1. Learner-facing sentence and pack outputs remain curated-only.
2. Reading and curriculum tests enforce CI+1 coverage and staged complexity.
3. Island/story outputs stay review-only until curated.
4. Review queues provide enough metadata for human curation decisions.

## Phase 5: Shadowing And SRS Support

**Goal:** Make shadowing and retention support coherent around the same controlled 10k path.

**Requirements:** SHAD-01, SHAD-02, SRS-01, SRS-02

**Success Criteria:**

1. Shadow schedules remain deterministic and path-aligned.
2. SRS daily plans derive from already-seen shadow or sentence-stream items.
3. Product policy tests continue to reject quiz-first or SRS-first drift.
4. Output contracts make shadowing/SRS dependencies clear.

## Phase 6: Local Web App Journey

**Goal:** Align the local web app with the 10k CI/shadowing journey and generated engine contracts.

**Requirements:** WEB-01, WEB-02, WEB-03, WEB-04

**Success Criteria:**

1. First screen presents the learner journey as CI/shadowing, not quizzes.
2. App data comes from `public/data/` generated artifacts.
3. Local storage state remains scoped to learner progress and compatible with regenerated data.
4. `npm run web:build` passes after app changes.

## Completion Criteria

- All v1 requirements are complete or intentionally moved out of scope.
- Tests and web build pass.
- `PROJECT_TRUTH.md`, `.planning/PROJECT.md`, and implementation behavior agree.
- Remaining gaps are captured in `.planning/ISSUES.md` or the next milestone.
