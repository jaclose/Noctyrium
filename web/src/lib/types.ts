// ===========================================================================
// Noctyrium data model. Everything here is user-owned, editable, and persisted
// in the browser. Nothing is hard-coded into the UI — the seed (seed.ts) merely
// provides a starting point that the user can fully reshape.
// ===========================================================================

export type ID = string;
export type BoardExamId = "step1" | "step2" | "step3" | "shelf" | "mcat" | "premed";

/** A term groups courses (e.g. "Term 1"). */
export interface Term {
  id: ID;
  name: string;
}

/** A module inside a course (e.g. "FTM 1", "MSK"). */
export interface CourseModule {
  id: ID;
  name: string;
}

/** A course (e.g. "01 BPM 500"), belonging to a term. */
export interface Course {
  id: ID;
  termId: ID;
  code: string; // "01 BPM 500"
  name: string; // optional longer name
  files: number; // count shown on the card; user-editable
  link?: string; // optional URL the "Open" button targets
  modules: CourseModule[];
}

export type TrackerStatus = "anki" | "working" | "mature" | "reset";

/**
 * A row in the Course Tracker mastery tree. `path` is a slash-delimited
 * grouping (e.g. "T2/NB3/Lectures") so the tree is fully data-driven.
 */
/** First-class work kinds so the tracker can describe more than lectures. */
export type TrackerKind =
  | "Lecture"
  | "DLA"
  | "PQ"
  | "Lab"
  | "Reading"
  | "Requirement"
  | "Milestone"
  | "Evidence"
  | "Question Block"
  | "Assessment"
  | "Review Loop";

/** High-yield / low-yield / needs-review — feeds the suggestion engine. */
export type Yield = "high" | "low" | "review" | "none";

export interface TrackerItem {
  id: ID;
  path: string; // "T2/NB3/Lectures"
  label: string;
  kind: TrackerKind; // Lecture / DLA / PQ / Lab / Reading
  passes: number; // study passes: 0 untouched, 1 red, 2 young, 3 mature, 4+ mastered
  ankiPasses: number; // Anki rounds: 0 off, 1 orange, 2 yellow, 3 purple (mastered)
  yield: Yield; // high / low / review / none
  note?: string;
  updated: string; // ISO
}

export interface Task {
  id: ID;
  title: string;
  due?: string; // ISO date
  done: boolean;
  created: string; // ISO
  completedAt?: string; // ISO
  scope?: string; // inferred course/module/board area
  archived?: boolean;
}

export interface JournalEntry {
  id: ID;
  date: string; // ISO datetime
  today: string;
  tomorrow: string;
  blockers: string;
  energy: "Low" | "Medium" | "High" | "";
  rating: string; // "Useful" | "Wasted" | ...
}

export type PremedExperienceKind = "Clinical" | "Service" | "Research" | "Shadowing" | "Leadership";

export interface PremedExperienceEntry {
  id: ID;
  date: string; // yyyy-MM-dd
  kind: PremedExperienceKind;
  title: string;
  organization: string;
  contact?: string;
  hours: number;
  verified: boolean;
  reflection: string;
  evidenceLink?: string;
  competencyTags?: string[];
  notes?: string;
  created: string; // ISO
}

export interface Prompt {
  id: ID;
  title: string;
  category: string;
  tags: string[];
  body: string;
  created: string;
  updated: string;
}

/** A saved hyperlink / resource (STEP 1 prep, references, tools, decks…). */
export interface Resource {
  id: ID;
  title: string;
  url: string;
  category: string; // "STEP 1", "Reference", "Anki", "Tools", "Drives", …
  tags: string[];
  note?: string;
  favorite?: boolean;
  rating?: number; // 1–10 personal usefulness (mainly for Drives)
  ratingReason?: string; // shown on hover over the rating badge
  created: string;
}

/** A user-defined folder / shortcut on the Hub Folders page. */
export interface HubFolder {
  id: ID;
  name: string;
  description?: string;
  link?: string;
  localPath?: string; // local file/folder path for packaged/local use
  icon?: string; // lucide icon name
  color?: string;
}

