# Eventually Fluent Mandarin - Agent Instructions

## Project Purpose

This project is a local-first MVP for a Mandarin language acquisition engine. It generates beginner-controlled Mandarin input for adult learners through sentence templates, constrained vocabulary, short dialogues, and reading passages.

Read `PROJECT_TRUTH.md` before changing product direction. The invariant is: 10k HSK-backed vocabulary path first, CI+1 sentence ladder as the primary engine, SRS as support only, and language islands later.

The product is a 10k Mandarin acquisition journey. The primary learning path is CI+1 sentence exposure, Glossika-style: many controlled, natural, repeated sentences that gradually expand usable vocabulary.

SRS is a support layer for retention after input. It is not the primary acquisition engine. Shadowing is core practice because learners need repeated listen-and-speak exposure to the same controlled sentence material.

Articles and longer readings unlock only when known-word count and vocabulary coverage make CI+1 reading possible.

## Vocabulary Sourcing Rules

- HSK 3.0 official vocabulary is the primary source and core backbone.
- Movie frequency lists rank spoken/dialogue usefulness for CI sentences and shadowing.
- Book frequency lists rank reading/article usefulness.
- BLCU/Beijing frequency lists provide supporting rank metadata, not the only expansion signal.
- Do not invent vocabulary outside approved source families.
- The original MVP seed set contains 100 words from HSK 3.0 Levels 1-2.
- The scaled lexicon is built from the 100-word seed plus HSK-backed expansion candidates.
- Movie/book/BLCU rank data is used as prioritization metadata, not as permission to introduce non-HSK beginner vocabulary before the path allows it.
- Keep simplified Chinese only.
- Every lexicon entry must include simplified Chinese, pinyin, English meaning, HSK level, source tag, part of speech, frequency priority, and island tags.

## How To Run Generation

```bash
npm install
npm run generate
```

Generation writes:

- `output/sentences.json`
- `output/locked-sentences.json`
- `output/curriculum-packs.json`
- `output/locked-packs.json`
- `output/draft-sentences.json`
- `output/dialogues.json`
- `output/readings.json`
- `output/lexicon.json`
- `output/lexicon-build-report.json`
- `output/progression-policy.json`
- `output/product-policy.json`
- `output/source-registry.json`
- `output/vocab-source-audit.json`
- `output/source-list-import-audit.json`
- `output/acquisition-vocab-path.json`
- `output/ci-path.json`
- `output/ci-sentence-targets.json`
- `output/ci-curation-queue.json`
- `output/ci-authorable-curation-queue.json`
- `output/ci-curation-batches.json`
- `output/ci-authoring-packets.json`
- `output/ci-authoring-packets.compact.json`
- `output/authored-ci-sentences.json`
- `output/authored-ci-validation-report.json`
- `output/promoted-authored-ci-stream.json`
- `output/ci-pipeline-contract.json`
- `output/ci-coverage-report.json`
- `output/sentence-stream.json`
- `output/sentence-stream-build-report.json`
- `output/review-only-sentences.json`
- `output/blocked-ci-sentences.json`
- `output/island-unlocks.json`
- `output/article-unlocks.json`
- `output/srs-support.json`

## How To Run Tests

```bash
npm test
```

Tests compile the TypeScript project, regenerate output, and verify source-list import state, template validity, curriculum-pack policy checks, duplicate filtering, reading coverage, CI+1 checks, and minimum output counts.

## Product Contract

Non-negotiable product hierarchy:

1. CI+1 sentence stream to 10k is the primary acquisition path.
2. Shadowing uses the same controlled sentence material for listen-and-repeat practice.
3. SRS is secondary retention support fed by already-seen sentences and lines.
4. Articles/readings unlock by known vocabulary and CI coverage thresholds.
5. Quizzes must not become the main product loop.

`src/productPolicy.ts` is the implementation-level contract for this hierarchy. It defines:

- `targetVocabularyCount: 10000`
- `primaryAcquisitionMode: "ci-plus-one-sentence-stream"`
- `repetitionStyle: "glossika-style"`
- `srsRole: "support-retention"`
- article unlock thresholds and coverage rules

Tests must fail if SRS or quiz mechanics replace the CI+1 sentence stream as the primary path.

## Web App Direction

The web app is a local-first CI and shadowing app with SRS as a retention layer.

- Primary loop: unlock sentence sets -> consume CI+1 sentence stream -> shadow lines -> optionally retain selected lines with SRS -> continue toward 10k.
- Do not frame the product as a quiz app.
- SRS cards should be fed by curated sentence, reading, and dialogue lines.
- Articles should appear as gated reading unlocked by vocabulary level and CI coverage, not as freeform content.
- The 10k journey should remain visible even while content is only implemented for early staged tiers.
- Current local learner state lives in browser local storage.

