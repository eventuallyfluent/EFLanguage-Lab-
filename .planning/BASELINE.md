# Baseline: 2026-07-03

## Verification

- `npm.cmd test`: passed.
- Test result: 43 passed, 0 failed.
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
- Sentence stream items: 49.
- Review-only sentences: 23.
- Blocked CI sentences: 20.
- CI sentence targets: 10000.
- CI targets needing curation: 9960.
- CI curation queue: 500.
- Authorable CI curation queue: 476.
- CI authoring packets: 4.
- CI authoring packet slots: 976.
- Authored CI sentences accepted: 24.
- Authored CI sentences rejected: 0.
- Promoted authored CI stream items: 24.
- Total CI exposure deficit: 98351.
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
- Current counts after Phase 3 plan 03-02 verification: raw queue 500, authorable queue 476, authoring packets 4, packet slots 976, accepted authored CI sentences 24, rejected authored CI sentences 0.
- Authored CI naturalness regression coverage includes weak fragment renderings, vague English renderings, and promotion failure for naturalness-invalid authored lines.

## Next Route

Phase 3 is in execution. Next GSD action is to continue with plan 03-03: Coverage Deficit Reporting Without Forced Authoring.
