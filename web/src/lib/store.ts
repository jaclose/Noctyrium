// ===========================================================================
// The single source of truth. Zustand + persist (localStorage) so every change
// survives reloads, works offline, and needs no backend. All lists are CRUD-
// able, which is what makes the app "modular" rather than the fixed Swift build.
// ===========================================================================
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  BoardBlueprintLog, BoardExamId, BoardPrepProfile, Course, CourseModule, DayPlan, HubFolder, JournalEntry, NoctyriumState,
  PremedExperienceEntry, Prompt, Resource, Task, Term, TrackerItem, Profile, StudyLog,
} from "./types";
import {
  APP_VERSION_LABEL, DEFAULT_DASHBOARD_WIDGETS, DEFAULT_HIDDEN_DASHBOARD_WIDGETS,
  driveResourceFields, makeSeed, SCHEMA_VERSION, SGU_DRIVES,
} from "./seed";
import { dayKey } from "./scoring";
import { localVaultStorage } from "./localVault";
import { userIdFromName } from "./userIdentity";
import { ACADEMIC_TEMPLATE_COURSES, ACADEMIC_TEMPLATE_TERMS, focusOption, normalizedFocusIds } from "./experience";
import { inferTrackFromFocus, resolveTrack } from "./tracks";
import type { EducationTrack } from "./tracks";
import type { EducationTrackId, ExperienceFocusId } from "./types";

interface ApplyTrackOptions {
  focusSubscriptions?: ExperienceFocusId[];
  activeFocusId?: ExperienceFocusId;
  showSguResources?: boolean;
  cardTarget?: number;
  minuteTarget?: number;
  /** Install the track's term/course/tracker blueprint (replaces seed shells). */
  seedStructure?: boolean;
}
import { normalizeTrackerPath, trackerPathKey } from "./pathUtils";
import { normalizeResourceUrl } from "./resourceUtils";

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

interface Actions {
  // profile
  updateProfile: (patch: Partial<Profile>) => void;
  // education track (program) — sets prefs, and optionally installs its
  // term/course/tracker blueprint (used by onboarding + "load starter structure")
  applyEducationTrack: (trackId: EducationTrackId, opts?: ApplyTrackOptions) => void;

  // terms
  addTerm: (name: string) => void;
  renameTerm: (id: string, name: string) => void;
  removeTerm: (id: string) => void;

  // courses
  addCourse: (c: Omit<Course, "id" | "modules"> & { modules?: string[] }) => void;
  updateCourse: (id: string, patch: Partial<Course>) => void;
  removeCourse: (id: string) => void;
  addModule: (courseId: string, name: string) => void;
  renameModule: (courseId: string, moduleId: string, name: string) => void;
  removeModule: (courseId: string, moduleId: string) => void;

  // tracker
  addTrackerItem: (item: Omit<TrackerItem, "id" | "updated">) => void;
  bulkAddTrackerItems: (items: Omit<TrackerItem, "id" | "updated">[]) => void;
  updateTrackerItem: (id: string, patch: Partial<TrackerItem>) => void;
  renameTrackerScope: (oldPath: string, newPath: string) => void;
  removeTrackerScope: (path: string) => void;
  bumpPasses: (id: string, delta: number) => void; // +1 / -1 study pass (clamped 0..)
  setPasses: (id: string, n: number) => void; // click a dot to set passes directly
  cycleAnki: (id: string) => void; // 0→1→2→3→0 (orange/yellow/purple)
  cycleYield: (id: string) => void; // none→high→review→low
  removeTrackerItem: (id: string) => void;

  // resources (saved hyperlinks)
  addResource: (r: Omit<Resource, "id" | "created">) => void;
  bulkAddResources: (rs: Omit<Resource, "id" | "created">[]) => void;
  updateResource: (id: string, patch: Partial<Resource>) => void;
  removeResource: (id: string) => void;
  toggleResourceFavorite: (id: string) => void;

  // tasks
  addTask: (title: string, due?: string, scope?: string) => void;
  toggleTask: (id: string) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;

  // journal
  addJournal: (e: Omit<JournalEntry, "id"> & { id?: string }) => void;
  updateJournal: (id: string, patch: Partial<JournalEntry>) => void;
  removeJournal: (id: string) => void;

  // pre-med experiences
  addPremedExperience: (e: Omit<PremedExperienceEntry, "id" | "created">) => void;
  updatePremedExperience: (id: string, patch: Partial<PremedExperienceEntry>) => void;
  removePremedExperience: (id: string) => void;

  // prompts
  addPrompt: (p: Omit<Prompt, "id" | "created" | "updated">) => void;
  updatePrompt: (id: string, patch: Partial<Prompt>) => void;
  removePrompt: (id: string) => void;

  // hub folders
  addFolder: (f: Omit<HubFolder, "id">) => void;
  updateFolder: (id: string, patch: Partial<HubFolder>) => void;
  removeFolder: (id: string) => void;

  // productivity
  logStudy: (entry: { type: string; minutes?: number; cards?: number; note?: string }) => void;
  startNewStudyDay: () => void;

  // board prep
  updateBoardPrep: (exam: BoardExamId, patch: Partial<BoardPrepProfile>) => void;
  addBoardBlueprintLog: (exam: BoardExamId, entry: Omit<BoardBlueprintLog, "id" | "updated">) => void;
  removeBoardBlueprintLog: (exam: BoardExamId, id: string) => void;

  // win the day
  setDayPlan: (dayKey: string, intention: string, wins: string[]) => void;
  reviewDayPlan: (dayKey: string, outcome: DayPlan["outcome"], reviewNote?: string) => void;

