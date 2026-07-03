# Phase 2 Research: Source Path Hardening

## Research Complete

Phase 2 is about preserving source honesty and deterministic ranking while the pan-Mandarin 10k path matures. The current code already has a useful foundation:

- `src/data/panMandarinSources.ts` defines the pan-Mandarin source registry and import audit.
- `src/data/panMandarinVocab.ts` parses TUBELEX, SUBTLEX-CH, HSK 3.0, and TOCFL, then assembles ranked concept entries.
- `src/data/sourceListAudit.ts` audits the older HSK-backed source-list path.
- `tests/engine.test.ts` already checks source modes, parser counts, 10k vocabulary export, variants, and path uniqueness.
- `.planning/PAN_MANDARIN_VOCAB_PLAN.md` records the direction change from HSK backbone to concept-backed pan-Mandarin ranking.

## Current Source Status

File-backed:

- `TUBELEX_CHINESE`
- `SUBTLEX_CH`
- `HSK_3_0_REFERENCE`
- `TBCL_TOCFL_REFERENCE`
- legacy `HSK_3_0`
- legacy `BLCU_FREQUENCY`

Fixture/manual/missing:

- legacy `MOVIE_FREQUENCY` is fixture-backed.
- legacy `BOOK_FREQUENCY` is fixture-backed.
- `SPOKEN_CORPUS` is missing.
- `BALANCED_WRITTEN` is missing.
- `LANCASTER_WRITTEN` is planned with ranking weight 0.
- `MANUAL_USEFULNESS` is manual.

## Implementation Risks

- Do not silently redistribute missing source weights. Missing sources must remain warnings, not invisible scoring changes.
- Do not collapse regional variants into one fake universal word. Shared concepts can group variants, but the variant metadata must preserve script, region, pronunciation, and source refs when available.
- Do not let legacy HSK-path terminology imply HSK is still the 10k ranking backbone.
- Parser changes must not alter `globalRank`, `communicationPathRank`, source membership, or import warnings without explicit tests.
- The current `loadTubelexEntries()` parser reads `source-lists/tubelex-zh.tsv`; the `.xz` file is present but not the active parser input.

## Recommended Plan Shape

1. Source audit contract cleanup: make source roles and import modes clear across docs and generated contracts.
2. Parser and ranking regression hardening: add tests and small diagnostics around deterministic parser/ranking behavior.
3. Regional variant/source documentation: make variant and source-role expectations explicit for future path expansion.

## Validation Architecture

Phase 2 should be verified by:

- `npm.cmd test` for engine/source/path invariants.
- `npm.cmd run web:build` only if generated output contracts or public data shape change.
- Direct inspection of generated `output/source-list-import-audit.json`, `output/pan-mandarin-source-audit.json`, and `output/pan-mandarin-vocab.json` when source contract fields change.

## Must Not Regress

- `buildPanMandarinVocab()` returns 10000 concepts.
- Source audit warnings remain present for missing weighted sources.
- TUBELEX and SUBTLEX parsers load more than 10000 entries.
- HSK and TOCFL membership continue to appear in pan-Mandarin vocabulary.
- At least one entry retains traditional-vs-simplified variant metadata.
- CI authoring and learner-facing output gates remain untouched by source-path cleanup.
