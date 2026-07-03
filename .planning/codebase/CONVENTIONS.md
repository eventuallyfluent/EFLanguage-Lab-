# Conventions

## TypeScript

- Use strict TypeScript.
- Prefer typed model contracts from `src/models.ts`.
- Keep generation deterministic.
- Avoid runtime randomness unless it is explicitly seeded and auditable.

## Product Direction

- Read `PROJECT_TRUTH.md` before changing product direction.
- The 10k CI+1 sentence ladder is primary.
- SRS is support after CI exposure, not the main loop.
- Shadowing is a core practice and uses controlled sentence material.
- Articles and language islands are gated by vocabulary coverage and known-word thresholds.

## Data Changes

- Add vocabulary in the appropriate data source file rather than inline in generated content.
- Keep HSK-backed expansion in `src/data/hskExpansion.ts`.
- Keep source registry changes in `src/data/sourceRegistry.ts` or `src/data/panMandarinSources.ts`.
- Keep authored CI sentence intake in `source-lists/authored-ci-sentences.json`.
- Do not hand-maintain a large TypeScript authored sentence array.

## Learner-Facing Content

- `output/sentences.json` must remain curated-only.
- Raw template output belongs in `output/draft-sentences.json`.
- Review-only pan-Mandarin candidates must not silently become learner-facing.
- Weak fragments should be rejected or rewritten as natural authored lines.
- Do not weaken naturalness gates just to satisfy exposure math.

## Validation Style

- Business rules are enforced with tests in `tests/engine.test.ts`.
- Product-policy invariants are tested directly.
- CI+1 math, known-word coverage, staged unlocks, and SRS support derivation are tested.
- Negative cases are important: tests reject robotic fragments, invalid semantic pairs, adult themes too early, and known-only acquisition lines.

## Error Handling

- Generation should fail loudly when policy validation fails.
- Curriculum validation throws when packs violate tier, vocabulary, reading, or dialogue constraints.
- Authored CI promotion throws if validation rejects any provided lines.
- Missing lexicon entries throw during lookup instead of producing partial output.

## Output Discipline

- Keep `output/` and `public/data/` consistent by running `npm run generate`.
- Do not edit generated JSON by hand except for diagnosis; change the engine or source data instead.
- Treat `web-dist/` as build output, not source truth.
