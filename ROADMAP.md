# AXOM — Roadmap, In-Progress & Proposed Ideas

Living backlog. Update this regularly: move items to [FEATURES.md](FEATURES.md) when they
ship, add proposed ideas here as they come up, and be honest about status.

Statuses: **in-progress** (partially built, gaps known) · **next** (agreed, not started) ·
**proposed** (idea, not committed) · **blocked** (needs something first).

Last updated: 2026-07-11

## Question Bank

| Item | Status | Notes |
| --- | --- | --- |
| OCR for scanned PDFs / screenshots | blocked | Needs a local OCR path (tesseract.js evaluation) or secure server-side OCR. Scans currently store provenance only — the UI says so. |
| Legacy Word `.doc` import | blocked | Mammoth handles modern DOCX only. Binary `.doc` needs a separate, security-reviewed conversion path. |
| Original source-binary retention | proposed | The library stores extracted/page text, metadata, and SHA-256 checksums today, not PDF/DOCX bytes. Needs a storage-budget, export, privacy, and deletion design before shipping. |
| Complex PDF layout recovery | in-progress | Digital text extraction is live and page-aware; columns, tables, unusual positioning, and damaged text layers can still require review. |
| Per-question AI explanation generation for imported sets | next | One call per question is expensive; needs batching UX + progress. Digest-level analysis shipped instead. |
| AI dedup of imported questions | next | Similarity check on import (normalized stem match shipped for cards, not yet questions). |
| Timed-block per-question pacing stats | in-progress | Coarse seconds are recorded; no pacing UI yet. |
| Faculty-style question mode (filter by analyzed style) | proposed | Analyzer exists; the mode filter is labeled "soon" in the bank browser. |
| Exam-simulation mode (full-length, sectioned) | proposed | Exam blocks + timer shipped; full simulation (sections, breaks) not built. |
| Import from Anki decks (.apkg) | proposed | Currently unsupported file type with a clear message. |
| Answer-choice-level analytics (distractor pull) | proposed | Requires per-option pick tracking (recorded, not surfaced). |

## AI layer

| Item | Status | Notes |
| --- | --- | --- |
| Secure cloud AI proxy (BYOK server-side) | blocked | Without a configured local/demo endpoint, optional AI actions are unavailable. Cloud calls stay disabled until a Vercel proxy handles secrets + consent. Never put keys in the client. |
| AI-proposed Command Brief overlay | next | Schema + validator + provider exist (`validateAiBrief`); needs the review-overlay UI. |
| WebLLM / in-browser models | proposed | Ollama covers local today; browser models when mature. |
| AI error-type classification of misses | in-progress | Provider interface + mock exist; not wired into tutor flow. |

## Data & platform

| Item | Status | Notes |
| --- | --- | --- |
| Dedicated IndexedDB records / attachments | proposed | The current vault persists one local-first state graph with a localStorage fallback. Large binary attachments and per-record stores need migration and quota design. |
| Code-splitting the main bundle | in-progress | xlsx + pdf.js + mammoth are lazy chunks; the main index chunk still exceeds 500 kB. Route-level splitting proposed. |
| Remaining React hook warnings (8, page-level) | in-progress | Pre-existing in large pages (Dashboard/Journal/Productivity/CourseTracker/GuidedTour/Onboarding); fix opportunistically. |
| Cloud sync hardening (PIN auth, sessions) | blocked | Alpha-labeled; needs real auth review before production claims. |
| AnkiConnect verified sync (dry-run preview, deck mapping) | next | Diagnostics exist; not machine-verified. |
| Native/Tauri shell refresh | proposed | Metadata rebranded; end-to-end native vault behavior unverified. |
| Calendar integration (day plans → calendar blocks) | proposed | Standard formats (ICS) first. |
| Premium tier activation | blocked | Scaffold shipped (`lib/tier.ts`), everything free during beta by design. |

## Product surfaces

| Item | Status | Notes |
| --- | --- | --- |
| Dashboard/Reports surfacing quiz sessions | next | Results live in the Question Bank tab today. |
| Pitfall Map as a dedicated surface | in-progress | Digest pitfalls ship on set cards; a cross-set pitfall dashboard is proposed. |
| Application Checker maturation | proposed | Shell exists; no data gathering yet. |
| Leaderboards | proposed | Deliberately deprioritized — conflicts with the calm tone. |
| DAT / CASPer lanes | proposed | Light surfaces only. |
| Accessibility pass (focus traps, contrast, reduced motion) | in-progress | Modal focus containment/restoration, quiz selected-state semantics, mobile-drawer inert/focus behavior, 44px mobile nav targets, and modal/drawer reduced motion are verified. A broader contrast/screen-reader audit remains. |
| In-app privacy/data inventory page | next | Documented in ASK report; not in-app yet. |

## Recently shipped (move log)

- 2026-07-11 — Latest-attempt current-mastery metrics with separately named
  all-attempt historical accuracy, shared vault constants, verbatim stored-explanation
  rendering, and the persisted Question Bank browser journey → moved to FEATURES.md.
- 2026-07-10 — Question Bank Command Center, progress-rich set cards, structured
  quiz feedback, deterministic explanation cleanup, per-stage parser confidence,
  exact answer evidence, source checksums, schema v32 migration, and dev-only
  reusable design preview → moved to FEATURES.md.
- 2026-07-10 — Full-text bank/source/set search, weak-topic next actions, optional
  weakness coach, and AI explanation cleaner → moved to FEATURES.md.
- 2026-07-10 — IndexedDB backup hardening, same-question attempt-safe backup merge,
  mobile/modal keyboard accessibility, bundled production PDF worker, and AXOM package/
  wrapper identity cleanup → moved to FEATURES.md.
- 2026-07-08 — PDF/DOCX extraction, answer-key mapping, Source Library, Question Sets,
  Block Builder, AI set digests → moved to FEATURES.md.
- 2026-07-08 — AXOM rebrand, version unification, exam/tutor modes, quiz sessions.
- 2026-07-08 — Daily loop (Command Brief, sessions, closeout, recovery), Anki card vault,
  local AI provider layer, persistence hardening.