  // data management
  replaceAll: (state: NoctyriumState) => void;
  resetToSeed: () => void;
  startFresh: () => void; // wipe sample data, keep an empty personal profile
}

export type Store = NoctyriumState & Actions;

export const useStore = create<Store>()(
  persist(
    (set) => ({
      ...makeSeed(),

      updateProfile: (patch) => set((s) => {
        const profile = { ...s.profile, ...patch };
        if ("name" in patch || !profile.userId) profile.userId = userIdFromName(profile.name);
        return { profile };
      }),

      applyEducationTrack: (trackId, opts = {}) =>
        set((s) => {
          const track = resolveTrack(trackId);
          const focusSubscriptions = opts.focusSubscriptions
            ? normalizedFocusIds(opts.focusSubscriptions)
            : s.profile.focusSubscriptions;
          const activeFocusId = opts.activeFocusId
            && focusSubscriptions.includes(opts.activeFocusId)
            ? opts.activeFocusId
            : s.profile.activeFocusId;
          const focus = focusOption(activeFocusId);
          const profile: Profile = {
            ...s.profile,
            educationTrack: trackId,
            showSguResources: opts.showSguResources ?? track.showsSguResources,
            hiddenNav: hiddenNavForTrackSwitch(s.profile.hiddenNav, trackId),
            focusSubscriptions,
            activeFocusId,
            phase: focus?.phase ?? s.profile.phase,
            ...(opts.cardTarget != null ? { dailyCardTarget: opts.cardTarget } : {}),
            ...(opts.minuteTarget != null ? { dailyMinuteTarget: opts.minuteTarget } : {}),
          };
          if (!opts.seedStructure) return { profile };

          const built = buildTrackStructure(track);
          // First-run / explicit reseed: swap in the track's term/course shells
          // and keep any tracker rows the user added (drop only seed examples).
          const keptTracker = s.tracker.filter((t) => !/^example[:\s]/i.test(t.label));
          return {
            profile,
            terms: built.terms,
            courses: built.courses,
            tracker: [...keptTracker, ...built.tracker],
          };
        }),

      addTerm: (name) => set((s) => ({ terms: [...s.terms, { id: uid(), name }] })),
      renameTerm: (id, name) =>
        set((s) => ({ terms: s.terms.map((t) => (t.id === id ? { ...t, name } : t)) })),
      removeTerm: (id) =>
        set((s) => ({
          terms: s.terms.filter((t) => t.id !== id),
          courses: s.courses.filter((c) => c.termId !== id),
        })),

      addCourse: ({ modules = [], ...rest }) =>
        set((s) => ({
          courses: [
            ...s.courses,
            { ...rest, id: uid(), modules: modules.map((n) => ({ id: uid(), name: n })) },
          ],
        })),
      updateCourse: (id, patch) =>
        set((s) => ({ courses: s.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeCourse: (id) => set((s) => ({ courses: s.courses.filter((c) => c.id !== id) })),
      addModule: (courseId, name) =>
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === courseId ? { ...c, modules: [...c.modules, { id: uid(), name }] } : c,
          ),
        })),
      renameModule: (courseId, moduleId, name) =>
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === courseId
              ? { ...c, modules: c.modules.map((m) => (m.id === moduleId ? { ...m, name } : m)) }
              : c,
          ),
        })),
      removeModule: (courseId, moduleId) =>
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === courseId
              ? { ...c, modules: c.modules.filter((m: CourseModule) => m.id !== moduleId) }
              : c,
          ),
        })),

      addTrackerItem: (item) =>
        set((s) => ({ tracker: [...s.tracker, { ...item, path: normalizeTrackerPath(item.path), id: uid(), updated: now() }] })),
      bulkAddTrackerItems: (items) =>
        set((s) => ({
          tracker: [...s.tracker, ...items.map((item) => ({ ...item, path: normalizeTrackerPath(item.path), id: uid(), updated: now() }))],
        })),
      updateTrackerItem: (id, patch) =>
        set((s) => ({
          tracker: s.tracker.map((t) => (t.id === id ? { ...t, ...patch, updated: now() } : t)),
        })),
      renameTrackerScope: (oldPath, newPath) =>
        set((s) => {
          const from = normalizeTrackerPath(oldPath);
          const to = normalizeTrackerPath(newPath);
          const fromKey = trackerPathKey(from);
          const toKey = trackerPathKey(to);
          if (!from || !to || fromKey === toKey) return {};
          return {
            tracker: s.tracker.map((t) => {
              const cleanPath = normalizeTrackerPath(t.path);
              const key = trackerPathKey(cleanPath);
              return key === fromKey || key.startsWith(`${fromKey}/`)
                ? { ...t, path: `${to}${cleanPath.slice(from.length)}`, updated: now() }
                : t;
            }),
          };
        }),
      removeTrackerScope: (path) =>
        set((s) => {
          const from = trackerPathKey(path);
          if (!from) return {};
          return { tracker: s.tracker.filter((t) => {
            const key = trackerPathKey(t.path);
            return !(key === from || key.startsWith(`${from}/`));
          }) };
        }),
      bumpPasses: (id, delta) =>
        set((s) => ({
          tracker: s.tracker.map((t) =>
            t.id === id ? { ...t, passes: Math.max(0, t.passes + delta), updated: now() } : t),
        })),
      setPasses: (id, n) =>
        set((s) => ({
          tracker: s.tracker.map((t) =>
            // click the dot you're already at to clear it back one
            t.id === id ? { ...t, passes: t.passes === n ? n - 1 : n, updated: now() } : t),
        })),
      cycleAnki: (id) =>
        set((s) => ({
          tracker: s.tracker.map((t) =>
            t.id === id ? { ...t, ankiPasses: (t.ankiPasses + 1) % 4, updated: now() } : t),
        })),
      cycleYield: (id) =>
        set((s) => {
          const order = ["none", "high", "review", "low"] as const;
          return {
            tracker: s.tracker.map((t) =>
              t.id === id
                ? { ...t, yield: order[(order.indexOf(t.yield) + 1) % order.length], updated: now() }
                : t),
          };
        }),
      removeTrackerItem: (id) => set((s) => ({ tracker: s.tracker.filter((t) => t.id !== id) })),

      addResource: (r) =>
        set((s) => addResourceToState(s.resources, r)),
      bulkAddResources: (rs) =>
        set((s) => addResourcesToState(s.resources, rs)),
      updateResource: (id, patch) =>
        set((s) => {
          const resources = s.resources.map((r) =>
            r.id === id ? { ...r, ...patch, url: patch.url ? normalizeResourceUrl(patch.url) : r.url } : r,
          );
          return { resources: dedupeResources(resources) };
        }),
      removeResource: (id) => set((s) => ({ resources: s.resources.filter((r) => r.id !== id) })),
      toggleResourceFavorite: (id) =>
        set((s) => ({ resources: s.resources.map((r) => (r.id === id ? { ...r, favorite: !r.favorite } : r)) })),

      addTask: (title, due, scope) =>
        set((s) => ({ tasks: [{ id: uid(), title, due, scope, done: false, archived: false, created: now() }, ...s.tasks] })),
      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? now() : undefined } : t,
          ),
        })),
      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      addJournal: (e) => set((s) => ({ journal: [{ ...e, id: e.id ?? uid() }, ...s.journal] })),
      updateJournal: (id, patch) =>
        set((s) => ({ journal: s.journal.map((j) => (j.id === id ? { ...j, ...patch } : j)) })),
      removeJournal: (id) => set((s) => ({ journal: s.journal.filter((j) => j.id !== id) })),

      addPremedExperience: (e) =>
        set((s) => ({ premedExperiences: [{ ...e, id: uid(), created: now() }, ...(s.premedExperiences ?? [])] })),
      updatePremedExperience: (id, patch) =>
        set((s) => ({ premedExperiences: (s.premedExperiences ?? []).map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)) })),
      removePremedExperience: (id) =>
        set((s) => ({ premedExperiences: (s.premedExperiences ?? []).filter((entry) => entry.id !== id) })),

      addPrompt: (p) =>
        set((s) => ({ prompts: [{ ...p, id: uid(), created: now(), updated: now() }, ...s.prompts] })),
      updatePrompt: (id, patch) =>
        set((s) => ({
          prompts: s.prompts.map((p) => (p.id === id ? { ...p, ...patch, updated: now() } : p)),
        })),
      removePrompt: (id) => set((s) => ({ prompts: s.prompts.filter((p) => p.id !== id) })),

      addFolder: (f) => set((s) => ({ folders: [...s.folders, { ...f, id: uid() }] })),
      updateFolder: (id, patch) =>
        set((s) => ({ folders: s.folders.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
      removeFolder: (id) => set((s) => ({ folders: s.folders.filter((f) => f.id !== id) })),

      logStudy: ({ type, minutes = 0, cards = 0, note }) =>
        set((s) => {
          const entry: StudyLog = {
            id: uid(), dayKey: s.activeDayKey, ts: now(), type, minutes, cards, note,
          };
          return { logs: [entry, ...s.logs] };
        }),

      // Close the current study day, advance the pointer to the next day.
      // Idempotent in spirit: it only advances after the real shifted day moves.
      startNewStudyDay: () =>
        set((s) => {
          const today = dayKey();
          if (s.activeDayKey >= today) return {};
          return { activeDayKey: today };
        }),

      updateBoardPrep: (exam, patch) =>
        set((s) => ({
          boardPrep: {
            ...defaultBoardPrepState(),
            ...s.boardPrep,
            [exam]: {
              ...defaultBoardPrep(exam),
              ...s.boardPrep?.[exam],
              ...patch,
              updated: now(),
            },
          },
        })),
      addBoardBlueprintLog: (exam, entry) =>
        set((s) => {
          const current = {
            ...defaultBoardPrep(exam),
            ...s.boardPrep?.[exam],
          };
          return {
            boardPrep: {
              ...defaultBoardPrepState(),
              ...s.boardPrep,
              [exam]: {
                ...current,
                blueprintLogs: [{ ...entry, id: uid(), updated: now() }, ...(current.blueprintLogs ?? [])],
                updated: now(),
              },
            },
          };
        }),
      removeBoardBlueprintLog: (exam, id) =>
        set((s) => {
          const current = {
            ...defaultBoardPrep(exam),
            ...s.boardPrep?.[exam],
          };
          return {
            boardPrep: {
              ...defaultBoardPrepState(),
              ...s.boardPrep,
              [exam]: {
                ...current,
                blueprintLogs: (current.blueprintLogs ?? []).filter((log) => log.id !== id),
                updated: now(),
              },
            },
          };
        }),

      setDayPlan: (dk, intention, wins) =>
        set((s) => {
          const rest = s.dayPlans.filter((p) => p.dayKey !== dk);
          if (!intention.trim()) return { dayPlans: rest };
          const prev = s.dayPlans.find((p) => p.dayKey === dk);
          return {
            dayPlans: [
              { dayKey: dk, intention, wins, createdAt: prev?.createdAt ?? now(),
                reviewedAt: prev?.reviewedAt, outcome: prev?.outcome, reviewNote: prev?.reviewNote },
              ...rest,
            ],
          };
        }),
      reviewDayPlan: (dk, outcome, reviewNote) =>
        set((s) => ({
          dayPlans: s.dayPlans.map((p) =>
            p.dayKey === dk
              ? outcome
                ? { ...p, outcome, reviewNote, reviewedAt: now() }
                : { ...p, outcome: undefined, reviewNote: undefined, reviewedAt: undefined }
              : p),
        })),

      replaceAll: (state) => set(() => ({ ...state })),
      resetToSeed: () => set(() => ({ ...makeSeed() })),
      startFresh: () =>
        set((s) => ({
          terms: [], courses: [], tracker: [], tasks: [],
          // keep the curated shared drives even on a fresh start
          resources: SGU_DRIVES.map((d) => ({ id: uid(), created: now(), ...driveResourceFields(d) })),
          journal: [], premedExperiences: [], prompts: [], folders: [], logs: [], dayPlans: [],
          boardPrep: defaultBoardPrepState(),
          activeDayKey: dayKey(),
          // keep the user's profile + integrations catalog
          profile: normalizeProfile({ ...s.profile, name: s.profile.name === "Noctyrium" ? "" : s.profile.name }),
        })),
    }),
    {
      name: "noctyrium-state",
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localVaultStorage),
      // Forward-migrate older saved data so existing users don't lose anything
      // when the schema grows (v1 had no resources / kind / day targets).
      migrate: (persisted, fromVersion) => {
        const s = (persisted ?? {}) as Record<string, unknown>;
        if (fromVersion < 2) {
          s.resources = s.resources ?? [];
          const tracker = (s.tracker as Array<Record<string, unknown>>) ?? [];
          s.tracker = tracker.map((t) => ({
            ...t,
            kind: t.kind ?? t.type ?? "Lecture",
          }));
          const profile = (s.profile as Record<string, unknown>) ?? {};
          s.profile = { dailyCardTarget: 120, dailyMinuteTarget: 240, ...profile };
        }
        if (fromVersion < 3) {
          // status/quality → passes / ankiPasses / yield
          const tracker = (s.tracker as Array<Record<string, unknown>>) ?? [];
          const fromStatus = (st: unknown) =>
            st === "mature" ? 3 : st === "working" ? 2 : st === "anki" ? 1 : 0;
          s.tracker = tracker.map((t) => ({
            id: t.id, path: t.path, label: t.label, kind: t.kind ?? "Lecture",
            passes: typeof t.passes === "number" ? t.passes : fromStatus(t.status),
            ankiPasses: typeof t.ankiPasses === "number" ? t.ankiPasses : (t.status === "anki" ? 1 : 0),
            yield: t.yield ?? "none",
            note: t.note, updated: t.updated ?? new Date().toISOString(),
          }));
        }
        if (fromVersion < 4) {
          const tasks = (s.tasks as Array<Record<string, unknown>>) ?? [];
          s.tasks = tasks.map((t) => ({
            ...t,
            archived: typeof t.archived === "boolean" ? t.archived : Boolean(t.done),
          }));
          const folders = (s.folders as Array<Record<string, unknown>>) ?? [];
          s.folders = folders.map((f) => ({
            ...f,
            localPath: f.localPath ?? "",
          }));
        }
        if (fromVersion < 5) {
          normalizeAcademicMap(s);
        }
        if (fromVersion < 6) {
          const profile = normalizeProfile(s.profile);
          if (/^v0\.\d+\.\d+ · web$/.test(profile.versionLabel)) profile.versionLabel = APP_VERSION_LABEL;
          s.profile = profile;
        }
        if (fromVersion < 7) {
          s.boardPrep = normalizeBoardPrep(s.boardPrep);
        }
        if (fromVersion < 8) {
          // Win-the-day plans + curated SGU drives that ship for everyone.
          s.dayPlans = s.dayPlans ?? [];
          const resources = (s.resources as Array<Record<string, unknown>>) ?? [];
          const urls = new Set(resources.map((r) => normalizeResourceUrl(String(r.url ?? ""))));
          for (const d of SGU_DRIVES) {
            if (!urls.has(normalizeResourceUrl(d.url))) {
              resources.unshift({ id: crypto.randomUUID(), created: new Date().toISOString(), ...driveResourceFields(d) });
            }
          }
          s.resources = dedupeResourceRecords(resources);
        }
        if (fromVersion < 9) {
          const profile = normalizeProfile(s.profile);
          if (/^v0\.\d+\.\d+ · web$/.test(profile.versionLabel)) profile.versionLabel = APP_VERSION_LABEL;
          s.profile = profile;
          s.resources = normalizeResourceLinks(s.resources);
          s.dayPlans = s.dayPlans ?? [];
        }
        if (fromVersion < 10) {
          const profile = normalizeProfile(s.profile);
          if (/^v0\.\d+\.\d+ · web$/.test(profile.versionLabel) || profile.versionLabel === "v0.10.0 · web") {
            profile.versionLabel = APP_VERSION_LABEL;
          }
          s.profile = profile;
        }
        if (fromVersion < 11) {
          s.boardPrep = normalizeBoardPrep(s.boardPrep);
        }
        if (fromVersion < 12) {
          const profile = normalizeProfile(s.profile);
          if (
            /^v0\.\d+\.\d+ · web$/.test(profile.versionLabel) ||
            profile.versionLabel === "v0.10.0 · web" ||
            profile.versionLabel === "alpha 1 · web" ||
            /^Noctyrium Alpha 1 · v[\d.-]+alpha[\d.-]* · web$/.test(profile.versionLabel)
          ) {
            profile.versionLabel = APP_VERSION_LABEL;
          }
          s.profile = profile;
        }
        if (fromVersion < 13) {
          // Anyone upgrading from an earlier schema already has a workspace —
          // never show the first-launch onboarding wizard to them.
          const profile = normalizeProfile(s.profile);
          profile.onboarded = true;
          s.profile = profile;
        }
        if (fromVersion < 14) {
          normalizeAcademicMap(s);
          s.boardPrep = normalizeBoardPrep(s.boardPrep);
          const profile = normalizeProfile(s.profile);
          profile.onboarded = true;
          s.profile = profile;
        }
        if (fromVersion < 15) {
          // Refresh the curated drive set (My Drive + MADCOW + SGU shared) with
          // personal usefulness ratings. Adds any missing by URL; keeps user drives.
          const resources = (s.resources as Array<Record<string, unknown>>) ?? [];
          const urls = new Set(resources.map((r) => normalizeResourceUrl(String(r.url ?? ""))));
          for (const d of SGU_DRIVES) {
            if (!urls.has(normalizeResourceUrl(d.url))) {
              resources.unshift({ id: crypto.randomUUID(), created: new Date().toISOString(), ...driveResourceFields(d) });
            }
          }
          s.resources = dedupeResourceRecords(resources);
        }
        if (fromVersion < 16) {
          s.profile = normalizeProfile(s.profile);
          s.resources = normalizeResourceLinks(s.resources);
          const tracker = (s.tracker as Array<Record<string, unknown>>) ?? [];
          s.tracker = tracker.map((t) => ({ ...t, path: normalizeTrackerPath(String(t.path ?? "")) }));
        }
        if (fromVersion < 17) {
          // Correct curated drive labels/categories/ratings to the canonical set
          // (fixes "Claudfather"↔"My Drive" mislabel + placeholder SGU names; adds
          // Mehlman + White Coat). Matches by normalized URL; injects any missing.
          const resources = (s.resources as Array<Record<string, unknown>>) ?? [];
          const byUrl = new Map(resources.map((r) => [normalizeResourceUrl(String(r.url ?? "")), r]));
          for (const d of SGU_DRIVES) {
            const fields = driveResourceFields(d);
            const existing = byUrl.get(normalizeResourceUrl(d.url));
            if (existing) {
              existing.title = fields.title;
              existing.url = fields.url;
              existing.category = "Drives";
              existing.tags = fields.tags;
              existing.rating = fields.rating;
              existing.ratingReason = fields.ratingReason;
              if (fields.note !== undefined) existing.note = fields.note;
            } else {
              resources.unshift({ id: crypto.randomUUID(), created: new Date().toISOString(), ...fields });
            }
          }
          s.resources = dedupeResourceRecords(resources);
        }
        if (fromVersion < 18) {
          // Introduce the education-track layer. Existing installs have been
          // SGU-centric, so infer their track from focus and keep SGU drives on.
          const profile = isRecord(s.profile) ? s.profile : {};
          if (typeof profile.educationTrack !== "string") {
            profile.educationTrack = inferTrackFromFocus(
              Array.isArray(profile.focusSubscriptions) ? profile.focusSubscriptions.map(String) : [],
            );
          }
          if (typeof profile.showSguResources !== "boolean") {
            profile.showSguResources = profile.educationTrack === "sgu";
          }
          s.profile = normalizeProfile(profile);
        }
        if (fromVersion < 19) {
          s.profile = normalizeProfile(s.profile);
        }
        if (fromVersion < 20) {
          s.premedExperiences = s.premedExperiences ?? [];
          const profile = isRecord(s.profile) ? s.profile : {};
          profile.hiddenDashboardWidgets = mergeStringLists(
            profile.hiddenDashboardWidgets,
            DEFAULT_HIDDEN_DASHBOARD_WIDGETS,
          );
          profile.hiddenNav = mergeStringLists(profile.hiddenNav, defaultHiddenNavForTrack(String(profile.educationTrack ?? "")));
          s.profile = normalizeProfile(profile);
        }
        return s as unknown as NoctyriumState;
      },
      partialize: (s) => {
        // persist data only — strip the action functions
        const {
          profile, terms, courses, tracker, resources, tasks, journal, premedExperiences, prompts,
          folders, logs, integrations, boardPrep, dayPlans, activeDayKey, schemaVersion,
        } = s;
        return {
          profile, terms, courses, tracker, resources, tasks, journal, premedExperiences, prompts,
          folders, logs, integrations, boardPrep, dayPlans, activeDayKey, schemaVersion,
        } as NoctyriumState;
      },
    },
  ),
);

