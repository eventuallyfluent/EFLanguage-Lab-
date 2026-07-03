# Pan-Mandarin Vocabulary Source Plan

## Objective

Build a reusable pan-Mandarin vocabulary list organized by frequency and communication usefulness. The list should be useful inside this project or reusable elsewhere.

The output is not just a flat HSK list. It is a concept-backed shared core with regional metadata, source tags, and separate ranking views for global, Mainland, Taiwan, communication, and reading use.

## Direction Change

Replace the old premise:

- HSK 3.0 is the 10k backbone.

With:

- The 10k path is a pan-Mandarin concept list ranked by corpus frequency and communication usefulness.
- HSK 3.0 and TBCL/TOCFL are coverage and proficiency references.
- Regional variants are modeled as related variants under one concept, not merged into one fake universal word.

## Source Roles

| Source | Role | Notes |
| --- | --- | --- |
| TUBELEX Chinese | Modern media/spoken exposure | Strong daily-language signal; includes Chinese frequency files. |
| SUBTLEX-CH | Film subtitle frequency | Useful spoken/media signal, but should not dominate alone. |
| Genuine spoken corpora | Conversation signal | Highest value if accessible and licensed clearly. |
| BCC or equivalent balanced corpus | Balanced written/Mainland signal | Helps avoid overfitting to subtitles or YouTube. |
| HSK 3.0 | Mainland learner coverage | Tags level and coverage; does not control rank. |
| TBCL/TOCFL | Taiwan learner coverage | Tags level and regional coverage; does not control rank. |
| Lancaster | Academic/written signal | Later reading/formal priority, not early communication priority. |
| Manual usefulness cleanup | Quality gate | Handles proper nouns, fragments, specialist terms, regional pairs, and misleading frequency. |

## Candidate Source Locations

- TUBELEX: https://github.com/naist-nlp/tubelex
- SUBTLEX-CH: https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0010729
- TOCFL-derived CSV generator: https://github.com/tomcumming/tocfl-word-list
- CUHK regional character frequency reference: https://humanum.arts.cuhk.edu.hk/Lexis/chifreq/

Prefer official or clearly licensed files when possible. Keep source acquisition auditable and do not silently mix in unlicensed dumps.

## Data Model

```ts
interface PanMandarinConcept {
  conceptId: string;
  gloss: string;
  category:
    | "universal-core"
    | "universal-regionally-uneven"
    | "essential-regional-pair"
    | "mainland-preferred"
    | "taiwan-preferred"
    | "formal-written"
    | "colloquial"
    | "low-value-specialist";
  globalRank?: number;
  mainlandRank?: number;
  taiwanRank?: number;
  communicationRank?: number;
  readingRank?: number;
  scores: {
    globalFrequency: number;
    mainlandFrequency: number;
    taiwanFrequency: number;
    spoken: number;
    written: number;
    learnerCoverage: number;
    manualUsefulness: number;
  };
  variants: PanMandarinVariant[];
  sourceMemberships: PanMandarinSourceMembership[];
}

interface PanMandarinVariant {
  variantId: string;
  region: "universal" | "mainland" | "taiwan" | "hong-kong" | "other";
  simplified: string;
  traditional?: string;
  pinyin?: string;
  pronunciationRegion?: "standard-mainland" | "standard-taiwan" | "shared";
  sourceRefs: string[];
  exampleStatus: "missing" | "source-backed" | "reviewed";
}
```

Traditional support should be included when the source provides it or when conversion is straightforward. It should not become a separate conversion project before the ranked source list exists.

## Ranking

Use multiple ranks instead of one fake neutral rank:

- `globalRank`: broad shared usefulness.
- `mainlandRank`: Mainland-weighted usefulness.
- `taiwanRank`: Taiwan-weighted usefulness.
- `communicationRank`: CI sentence and shadowing priority.
- `readingRank`: article and formal-reading priority.

Initial scoring weights:

| Signal | Weight |
| --- | ---: |
| Modern spoken/media frequency | 35 |
| Genuine conversational corpora | 20 |
| Balanced written frequency | 20 |
| HSK 3.0 coverage | 10 |
| TBCL/TOCFL coverage | 10 |
| Manual usefulness cleanup | 5 |

If a source is missing, record it in the source audit and redistribute nothing silently. Missing data should be visible.

## Outputs

Phase 1 outputs:

- `output/pan-mandarin-vocab.json`
- `output/pan-mandarin-vocab.csv`
- `output/pan-mandarin-source-audit.json`

Optional later public app outputs:

- `public/data/pan-mandarin-vocab.json`
- `public/data/pan-mandarin-source-audit.json`

## Implementation Phases

### Phase 1: Source Acquisition Audit

- Add source registry entries for the new source families.
- Add a source acquisition manifest with URL, local expected path, license/terms note, import status, and parser status.
- Import only files with clear access and stable format.
- Produce `pan-mandarin-source-audit.json`.

### Phase 2: Normalizers and Parsers

- Parse TUBELEX Chinese TSV/XZ.
- Parse SUBTLEX-CH ZIP contents after acquisition.
- Parse HSK 3.0 from the existing `source-lists/hsk30.csv`.
- Parse TBCL/TOCFL if a suitable file is acquired.
- Add stubs for BCC, spoken corpus, and Lancaster if files are not yet available.

### Phase 3: Concept Assembly

- Normalize forms.
- Attach simplified/traditional variants where available.
- Group obvious regional pairs under shared concept IDs.
- Keep uncertain pairs as `needs-review` instead of forcing a merge.

### Phase 4: Ranking and Export

- Calculate global, regional, communication, and reading ranks.
- Export JSON and CSV.
- Add tests for deterministic ordering, source tags, regional pair preservation, and audit honesty.

### Phase 5: Engine Integration

- Only after the research list is stable, decide how much of it replaces `acquisition-vocab-path.json`.
- Preserve CI+1 naturalness gates and authorable queue separation.
- Do not feed raw high-frequency words into learner-facing generation until metadata, compatibility, and sentence coverage exist.

## Open Implementation Choices

- Which balanced written corpus is acceptable and legally practical.
- Which genuine spoken corpus is accessible enough for v1.
- Whether TOCFL should come from an official file, a derived CSV, or both with provenance.
- Whether regional pair mapping starts as a small reviewed seed list or waits until after raw ranking export.
