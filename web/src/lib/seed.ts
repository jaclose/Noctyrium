// ===========================================================================
// Alpha starter data. Keep the app useful on first launch without shipping a
// personal workload: canonical SGU terms/courses, a few sample tracker rows,
// official board resources, and empty logs/journal.
// ===========================================================================
import type { BoardPrepProfile, NoctyriumState, TrackerItem, TrackerKind, Yield } from "./types";
import { dayKey, isoDate } from "./scoring";
import { userIdFromName } from "./userIdentity";
import { ACADEMIC_TEMPLATE_COURSES, ACADEMIC_TEMPLATE_TERMS, DEFAULT_FOCUS_IDS } from "./experience";

export const SCHEMA_VERSION = 14;
export const APP_RELEASE_VERSION = "0.1.0-alpha.1";
export const APP_BUILD_LABEL = `Noctyrium Alpha 1 · v${APP_RELEASE_VERSION}`;
export const APP_VERSION_LABEL = `${APP_BUILD_LABEL} · web`;

const now = () => new Date().toISOString();

function trackerRow(
  path: string,
  label: string,
  kind: TrackerKind,
  passes: number,
  ankiPasses = 0,
  y: Yield = "none",
): TrackerItem {
  return { id: crypto.randomUUID(), path, label, kind, passes, ankiPasses, yield: y, updated: now() };
}