type AnyRecord = Record<string, unknown>;

/** Convert a track's blueprint into live Term/Course/TrackerItem arrays. */
function buildTrackStructure(track: EducationTrack): { terms: Term[]; courses: Course[]; tracker: TrackerItem[] } {
  const terms: Term[] = track.terms.map((t) => ({ id: uid(), name: t.name }));
  const courses: Course[] = [];
  track.terms.forEach((termDef, index) => {
    const termId = terms[index].id;
    for (const course of termDef.courses) {
      courses.push({
        id: uid(),
        termId,
        code: course.code,
        name: course.name,
        files: 0,
        modules: course.modules.map((name) => ({ id: uid(), name })),
      });
    }
  });
  const tracker: TrackerItem[] = track.trackerRows.map((row) => ({
    id: uid(),
    path: normalizeTrackerPath(row.path),
    label: row.label,
    kind: row.kind,
    passes: 0,
    ankiPasses: 0,
    yield: row.yield,
    note: row.note,
    updated: now(),
  }));
  return { terms, courses, tracker };
}

function normalizeAcademicMap(state: AnyRecord) {
  // Only the SGU template owns the canonical Term 1–5 / BPM-PPM course map.
  // Other tracks manage their own structure, so don't force-inject SGU courses.
  const track = isRecord(state.profile) ? state.profile.educationTrack : undefined;
  if (track && track !== "sgu") return;
  const terms = arrayOfRecords(state.terms);
  const courses = arrayOfRecords(state.courses);
  const termIds = new Map<string, string>();

  for (const termDef of ACADEMIC_TEMPLATE_TERMS) {
    const existing = terms.find((t) => cleanText(t.name) === cleanText(termDef.name));
    if (existing) {
      existing.name = termDef.name;
      termIds.set(termDef.name, String(existing.id ?? termDef.id));
    } else {
      terms.push({ id: termDef.id, name: termDef.name });
      termIds.set(termDef.name, termDef.id);
    }
  }

  const termNameById = new Map(ACADEMIC_TEMPLATE_TERMS.map((term) => [term.id, term.name]));
  for (const courseDef of ACADEMIC_TEMPLATE_COURSES) {
    const existing = courses.find((c) => courseDef.aliases.includes(cleanCode(c.code)));
    const termName = termNameById.get(courseDef.termId) ?? "Term";
    const termId = termIds.get(termName) ?? courseDef.termId;
    if (existing) {
      existing.termId = termId;
      existing.code = courseDef.code;
      existing.name = courseDef.name;
      existing.files = typeof existing.files === "number" ? existing.files : 0;
      existing.modules = mergeModules(arrayOfRecords(existing.modules), courseDef.modules);
    } else {
      courses.push({
        id: uid(),
        termId,
        code: courseDef.code,
        name: courseDef.name,
        files: 0,
        modules: mergeModules([], courseDef.modules),
      });
    }
  }

  const profile = isRecord(state.profile) ? state.profile : {};
  profile.versionLabel = APP_VERSION_LABEL;
  state.profile = normalizeProfile(profile);
  state.terms = terms;
  state.courses = courses;
}

