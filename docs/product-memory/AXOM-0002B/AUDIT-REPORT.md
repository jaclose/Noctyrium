# AXOM-0002b — Independent Institutional Audit

**Role:** Independent Product Architecture Auditor (review only — no fixes, no AX IDs, no owner-controlled values assigned).
**Scope:** Complete AXOM-0002a evidence archive (`docs/product-memory/AXOM-0002A/`) against governance v1.0.0 (AX-0000, AX-0001, AX-0002, AX-0003, AX-0009, AX-0010).
**Method:** Every archive artifact was read. Every checkable numeric claim was mechanically re-derived from the raw JSONL and source catalogues rather than trusted. Evidence citations were spot-verified against the live repository at the audited HEAD (`d4db0f4`, which is the current HEAD).
**Mindset:** Adversarial. The goal was to reject.

---

## Verification record (what was attacked and survived)

Every one of the following claims was independently recomputed and found exact:

| Claim | Result |
| --- | --- |
| 193 records, unique contiguous `CAND-000001`–`CAND-000193`, exactly 25 fields each | Verified |
| MD ledger ↔ JSONL parity (all 193 IDs, titles, and 23 body fields present in both) | Verified |
| Category totals (Bug 12, Feature 102, Polish 7, Product Debt 10, Product Decision 40, Research 28, Technical Debt 17); 21 multi-category | Verified |
| Confidence (High 139 / Medium 52 / Low 2), origin, and epoch distributions | Verified |
| 250 raw provenance units = 100 C + 83 H + 67 Q; 250/250 cited; reduction arithmetic 250→193 (44 H-merges + 1 conflict absorbed, 20 H-new, 6 split-recovered) closes exactly | Verified |
| Crosswalk dispositions (44 MERGE / 20 NEW / 18 SPLIT / 1 CONFLICT) match INDEXES §6 for all 83 rows | Verified |
| All 250 unit line-locators resolve to `###` headings at the cited line; ordinal ↔ unit number consistent in all three catalogues | Verified |
| Zero orphan `EVID-*` references, zero orphan `CAND-*` references, zero dangling merge refs, zero duplicate titles | Verified |
| System Index: 193/193 candidates placed exactly once across 16 groups; group counts match FINAL-REPORT | Verified |
| Category Index memberships match FINAL-REPORT counts exactly | Verified |
| Missing Evidence Index rows = 53 = FINAL-REPORT claim; all 21 catalogue headings not promoted to candidates are preserved there | Verified |
| All 17 cited commit SHAs exist; "91 commits at audited baseline" is exact (`git rev-list --count HEAD` = 91) | Verified |
| Spot-checked file:line citations (README.md:3-6, 98-99, 101-128, 126-149; PRE-ALPHA-CONTRACT.md:53-62, 136-138; FEATURES.md:455-460; IMPLEMENTATION_AUDIT.md:20, 59-61; ROADMAP.md:56-58, 80-86; ALPHA-RELEASE.md:119-128) | All accurate |
| Owner-controlled top-level fields: 0 (no priority, board, DNA, acceptance criteria, verification, or roadmap fields exist in the record schema) | Verified |
| Conflict records: 39, both sides preserved, `suggested_interpretation: null` in every case | Verified |

I could not falsify a single quantitative claim in FINAL-REPORT.md or INTEGRITY-REPORT.md. The archive's mechanical integrity is exceptional. The findings below are therefore about what the integrity checks *did not* measure.

---

## A. Critical Findings

### A1. The archive itself is not in version control

`docs/product-memory/` (1.8 MB) is **untracked** (`?? docs/product-memory/` in git status). The entire institutional-memory artifact — the thing whose purpose is to survive the loss of conversations — currently exists as loose files on one machine, in a repository with a known pending cleanup of ~4 GB of untracked personal data. One careless cleanup pass destroys AXOM-0002a with no recovery path. This is the single largest threat to the archive and it is invisible to every integrity check inside it.

### A2. Root evidence chain bottoms out in volatile, machine-local storage

- The Sol full-audit package (cited by ~86 Audit-kind evidence sources) lives at `/tmp/axom-sol-full-audit/` — a temp directory. It exists today; nothing guarantees it tomorrow.
- The nine owner conversation chronologies live at `/Users/jd/.codex/sessions/...` (62–150 MB JSONL files, personal home directory, not in the repo).

