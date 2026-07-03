# Integrations

## External Services

- There are no network API integrations in the current app.
- There is no external database, authentication provider, payment provider, or webhook receiver.
- The engine is local-first and deterministic from repository files.

## File-Backed Data Sources

- `source-lists/hsk30.csv` provides the HSK 3.0 reference list.
- `source-lists/tubelex-zh.tsv` and `source-lists/tubelex-zh.tsv.xz` provide modern media frequency data.
- `source-lists/subtlex-ch/` contains extracted SUBTLEX-CH files.
- `source-lists/subtlex-ch.zip` is also present as the source archive.
- `source-lists/tocfl.csv` provides a learner-reference list for Taiwan-oriented coverage.
- `source-lists/authored-ci-sentences.json` is the controlled authored sentence intake point.

## Source Registry

- `src/data/sourceRegistry.ts` defines legacy vocabulary source families used by the HSK-backed path.
- `src/data/panMandarinSources.ts` defines pan-Mandarin source availability and import modes.
- `src/data/sourceListAudit.ts` reports whether source families are file-backed, fixture-backed, or missing.

## Data Flow To Web App

- `src/generator.ts` writes all engine outputs to `output/`.
- When the output directory is the default `output`, `src/generator.ts` also writes copies to `public/data/`.
- The Vite app consumes local JSON from `public/data/`, so web state remains local and reproducible.

## Integration Risks

- Source-list parsers are part of the product contract: import mode must remain visible in `output/source-list-import-audit.json` and `output/pan-mandarin-source-audit.json`.
- Missing or fixture-backed source families should be reported honestly rather than hidden behind generated content.
- Authored sentence intake must remain file-backed and schema-checked through `src/data/authoredCiSentences.ts`.