const ACADEMIC_PHASES = [
  "pre-med", "mcat", "preclinical", "clinical", "step1-dedicated", "step2-dedicated", "other",
] as const;

function normalizeProfile(value: unknown): Profile {
  const profile = isRecord(value) ? value : {};
  const name = String(profile.name ?? "");
  const phase = ACADEMIC_PHASES.includes(profile.phase as typeof ACADEMIC_PHASES[number])
    ? profile.phase as Profile["phase"]
    : undefined;
  const focusSubscriptions = normalizedFocusIds(profile.focusSubscriptions);
  const activeFocus = focusSubscriptions.includes(profile.activeFocusId as typeof focusSubscriptions[number])
    ? profile.activeFocusId as Profile["activeFocusId"]
    : focusSubscriptions[0];
  const focus = focusOption(activeFocus);
  const educationTrack = resolveTrack(
    typeof profile.educationTrack === "string" ? profile.educationTrack : undefined,
  ).id;
  const dashboardWidgetOrder = normalizeDashboardWidgetOrder(profile.dashboardWidgetOrder);
  const hiddenDashboardWidgets = normalizeDashboardWidgetList(profile.hiddenDashboardWidgets);
  const hiddenNav = normalizeHiddenNav(profile.hiddenNav, educationTrack);
  const journalReviewTime = typeof profile.journalReviewTime === "string" && /^\d{2}:\d{2}$/.test(profile.journalReviewTime)
    ? profile.journalReviewTime
    : "20:00";
  return {
    name,
    userId: typeof profile.userId === "string" && profile.userId.trim()
      ? profile.userId
      : userIdFromName(name),
    versionLabel: String(profile.versionLabel ?? APP_VERSION_LABEL),
    tagline: String(profile.tagline ?? "Designed for execution, not decoration."),
    avatarDataUrl: typeof profile.avatarDataUrl === "string" ? profile.avatarDataUrl : undefined,
    dailyCardTarget: typeof profile.dailyCardTarget === "number" ? profile.dailyCardTarget : 120,
    dailyMinuteTarget: typeof profile.dailyMinuteTarget === "number" ? profile.dailyMinuteTarget : 240,
    onboarded: typeof profile.onboarded === "boolean" ? profile.onboarded : true,
    tourDone: typeof profile.tourDone === "boolean" ? profile.tourDone : undefined,
    promise: normalizePromise(profile.promise),
    phase: phase ?? focus?.phase,
    educationTrack,
    showSguResources: typeof profile.showSguResources === "boolean"
      ? profile.showSguResources
      : educationTrack === "sgu",
    activeFocusId: activeFocus,
    focusSubscriptions,
    dashboardWidgetOrder,
    hiddenDashboardWidgets,
    hiddenNav,
    toolsCollapsed: typeof profile.toolsCollapsed === "boolean" ? profile.toolsCollapsed : undefined,
    prepCollapsed: typeof profile.prepCollapsed === "boolean" ? profile.prepCollapsed : undefined,
    journalReviewTime,
  };
}