The catalogues quote the salient content, so first-order knowledge survives loss — but the *re-verification* chain (the thing this very audit relied on for repository sources) dies with those files. FINAL-REPORT honestly flags missing conversations but never flags that the evidence it *did* use is volatile.

### A3. A cross-catalogue handoff silently dropped at least one shipped concept

`core-systems.md` §J explicitly excluded three ROADMAP concepts as "owned by the Question evidence pass":

1. **Pitfall Map** (`ROADMAP.md:81`, status **in-progress**, "digest pitfalls ship on set cards" — i.e. partially shipped). The Question catalogue contains **zero** occurrences of "pitfall" — not as a candidate, not as a reconstruction note. The concept is absent from all 193 candidates and all 53 notes. Its only trace is the exclusion row that claims someone else owns it.
2. **Dashboard/Reports quiz-session surfacing** (`ROADMAP.md:80`, status "next"). Excluded by core-systems; the Question catalogue mentions it only inside Q-28's *exclusions* and Q-30's priority note. No candidate or note captures the concept itself.
3. **AI error-type classification of misses** (`ROADMAP.md:58`, status **in-progress**, "provider interface + mock exist"). Excluded by core-systems; the Question pass's "AI Question-system scope boundary" note does not cite `ROADMAP.md:58` and does not name this capability.

Two of these are marked *in-progress* in the product's own roadmap. INTEGRITY-REPORT's "PASS with 0 warnings" verified that every catalogue heading was accounted for, but never verified that every *promised handoff between catalogues* was fulfilled. This is the one place the 250/250 accounting is technically true and substantively incomplete.

### A4. Crosswalk-stated relationships were only partially transcribed into the ledger

The crosswalk explicitly names cross-candidate relationships that the ledger then fails to record:

- HR-17/group 7: C-07 (compatibility identity) and C-99 (hosted URL identity) "related but remain distinct" → ledger `CAND-000099.related_candidate_records` is **empty**; CAND-000007 does not reference 099.
- HR-15: "Core C-79 is the separate direct-sync candidate" → CAND-000078 (Card Vault) and CAND-000079 (AnkiConnect) are **not** cross-linked (078 rel=[], 079 rel=[191] only).
- HR-11: "Core C-21 is a related habit-date/fairness behavior" → CAND-000005 ↔ CAND-000021 not linked.

Other crosswalk-stated relationships *were* carried (174↔092, 176↔092, 169↔020/026, 193↔064/067/090), proving the transcription was possible and inconsistent, not deliberately excluded. The stated limitation ("relationships recorded only where sources explicitly grouped concepts") does not cover these cases — the source *did* explicitly group them.

### A5. Two controlled vocabularies are used 193 times each and defined nowhere

- `historical_epoch` ∈ {Noctyrium, Transition, AXOM Alpha, Current} — no definition in README, ledger, INDEXES, FINAL-REPORT, or catalogues. Assignment looks inconsistent: CAND-000016 and CAND-000023 have the same lineage shape (C-unit + H-08/H-09 + H-26), the same first-observed date (2026-07-12), and different epochs (Current vs AXOM Alpha).
- `lifecycle` ∈ {Observed 23, Incomplete 75, Conflict 39, Ready For Owner 33, Merged 23} — no criteria stated anywhere. 39% of the archive is "Incomplete" without a definition of completeness, and "Ready For Owner" is a materially load-bearing judgment (it will shape disposition order) with unstated criteria.

By AX-0009's own philosophy — one durable meaning per term — this is the archive violating the standard it was built under.

---

## B. Recommended Merges

Merging remains a Product Owner decision; these are evidence-based recommendations only.

