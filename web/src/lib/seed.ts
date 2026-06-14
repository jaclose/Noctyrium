// ===========================================================================
// Starter data. Mirrors what the v0.03.01.5 build showed (Terms, BPM/PPM
// courses, the T2 ▸ NB3 mastery tree, sample prompts/journal) so a brand-new
// install looks alive. Everything here is fully editable + deletable in-app.
// ===========================================================================
import type { BoardPrepProfile, NoctyriumState, TrackerItem, TrackerKind, Yield } from "./types";
import { dayKey, isoDate } from "./scoring";
import { userIdFromName } from "./userIdentity";

export const SCHEMA_VERSION = 9;

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
  const t1 = "term-1";
  const t2 = "term-2";
  const t3 = "term-3";
  const t4 = "term-4";
  const t5 = "term-5";

  return {
    schemaVersion: SCHEMA_VERSION,
    activeDayKey: dayKey(),
    profile: {
      name: "Noctyrium",
      userId: userIdFromName("Noctyrium"),
      versionLabel: "v0.10.0 · web",
      tagline: "Designed for execution, not decoration.",
      dailyCardTarget: 120,
      dailyMinuteTarget: 240,
    },
    terms: [
      { id: t1, name: "Term 1" },
      { id: t2, name: "Term 2" },
      { id: t3, name: "Term 3" },
      { id: t4, name: "Term 4" },
      { id: t5, name: "Term 5" },
    ],
    courses: [
      {
        id: crypto.randomUUID(), termId: t1, code: "BPM 500", name: "Basic Principles of Medicine I",
        files: 6, modules: ["FTM 1", "FTM 2", "MSK", "CPR 1", "CPR 2"].map((n) => ({ id: crypto.randomUUID(), name: n })),
      },
      {
        id: crypto.randomUUID(), termId: t2, code: "BPM 501", name: "Basic Principles of Medicine II",
        files: 2, modules: ["Heme", "Renal"].map((n) => ({ id: crypto.randomUUID(), name: n })),
      },
      {
        id: crypto.randomUUID(), termId: t3, code: "BPM 502", name: "Basic Principles of Medicine III",
        files: 0, modules: ["Neuro", "Behavioral", "Endocrine/Repro"].map((n) => ({ id: crypto.randomUUID(), name: n })),
      },
      {
        id: crypto.randomUUID(), termId: t4, code: "SPPM 500", name: "Systems-Based Principles & Practice of Medicine",
        files: 0, modules: [],
      },
      {
        id: crypto.randomUUID(), termId: t5, code: "PPM 501", name: "Principles & Practice of Medicine I",
        files: 0, modules: [],
      },
    ],
    tracker: [
      // path, label, kind, passes, ankiPasses, yield — new items default to "none" (Set yield);
      // only a couple are pre-flagged here to demo the review/high states.
      trackerRow("T2/NB3/Lectures", "NB 58 Emotions", "Lecture", 0, 0),
      trackerRow("T2/NB3/Lectures", "NB 58 Introduction to Psychopathology", "Lecture", 0, 0),
      trackerRow("T2/NB3/Lectures", "NB 57 OCD and Somatic Symptom Disorders", "Lecture", 1, 1, "review"),
      trackerRow("T2/NB3/Lectures", "NB 58 Trauma/Stressor and Dissociative Disorders", "Lecture", 2, 0),
      trackerRow("T2/NB3/Lectures", "NB 58 Depressive Disorders and Bipolar", "Lecture", 2, 1),
      trackerRow("T2/NB3/Lectures", "NB 60 Biological Rhythms", "Lecture", 3, 1),
      trackerRow("T2/NB3/Lectures", "NB 61 Sleep", "Lecture", 4, 3),
      trackerRow("T2/NB3/Lectures", "NB 62 Sleep-Wake Disorders", "Lecture", 1, 1, "review"),
      trackerRow("T2/NB3/DLAs", "NB3 DLA: Mood & Anxiety Pharmacology", "DLA", 0, 0),
      trackerRow("T2/NB3/DLAs", "NB3 DLA: Sleep Physiology Case", "DLA", 2, 0),
      trackerRow("T2/NB3/PQs", "NB3 Sakai Question Bank", "PQ", 2, 0),
      trackerRow("T2/ER/Lectures", "ER Cardiovascular Block", "Lecture", 3, 1),
      trackerRow("T2/ER/DLAs", "ER DLA: ECG Interpretation", "DLA", 1, 1),
      trackerRow("T1/BPM500/MSK", "MSK Upper Limb", "Lecture", 4, 3),
    ],
    resources: [
      { id: crypto.randomUUID(), title: "USMLE Step 1 Content Outline", url: "https://www.usmle.org/exam-resources/step-1-materials/step-1-content-outline-and-specifications", category: "STEP 1", tags: ["official", "blueprint"], favorite: true, created: now() },
      { id: crypto.randomUUID(), title: "USMLE Step 1 Sample Questions", url: "https://www.usmle.org/exam-resources/step-1-materials/step-1-sample-test-questions", category: "STEP 1", tags: ["official", "practice"], favorite: true, created: now() },
      { id: crypto.randomUUID(), title: "USMLE Step 2 CK Content Outline", url: "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-content-outline-specifications", category: "STEP 2", tags: ["official", "blueprint"], favorite: true, created: now() },
      { id: crypto.randomUUID(), title: "USMLE Step 2 CK Sample Questions", url: "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-sample-test-questions", category: "STEP 2", tags: ["official", "practice"], created: now() },
      { id: crypto.randomUUID(), title: "AnKing Overview (Step 1 deck)", url: "https://www.ankingmed.com/", category: "Anki", tags: ["deck", "step1"], favorite: true, created: now() },
      { id: crypto.randomUUID(), title: "AnKing Step Deck on AnkiHub", url: "https://www.ankihub.net/step-deck", category: "Anki", tags: ["deck", "step1", "step2"], favorite: true, created: now() },
      { id: crypto.randomUUID(), title: "Mehlman Medical Free HY Documents", url: "https://mehlmanmedical.com/free-stuff/", category: "STEP 1", tags: ["review", "hy"], favorite: true, created: now() },
      { id: crypto.randomUUID(), title: "Boards & Beyond", url: "https://www.boardsbeyond.com/", category: "STEP 1", tags: ["videos"], created: now() },
      { id: crypto.randomUUID(), title: "Sketchy (Micro/Pharm)", url: "https://www.sketchy.com/", category: "STEP 1", tags: ["mnemonics"], created: now() },
      { id: crypto.randomUUID(), title: "UpToDate", url: "https://www.uptodate.com/", category: "Reference", tags: ["clinical"], created: now() },
      { id: crypto.randomUUID(), title: "AMBOSS", url: "https://www.amboss.com/us", category: "Reference", tags: ["qbank", "library"], created: now() },
      { id: crypto.randomUUID(), title: "First Aid for the USMLE Step 1", url: "https://www.usmle-rx.com/", category: "STEP 1", tags: ["book"], created: now() },
      { id: crypto.randomUUID(), title: "St. George's University (SGU)", url: "https://www.sgu.edu/", category: "Drives", tags: ["sgu", "official"], note: "Home base for SGU students.", created: now() },
    ],
    tasks: [
      { id: crypto.randomUUID(), title: "Create today's standup", done: false, archived: false, scope: "Journal", created: now(), due: isoDate(new Date()) },
      { id: crypto.randomUUID(), title: "Import current lecture list into Course Tracker", done: false, archived: false, scope: "Course Tracker", created: now() },
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
    updated: now(),
  };
}
