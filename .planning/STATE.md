# State: Eventually Fluent Mandarin

**Updated:** 2026-07-03
**Status:** Phase 3 planned; ready to execute

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-07-03)

**Core value:** The engine must produce a natural, source-backed 10k CI+1 Mandarin sentence ladder that can carry acquisition; every other surface supports that ladder.
**Current focus:** Phase 3 - CI Authoring Quality Expansion

## Current Position

- GSD planning state was missing from this checkout.
- Codebase map has been created under `.planning/codebase/`.
- Git was initialized in this workspace after the initial `git init` failed under sandbox write restrictions for `.git`.
- Project, requirements, roadmap, config, issue tracking, and baseline verification have been initialized from the current codebase and `PROJECT_TRUTH.md`.

## Completed Phase

### Phase 1: Baseline And Verification

**Goal:** Restore durable GSD project state and verify the current engine baseline before expanding content or product surfaces.

**Completed:**

- Created `.planning/` baseline.
- Created codebase map.
- Ran `npm.cmd test`: 43 passed, 0 failed.
- Ran `npm.cmd run web:build`: passed after sandbox-escalated rerun.
- Recorded generated counts in `.planning/BASELINE.md`.

## Completed Phase

### Phase 2: Source Path Hardening

**Goal:** Keep the 10k vocabulary path honest, source-backed, and resilient as pan-Mandarin ranking and parser work continues.

**Plans:**

- `02-01-PLAN.md`: Source Audit Contract Cleanup.
- `02-02-PLAN.md`: Parser And Ranking Regression Hardening.
- `02-03-PLAN.md`: Variant And Source Role Documentation.

**Completed:**

- Clarified source audit roles and notes for legacy and pan-Mandarin source families.
- Updated project metadata away from the old HSK-only description.
- Added parser field invariants for TUBELEX, SUBTLEX-CH, HSK, and TOCFL.
- Added deterministic first-page ranking and communication path rank tests.
- Added representative script/region/source-reference variant tests.
- Documented pan-Mandarin variant invariants.
- Verified `npm.cmd test`: 45 passed, 0 failed.
- Verified `npm.cmd run web:build`: passed after sandbox-escalated rerun.

## Current Phase

### Phase 3: CI Authoring Quality Expansion

**Goal:** Increase useful CI authoring throughput while preserving strict separation between raw exposure deficits and learner-facing authored lines.

**Open tasks:**

Phase 3 has been planned into three atomic execution plans:

- `03-01-PLAN.md`: Authorability Contract And Packet Provenance.
- `03-02-PLAN.md`: Naturalness Gate Expansion.
- `03-03-PLAN.md`: Coverage Deficit Reporting Without Forced Authoring.

Remaining work is execution and verification.

## Key Decisions

- `PROJECT_TRUTH.md` is authoritative when older metadata or docs conflict with current engine direction.
- The project is treated as a brownfield codebase, not a new greenfield scaffold.
- Naturalness gates are product-critical and should not be weakened to satisfy coverage math.
- Learner-facing output must stay curated or explicitly validated.
- SRS and quizzes must not replace the CI+1 sentence ladder as the primary loop.
- Raw CI exposure deficits are not automatically authorable work; authoring packets must derive from the authorable queue.

## Known Concerns

- This checkout was not a Git repository before this session.
- `package.json` description still says "controlled HSK 3.0 vocabulary" and may understate the current pan-Mandarin 10k direction.
- Generated JSON exists in multiple locations; source code and source lists should be edited instead of hand-editing output.
- Verification may touch many generated files.

## Recent Work

- Created `.planning/codebase/STACK.md`.
- Created `.planning/codebase/INTEGRATIONS.md`.
- Created `.planning/codebase/ARCHITECTURE.md`.
- Created `.planning/codebase/STRUCTURE.md`.
- Created `.planning/codebase/CONVENTIONS.md`.
- Created `.planning/codebase/TESTING.md`.
- Created `.planning/codebase/CONCERNS.md`.
- Created `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/config.json`, and `.planning/ISSUES.md`.
- Created `.planning/BASELINE.md`.
- Verified `npm.cmd test`.
- Verified `npm.cmd run web:build`.
- Created Phase 2 research and execution plans under `.planning/phases/02-source-path-hardening/`.
- Completed `02-01`: Source Audit Contract Cleanup.
- Completed `02-02`: Parser And Ranking Regression Hardening.
- Completed `02-03`: Variant And Source Role Documentation.
- Created `.planning/phases/02-source-path-hardening/02-VERIFICATION.md`.
- Created Phase 3 research and execution plans under `.planning/phases/03-ci-authoring-quality-expansion/`.

## Next Action

Run `$gsd-execute-phase 3` to execute the CI Authoring Quality Expansion plans.