| Candidates | Recommendation | Evidence |
| --- | --- | --- |
| CAND-000030 (Route-level Dashboard performance containment) + CAND-000069 (Broader route-level code splitting) | **Merge** (or minimally cross-link) | Same technical concept at two scopes; C-30 is the dashboard-scoped instance of C-69's general debt. Neither record references the other. Both Technical Debt. |
| CAND-000044 (Independent difficulty and yield) + the difficulty/yield clause of CAND-000119 (Restrained academic classification) | **Keep separate but relate**; owner should decide which record canonically owns the "difficulty ≠ yield" decision | Q-19's Product Truth restates C-44's core decision verbatim in question-metadata form. Unlinked today — the same decision has two unconnected homes, a One-Source-of-Truth hazard at disposition. |
| CAND-000148 (Focused first-use Question Bank) + CAND-000149 (Returning Question Bank command center) | **Keep separate** (recommendation: do not merge) | Deliberate HR-23 split into two user-state jobs; evidence supports independence. Flagged only because a reviewer will be tempted to merge them — the split is defensible. |
| CAND-000034–037 (Course Central Levels 0–3) | **Keep separate**, but owner should confirm they are stages of one capability, not four capabilities | Levels are trust tiers of the same integration concept; separate records are defensible for research staging, but disposition as four independent PBIs would misrepresent one product promise. |

No incorrectly-merged pair was found. The one dedup **structural** gap: normalization ran H against C+Q, but never C against Q (CAND-000001–100 are C-01–C-100 one-to-one; CAND-000101–167 are Q-01–Q-67 one-to-one). The C-44/Q-19 overlap above is the observable consequence. A bounded C↔Q dedup sweep has never happened and the uniformly empty `suggested_merge_candidates` field ("None after normalization" × 193) overstates the completeness of deduplication.

## C. Recommended Splits

| Candidate | Recommendation | Evidence |
| --- | --- | --- |
| CAND-000080 (Resource Hub) | **Consider split**: (a) privacy defect — personal Drive/Notion/MEGA URLs compiled into public defaults; (b) curated Resource Hub capability | Carries three conflict flags and three categories (Feature/Bug/Product Debt). The privacy exposure is a release-blocking defect regardless of what the Hub becomes; binding them risks the defect inheriting feature-priority cadence. |
| CAND-000067 (Cloud sync/account hardening) | **Consider split**: present containment defect vs. future secure-accounts research | The crosswalk itself anticipates this: "owner disposition may later split them" (group 12). Categories Bug+Research in one record. |
| CAND-000091 (Five-section Settings IA) | **Watch, no split yet** | Tri-category (Product Decision/Product Debt/Polish) with four evidence lineages; may decompose at disposition, but evidence doesn't yet separate cleanly. |

No candidate was found that wrongly fuses unrelated concepts.

## D. Missing Candidates

Confirmed absent from all 193 candidates and 53 notes (the archive can only mine what its sources contain — each item below should be dispositioned as "add candidate," "confirm never discussed," or "defer"):

1. **Pitfall Map** — dropped handoff; partially shipped per ROADMAP (A3). The strongest omission: shipped behavior with zero archive representation.
2. **Dashboard/Reports quiz-session surfacing** — dropped handoff (A3).
3. **AI error-type classification of misses** — dropped handoff, roadmap in-progress (A3).
4. **Global workspace search / command palette** — no candidate anywhere addresses cross-workspace search (CAND-000121 is Question-library-scoped). For a product whose identity is "academic operating system" holding Journal, notes, questions, tasks, and courses, the absence of any find-anything concept is conspicuous.
5. **Telemetry / product-analytics posture** — a privacy-first product with no recorded Product Decision that it collects nothing. The absence of a "no telemetry" doctrine record means the strongest privacy promise exists only implicitly.
6. **Notification policy beyond daily-loop reminders** — CAND-000013 is the only notification concept; no general policy for what may interrupt the learner.
7. **Keyboard-shortcut / power-user input system** — AX-0010 mandates keyboard operability as a standard, but no product concept exists for deliberate shortcuts.
8. **Data export beyond Portable Backup** (per-module export, printable study artifacts) — only whole-workspace backup semantics exist.

Items 4–8 have no evidence they were ever historically discussed — they are gaps in the product's conceptual universe, not errors in mining. They belong in the owner's 0002c intake as new-idea candidates, not as archive corrections.

## E. Institutional Risks