function normalizeDashboardWidgetOrder(value: unknown): Profile["dashboardWidgetOrder"] {
  if (!Array.isArray(value)) return [...DEFAULT_DASHBOARD_WIDGETS];
  const valid = new Set(DEFAULT_DASHBOARD_WIDGETS);
  const incoming = value.filter((item): item is typeof DEFAULT_DASHBOARD_WIDGETS[number] =>
    typeof item === "string" && valid.has(item as typeof DEFAULT_DASHBOARD_WIDGETS[number]),
  );
  return [...new Set([...incoming, ...DEFAULT_DASHBOARD_WIDGETS])];
}

function normalizeDashboardWidgetList(value: unknown): Profile["hiddenDashboardWidgets"] {
  if (!Array.isArray(value)) return [];
  const valid = new Set(DEFAULT_DASHBOARD_WIDGETS);
  return [...new Set(value.filter((item): item is typeof DEFAULT_DASHBOARD_WIDGETS[number] =>
    typeof item === "string" && valid.has(item as typeof DEFAULT_DASHBOARD_WIDGETS[number]),
  ))];
}

function normalizeHiddenNav(value: unknown, trackId: string): Profile["hiddenNav"] {
  if (!Array.isArray(value)) return defaultHiddenNavForTrack(trackId);
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0))];
}

