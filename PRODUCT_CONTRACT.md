# Eventually Fluent Mandarin Product Contract

## Core Product

Eventually Fluent Mandarin is a 10k Mandarin acquisition journey.

The primary path is CI+1 sentence exposure, Glossika-style: controlled, natural Mandarin sentence streams that repeat useful structures heavily while gradually introducing new vocabulary.

Vocabulary progression is source-backed and concept-backed:

- The 10k path is a pan-Mandarin shared core ranked by broad corpus frequency and communication usefulness.
- HSK 3.0 and TBCL/TOCFL are learner coverage references, not the ranking foundation.
- TUBELEX, SUBTLEX-CH, balanced written corpora, and genuine spoken corpora provide the main frequency signals.
- Lancaster and other academic/written lists provide formal-reading metadata.
- Mainland and Taiwan variants should share concept IDs when they represent the same learner concept, while retaining regional labels and script-specific forms.

## Learning Hierarchy

1. CI+1 sentence stream is the acquisition engine.
2. Shadowing is core practice for listen-and-repeat fluency.
3. Articles/readings unlock only when known vocabulary and CI coverage make them appropriate.
4. SRS is retention support for already-seen material.

## Non-Goals

- Quiz-first learning.
- SRS as the main acquisition engine.
- Freeform generated learner-facing Mandarin.
- Adult operating-life content before the learner has sufficient vocabulary coverage.
- Articles unlocked by theme alone without CI+1 coverage.

## Implementation Guardrails

- `src/productPolicy.ts` defines the 10k journey, product surfaces, and article unlock thresholds.
- `src/pathEngine.ts` builds the ranked acquisition path, sentence stream, island unlocks, article unlocks, and SRS support metadata.
- `output/product-policy.json` and `public/data/product-policy.json` expose the policy to local tooling and the web app.
- `output/acquisition-vocab-path.json` and `output/sentence-stream.json` expose the engine path.
- `output/source-list-import-audit.json` exposes whether HSK, movie, book, and BLCU signals are real source files, fixtures, or missing.
- `output/sentence-stream-build-report.json` separates true acquisition CI lines from review-only and blocked curation backlog.
- `output/ci-authoring-packets.json` is the actionable work queue for authoring new CI+1 sentences against the 10k path.
- `output/ci-authoring-packets.compact.json` is the smaller downstream app view of the same authoring work.
- `source-lists/authored-ci-sentences.json` is the reviewed sentence intake file for authored CI+1 lines.
- `output/authored-ci-validation-report.json` is the gate between written CI+1 lines and learner-facing stream promotion.
- `output/promoted-authored-ci-stream.json` contains only authored lines that satisfy the exact slot target and known-vocabulary allowance.
- Tests must fail if the product policy stops treating CI+1 sentence stream as primary or SRS as support.
- Content packs are implementation containers. They should not replace the learner-facing idea of a long sentence journey.