1. **Uncommitted archive** (A1) — highest severity, trivially fixable outside this audit.
2. **Volatile evidence roots** (A2) — `/tmp` audit package and `~/.codex` session files.
3. **Evidence-class imbalance:** of 835 evidence sources — Repository 531, Checkpoint 128, Conversation 89, Audit 86, **Review 1**. Independent-verification history (Fable's role under AX-0003 §4) is essentially unrepresented; the archive's memory of *what was independently verified* is one citation deep. core-systems §N.2 admits no review files were assigned.
4. **Noctyrium era is one record deep.** The owner conversation corpus starts 2026-06-13; everything earlier survives only through CHANGELOG/PRODUCTIVITY-ARCHITECTURE mining (CAND-000098) and alias notes. The archive honestly bounds this (§N.1), but if pre-June history matters, it is not yet preserved — and the sources that could preserve it are the volatile ones in risk 2.
5. **Synthetic unit IDs (`H-xx`, `Q-xx`) exist only in the ledger.** `historical-review.md` and `question-system.md` contain no unit identifiers; the ledger's H/Q labels are ordinals over `###` headings plus line numbers. Any future edit to either catalogue silently invalidates both the ordinals and the line locators. (`C-xx` IDs are real; only two of three catalogues are exposed.)
6. **178 raw `observed_area_system` strings** with case/spacing variants ("Backup / QA" vs "Backup/QA", "Question annotations" vs "Question Annotations") map to 16 System Index groups through an undocumented mapping. Preserving raw strings is correct provenance discipline, but the 16-group normalization is an interpretive layer that exists only as index placement — unreproducible if the index is lost.
7. **Relationship model is too weak to carry the product graph** (see G/H): 5/193 records have dependencies (all `related_candidate_id: null`), one generic untyped relationship kind, and split-provenance co-membership masquerading as semantic relation (the seven H-28 records are fully cross-linked because one checkpoint touched them, not because Journal autosave relates to Daily Check-In).

## F. Governance Risks

1. **Authored "Product DNA" in the Question catalogue.** `question-system.md` gives every unit a five-part **Product DNA** block (Design Intent / Product Principle / Core Promise / User Feeling / Product Truth) — the exact owner-controlled vocabulary of AX-0001 §3 — with no per-unit marker distinguishing transcribed source language from cataloguer-synthesized wording. `core-systems.md` had the right discipline ("**Evidenced DNA** … is not a substitute for Product Owner-authored immutable Product DNA"); the Question catalogue does not, and its DNA text flows verbatim into ledger evidence summaries and conflict quotes (CAND-000102, -000156, -000162). INTEGRITY-REPORT's "Owner-controlled top-level fields: 0" is true of the schema and blind to this. The risk is not a present violation — it is that at disposition, 67 pre-drafted DNA blocks become canonical by path of least resistance. The same shape applies to catalogue "Acceptance / success evidence" fields (hidden-acceptance-criteria risk).
2. **Undefined `lifecycle` / `historical_epoch` vocabularies** (A5) — "Ready For Owner" is an unstated-criteria judgment that will influence owner attention order.
3. **`confidence` duplicates `evidence_confidence.level`** in all 193 records — currently consistent (0 mismatches), but a denormalized copy inside an archive governed by One Source of Truth is a drift vector with no stated owner.
4. **Doctrine masquerading as backlog inventory** — see Product Truth below; without a declared disposition path, records like CAND-000001 invite re-defining what AX-0002 C-001 already owns, which AX-0000 §4 forbids.
5. **No governance contradiction found.** No AX ID consumed, no candidate ID in `docs/governance/`, no conflict silently resolved, no priority/board/DNA/acceptance assigned in any top-level field, `Product Polish`→`Polish` normalization disclosed and conflict-preserved. The ratified layer required no amendment to complete this audit.

## G. Product Owner Questions

Only decisions that are genuinely the owner's:

1. **DNA provenance rule for 0002c:** may catalogue-authored Product DNA / acceptance blocks be used as *drafts* for owner-authored records, or must DNA be re-authored from scratch with the archive as evidence only? (Determines whether F1 is a convenience or a contamination.)
2. **Doctrine vs. backlog routing:** for Product Decision candidates that duplicate ratified meaning (CAND-000001 ↔ C-001; -000060 ↔ AX-0009 §2.2; -000103/104/105/106 ↔ §5.5 and trust rules; -000123/127/128 ↔ §§4.3–4.6; -000033 ↔ §3.5; -000100 ↔ future AX-0008; -000064 ↔ future AX-0006), do they become backlog records citing governance, lexicon/constitution amendments, or evidence-only citations with no record?
3. **Late candidates:** should Pitfall Map, quiz-session surfacing, and AI error-type classification be added as candidates before 0002c, given two are roadmap-in-progress?
4. **Tooling boundary:** do CAND-000095 (lint/hook hygiene), -000180 (Node LTS test runtime), and -000179 (repo asset boundaries) belong in the product backlog's Technical Debt board, or in engineering tracking outside AX-0001? And is CAND-000098 (Noctyrium daily-file architecture) backlog work at all, or pure historical preservation?
5. **Noctyrium recovery:** is a dedicated pre-June-2026 history-mining pass wanted while the session files still exist, or is the current one-record depth accepted?
6. **Archive custody:** commit `docs/product-memory/` now, and bring `/tmp/axom-sol-full-audit/` under durable storage? (Owner/repository decision; flagged because nothing else protects A1/A2.)
7. The 39 conflict records already enumerate their own owner decisions (Conflict Index) — cloud/account truth, Resource Hub privacy, Daily Games default, Daily Check-In wellbeing scope, dashboard quote hierarchy, release identity/version. They are correctly framed; no re-listing needed here.

## H. Concept Density Analysis

- **Well balanced:** Question System (67 records, 35%) — proportionate to flagship status and the P0 Import Engine; the trust chain (103→105, 114–117) and annotation family (138–144) are modeled at exactly the granularity their independent testability requires. Data Safety (14) and Daily Loop (13) similarly sound.
- **Over-modeled:** Course Central (20 records for a design-only module with no live connectors) — heavy forward speculation, including an SGU-specific template and cohort scheduling, ahead of any Level 0 implementation. Quiz Player micro-records (133–137: elimination, return-to-stem, reading scale, calculator, rationale hierarchy) — a deliberate HR-30 split, defensible for verification granularity but five PBIs' worth of ceremony for one checkpoint's conveniences.
- **Under-modeled:** Tasks (2 records) and Applications/Academic Prep (3) for surfaces that exist in the product — core-systems §N.6 admits these have only "one-line functional claims"; AI (a 2-record system group while AI concepts are actually scattered across 6+ records in other groups with no links to the provider-layer decision CAND-000074); cross-feature cohesion itself (the "one operating system" connective tissue rests on CAND-000003, a Medium-confidence Incomplete record, plus governance).

## I. Readiness Assessment

### READY WITH MINOR CORRECTIONS

**Why rejection failed.** I attacked this archive the way its own integrity report should be attacked: every count recomputed from raw data, every index re-derived, every disposition re-crosswalked, citations traced into the live repository, and the authority boundary searched for smuggled owner decisions. Nothing broke. The 250→193 arithmetic closes exactly. All 83 crosswalk dispositions match. All 17 cited commits exist. Every spot-checked file:line citation was accurate — including the unflattering ones (README's cloud claims contradicting shipped Settings). All 39 conflicts preserve both sides and select nothing. The 53 reconstruction notes correctly refused promotion. The schema contains no owner-controlled field. This is an archive built by someone who expected to be audited.

**Why not READY outright.** The corrections are real, bounded, and none requires re-normalization:

1. Commit the archive; secure `/tmp/axom-sol-full-audit/` (A1, A2) — *blocking in effect, trivial in cost.*
2. Restore the three dropped handoff concepts as candidates or notes (A3).
3. Transcribe the crosswalk-stated relationships the ledger missed (A4: 007↔099, 078↔079, 005↔021).
4. Define `lifecycle` and `historical_epoch` vocabularies; re-check epoch assignments against the definition (A5).
5. Mark authored-vs-transcribed provenance for Question-catalogue Product DNA blocks, or record the owner's process rule (G1).
6. Add cross-links for C-44/Q-19 and C-30/C-69 (B).

Per the checkpoint instruction, none of these was fixed here. They are inputs to AXOM-0002b.1. Items 1–4 should complete before AXOM-0002c disposition begins; items 5–6 can ride the disposition itself if the owner prefers.

---
*This audit assigned no AX ID, no priority, no board, no Product DNA, no acceptance criteria, no verification status, and no roadmap placement. It modified no governance document and no application file.*
