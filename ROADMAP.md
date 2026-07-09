# AXOM — Roadmap, In-Progress & Proposed Ideas

Living backlog. Update this regularly: move items to [FEATURES.md](FEATURES.md) when they
ship, add proposed ideas here as they come up, and be honest about status.

Statuses: **in-progress** (partially built, gaps known) · **next** (agreed, not started) ·
**proposed** (idea, not committed) · **blocked** (needs something first).

Last updated: 2026-07-08

## Question Bank

| Item | Status | Notes |
| --- | --- | --- |
| OCR for scanned PDFs / screenshots | blocked | Needs a local OCR path (tesseract.js evaluation) or secure server-side OCR. Scans currently store provenance only — the UI says so. |
| Per-question AI explanation generation for imported sets | next | One call per question is expensive; needs batching UX + progress. Digest-level analysis shipped instead. |
| AI dedup of imported questions | next | Similarity check on import (normalized stem match shipped for cards, not yet questions). |
| AI cleanup of messy imported text | proposed | "Fix formatting" action per draft in the review screen. |
| Timed-block per-question pacing stats | in-progress | Coarse seconds are recorded; no pacing UI yet. |
| Faculty-style question mode (filter by analyzed style) | proposed | Analyzer exists; the mode filter is labeled "soon" in the bank browser. |
| Exam-simulation mode (full-length, sectioned) | proposed | Exam blocks + timer shipped; full simulation (sections, breaks) not built. |
| Question bank search (full-text across stems) | next | Bank browser filters by mode only today. |
| Import from Anki decks (.apkg) | proposed | Currently unsupported file type with a clear message. |
| Answer-choice-level analytics (distractor pull) | proposed | Requires per-option pick tracking (recorded, not surfaced). |

## AI layer

| Item | Status | Notes |
| --- | --- | --- |
| Secure cloud AI proxy (BYOK server-side) | blocked | Config surface ships; calls stay disabled until the Vercel proxy handles secrets + consent. Never put keys in the client. |
| AI-proposed Command Brief overlay | next | Schema + validator + provider exist (`validateAiBrief`); needs the review-overlay UI. |
| AI-recommended next block from weak categories | next | Category scores exist; wire a "recommended block" card into Results. |
| WebLLM / in-browser models | proposed | Ollama covers local today; browser models when mature. |
| AI error-type classification of misses | in-progress | Provider interface + mock exist; not wired into tutor flow. |

## Data & platform

| Item | Status | Notes |
| --- | --- | --- |
| E2E smoke test (onboarding → import → block → repair card) | next | Unit coverage is strong (190+ tests); no browser e2e yet. |
| Code-splitting the main bundle | in-progress | xlsx + pdf.js + mammoth are lazy chunks; the main index chunk still exceeds 500 kB. Route-level splitting proposed. |
| Remaining React hook warnings (7, page-level) | in-progress | Pre-existing in large pages (Dashboard/Journal/Productivity/CourseTracker/GuidedTour/Onboarding); fix opportunistically. |
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
| Accessibility pass (focus traps, contrast, reduced motion) | next | Reduced-motion partially handled; needs a dedicated pass. |
| In-app privacy/data inventory page | next | Documented in ASK report; not in-app yet. |

## Recently shipped (move log)

- 2026-07-08 — PDF/DOCX extraction, answer-key mapping, Source Library, Question Sets,
  Block Builder, AI set digests → moved to FEATURES.md.
- 2026-07-08 — AXOM rebrand, version unification, exam/tutor modes, quiz sessions.
- 2026-07-08 — Daily loop (Command Brief, sessions, closeout, recovery), Anki card vault,
  local AI provider layer, persistence hardening.
