// ===========================================================================
// The single source of truth. Zustand + persist (localStorage) so every change
// survives reloads, works offline, and needs no backend. All lists are CRUD-
// able, which is what makes the app "modular" rather than the fixed Swift build.
// ===========================================================================
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  BoardBlueprintLog, BoardExamId, BoardPrepProfile, Course, CourseModule, DayPlan, HubFolder, JournalEntry, NoctyriumState,
  Prompt, Resource, Task, TrackerItem, Profile, StudyLog,
} from "./types";
import { APP_VERSION_LABEL, makeSeed, SCHEMA_VERSION, SGU_DRIVES } from "./seed";
import { dayKey } from "./scoring";
import { localVaultStorage } from "./localVault";
import { userIdFromName } from "./userIdentity";

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

interface Actions {
  // profile
  updateProfile: (patch: Partial<Profile>) => void;

  // terms
  addTerm: (name: string) => void;
  renameTerm: (id: string, name: string) => void;
  removeTerm: (id: string) => void;

  // courses
  addCourse: (c: Omit<Course, "id" | "modules"> & { modules?: string[] }) => void;
  updateCourse: (id: string, patch: Partial<Course>) => void;
  removeCourse: (id: string) => void;
  addModule: (courseId: string, name: string) => void;
  removeModule: (courseId: string, moduleId: string) => void;

  // tracker
  addTrackerItem: (item: Omit<TrackerItem, "id" | "updated">) => void;
  bulkAddTrackerItems: (items: Omit<TrackerItem, "id" | "updated">[]) => void;
  updateTrackerItem: (id: string, patch: Partial<TrackerItem>) => void;
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
  addJournal: (e: Omit<JournalEntry, "id">) => void;
  updateJournal: (id: string, patch: Partial<JournalEntry>) => void;
  removeJournal: (id: string) => void;

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
      removeModule: (courseId, moduleId) =>
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === courseId
              ? { ...c, modules: c.modules.filter((m: CourseModule) => m.id !== moduleId) }
              : c,
          ),
        })),

      addTrackerItem: (item) =>
        set((s) => ({ tracker: [...s.tracker, { ...item, id: uid(), updated: now() }] })),
      bulkAddTrackerItems: (items) =>
        set((s) => ({
          tracker: [...s.tracker, ...items.map((item) => ({ ...item, id: uid(), updated: now() }))],
        })),
      updateTrackerItem: (id, patch) =>
        set((s) => ({
          tracker: s.tracker.map((t) => (t.id === id ? { ...t, ...patch, updated: now() } : t)),
        })),
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
        set((s) => ({ resources: [{ ...r, id: uid(), created: now() }, ...s.resources] })),
      bulkAddResources: (rs) =>
        set((s) => ({
          resources: [...rs.map((r) => ({ ...r, id: uid(), created: now() })), ...s.resources],
        })),
      updateResource: (id, patch) =>
        set((s) => ({ resources: s.resources.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
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

      addJournal: (e) => set((s) => ({ journal: [{ ...e, id: uid() }, ...s.journal] })),
      updateJournal: (id, patch) =>
        set((s) => ({ journal: s.journal.map((j) => (j.id === id ? { ...j, ...patch } : j)) })),
      removeJournal: (id) => set((s) => ({ journal: s.journal.filter((j) => j.id !== id) })),

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
          resources: SGU_DRIVES.map((d) => ({ id: uid(), created: now(), category: "Drives", favorite: false, ...d })),
          journal: [], prompts: [], folders: [], logs: [], dayPlans: [],
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
          const urls = new Set(resources.map((r) => r.url));
          for (const d of SGU_DRIVES) {
            if (!urls.has(d.url)) {
              resources.unshift({ id: crypto.randomUUID(), created: new Date().toISOString(), category: "Drives", favorite: false, ...d });
            }
          }
          s.resources = resources;
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
        return s as unknown as NoctyriumState;
      },
      partialize: (s) => {
        // persist data only — strip the action functions
        const {
          profile, terms, courses, tracker, resources, tasks, journal, prompts,
          folders, logs, integrations, boardPrep, dayPlans, activeDayKey, schemaVersion,
        } = s;
        return {
          profile, terms, courses, tracker, resources, tasks, journal, prompts,
          folders, logs, integrations, boardPrep, dayPlans, activeDayKey, schemaVersion,
        } as NoctyriumState;
      },
    },
  ),
);

