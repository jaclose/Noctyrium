# Implementation Audit — web app (`web/`)

Snapshot taken before the Daily Academic Loop build. Stack: Vite + React 18 + TypeScript (strict),
Zustand 5 with `persist`, hash-based routing in `App.tsx`, no router lib. ~95 source files.

## 1. Existing verified functionality

- **State core** (`lib/store.ts`, 1.5k lines): single persisted Zustand store, schema v26 with 25
  forward migrations; `partialize` strips actions; `replaceAll`/`resetToSeed`/`startFresh` data ops.
- **Persistence** (`lib/localVault.ts`): IndexedDB (`noctyrium-local-vault`) with localStorage
  fallback + per-user scoped copies. Writes go to both; reads prefer IDB and re-hydrate from
  localStorage if IDB read fails.
- **Backup** (`lib/backup.ts`): JSON export of all data keys; import with field-level normalization.
  Import **replaces** state (no merge), with a confirm in Settings → Backup.
- **Daily rollover** (`lib/dailyRollover.ts` + watcher): timestamp/date-key based, timezone-aware,
  carries open tasks forward, archives day summaries; well-tested.
- **Course tracker** (`lib/tracker.ts`): pass-based mastery model + a real scored suggestion engine
  (`suggestMoves`) — a solid foundation for Next Best Move.
- **Exam plan engine** (`lib/examPlan.ts`): pure countdown/phase/question-tier logic per board exam.
- **Energy/readiness** (`lib/energy.ts`): factor-based readiness score with decay + journal signals.
- **Performance analysis** (`lib/performance.ts`): 14-day trend commentary.
- **Pomodoro** (`lib/pomodoro.ts`): global timer store, persisted snapshot with `updatedAt` and
  elapsed reconstruction on load; auto-logs minutes to study logs.
- **Dashboard** (`pages/DashboardPage.tsx`, 1.6k lines): reorderable widget wall (15 widgets).
- **Blueprints**: catalog → installable containers with rich nodes, versioned reconcile.
- **Anki Lab (current)**: prompt-builder for external AI + local heuristic card drafts + TSV export.
  Cards are **not persisted** and there is no in-app review.
- **Anki Connect** (`lib/ankiConnect.ts`): real AnkiConnect probing (version → decks/reviews).
- **Update check** (`UpdateAvailableWatcher`): polls `version.json` every 15 min, warns via toast.
- **Onboarding, guided tour, journal/standups, habits (experimental), premed experience log +
  xlsx export, activity history, resources, hub folders** — all functional.
- **Serverless API** (`/api/ai.ts` → `lib/api/aiService`): Vercel-hosted AI endpoints; client
  (`services/aiClient.ts`) disables them on localhost. No keys in client code.

## 2. Existing unfinished functionality

- **AI layer**: `types/ai.ts` defines 5 features but the client is hosted-only; no local provider,
  no provider abstraction, no structured-output validation. Dashboard "AI actions" widget hidden by default.
- **Anki Lab**: draft cards vanish on navigation; no scheduling, review, retention tracking.
- **Practice questions**: `TrackerKind "PQ"` rows count sets, but there is no question record,
  no error log, no review queue.
- **Leaderboards**: stub page ("coming soon").
- **Application Checker / Residency**: page exists; data model is thin; no profile analysis.
- **Sync** (`services/syncClient.ts`, `AccountSyncPanel`): optional cloud backup scaffolding.
- **Native/Tauri** (`services/nativeSqlite.ts`, `@tauri-apps/plugin-sql`): dormant desktop path.

## 3. Data-loss risks

1. **Import replaces instead of merging** — a user importing an old backup silently loses newer
   records. Needs merge behavior + explicit overwrite confirmation (Phase 2 §5).
2. **Migration has no pre-migration snapshot** — a throwing migration would leave zustand-persist
   in a bad state with no recovery copy. Need a pre-migration backup key + recoverable error state.
3. **Unknown keys survive today** (migrations mutate the same object) — must stay true as schema grows.
4. **`startFresh`/`resetToSeed` destroy data** — they are user-initiated but have no export prompt.
5. **No visible backup-age indicator** — users don't know how stale their last export is.

## 4. Timer reliability risks

- Pomodoro reconstructs elapsed time from `updatedAt` on **load only**; a backgrounded tab that
  throttles `setInterval` will drift until the next `_tick` (elapsed is computed from `lastTickAt`,
  which limits drift to ~1 tick — acceptable). Snapshot writes every second are heavy but safe.
