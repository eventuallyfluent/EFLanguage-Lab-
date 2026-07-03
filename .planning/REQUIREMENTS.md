# Requirements: Eventually Fluent Mandarin

**Defined:** 2026-07-03
**Core Value:** The engine must produce a natural, source-backed 10k CI+1 Mandarin sentence ladder that can carry acquisition; every other surface supports that ladder.

## v1 Requirements

### Engine Baseline

- [x] **BASE-01**: The project has durable GSD planning state that reflects the current brownfield codebase.
- [x] **BASE-02**: Generation produces the required engine outputs listed in `PROJECT_TRUTH.md`.
- [x] **BASE-03**: Tests verify the current generated baseline before new expansion work.
- [x] **BASE-04**: Documentation calls out current source modes, generated counts, and known risks.

### Source Path

- [x] **SRC-01**: The 10k path remains source-backed and exposes source membership for each vocabulary item.
- [x] **SRC-02**: Source audit outputs distinguish file-backed, fixture-backed, missing, and manual source families.
- [x] **SRC-03**: Pan-Mandarin concept entries retain regional/script variants where available.
- [x] **SRC-04**: Source parser or ranking changes are covered by tests that catch path-size and ordering regressions.

### CI Authoring

- [x] **CI-01**: CI sentence targets, queues, authorable queues, batches, and compact packets remain generated from the acquisition path.
- [x] **CI-02**: Bootstrap-only and needs-more-known-vocabulary targets stay out of normal learner-facing authored CI packets.
- [x] **CI-03**: Authored CI validation rejects weak, vague, robotic, or fragment-like lines.
- [x] **CI-04**: Accepted authored lines promote into `sentence-stream.json` only after slot, vocabulary, and naturalness validation.
- [x] **CI-05**: Coverage reports make remaining exposure deficits visible without forcing bad learner-facing content.

### Curriculum And Content

- [ ] **CURR-01**: Learner-facing sentence exports remain curated-only.
- [ ] **CURR-02**: Draft/template-generated material remains separated from learner-facing content.
- [ ] **CURR-03**: Readings maintain CI+1 known-word coverage and staged complexity.
- [ ] **CURR-04**: Language islands do not unlock before roughly 1000 known words.
- [ ] **CURR-05**: Work, health, money pressure, admin pressure, and serious adult logistics remain staged at 2000+.
- [ ] **CURR-06**: Review-only pan-Mandarin island/story material has a clear path toward human curation.

### Shadowing And SRS

- [ ] **SHAD-01**: Shadowing uses controlled CI/path material and remains central to the learner journey.
- [ ] **SHAD-02**: Daily shadow schedule remains deterministic and covers the 10k journey.
- [ ] **SRS-01**: SRS support is generated only from already-seen sentence or shadow material.
- [ ] **SRS-02**: Product policy and tests prevent SRS or quizzes from replacing the CI+1 primary loop.

### Web App

- [ ] **WEB-01**: The local web app presents the 10k CI/shadowing journey as the primary loop.
- [ ] **WEB-02**: The web app reads generated JSON from `public/data/` and does not duplicate engine logic.
- [ ] **WEB-03**: Local learner state remains browser-local and compatible with generated curriculum data.
- [ ] **WEB-04**: Web builds pass after engine output changes.

## v2 Requirements

### Audio And Review

- **AUDIO-01**: Add higher-quality audio generation or import beyond browser TTS fallback.
- **REVIEW-01**: Add an operator review UI for authored CI packets, island lines, and story queues.
- **EXPORT-01**: Add structured export formats for SRS tools or external shadowing practice.

### Deeper Grammar Validation

- **GRAM-01**: Add stricter grammar validators for aspect, negation, modal verbs, measure words, and location phrases.
- **GRAM-02**: Add regional grammar/form usage warnings where Mainland/Taiwan variants diverge.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Quiz-first product loop | Contradicts the acquisition engine premise. |
| SRS-first app direction | SRS is retention support after input. |
| Ungated adult logistics in early tiers | Violates staged content policy. |
| Learner-facing raw template output | Risks unnatural Mandarin and breaks curation boundaries. |
| Hiding fixture or missing source families | Source honesty is part of trust in the path. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BASE-01 | Phase 1 | Complete |
| BASE-02 | Phase 1 | Complete |
| BASE-03 | Phase 1 | Complete |
| BASE-04 | Phase 1 | Complete |
| SRC-01 | Phase 2 | Complete |
| SRC-02 | Phase 2 | Complete |
| SRC-03 | Phase 2 | Complete |
| SRC-04 | Phase 2 | Complete |
| CI-01 | Phase 3 | Complete |
| CI-02 | Phase 3 | Complete |
| CI-03 | Phase 3 | Complete |
| CI-04 | Phase 3 | Complete |
| CI-05 | Phase 3 | Complete |
| CURR-01 | Phase 4 | Planned |
| CURR-02 | Phase 4 | Planned |
| CURR-03 | Phase 4 | Planned |
| CURR-04 | Phase 4 | Planned |
| CURR-05 | Phase 4 | Planned |
| CURR-06 | Phase 4 | Planned |
| SHAD-01 | Phase 5 | Pending |
| SHAD-02 | Phase 5 | Pending |
| SRS-01 | Phase 5 | Pending |
| SRS-02 | Phase 5 | Pending |
| WEB-01 | Phase 6 | Pending |
| WEB-02 | Phase 6 | Pending |
| WEB-03 | Phase 6 | Pending |
| WEB-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-07-03*
*Last updated: 2026-07-03 after Phase 4 planning*
