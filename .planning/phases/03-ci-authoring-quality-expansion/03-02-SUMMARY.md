---
phase: 3
plan: 2
title: Naturalness Gate Expansion
status: complete
completed: 2026-07-03
---

# Summary: 03-02 Naturalness Gate Expansion

## Completed

- Added authored CI regression tests for weak early fragment renderings.
- Added authored CI regression tests for vague English renderings.
- Added promotion failure coverage for naturalness-invalid authored lines.
- Tightened the English-rendering naturalness gate for short weak renderings.
- Confirmed the real authored intake remains 24 accepted and 0 rejected.

## Verification

```powershell
npm.cmd test
```

Result: passed, 47 tests.

## Key Files

- `src/ciAuthoringIntake.ts`
- `tests/engine.test.ts`
- `.planning/BASELINE.md`

## Deviations

- An attempted broad vocabulary-frame rule rejected valid reviewed lines such as location and sleep sentences, so it was removed. The final implementation keeps the narrower rendering/fragment checks that preserve accepted curated input.