type AnyRecord = Record<string, unknown>;

const CANONICAL_TERMS = [
  { key: "term-1", name: "Term 1" },
  { key: "term-2", name: "Term 2" },
  { key: "term-3", name: "Term 3" },
  { key: "term-4", name: "Term 4" },
  { key: "term-5", name: "Term 5" },
];

const CANONICAL_COURSES = [
  {
    code: "BPM 500",
    aliases: ["bpm500", "01bpm500"],
    name: "Basic Principles of Medicine I",
    termName: "Term 1",
    modules: ["FTM 1", "FTM 2", "MSK", "CPR 1", "CPR 2"],
  },
  {
    code: "BPM 501",
    aliases: ["bpm501", "01bpm501"],
    name: "Basic Principles of Medicine II",
    termName: "Term 2",
    modules: ["DM", "ER", "NB1", "NB2", "NB3"],
  },
  {
    code: "BPM 502",
    aliases: ["bpm502", "ppm502", "02ppm502"],
    name: "Basic Principles of Medicine III",
    termName: "Term 3",
    modules: ["Neuro", "Behavioral", "Endocrine/Repro"],
  },
  {
    code: "SPPM 500",
    aliases: ["sppm500", "ppm500", "02ppm500"],
    name: "Systems-Based Principles & Practice of Medicine",
    termName: "Term 4",
    modules: [],
  },
  {
    code: "PPM 501",
    aliases: ["ppm501", "02ppm501"],
    name: "Principles & Practice of Medicine I",
    termName: "Term 5",
    modules: [],
  },
];

function normalizeAcademicMap(state: AnyRecord) {
  const terms = arrayOfRecords(state.terms);
  const courses = arrayOfRecords(state.courses);
  const termIds = new Map<string, string>();

  for (const termDef of CANONICAL_TERMS) {
    const existing = terms.find((t) => cleanText(t.name) === cleanText(termDef.name));
    if (existing) {
      existing.name = termDef.name;
      termIds.set(termDef.name, String(existing.id ?? termDef.key));
    } else {
      terms.push({ id: termDef.key, name: termDef.name });
      termIds.set(termDef.name, termDef.key);
    }
  }

  for (const courseDef of CANONICAL_COURSES) {
    const existing = courses.find((c) => courseDef.aliases.includes(cleanCode(c.code)));
    const termId = termIds.get(courseDef.termName) ?? courseDef.termName.toLowerCase().replace(/\s+/g, "-");
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

function normalizeProfile(value: unknown): Profile {
  const profile = isRecord(value) ? value : {};
  const name = String(profile.name ?? "");
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
  };
}

function defaultBoardPrepState(): Record<BoardExamId, BoardPrepProfile> {
  return {
    step1: defaultBoardPrep("step1"),
    step2: defaultBoardPrep("step2"),
  };
}

function defaultBoardPrep(exam: BoardExamId): BoardPrepProfile {
  return {
    medYear: exam === "step1" ? "MS2" : "MS3",
    contentStarted: exam === "step1" ? "light" : "not-started",
    weeklyHours: exam === "step1" ? 18 : 14,
    questionTarget: 40,
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
  return {
    step1: normalizeBoardPrepProfile(src.step1, "step1"),
    step2: normalizeBoardPrepProfile(src.step2, "step2"),
  };
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
    const replacement = replacements.get(String(resource.url ?? ""));
    if (replacement) {
      resource.url = replacement.url;
      if (String(resource.title ?? "").includes("Practice Materials")) resource.title = replacement.title;
    }
  }

  const urls = new Set(resources.map((r) => r.url));
  for (const d of SGU_DRIVES) {
    if (!urls.has(d.url)) {
      resources.unshift({ id: crypto.randomUUID(), created: new Date().toISOString(), category: "Drives", favorite: false, ...d });
    }
  }
  return resources;
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
    const mode = ["Content", "Retrieval", "Questions", "Assessment", "Review"].includes(String(log.mode))
      ? log.mode as BoardBlueprintLog["mode"]
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