## Coding Conventions

- Use TypeScript with strict types.
- Keep generation deterministic.
- Add vocabulary in `src/data/lexicon.ts`; do not inline new words in generated content.
- Put new HSK-backed expansion entries in `src/data/hskExpansion.ts`.
- Put movie frequency metadata in `src/data/movieFrequency.ts`.
- Put book frequency metadata in `src/data/bookFrequency.ts`.
- Put BLCU/Beijing corpus frequency metadata in `src/data/blcuFrequency.ts`.
- Keep lexicon assembly rules in `src/data/lexiconBuilder.ts`.
- Put authored CI+1 sentence intake in `source-lists/authored-ci-sentences.json`; `src/data/authoredCiSentences.ts` only loads and schema-checks that file.
- Keep source-family definitions in `src/data/sourceRegistry.ts`.
- Keep the 10k path engine in `src/pathEngine.ts`.
- Keep CI+1 acquisition target logic in `src/ciEngine.ts`.
- Add reusable Mandarin structures in `src/templates.ts`.
- Keep semantic constraints explicit. Avoid random combinations that produce unnatural Mandarin.
- Prefer small, auditable data structures over opaque generation logic.
- Keep output JSON stable enough for later SRS and shadowing exports.

## Semantic Filtering

Sentence candidates must pass explicit compatibility checks before export:

- Verb-object pairs are checked in `src/compatibility.ts`. For example, `看` can pair with `书`, but not `电话`.
- Noun-adjective pairs are checked separately. For example, `天气` can be `好`, `热`, or `冷`, but not `大`.
- Subject-predicate pairs reject beginner-unhelpful descriptions such as `我很多`.

Use `isValidCombination()` for compatibility checks. Do not bypass it by adding string-only exceptions unless the phrase is a fixed, common beginner expression.

## Scaling Rules

The lexicon scales through a source-backed builder:

- `hskSeedLexicon` preserves the original 100-word seed.
- `hskExpansionCandidates` adds HSK-backed vocabulary for the next core tier.
- `movieFrequencyRanks` ranks spoken/dialogue usefulness.
- `bookFrequencyRanks` ranks reading/article usefulness.
- `blcuFrequencyRanks` ranks HSK entries by Beijing/BLCU frequency when available.
- `lexiconBuildReport` tracks total entries, HSK backbone count, movie/book/BLCU ranked counts, source coverage, missing ranks, and missing metadata.

Do not let a word into generated content just because it exists in movie/book/BLCU ranks. It also needs controlled-source provenance, English rendering, compatibility metadata, and quality-filter coverage.

## 10k Path Engine

`src/pathEngine.ts` owns the acquisition path.

- `output/acquisition-vocab-path.json` is the ranked vocabulary path toward the 10k target.
- `output/ci-path.json` defines CI+1 stages and rejects easy known-only lines as acquisition.
- `output/ci-sentence-targets.json` defines required repeated sentence exposures for each target word.
- `output/ci-curation-queue.json` is the next actionable list for sentence curation.
- `output/ci-authorable-curation-queue.json` filters the deficit queue to targets that have enough known vocabulary for natural learner-facing authored sentences.
- `output/ci-curation-batches.json` groups queue items into concrete sentence-slot work packets.
- `output/ci-authoring-packets.json` enriches those slots with target word metadata, allowed known vocabulary, and acceptance rules for authoring.
- `output/ci-authoring-packets.compact.json` is the smaller web/app-friendly version with a shared vocabulary pool per packet.
- `source-lists/authored-ci-sentences.json` is the controlled intake point for reviewed CI+1 lines written against compact authoring slots.
- `src/data/authoredCiSentences.ts` loads and schema-checks the JSON intake; do not hand-maintain a large TypeScript sentence array.
- `output/authored-ci-sentences.json` publishes the current authored input set.
- `output/authored-ci-validation-report.json` records accepted and rejected authored lines with concrete reasons.
- `output/promoted-authored-ci-stream.json` contains only authored lines that passed slot, target-word, and vocabulary allowance checks.
- Authored lines must also pass naturalness/usefulness checks in `src/ciAuthoringIntake.ts`; slot-valid fragments such as `我`, `我有`, `我想`, or `是我` must not be promoted as learner-facing acquisition sentences.
- Early exposure deficits may be `bootstrap-only` or `needs-more-known-vocabulary`; do not force those into learner-facing authoring packets just because they need exposure mathematically.
- `output/ci-pipeline-contract.json` explains the full source-to-stream pipeline with inputs, outputs, gates, and current counts.
- `output/ci-coverage-report.json` reports exposure deficits by stage.
- `output/sentence-stream.json` is the primary CI+1 sentence stream view.
- `output/island-unlocks.json` gates language islands.
- `output/article-unlocks.json` gates longer readings/articles by known-word count and CI coverage.
- `output/srs-support.json` is derived only from already-seen sentence-stream items.