export function makeSeed(): NoctyriumState {
  return {
    schemaVersion: SCHEMA_VERSION,
    activeDayKey: dayKey(),
    profile: {
      name: "Noctyrium",
      userId: userIdFromName("Noctyrium"),
      versionLabel: APP_VERSION_LABEL,
      tagline: "Designed for execution, not decoration.",
      dailyCardTarget: 120,
      dailyMinuteTarget: 240,
      onboarded: false,
      activeFocusId: "term1",
      focusSubscriptions: DEFAULT_FOCUS_IDS,
    },
    terms: ACADEMIC_TEMPLATE_TERMS.map((term) => ({ ...term })),
    courses: ACADEMIC_TEMPLATE_COURSES.map(({ aliases: _aliases, modules, ...course }) => ({
      ...course,
      id: crypto.randomUUID(),
      modules: modules.map((n) => ({ id: crypto.randomUUID(), name: n })),
    })),
    tracker: [
      // Small examples only. Users can bulk-import real lecture/DLA/PQ lists.
      trackerRow("Term 1/BPM 500/FTM 1/Lectures", "Example lecture: Cellular adaptation", "Lecture", 0, 0, "high"),
      trackerRow("Term 1/BPM 500/FTM 1/DLAs", "Example DLA: Histology orientation", "DLA", 0, 0),
      trackerRow("Term 1/BPM 500/FTM 1/PQs", "Example PQ set: General principles", "PQ", 0, 0),
      trackerRow("Term 2/BPM 501/NB3/Lectures", "Example lecture: Sleep and biological rhythms", "Lecture", 1, 1, "review"),
      trackerRow("Term 2/BPM 501/NB3/PQs", "Example PQ set: Psych foundations", "PQ", 1, 0),
    ],
    resources: [
      { id: crypto.randomUUID(), title: "USMLE Step 1 Content Outline", url: "https://www.usmle.org/exam-resources/step-1-materials/step-1-content-outline-and-specifications", category: "STEP 1", tags: ["official", "blueprint"], favorite: true, created: now() },
      { id: crypto.randomUUID(), title: "USMLE Step 1 Sample Questions", url: "https://www.usmle.org/exam-resources/step-1-materials/step-1-sample-test-questions", category: "STEP 1", tags: ["official", "practice"], favorite: true, created: now() },
      { id: crypto.randomUUID(), title: "USMLE Step 2 CK Content Outline", url: "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-content-outline-specifications", category: "STEP 2", tags: ["official", "blueprint"], favorite: true, created: now() },
      { id: crypto.randomUUID(), title: "USMLE Step 2 CK Sample Questions", url: "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-sample-test-questions", category: "STEP 2", tags: ["official", "practice"], created: now() },
      { id: crypto.randomUUID(), title: "AnKing Overview (Step 1 deck)", url: "https://www.ankingmed.com/", category: "Anki", tags: ["deck", "step1"], favorite: true, created: now() },
      { id: crypto.randomUUID(), title: "AnKing Step Deck on AnkiHub", url: "https://www.ankihub.net/step-deck", category: "Anki", tags: ["deck", "step1", "step2"], favorite: true, created: now() },
      { id: crypto.randomUUID(), title: "Mehlman Medical Free HY Documents", url: "https://mehlmanmedical.com/free-stuff/", category: "STEP 1", tags: ["review", "hy"], favorite: true, created: now() },
      { id: crypto.randomUUID(), title: "St. George's University (SGU)", url: "https://www.sgu.edu/", category: "Drives", tags: ["sgu", "official"], note: "Home base for SGU students.", created: now() },
    ],
    tasks: [
      { id: crypto.randomUUID(), title: "Create today's standup", done: false, archived: false, scope: "Journal", created: now(), due: isoDate(new Date()) },
      { id: crypto.randomUUID(), title: "Add your real lecture/DLA/PQ list", done: false, archived: false, scope: "Course Tracker", created: now() },
      { id: crypto.randomUUID(), title: "Save progress from Settings", done: false, archived: false, scope: "Cloud Sync", created: now() },
    ],
    journal: [],
    prompts: [
      {
        id: crypto.randomUUID(), title: "Lecture → Anki cloze deck", category: "Anki",
        tags: ["anki", "cloze", "lectures"],
        body: "You are my medical-school study partner. Convert the following lecture notes into high-yield Anki cloze cards. Keep one fact per card, prefer cloze over basic, and tag by system. Notes:\n\n{{paste notes}}",
        created: now(), updated: now(),
      },
      {
        id: crypto.randomUUID(), title: "STEP 1 weak-area drill", category: "STEP 1",
        tags: ["step1", "questions", "review"],
        body: "Act as a STEP 1 tutor. Given my weak area below, generate 5 vignette-style MCQs with one-line explanations and a final 'why the others are wrong' block. Weak area: {{topic}}",
        created: now(), updated: now(),
      },
      {
        id: crypto.randomUUID(), title: "Daily standup summary", category: "Productivity",
        tags: ["standup", "journal"],
        body: "Summarize my day from these bullet points into a tight standup: what I did, what's next, blockers, and a one-word energy rating. Bullets:\n\n{{bullets}}",
        created: now(), updated: now(),
      },
    ],
    folders: [
      { id: crypto.randomUUID(), name: "Inbox", description: "Files waiting to be sorted", icon: "Inbox", color: "var(--cyan)" },
      { id: crypto.randomUUID(), name: "Anki Decks", description: "Exported .apkg builds", icon: "Layers", color: "var(--purple)" },
      { id: crypto.randomUUID(), name: "Research", description: "Papers & references", icon: "FlaskConical", color: "var(--green)" },
      { id: crypto.randomUUID(), name: "Summaries & Sheets", description: "Condensed high-yield docs", icon: "FileText", color: "var(--orange)" },
    ],
    logs: [],
    integrations: [
      { id: crypto.randomUUID(), name: "Anki Lab", description: "Turn lectures, DLAs & slides into cards (prompt-based today)", status: "available", icon: "Wand2" },
      { id: crypto.randomUUID(), name: "Anki Sync", description: "Pull review counts + due cards into Productivity", status: "planned", icon: "Layers" },
      { id: crypto.randomUUID(), name: "Calendar", description: "Sync study blocks", status: "planned", icon: "Calendar" },
      { id: crypto.randomUUID(), name: "Google Drive", description: "Course file routing", status: "planned", icon: "HardDrive" },
      { id: crypto.randomUUID(), name: "JSON Backup", description: "Export / import all data", status: "connected", icon: "Database" },
    ],
    boardPrep: {
      step1: boardPrepSeed("light", 18, 40),
      step2: boardPrepSeed("not-started", 14, 40),
      step3: boardPrepSeed("not-started", 10, 30),
      shelf: boardPrepSeed("light", 10, 25),
      mcat: boardPrepSeed("light", 12, 35),
      premed: boardPrepSeed("not-started", 8, 15),
    },
    dayPlans: [],
  };
}

// Curated shared drives — mostly SGU. These ship with every build so they are
// present for all users. Paste real SGU shared-drive links here to bake them in.
export const SGU_DRIVES: { title: string; url: string; tags: string[]; note?: string }[] = [
  { title: "St. George's University (SGU)", url: "https://www.sgu.edu/", tags: ["sgu", "official"], note: "Home base for SGU students." },
];

function boardPrepSeed(
  contentStarted: BoardPrepProfile["contentStarted"],
  weeklyHours: number,
  questionTarget: number,
): BoardPrepProfile {
  return {
    medYear: "MS2",
    contentStarted,
    weeklyHours,
    questionTarget,
    resourcesDone: [],
    otherResources: "",
    confidence: "medium",
    blueprintLogs: [],
    aiStrategy: "",
    updated: now(),
  };
}
