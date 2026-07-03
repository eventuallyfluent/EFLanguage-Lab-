# Testing

## Test Runner

- Tests use Node's built-in `node:test` runner.
- Assertions use `node:assert/strict`.
- The main test file is `tests/engine.test.ts`.
- `npm test` runs `npm run generate` first, then `node --test dist/tests/*.test.js`.

## Build Requirement

- Tests run against compiled JavaScript in `dist/`.
- `npm run generate` runs `npm run build`, so TypeScript compilation happens before output verification.
- Generated JSON is refreshed as part of the test flow.

## Coverage Areas

- Lexicon scale, HSK seed preservation, source metadata, and ranked expansion.
- Source registries and import audits.
- Pan-Mandarin source parsing, concept-backed vocabulary, CI candidates, and naturalness classification.
- Language island and story unlock gating.
- Sentence stream generation and CI target/queue/packet construction.
- Authored CI schema loading, slot validation, naturalness rejection, and promotion.
- Product policy invariants for CI+1, shadowing, SRS support, and quiz non-goals.
- Curriculum pack validation, tier gating, readings, dialogues, and semantic compatibility.
- SRS support derivation after CI exposure.
- Daily shadow curriculum and 1000-day schedule.

## Test Philosophy

- Tests encode product policy, not only code behavior.
- If a generated line sounds wrong, improve source content, compatibility, or validation rather than lowering the test bar.
- Keep coverage focused on deterministic engine contracts.
- UI layout changes may not need TDD, but engine and validation changes should have tests.

## Known Verification Commands

- `npm run build`
- `npm run generate`
- `npm test`
- `npm run web:build`

## Local Caveats

- Prior memory notes mention possible sandbox-specific `EPERM: operation not permitted, lstat 'C:\Users\stude'` during Node/npm verification.
- If that appears, rerun the same verification outside the failing sandbox path before treating it as a project bug.
- This checkout currently is not detected as a Git repository from the workspace root, so commit-oriented GSD steps cannot complete until Git state is restored or initialized.
