# Eventually Fluent Mandarin

## What This Is

Eventually Fluent Mandarin is a local-first Mandarin acquisition engine and app for adult learners. It builds a source-backed 10k vocabulary path, then turns that path into controlled CI+1 sentence exposure, shadowing material, staged readings, language islands, and SRS support.

This is not a quiz app, not an SRS-first app, and not a generic lesson-pack app. The product is a Glossika-style acquisition journey where learners repeatedly hear, read, and shadow natural controlled Mandarin that expands one step at a time.

## Core Value

The engine must produce a natural, source-backed 10k CI+1 Mandarin sentence ladder that can carry acquisition; every other surface supports that ladder.

## Requirements

### Validated

- [x] Source-backed 10k vocabulary path exists with file-backed HSK, TUBELEX, SUBTLEX-CH, and TOCFL inputs represented in engine outputs.
- [x] CI+1 path, sentence targets, curation queue, authorable queue, authoring packets, validation report, promoted authored stream, and coverage report are generated.
- [x] Learner-facing sentence output is curated-only and separated from draft/review-only generation.
- [x] Authored CI intake is file-backed and rejects slot-valid but unnatural fragments.
- [x] Language islands and adult operating-life content are gated behind later known-word thresholds.
- [x] SRS support is derived only after CI or shadow exposure and is not the primary loop.
- [x] Daily shadow schedule and 1000-day curriculum scaffolding exist.
- [x] Tests encode product-policy, naturalness, source, CI, reading, island, shadowing, and SRS invariants.

### Active

- [ ] Harden the current generated baseline so counts, source modes, and policy outputs are documented and reproducible.
- [ ] Expand authorable CI coverage without weakening naturalness gates or forcing early fragments.
- [ ] Improve source-backed pan-Mandarin path quality while keeping import-mode honesty visible.
- [ ] Turn review-only islands, stories, and shadow material into a stronger curation workflow.
- [ ] Keep the local web app aligned with the 10k CI/shadowing journey rather than quiz-first UX.

### Out of Scope

- Quiz-first learning loop - contradicts the primary CI+1 acquisition contract.
- SRS-first product direction - SRS remains retention support after input.
- Freeform generated Mandarin for learners - learner-facing output must be curated or validated.
- Ungated adult logistics at beginner stages - work, health, money pressure, admin pressure, and heavier logistics remain staged for later thresholds.
- Hidden or overstated source coverage - file-backed, fixture-backed, and missing source modes must remain visible.
- Hand-stitching learner-facing sentence output to satisfy counts - engine/pipeline quality matters more than raw volume.

## Context

- The current codebase is TypeScript with deterministic generation through `src/generator.ts`.
- The web app is Vite/React and consumes generated JSON from `public/data/`.
- The authoritative product invariant is `PROJECT_TRUTH.md`.
- Current outputs include the legacy HSK-backed path and newer pan-Mandarin concept-backed artifacts.
- The repo previously had no `.planning` directory in this checkout; this baseline restores GSD state.
- The workspace was not a Git repo before initialization in this session.
- Prior validated work introduced an authorable CI queue and naturalness gate so early exposure deficits do not force weak lines into learner-facing output.

## Constraints

- **Product hierarchy**: CI+1 sentence stream is primary; shadowing uses the same controlled material; SRS is support only.
- **Vocabulary provenance**: Vocabulary must come from approved source families and expose source membership/import mode.
- **Content quality**: Natural learner-facing Mandarin beats mathematical coverage counts.
- **Simplified-first current engine**: Current learner-facing Mandarin output uses simplified Chinese; pan-Mandarin data tracks variants where available.
- **Local-first runtime**: Generation and web app run locally from files; no external service is required.
- **Determinism**: Output JSON should be reproducible from source files and engine code.
- **Testing**: Engine and policy changes should run through `npm test`; web surface changes should also run `npm run web:build`.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Treat `PROJECT_TRUTH.md` as binding | It resolves conflict between older HSK-MVP wording and the current pan-Mandarin 10k engine direction. | Good |
| Keep CI+1 as primary acquisition engine | The user's product premise is acquisition through controlled input, not recall drills. | Good |
| Keep authored CI intake file-backed | It creates an auditable human/review boundary for learner-facing sentences. | Good |
| Reject weak early fragments even when slot-valid | Naturalness and usefulness are separate gates from structural slot validity. | Good |
| Initialize GSD planning from current brownfield code | This checkout had engine code but no `.planning` state. | Pending |

---
*Last updated: 2026-07-03 after GSD brownfield baseline initialization*