- **There is no task-linked session record at all** — the Pomodoro logs minutes but sessions as
  first-class entities (task link, status, confidence, takeaway) don't exist. The new session
  engine must be built on absolute timestamps + persisted segments, not on the Pomodoro store.

## 5. Architecture limitations

- `DashboardPage.tsx` (1.6k lines) and `store.ts` (1.5k lines) are god-files; new features must
  live in their own modules (engines pure, components small).
- Whole-state JSON blob persisted on every change — fine at current scale; a per-table Dexie
  schema is not justified yet, but new record types must be arrays that can be split later.
- Brand strings ("Noctyrium") are scattered across ~18 UI files; version constants live in `seed.ts`.
- No error boundaries; storage failures fail silently.
- Routing is a flat string map — fine, but new pages must be registered in three places
  (`nav.ts`, `App.tsx`, sidebar groups).

## 6. What will be implemented now

- **Brand config** (`lib/brand.ts`): single source for product name, version, storage keys,
  changelog URL; `seed.ts` re-exports for compatibility.
- **Command Brief** engine (`lib/commandBrief.ts`, pure + tested) + full-width dashboard section:
  mode (Maintain/Catch-Up/Recovery/Sprint/Exam Week) with plain-language rationale, one Next Best
  Move with Begin Session, Minimum Viable Win, What Changed Since Yesterday.
- **Study sessions** (`lib/sessions.ts` + store slice): timestamp-segment-based sessions linked to
  tasks/tracker/questions; pause/resume; quick logging (completed/partial/blocked/…); completion
  capture (confidence, takeaway, blocker, energy); active-session restoration after reload/sleep.
- **Daily Closeout**: 30–90s flow persisted as `DailyCloseout` records; feeds tomorrow's brief and
  a mode override.
- **Recovery Protocol** (`lib/recovery.ts`, pure + tested): trigger detection, gap estimate,
  triage buckets, 24h/72h plans, accept/edit/defer/reset; no shame language.
- **Persistence hardening**: schema v27 migration (additive), pre-migration snapshot, merge-mode
  import with explicit overwrite, data-health panel (driver, counts, last backup, migration state).
- **Update flow**: calm notice with Update now / Later / View changes; suppressed during an active
  session; centralized version source.
- **AI provider layer** (`lib/ai/*`): typed provider interfaces; Ollama local detection + chat
  (no key); deterministic labeled mock mode; BYOK config surface marked future/cloud-proxy-only;
  structured output validation; nothing mutates plans without user review.
- **Question Workspace** (new page): paste → parse → review → save pipeline; typed question
  records with error taxonomy; answer/review flows; weak-topic + repeat-error surfacing; file
  intake stores metadata with manual transcription (honest no-OCR-yet extension point).
- **Anki Lab upgrade**: persisted typed cards with provenance + AI-generated flag; in-app review
  with lightweight spaced scheduling; quality checks (duplicates, too-long, multi-fact, weak cloze);
  error→repair-card pipeline; existing prompt studio kept.
- **Study Methods** library page with when/when-not/steps/mistakes + add-to-plan.
- **Faculty Style Analyzer** (pure stats over saved questions, hedged language).
- Focused tests for: migrations, session restoration, brief priority logic, recovery triggers,
  question validation, card schema + quality checks, Ollama detection, update-notice logic.

## 7. Scaffolded for later (intentionally in development)

- Cloud BYOK calls (needs the server proxy; config UI + types only).
- Server-side OCR for PDFs/screenshots (extension point + provenance fields ship now).
- AI question generation end-to-end (schema + provider interface + review gate ship now; local
  provider can fill it when configured).
- Exam Simulation / Timed Block modes (mode enum + filtering ship; timing UI later).
- Application/Residency Intelligence (typed profile architecture; no analysis claims).
- Anki export via AnkiConnect for the new card vault (TSV export ships now).

## 8. Remove / merge / deprioritize

- **Leaderboards**: keep hidden by default; conflicts with the calm, non-competitive tone — do not invest.
- **Prompt Library**: keep, but fold Anki Lab prompt output into it rather than expanding it.
- **Legacy `types/ai.ts` + hosted-only `aiClient.ts`**: superseded by the provider layer; kept for
  the Vercel path but new features must go through `lib/ai`.
- **Tauri/native SQLite path**: dormant; exclude from this effort.
- **Dashboard widget wall**: retained but demoted below the Command Brief; several widgets stay
  hidden-by-default.
