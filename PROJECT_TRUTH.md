# Eventually Fluent Mandarin Project Truth

## Non-Negotiable Core

This project is an engine for a 10k Mandarin acquisition journey.

The product is not a quiz app, not an SRS app, and not a generic lesson-pack app.

## Primary Engine

The primary engine is a CI+1 sentence ladder:

- each learner stage has a known vocabulary base
- each acquisition sentence introduces controlled new vocabulary
- easy known-only lines are review, not acquisition
- each new word needs repeated sentence exposure before it is treated as acquired
- shadowing uses the same sentence material
- SRS only supports retention after CI exposure

## Vocabulary Sources

- The 10k path is a pan-Mandarin concept-backed vocabulary path.
- Corpus frequency and communication usefulness control ranking before learner-list coverage.
- HSK 3.0 and TBCL/TOCFL are coverage and proficiency references, not the ranking foundation.
- TUBELEX, SUBTLEX-CH, balanced written corpora, and genuine spoken corpora provide the main frequency signals.
- Lancaster and other academic/written lists are formal-reading signals, not early spoken priority.
- Mainland and Taiwan variants share concept IDs where they express the same learner concept, but keep separate regional forms, script forms, pronunciation, frequency, and examples.
- Generation must expose whether each source family is file-backed, fixture-backed, or missing.

## Unlock Rules

- The 10k list must exist before scaling sentences.
- No language islands before roughly 1000 known words.
- Work, health, admin pressure, money pressure, and adult logistics unlock at 2000+.
- Longer adult nuance and article-heavy progression unlock at 3000+.

## Required Engine Outputs

- `acquisition-vocab-path.json`
- `ci-path.json`
- `ci-sentence-targets.json`
- `ci-curation-queue.json`
- `ci-curation-batches.json`
- `ci-authoring-packets.json`
- `ci-authoring-packets.compact.json`
- `authored-ci-sentences.json`
- `authored-ci-validation-report.json`
- `promoted-authored-ci-stream.json`
- `ci-pipeline-contract.json`
- `ci-coverage-report.json`
- `source-list-import-audit.json`
- `sentence-stream.json`
- `sentence-stream-build-report.json`
- `review-only-sentences.json`
- `blocked-ci-sentences.json`
- `island-unlocks.json`
- `article-unlocks.json`
- `srs-support.json`

If future work contradicts this file, the work is wrong.
