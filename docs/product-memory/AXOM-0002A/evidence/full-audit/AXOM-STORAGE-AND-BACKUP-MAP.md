# AXOM Storage and Backup Map

## Boundaries

| Boundary/key | Purpose | Personal data | Bounded/versioned | Backup/restore | Notes |
|---|---|---|---|---|---|
| IndexedDB `noctyrium-local-vault` v2 / `state` | Canonical Zustand workspace and compatibility scoped copies | Yes: journal, tasks, questions, activity, profile | Workspace schema 32; payload growth not globally capped | Portable JSON includes DATA_KEYS; replace/merge supported | Canonical local-first owner |
| IndexedDB / `backups` | pre-migration local snapshots | Yes, full vault/local metadata | retention logic exists; backup schema versioned | internal recovery | Stored apart from workspace records, same database |
| `noctyrium-state` | legacy/fallback workspace | Yes | browser quota; schema 32 | included in local migration snapshots | removed after confirmed IDB write |
| `noctyrium-state:active-user` | profile pointer | identifier | tiny | local snapshot | compatibility |
| `noctyrium-state:user:<id>` | scoped compatibility/fallback workspace | Yes | potentially large | local snapshot | IDB keeps compatibility copy; localStorage removed after success |
| Pomodoro/active session keys | reload-safe timers/sessions | study activity | one session each | local snapshot; not portable DATA_KEYS directly | reconciliation logic tested |
| AI settings/generations | provider prefs and generated artifacts | potentially sensitive prompts | generations migrated/bounded by implementation | generations in migration snapshot; portable workspace differs | no hidden cloud provider activation; Ollama explicit |
| theme/quote/announcement/reminder keys | device UI preferences/ledgers | low | bounded | local migration snapshot, not portable workspace | correct separation |
| `axom.storage.schemaVersion`, last build/failure | update/migration metadata | no | scalar/versioned | local snapshot | drives pre-migration backup and recovery warning |
| Cache Storage `axom-v0.0.1-prebeta` | offline shell/assets | no workspace data intended | release-named, runtime GET cache unbounded | not backup | exclude APIs and cap runtime cache before public Alpha |
| Exported `axom-backup-YYYY-MM-DD.json` | user-controlled portable backup | Yes, plaintext | schema field; unknown/older normalized | replace or merge | user must protect file; no encryption |
| Optional Neon backend | users/snapshots/backups/sessions | Yes if enabled | SQL schemas | cloud snapshot/backup | unsafe for public use until all snapshot endpoints enforce session ownership |
| Tauri SQLite | experimental native vault | potentially | SQL migration scaffold | not proven equivalent to browser backup | not Alpha authority |

## Safety verdict

Normal same-origin deployments preserve IndexedDB/localStorage because app assets and origin storage are separate. Startup compares build/schema metadata; before schema migration it creates a local snapshot and leaves existing data in place on failure. Existing tests cover current/older schemas, unknown-field normalization, backup round-trip, merge behavior, local vault fallback, migration failure, and question-attempt preservation. What is not proven here is browser-origin migration after a hostname/repository deployment change, quota exhaustion with a very large question/PDF workspace, crash injection during every transaction boundary, or native/cloud parity. Before public Alpha: add an automated populated-workspace upgrade test across two built versions, surface quota/persistence status, provide scheduled backup reminders plus one-click recovery, and document that changing origin creates a different browser vault.

A 4–6 digit PIN is not secure cloud authentication by itself. The scaffold uses salted PBKDF2/lockout/session concepts, but the legacy name/UUID snapshot paths bypass session ownership. Accounts are Beta/later after threat modeling, authenticated endpoint authorization, recovery, encryption policy, OAuth option, conflict resolution, and anonymous-local migration.
