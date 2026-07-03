# Baseline: 2026-07-03

## Verification

- `npm.cmd test`: passed.
- Test result: 51 passed, 0 failed after Phase 4 plan 04-02.
- `npm.cmd run web:build`: passed after rerunning outside the filesystem sandbox.
- Initial web build failure cause: Vite/esbuild could not read parent directories under sandbox restrictions and could not resolve `vite.config.ts`.

## Generated Counts

- Lexicon entries: 157.
- Acquisition path target: 10000.
- Acquisition path candidates: 10000.
- Pan-Mandarin vocabulary entries: 10000.
- Pan-Mandarin CI candidates: 10000.
- Pan-Mandarin accepted review candidates: 4807.
- Pan-Mandarin needs-human-review candidates: 3375.
- Learner-facing curated sentences: 51.
- Locked learner-facing future sentences: 16 after removing early work/health sentence mappings from pre-2000 packs.
- Sentence stream items: 47.
- Review-only sentences: 22.
- Blocked CI sentences: 22.
- CI sentence targets: 10000.
- CI targets needing curation: 9961.
- CI curation queue: 500.
- Authorable CI curation queue: 476.
- CI authoring packets: 4.
- CI authoring packet slots: 976.
- Authored CI sentences accepted: 24.
- Authored CI sentences rejected: 0.
- Promoted authored CI stream items: 24.
- Total CI exposure deficit: 98353.
- Daily shadow days: 1000.
- Daily shadow items: 10000.
- SRS daily plan days: 1000.
- Curriculum packs: 8.
- Locked packs: 7.
- Dialogues: 8.
- Readings: 8.
- Pan-Mandarin content review queue: 164.

## Source Modes

Legacy source-list modes:

- `HSK_3_0`: file.
- `MOVIE_FREQUENCY`: fixture.
- `BOOK_FREQUENCY`: fixture.
- `BLCU_FREQUENCY`: file.

Pan-Mandarin source modes:

- `TUBELEX_CHINESE`: file.
- `SUBTLEX_CH`: file.
- `SPOKEN_CORPUS`: missing.
- `BALANCED_WRITTEN`: missing.
- `HSK_3_0_REFERENCE`: file.
- `TBCL_TOCFL_REFERENCE`: file.
- `LANCASTER_WRITTEN`: missing.
- `MANUAL_USEFULNESS`: manual.

## Current Warnings

- `MOVIE_FREQUENCY` is not file-backed yet.
- `BOOK_FREQUENCY` is not file-backed yet.
- `SPOKEN_CORPUS` is missing.
- `BALANCED_WRITTEN` is missing.

## Variant Baseline

- The pan-Mandarin concept model currently exports one primary variant per concept.
- Shared HSK/TBCL concepts can preserve simplified and traditional forms, such as `我们` / `我們`.
- Taiwan-reference-only concepts can preserve `region: "taiwan"` and `pronunciationRegion: "standard-taiwan"` when no HSK simplified pairing is available.
- Future work must not collapse regional/script variants into one fake universal word.

## CI Authoring Baseline

- Raw CI curation queue is deficit accounting, not a normal authoring source.
- Authorable CI curation queue contains only `authorability: "ready"` items.
- CI curation batches and authoring packets must be built from the authorable queue; batch construction rejects `bootstrap-only` and `needs-more-known-vocabulary` items.
- Current first authorable target starts at word index 25.
- Current counts after Phase 3 plan 03-03 verification: raw queue 500, authorable queue 476, authoring packets 4, packet slots 976, accepted authored CI sentences 24, rejected authored CI sentences 0.
- CI coverage authorability summary: ready targets 9976 / ready exposure deficit 98111; bootstrap-only targets 16 / deficit 160; needs-more-known-vocabulary targets 8 / deficit 80; non-authorable targets 24 / deficit 240.
- Authored CI naturalness regression coverage includes weak fragment renderings, vague English renderings, and promotion failure for naturalness-invalid authored lines.

## Next Route

Phase 4 is in progress. Plans `04-01` and `04-02` are complete; continue with plan `04-03`: Pan-Mandarin Review Queue Metadata.

Phase 4 plan set:

- `04-01`: Learner-Facing Curriculum Boundary Hardening.
- `04-02`: Reading And Tier Policy Regression Gates.
- `04-03`: Pan-Mandarin Review Queue Metadata.
- `04-04`: Curriculum Output Contract And Web Data Alignment.

## Phase 4 Boundary Notes

- Full generation now has regression coverage for active learner-facing packs, locked packs, draft sentences, and review-only sentence-stream report items.
- `pack-300-transit-light` no longer reuses active 100-tier sentence `curated-050`; it uses transport/location sentence `curated-081` instead.
- Curriculum validation now rejects readings outside 95-98% known coverage, readings with no controlled new word, reading lines with more than two new words, and hidden forbidden themes on sentences, dialogues, or readings.
- Pre-2000 packs no longer use work/health-tagged source sentences through benign pack tags.
- Pan-Mandarin content review queue items now include normalized source item metadata, max allowed communication rank, coverage target, suggested curation action, and blocking reasons.