function mergeStringLists(value: unknown, defaults: readonly string[]) {
  const incoming = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  return [...new Set([...incoming, ...defaults])];
}

function defaultHiddenNavForTrack(trackId: string): string[] {
  const base = ["prompts", "integrations", "folders"];
  if (trackId === "premed" || trackId === "mcat" || trackId === "undergrad") return [...base, "step"];
  if (trackId === "nursing" || trackId === "pa") return [...base, "step", "premed"];
  return [...base, "premed"];
}

function hiddenNavForTrackSwitch(current: unknown, trackId: string): string[] {
  const set = new Set(normalizeHiddenNav(current, trackId));
  set.add("prompts");
  set.add("integrations");
  set.add("folders");
  if (trackId === "premed" || trackId === "mcat" || trackId === "undergrad") {
    set.add("step");
    set.delete("premed");
  } else if (trackId === "nursing" || trackId === "pa") {
    set.add("step");
    set.add("premed");
  } else {
    set.add("premed");
    set.delete("step");
  }
  return [...set];
}

function normalizePromise(value: unknown): Profile["promise"] {
  if (!isRecord(value)) return undefined;
  const signedName = typeof value.signedName === "string" ? value.signedName.trim() : "";
  const signedAt = typeof value.signedAt === "string" ? value.signedAt : "";
  if (!signedName || !signedAt) return undefined;
  return {
    signedName,
    signedAt,
    promiseTextVersion: typeof value.promiseTextVersion === "string" ? value.promiseTextVersion : "promise-of-use-v1",
    journalEntryId: typeof value.journalEntryId === "string" ? value.journalEntryId : undefined,
  };
}

