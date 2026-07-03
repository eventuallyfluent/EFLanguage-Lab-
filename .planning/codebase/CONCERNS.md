# Concerns

## Repository State

- The current workspace root is not detected as a Git repository by `git status`.
- GSD commit steps cannot work until the Git repository state is restored, initialized, or the correct repository root is used.
- `.planning/` was absent before this baseline, so earlier GSD project state is not present in this checkout.

## Product Drift Risk

- `package.json` still describes the project as an HSK 3.0 vocabulary MVP, while `PROJECT_TRUTH.md` and current code describe a pan-Mandarin, source-backed 10k path.
- Future planning should treat `PROJECT_TRUTH.md` as authoritative.
- Old HSK-only wording should be updated when making metadata/docs changes.

## Generated Artifact Risk

- Many generated JSON files are present in `output/`, `public/data/`, and `web-dist/data/`.
- Hand-editing generated files would create drift from `src/` source data and engine logic.
- Regeneration can touch many files, so diffs should be reviewed carefully once Git tracking is available.

## Content Quality Risk

- The core risk is not count generation; it is weak learner-facing Mandarin.
- CI exposure deficits must not force robotic fragments into the learner stream.
- `src/ciAuthoringIntake.ts` must remain strict about naturalness and usefulness.
- Pan-Mandarin candidate content is review-only and should not bypass human or validator gates.

## Source Integrity Risk

- Source import mode honesty is part of the product contract.
- Fixture-backed or missing frequency sources should stay visible in audit outputs.
- Parser changes for TUBELEX, SUBTLEX-CH, HSK, or TOCFL can reorder the 10k path and should be treated as high-impact.

## Performance/Scale Risk

- Generation builds a large number of artifacts, including 10k vocabulary, candidates, shadow items, story queues, and web copies.
- Tests regenerate all output, so verification cost may grow as the content engine expands.
- If generation becomes slow, optimize data flow with profiling evidence rather than removing policy checks.

## Frontend Risk

- The web app depends on generated JSON in `public/data/`.
- If generation fails or copies are stale, the app can show outdated state.
- Local storage learner state should remain compatible with future curriculum schema changes.
