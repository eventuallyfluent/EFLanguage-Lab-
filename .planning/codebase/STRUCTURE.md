# Structure

## Top-Level Files

- `PROJECT_TRUTH.md` defines the non-negotiable product direction.
- `AGENTS.md` defines repository instructions and GSD workflow expectations.
- `PRODUCT_CONTRACT.md` provides additional product contract context.
- `package.json` defines build, generation, test, and web scripts.
- `tsconfig.json` defines TypeScript compilation.
- `vite.config.ts` configures the web build.
- `index.html` is the Vite app shell.

## Source Directories

- `src/` contains the TypeScript engine and web app.
- `src/data/` contains source lists, lexicon builders, curated content, pan-Mandarin builders, and authored intake loaders.
- `src/web/` contains the Vite/React app.
- `tests/` contains Node test coverage.
- `source-lists/` contains imported or manually controlled source data.

## Output Directories

- `output/` contains generated engine artifacts.
- `public/data/` contains generated JSON copied for the web app.
- `web-dist/` contains the built Vite output.
- `dist/` is created by TypeScript build and is not a source-of-truth directory.

## Important Engine Files

- `src/generator.ts` orchestrates generation.
- `src/index.ts` runs generation and prints summary counts.
- `src/models.ts` centralizes TypeScript model contracts.
- `src/pathEngine.ts` owns acquisition-path, sentence-stream, article, island, and SRS derivations.
- `src/ciEngine.ts` owns CI path stages, targets, queues, and packets.
- `src/ciAuthoringIntake.ts` owns validation and promotion for authored CI lines.
- `src/shadowCurriculum.ts` owns daily shadowing and SRS scheduling.
- `src/curriculum.ts` owns pack policy validation.
- `src/progression.ts` owns known-word tier gates.
- `src/quality.ts` owns duplicate, CI+1, and reading-coverage checks.
- `src/compatibility.ts` owns semantic compatibility rules.

## Important Data Files

- `src/data/lexicon.ts` preserves the seed lexicon.
- `src/data/hskExpansion.ts` contains HSK-backed expansion entries.
- `src/data/lexiconBuilder.ts` assembles ranked lexicon metadata.
- `src/data/curatedSentences.ts` holds reviewed beginner sentence content.
- `src/data/curriculumContent.ts` groups reviewed content into packs.
- `src/data/authoredCiSentences.ts` loads and validates authored intake JSON.
- `src/data/panMandarinVocab.ts` builds concept-backed 10k vocabulary.
- `src/data/panMandarinCi.ts` builds pan-Mandarin CI candidates and review classifications.
- `src/data/panMandarinContentQueues.ts` builds islands, stories, and review queues.

## Naming Patterns

- Generated output filenames are kebab-case JSON.
- TypeScript modules use camelCase file names where established.
- CI artifacts use `ci-*` prefixes.
- Pan-Mandarin artifacts use `pan-mandarin-*` prefixes.
- Source-list files are kept under `source-lists/` and should not be hidden inside TypeScript constants when file-backed imports are intended.