function addResourceToState(resources: Resource[], payload: Omit<Resource, "id" | "created">) {
  return addResourcesToState(resources, [payload]);
}

function addResourcesToState(resources: Resource[], payloads: Omit<Resource, "id" | "created">[]) {
  const created = now();
  const next = dedupeResources(resources);
  for (const payload of payloads) {
    const url = normalizeResourceUrl(payload.url);
    if (!payload.title.trim() || !url.trim()) continue;
    const existing = next.find((resource) => normalizeResourceUrl(resource.url).toLowerCase() === url.toLowerCase());
    if (existing) {
      Object.assign(existing, {
        ...existing,
        ...payload,
        url,
        id: existing.id,
        created: existing.created,
        favorite: existing.favorite || payload.favorite,
        tags: Array.from(new Set([...(existing.tags ?? []), ...(payload.tags ?? [])])),
      });
    } else {
      next.unshift({ ...payload, url, id: uid(), created });
    }
  }
  return { resources: next };
}

function dedupeResources(resources: Resource[]): Resource[] {
  const seen = new Map<string, Resource>();
  const out: Resource[] = [];
  for (const resource of resources) {
    const normalized = normalizeResourceUrl(resource.url);
    const key = normalized.toLowerCase();
    const cleaned = { ...resource, url: normalized };
    const previous = seen.get(key);
    if (previous) {
      Object.assign(previous, {
        ...previous,
        ...cleaned,
        id: previous.id,
        created: previous.created,
        favorite: previous.favorite || cleaned.favorite,
        rating: Math.max(previous.rating ?? 0, cleaned.rating ?? 0) || previous.rating || cleaned.rating,
        ratingReason: previous.ratingReason || cleaned.ratingReason,
        tags: Array.from(new Set([...(previous.tags ?? []), ...(cleaned.tags ?? [])])),
        note: previous.note || cleaned.note,
      });
      continue;
    }
    seen.set(key, cleaned);
    out.push(cleaned);
  }
  return out;
}

function dedupeResourceRecords(resources: AnyRecord[]): AnyRecord[] {
  const typed = resources.map((resource) => ({
    id: typeof resource.id === "string" ? resource.id : uid(),
    title: String(resource.title ?? hostFallback(resource.url)),
    url: normalizeResourceUrl(String(resource.url ?? "")),
    category: String(resource.category ?? "General"),
    tags: Array.isArray(resource.tags) ? resource.tags.filter((x): x is string => typeof x === "string") : [],
    note: typeof resource.note === "string" ? resource.note : undefined,
    favorite: typeof resource.favorite === "boolean" ? resource.favorite : undefined,
    rating: typeof resource.rating === "number" ? resource.rating : undefined,
    ratingReason: typeof resource.ratingReason === "string" ? resource.ratingReason : undefined,
    created: typeof resource.created === "string" ? resource.created : now(),
  }));
  return dedupeResources(typed) as unknown as AnyRecord[];
}

function hostFallback(value: unknown) {
  try {
    return new URL(normalizeResourceUrl(String(value ?? ""))).hostname;
  } catch {
    return "Untitled resource";
  }
}

const BOARD_EXAMS: BoardExamId[] = ["step1", "step2", "step3", "shelf", "mcat", "premed"];

function defaultBoardPrepState(): Record<BoardExamId, BoardPrepProfile> {
  return Object.fromEntries(BOARD_EXAMS.map((exam) => [exam, defaultBoardPrep(exam)])) as Record<BoardExamId, BoardPrepProfile>;
}

