# Phase 4 Research: Curriculum, Islands, And Review Queues

**Date:** 2026-07-03
**Status:** Complete

## Objective

Plan the next hardening pass for learner-facing curriculum, gated language islands, and pan-Mandarin review queues without weakening the source-backed 10k CI+1 path.

## Current State

- Learner-facing `sentences.json` is produced from curated pack-backed content.
- `draft-sentences.json` remains generated template review material with `reviewStatus: "draft"`.
- `review-only-sentences.json`, pan-Mandarin island queues, story queues, premade islands, and premade stories already use `reviewStatus: "review-only"`.
- Curriculum packs currently cover active early tiers and locked future packs. Existing tests check curated-only sentences, pack staging, CI+1 readings, island thresholds, and review-only pan-Mandarin queues.
- Phase 3 established that raw exposure deficits are accounting data, not automatic authoring or learner-facing content.

## Risks

1. Learner-facing exports could silently accept draft, validated, or review-only material if generator boundaries are changed later.
2. Reading coverage tests could pass while still allowing weak placeholder readings or adult-theme content in early tiers.
3. Pan-Mandarin island and story queues could become large but not actionable if review metadata is too thin.
4. Web-facing data copies could blur the difference between active curriculum, locked curriculum, draft material, and review-only material.

## Planning Direction

Phase 4 should harden contracts and review flow before adding broad new content. The engine already has enough surface area that a content expansion without stronger boundaries would make the repo harder to trust.

## Plan Set

1. `04-01-PLAN.md`: harden curated-only learner-facing curriculum boundaries.
2. `04-02-PLAN.md`: strengthen reading coverage and tier policy regression gates.
3. `04-03-PLAN.md`: make pan-Mandarin review queues more actionable while keeping them review-only.
4. `04-04-PLAN.md`: align generated output and web data contracts around learner-facing versus review-only surfaces.

## Verification

Each implementation plan should run:

- `npm.cmd test`

Plans that touch `src/generator.ts`, `src/web/`, or public data shape should also run:

- `npm.cmd run web:build`

On this machine, `web:build` may require a sandbox-escalated rerun because Vite/esbuild needs parent-directory reads.