Language islands must not appear at the beginning:

- No language island unlock before `1000` known words.
- Practical islands such as city movement and errands may start at `1000`.
- Work, health, admin pressure, money pressure, and adult logistics start at `2000+`.
- Longer adult nuance and book-weighted article growth start at `3000+`.

## Curated vs Draft Sentences

Learner-facing sentence output must not come directly from raw template generation.

- `output/sentences.json` is learner-facing. Items must have `reviewStatus: "curated"`.
- `output/curriculum-packs.json` is the learner-facing pack export. It contains only unlocked curated lesson packs.
- `output/locked-packs.json` contains future lesson packs whose `unlockAtWordCount` has not been reached yet.
- `output/draft-sentences.json` contains template-generated candidates only. Items have `reviewStatus: "draft"` and should be treated as review material, not learning content.
- `src/data/curatedSentences.ts` is the manually reviewed beginner sentence bank.
- `src/data/curriculumContent.ts` groups reviewed content into tier-specific lesson packs.
- Curated sentences may be inspired by common HSK/example-sentence patterns, but must remain lexicon-controlled and must not introduce untracked vocabulary.
- If a generated sentence sounds off, do not patch around it with one-off string exceptions. Either move a reviewed version into the curated bank or tighten compatibility/English rendering.
- Automated `validated` promotion is intentionally disabled for learner-facing output until there is a stronger review workflow.

## Curriculum Packs

Curriculum structure lives above the flat sentence bank.

- `src/curriculum.ts` defines tier policy for `100`, `300`, `1000`, `2000`, and `3000` word stages.
- Each pack must declare a tier, theme tags, unlock threshold, sentence quota, dialogue count, and one reading.
- Learner-facing generation should flatten unlocked packs, not pull directly from the full curated bank.
- `100-tier` is survival beginner only.
- `300-tier` adds shopping, simple errands, restaurant basics, light transport, and basic device use.
- `1000-tier` adds bridge content such as delays, missed plans, clarification, and practical movement through a city.
- Work/health/adult operating-life themes remain staged for `2000+`.

Policy checks should fail generation if:

- a pack includes forbidden tier themes
- a sentence unlocks later than its pack
- a dialogue or reading references unknown vocabulary ids
- a reading exceeds tier complexity or fails CI+1 validation

## Progression Gating

Sentence unlocks are controlled by `src/progression.ts`.

- 100 words: survival beginner and classroom-safe daily phrases.
- 300 words: core daily life may expand, but still avoids adult operating-life load.
- 1000 words: practical bridge material can include simple errands and transport.
- 2000 words: adult operating-life themes unlock, including work, health, money pressure, appointments, and transport logistics.
- 3000 words: longer adult multi-clause scenarios unlock.

Do not move work/health/serious adult logistics into the 100-word or 300-word learner-facing output. Stage them with `unlockAtWordCount` instead.

## Naturalness Scoring

Every generated sentence receives a `qualityScore`.

The score favors:

- high-frequency sentence patterns
- semantically correct combinations
- beginner-useful speaking patterns
- reusable classroom, food, shopping, time, and location phrases

The generator rejects candidates below the minimum quality threshold and also blocks known weak patterns such as `天气很大`, `我很多`, `我会看电话`, `看电话`, `做工作`, and `去家`.

## CI+1 Reading Validation

Reading passages must calculate known and new words from sentence metadata:

- `vocabularyIds` are treated as known words for that passage.
- `newWordIds` are treated as controlled new words introduced in the passage.
- `knownVocabularyCoverage` is `(known words / total words)`.
- Coverage must be between 95% and 98%.
- Each sentence may introduce at most 1-2 new words.

If a reading does not meet these rules, generation should fail instead of exporting weak material.

For curriculum packs, readings are derived from curated pack content and must still satisfy the same CI+1 math. Do not bypass this with zero-new-word placeholder readings.

## Future Expansion Plan

1. Expand the controlled seed set to 300 HSK-backed words, using BLCU only to prioritize and fill practical gaps.
2. Add stronger SRS card generation with sentence cards, cloze cards, audio fields, and review metadata.
3. Add shadowing scripts with short repeatable lines, pacing metadata, and speaker turns.
4. Add gated language islands so learners unlock contexts such as food, school, work, transport, and health only when coverage is high enough.
5. Extend the staged curriculum beyond 3k toward the 10k journey with source-backed vocabulary and curated adult-use input.
6. Add stricter grammar validators for aspect, negation, modal verbs, measure words, and location phrases.