function defaultBoardPrep(exam: BoardExamId): BoardPrepProfile {
  return {
    medYear: exam === "step1" ? "MS2" : exam === "step2" || exam === "shelf" ? "MS3" : "Other",
    contentStarted: exam === "step1" || exam === "mcat" || exam === "shelf" ? "light" : "not-started",
    weeklyHours: exam === "step1" ? 18 : exam === "step2" ? 14 : exam === "mcat" ? 12 : 10,
    questionTarget: exam === "premed" ? 15 : exam === "shelf" ? 25 : exam === "step3" ? 30 : 40,
    resourcesDone: [],
    otherResources: "",
    confidence: "medium",
    blueprintLogs: [],
    aiStrategy: "",
    updated: new Date().toISOString(),
  };
}

function normalizeBoardPrep(value: unknown): Record<BoardExamId, BoardPrepProfile> {
  const src = isRecord(value) ? value : {};
  return Object.fromEntries(BOARD_EXAMS.map((exam) => [exam, normalizeBoardPrepProfile(src[exam], exam)])) as Record<BoardExamId, BoardPrepProfile>;
}

function normalizeResourceLinks(value: unknown): AnyRecord[] {
  const resources = arrayOfRecords(value);
  const replacements = new Map([
    [
      "https://www.usmle.org/prepare-your-exam/step-1-materials",
      {
        title: "USMLE Step 1 Sample Questions",
        url: "https://www.usmle.org/exam-resources/step-1-materials/step-1-sample-test-questions",
      },
    ],
    [
      "https://www.usmle.org/prepare-your-exam/step-2-ck-materials",
      {
        title: "USMLE Step 2 CK Sample Questions",
        url: "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-sample-test-questions",
      },
    ],
  ]);

  for (const resource of resources) {
    const currentUrl = normalizeResourceUrl(String(resource.url ?? ""));
    const replacement = replacements.get(currentUrl) ?? replacements.get(String(resource.url ?? ""));
    if (replacement) {
      resource.url = replacement.url;
      if (String(resource.title ?? "").includes("Practice Materials")) resource.title = replacement.title;
    } else {
      resource.url = currentUrl;
    }
  }

  const urls = new Set(resources.map((r) => normalizeResourceUrl(String(r.url ?? ""))));
  for (const d of SGU_DRIVES) {
    if (!urls.has(normalizeResourceUrl(d.url))) {
      resources.unshift({ id: crypto.randomUUID(), created: new Date().toISOString(), ...driveResourceFields(d) });
    }
  }
  return dedupeResourceRecords(resources);
}

function normalizeBoardPrepProfile(value: unknown, exam: BoardExamId): BoardPrepProfile {
  const base = defaultBoardPrep(exam);
  const profile = isRecord(value) ? value : {};
  const contentStarted = ["not-started", "light", "half", "most", "dedicated"].includes(String(profile.contentStarted))
    ? profile.contentStarted as BoardPrepProfile["contentStarted"]
    : base.contentStarted;
  const confidence = ["low", "medium", "high"].includes(String(profile.confidence))
    ? profile.confidence as BoardPrepProfile["confidence"]
    : base.confidence;
  return {
    medYear: String(profile.medYear ?? base.medYear),
    contentStarted,
    examDate: typeof profile.examDate === "string" ? profile.examDate : undefined,
    weeklyHours: typeof profile.weeklyHours === "number" ? profile.weeklyHours : base.weeklyHours,
    questionTarget: typeof profile.questionTarget === "number" ? profile.questionTarget : base.questionTarget,
    resourcesDone: Array.isArray(profile.resourcesDone) ? profile.resourcesDone.filter((x): x is string => typeof x === "string") : [],
    otherResources: String(profile.otherResources ?? ""),
    confidence,
    blueprintLogs: normalizeBoardBlueprintLogs(profile.blueprintLogs),
    aiStrategy: typeof profile.aiStrategy === "string" ? profile.aiStrategy : "",
    updated: typeof profile.updated === "string" ? profile.updated : new Date().toISOString(),
  };
}

function normalizeBoardBlueprintLogs(value: unknown): BoardBlueprintLog[] {
  return arrayOfRecords(value).map((log) => {
    const dimension = ["system", "competency", "discipline"].includes(String(log.dimension))
      ? log.dimension as BoardBlueprintLog["dimension"]
      : "system";
    const oldMode = String(log.mode);
    const mode = oldMode === "Content"
      ? "First pass"
      : oldMode === "Retrieval"
        ? "Missed facts"
        : ["First pass", "Questions", "Missed facts", "Assessment", "Review"].includes(oldMode)
          ? oldMode as BoardBlueprintLog["mode"]
          : "Questions";
    const confidence = ["red", "orange", "green", "blue"].includes(String(log.confidence))
      ? log.confidence as BoardBlueprintLog["confidence"]
      : "orange";
    return {
      id: typeof log.id === "string" && log.id ? log.id : uid(),
      date: typeof log.date === "string" && log.date ? log.date : dayKey(),
      dimension,
      area: String(log.area ?? "Unmapped"),
      mode,
      minutes: typeof log.minutes === "number" ? log.minutes : 0,
      questions: typeof log.questions === "number" ? log.questions : 0,
      correct: typeof log.correct === "number" ? log.correct : 0,
      confidence,
      notes: typeof log.notes === "string" ? log.notes : undefined,
      updated: typeof log.updated === "string" ? log.updated : new Date().toISOString(),
    };
  });
}

function mergeModules(existing: AnyRecord[], names: string[]) {
  const out = [...existing];
  for (const name of names) {
    if (!out.some((m) => cleanText(m.name) === cleanText(name))) {
      out.push({ id: uid(), name });
    }
  }
  return out;
}

function arrayOfRecords(value: unknown): AnyRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null;
}

function cleanText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function cleanCode(value: unknown): string {
  return cleanText(value).replace(/[^a-z0-9]/g, "");
}
