# Architecture

## System Shape

- The project is a deterministic local generation engine plus a local Vite/React viewer.
- The generator is the source of truth for product outputs.
- Learner-facing surfaces consume generated JSON instead of recomputing engine state in the browser.

## Main Entry Points

- `src/index.ts` calls `generateAll()` and prints a summary of generated counts.
- `src/generator.ts` orchestrates all engine modules and writes JSON outputs.
- `src/web/main.tsx` mounts the React app.
- `src/web/App.tsx` reads generated data and renders the local learner/operator surface.

## Core Engine Layers

- Vocabulary and source data live under `src/data/`.
- `src/data/lexicon.ts`, `src/data/hskExpansion.ts`, and `src/data/lexiconBuilder.ts` build the HSK-backed lexicon.
- `src/data/panMandarinVocab.ts`, `src/data/panMandarinSources.ts`, and related files build the pan-Mandarin concept-backed path.
- `src/pathEngine.ts` builds the 10k acquisition path, sentence stream, island unlocks, article unlocks, and SRS support.
- `src/ciEngine.ts` builds CI stages, sentence targets, curation queues, authorable queues, curation batches, and authoring packets.
- `src/ciAuthoringIntake.ts` validates authored CI sentences and promotes accepted lines into the sentence stream.
- `src/shadowCurriculum.ts` builds the daily shadow schedule, SRS daily plan, session plan, and curriculum roadmap.

## Content Layers

- Curated beginner content lives in `src/data/curatedSentences.ts` and `src/data/curriculumContent.ts`.
- Template-generated drafts come from `src/templates.ts` and `src/generator.ts`, but drafts are not learner-facing.
- Pan-Mandarin candidate and review-only content lives in `src/data/panMandarinCi.ts` and `src/data/panMandarinContentQueues.ts`.

## Policy Layers

- `PROJECT_TRUTH.md` is the product-direction invariant.
- `src/productPolicy.ts` codifies the 10k CI+1 path, shadowing, SRS support role, and non-goals.
- `src/progression.ts` gates content by known-word thresholds.
- `src/curriculum.ts` validates tier policy, forbidden themes, reading references, and pack structure.
- `src/quality.ts` validates CI+1 math, reading coverage, duplicate signatures, and sentence stream behavior.
- `src/compatibility.ts` rejects invalid semantic combinations.

## Data Flow

1. Load source-backed and fixture-backed vocabulary data.
2. Build the HSK-backed lexicon and pan-Mandarin 10k vocabulary path.
3. Build curated sentence streams, review-only candidates, CI targets, queues, authoring packets, shadow schedules, stories, islands, articles, and SRS support.
4. Validate authored intake against compact authoring packets and naturalness gates.
5. Merge promoted authored lines into the curated sentence stream.
6. Write deterministic JSON outputs to `output/` and `public/data/`.

## Architectural Constraints

- CI+1 sentence exposure is the primary acquisition path.
- Shadowing uses the same controlled sentence material.
- SRS is derived after CI exposure and remains a support layer.
- Articles and language islands are gated by known-word thresholds and coverage.
- Raw template or review-only output must not become learner-facing content without explicit curation gates.