/** One study event — minutes and/or cards logged on a given study day. */
export interface StudyLog {
  id: ID;
  dayKey: string; // yyyy-MM-dd (Noctyrium 4am-shifted study day)
  ts: string; // ISO datetime
  type: string; // "Lecture", "Anki", "Deep Study", "Manual"
  minutes: number;
  cards: number;
  note?: string;
}

export type BoardBlueprintDimension = "system" | "competency" | "discipline";
export type BoardBlueprintMode = "First pass" | "Questions" | "Missed facts" | "Assessment" | "Review";
export type BoardConfidence = "red" | "orange" | "green" | "blue";

export interface BoardBlueprintLog {
  id: ID;
  date: string; // yyyy-MM-dd
  dimension: BoardBlueprintDimension;
  area: string;
  mode: BoardBlueprintMode;
  minutes: number;
  questions: number;
  correct: number;
  confidence: BoardConfidence;
  notes?: string;
  updated: string;
}

export interface Integration {
  id: ID;
  name: string;
  description: string;
  status: "connected" | "available" | "planned";
  icon?: string;
}

export interface BoardPrepProfile {
  medYear: string;
  contentStarted: "not-started" | "light" | "half" | "most" | "dedicated";
  examDate?: string; // yyyy-MM-dd
  weeklyHours: number;
  questionTarget: number;
  resourcesDone: string[];
  installedBlueprintAreas?: string[];
  completedBlueprintItems?: string[];
  otherResources: string;
  confidence: "low" | "medium" | "high";
  blueprintLogs: BoardBlueprintLog[];
  aiStrategy?: string;
  updated: string;
}

/** "Win the day" — a morning intention reviewed at the end of the day. */
export interface DayPlan {
  dayKey: string; // the study day this plan is for (yyyy-MM-dd)
  intention: string; // what would make today a win
  wins: string[]; // a few concrete win conditions / mini-tasks
  createdAt: string;
  reviewedAt?: string;
  outcome?: "won" | "partial" | "missed";
  reviewNote?: string;
}

/** Academic phase, set during first-launch onboarding — tailors targets, tagline, and AI context. */
export type AcademicPhase =
  | "pre-med"
  | "mcat"
  | "preclinical"
  | "clinical"
  | "step1-dedicated"
  | "step2-dedicated"
  | "other";

export type ExperienceFocusId =
  | "term1"
  | "term2"
  | "term3"
  | "term4"
  | "term5"
  | "cbse"
  | "step1"
  | "step2"
  | "step3"
  | "shelf"
  | "mcat"
  | "premed";

/**
 * Top-level program a user belongs to, chosen first during onboarding. It sits
 * above ExperienceFocusId (the individual study lanes) and decides which course
 * structure is auto-seeded, which resources show, and which focus lanes appear.
 */
export type EducationTrackId =
  | "sgu" // St. George's University (Caribbean MD)
  | "usmd" // US allopathic MD
  | "do" // US osteopathic DO
  | "img" // Other international medical school
  | "premed" // Pre-med / pre-health undergraduate
  | "mcat" // MCAT-focused prep
  | "undergrad" // General undergraduate
  | "nursing" // Nursing school
  | "pa"; // Physician Assistant school

export type DashboardWidgetId =
  | "winDay"
  | "todayScore"
  | "pomodoro"
  | "weekly"
  | "suggested"
  | "aiActions"
  | "schedule"
  | "termMap"
  | "localData"
  | "latestStandup"
  | "productivityTrend"
  | "premedHours"
  | "resourceFocus"
  | "boardBlueprint";

// ===========================================================================
// Blueprint Prep — an installable operating-system model (god-file architecture).
// A catalog defines lanes → blueprints → categories → nodes; installing a
// blueprint instantiates a rich, per-user container of mastery objects rather
// than flattening everything into lecture "passes".
// ===========================================================================

/** Top-level pathway. The active bar only shows the current mode's lanes. */
export type BlueprintMode = "usmle" | "prehealth";

export type BlueprintLaneId =
  // USMLE mode
  | "step1" | "step2" | "dedicated" | "shelf" | "step3"
  // Pre-Health mode
  | "premed" | "mcat" | "dat" | "casper";

