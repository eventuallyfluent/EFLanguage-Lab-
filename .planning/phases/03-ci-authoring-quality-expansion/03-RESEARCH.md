# Phase 3 Research: CI Authoring Quality Expansion

**Created:** 2026-07-03
**Phase:** 3
**Status:** Ready for execution planning

## Objective

Increase useful CI authoring throughput while preserving the product-critical boundary between raw exposure deficits and learner-facing authored CI lines.

## Current Pipeline

The acquisition path feeds `buildCiSentenceTargets()`, which produces repeated exposure targets for the 10k path. `buildCiCurationQueue()` converts those targets into the raw deficit queue and labels each item with an `authorability` state:

- `bootstrap-only`: early path items that need exposure mathematically but are too fragment-prone for normal learner-facing authored CI.
- `needs-more-known-vocabulary`: targets where the known vocabulary pool is still too thin for natural CI+1 authoring.
- `ready`: targets that have enough known vocabulary for short, natural CI+1 authored lines.

`buildAuthorableCiCurationQueue()` filters the raw queue down to `ready` items. Authoring batches, full packets, and compact packets must be built from that authorable queue, not from the raw deficit queue.

## Existing Gates

`validateAuthoredCiSentences()` currently checks:

- packet and slot existence
- target word match
- required target word inclusion
- allowed vocabulary only
- required metadata fields
- review status
- naturalness and usefulness checks

`promoteAuthoredCiSentencesToStream()` revalidates authored input before promotion. Promoted lines become curated stream entries only after validation.

The naturalness gate rejects bootstrap slots, too-short lines, weak fragments, and vague English renderings. This is intentionally strict because the project goal is natural acquisition input, not satisfying exposure math with odd learner-facing content.

## Baseline From Current Engine

The current authored CI path has a small reviewed accepted set and a much larger unresolved exposure deficit. That is acceptable. The correct response is to expose the deficit honestly and expand authorable throughput where vocabulary context supports it, not to weaken the validator.

Prior verified context recorded:

- raw CI queue includes early non-authorable targets
- authorable queue begins after early fragment-pressure targets
- accepted authored CI stream is validated before promotion
- weak fragment-like examples are rejected even when they can satisfy a slot mechanically

## Risks

- Accidentally feeding `ci-curation-queue.json` into authoring packets would create pressure to author bootstrap fragments.
- Expanding authored input without stronger test coverage could promote robotic or vague lines.
- Coverage reports can be misread as "every deficit should be authored now" unless they explicitly preserve authorability states.
- Exact generated counts may shift as source data grows, so tests should prefer contract assertions over brittle full-output snapshots unless a count is part of the baseline record.

## Execution Strategy

Plan 03-01 should lock packet provenance and authorability contract behavior.

Plan 03-02 should expand naturalness tests and any needed validator messages without changing accepted authored content by accident.

Plan 03-03 should make remaining deficits visible by authorability class and document that non-ready deficits are not normal authoring work.

## Verification Commands

```powershell
npm.cmd test
npm.cmd run web:build
```

Use `npm.cmd`, not `npm`, on this Windows machine. If `web:build` fails under sandbox permissions while resolving Vite/esbuild, rerun it outside the sandbox with approval and record the exact cause.