/** A node is not always a checkbox — it can be content, a task, a tracker, etc. */
export type BlueprintNodeType =
  | "content" | "task" | "tracker" | "queue" | "assessment" | "evidence" | "metric" | "planner";

export type BlueprintNodeStatus = "not-started" | "in-progress" | "blocked" | "mastered" | "done";
export type BlueprintPriority = "high" | "medium" | "low";

export type SourceType = "official" | "tool" | "internal";
export type VerificationStatus = "verified" | "needs-review" | "unverified";
export type SourceConfidence = "high" | "medium" | "low";

/** Source governance — official sources govern; tools are labeled as tools. */
export interface BlueprintSource {
  type: SourceType;
  name: string;
  url?: string;
  lastVerified?: string; // ISO date
  verification: VerificationStatus;
  confidence: SourceConfidence;
}

export interface BlueprintResourceLink {
  label: string;
  url: string;
  kind: SourceType;
}

/** A user-owned mastery object inside an installed blueprint container. */
export interface InstalledBlueprintNode {
  id: string;            // unique per install
  catalogNodeId: string; // links back to the catalog template
  category: string;
  subCategory?: string;
  objective: string;
  detail?: string;
  taskType: BlueprintNodeType;
  priority: BlueprintPriority;
  status: BlueprintNodeStatus;
  mastery: number;       // 0–100
  tags: string[];
  sourceType?: SourceType;
  sourceUrl?: string;
  lastVerified?: string;
  resourceLinks: BlueprintResourceLink[];
  linkedQuestions: number;
  linkedAnki: number;
  linkedErrorLog: number;
  linkedAssessments: number;
  dueDate?: string;
  estimatedMinutes?: number;
  evidenceOfCompletion?: string;
  notes?: string;
  order: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** One installed blueprint = a named, collapsible container under the tracker. */
export interface InstalledBlueprint {
  id: string;            // containerId
  blueprintId: string;
  laneId: BlueprintLaneId;
  title: string;         // container name (duplicates get a version suffix)
  catalogVersion: number;
  installedAt: string;
  updatedAt: string;
  nodes: InstalledBlueprintNode[];
}

export interface Profile {
  name: string;
  userId: string; // local backend owner key derived from display name
  versionLabel: string;
  tagline: string;
  avatarDataUrl?: string; // user-uploaded avatar (data URL)
  // Anti-overload targets: a "good enough" day, not a maximum to grind past.
  dailyCardTarget: number;
  dailyMinuteTarget: number;
  // Sidebar customization: hidden (unsubscribed) nav ids + collapsed Tools folder
  hiddenNav?: string[];
  toolsCollapsed?: boolean;
  prepCollapsed?: boolean;
  // First-launch onboarding
  onboarded: boolean;
  tourDone?: boolean; // guided tour + promise cutscene completed
  promise?: {
    signedName: string;
    signedAt: string;
    promiseTextVersion?: string;
    journalEntryId?: string;
  }; // the signed "promise to yourself"
  phase?: AcademicPhase;
  // The program chosen during onboarding (drives structure, resources, lanes).
  educationTrack?: EducationTrackId;
  // Whether SGU-specific shared drives are shown on the Resources page.
  showSguResources?: boolean;
  activeFocusId?: ExperienceFocusId;
  focusSubscriptions: ExperienceFocusId[];
  dashboardWidgetOrder?: DashboardWidgetId[];
  hiddenDashboardWidgets?: DashboardWidgetId[];
  journalReviewTime?: string; // "20:00" local time
  blueprintMode?: BlueprintMode; // which lane bar (USMLE vs Pre-Health) is active
}

export interface NoctyriumState {
  profile: Profile;
  terms: Term[];
  courses: Course[];
  tracker: TrackerItem[];
  resources: Resource[];
  tasks: Task[];
  journal: JournalEntry[];
  premedExperiences: PremedExperienceEntry[];
  prompts: Prompt[];
  folders: HubFolder[];
  logs: StudyLog[];
  integrations: Integration[];
  boardPrep: Record<BoardExamId, BoardPrepProfile>;
  dayPlans: DayPlan[];
  blueprintInstalls: InstalledBlueprint[];
  activeDayKey: string; // current study day
  schemaVersion: number;
}
