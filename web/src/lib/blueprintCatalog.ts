// ===========================================================================
// Blueprint catalog — the canonical, source-governed content + architecture for
// every exam lane, anchored to the "Blueprint Study God File" and the official
// USMLE / AAMC / NBME / ADA / Acuity outlines. This is a TEMPLATE library; the
// store instantiates per-user InstalledBlueprint containers from these entries.
//
// Authoring rules (from the god file):
//   - Never flatten a lane into lecture "passes". Every node has a real taskType.
//   - Official sources govern; third-party tools are labeled as tools.
//   - For CASPer/DAT, the schema + install architecture is built now and content
//     is scaffolded against the official testing authority (not invented depth).
// ===========================================================================
import type {
  BlueprintLaneId, BlueprintMode, BlueprintNodeType, BlueprintPriority,
  BlueprintResourceLink, BlueprintSource,
} from "./types";

export interface CatalogNode {
  objective: string;
  taskType: BlueprintNodeType;
  detail?: string;
  subCategory?: string;
  priority?: BlueprintPriority;
  estimatedMinutes?: number;
  tags?: string[];
  source?: BlueprintSource;        // overrides the blueprint source (e.g. a tool)
  resourceLinks?: BlueprintResourceLink[];
}

export interface CatalogCategory {
  name: string;
  summary?: string;
  nodes: CatalogNode[];
}

export interface BlueprintCatalogEntry {
  id: string;            // blueprintId
  laneId: BlueprintLaneId;
  title: string;         // installed container name
  short: string;
  summary: string;
  version: number;
  source: BlueprintSource;
  crossTags: string[];   // the lane's cross-tag taxonomy
  categories: CatalogCategory[];
}

export interface BlueprintLane {
  id: BlueprintLaneId;
  mode: BlueprintMode;
  label: string;
  sub: string;
  blueprintId: string;   // primary master blueprint for the lane
}

// Deterministic node id so user progress survives catalog/schema updates.
export function catalogNodeId(blueprintId: string, category: string, objective: string): string {
  return `${blueprintId}::${category}::${objective}`;
}

// ---- Source records (official sources govern) -----------------------------
const verified = (name: string, url: string): BlueprintSource =>
  ({ type: "official", name, url, lastVerified: "2026-06-21", verification: "verified", confidence: "high" });
const tool = (name: string, url: string): BlueprintSource =>
  ({ type: "tool", name, url, lastVerified: "2026-06-21", verification: "verified", confidence: "medium" });
const internal = (name: string): BlueprintSource =>
  ({ type: "internal", name, verification: "unverified", confidence: "medium" });

const SRC = {
  usmleStep1: verified("USMLE Step 1 Content Outline", "https://www.usmle.org/exam-resources/step-1-materials/step-1-content-outline-and-specifications"),
  usmleStep2: verified("USMLE Step 2 CK Content Outline", "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-content-outline-specifications"),
  usmleStep3: verified("USMLE Step 3 Content Outline", "https://www.usmle.org/exam-resources/step-3-materials/step-3-content-outline-and-specifications"),
  nbmeShelf: verified("NBME Clinical Science Subject Exams", "https://www.nbme.org/educators/assess-learn/subject-exams/clinical-science"),
  aamcMcat: verified("AAMC What's on the MCAT Exam", "https://students-residents.aamc.org/prepare-mcat-exam/whats-mcat-exam-pdf-outline"),
  aamcComp: verified("AAMC Premed Competencies", "https://students-residents.aamc.org/real-stories-demonstrating-premed-competencies/premed-competencies-entering-medical-students"),
  amcas: verified("AAMC AMCAS Applicant Guide", "https://students-residents.aamc.org/applying-medical-school-amcas/applying-medical-school-amcas"),
  casper: verified("Acuity Insights — Casper", "https://acuityinsights.app/casper/"),
  dat: verified("ADA Dental Admission Test (DAT)", "https://www.ada.org/education/testing/dental-admission-test"),
  jackWestin: tool("Jack Westin (topic navigation + early practice tool)", "https://jackwestin.com/"),
  godFile: internal("Blueprint Study God File v1"),
} as const;

// ---- Authoring helpers -----------------------------------------------------
function n(objective: string, taskType: BlueprintNodeType, opts: Partial<CatalogNode> = {}): CatalogNode {
  return { objective, taskType, priority: "medium", ...opts };
}
function cat(name: string, summary: string, nodes: CatalogNode[]): CatalogCategory {
  return { name, summary, nodes };
}

// Shared category builders reused across lanes (keeps the model consistent).
const qbankCategory = (label = "Question Bank Center") => cat(label,
  "Timed blocks, review discipline, and accuracy tracked by tag — questions are the map.",
  [
    n("Daily timed block", "task", { priority: "high", estimatedMinutes: 60, tags: ["questions"] }),
    n("Tutor / untimed remediation block", "task", { tags: ["questions", "review"] }),
    n("Accuracy by tag dashboard", "metric", { tags: ["questions", "analytics"] }),
    n("Explanation-review discipline (every miss + every guess)", "task", { priority: "high", tags: ["questions", "review"] }),
  ]);
const errorLogCategory = () => cat("Error Log and Weakness Repair",
  "Every miss becomes a tagged, retested repair item — not a deleted memory.",
  [
    n("Capture miss with mechanism + error type", "tracker", { priority: "high", tags: ["error-log"] }),
    n("48–72h retest queue", "queue", { priority: "high", tags: ["error-log", "spaced"] }),
    n("Recurring-weakness ranking", "metric", { tags: ["error-log", "analytics"] }),
  ]);
const ankiCategory = () => cat("Anki / Spaced Repetition",
  "Convert repeat misses into durable recall; keep reviews honest.",
  [
    n("Repeat-miss → card pipeline", "task", { priority: "high", tags: ["anki"] }),
    n("Mature vs. lapsed review balance", "metric", { tags: ["anki", "analytics"] }),
    n("Daily review ceiling (protect the floor, not the maximum)", "task", { tags: ["anki"] }),
  ]);
const assessmentCategory = (label = "NBME / Assessment Center") => cat(label,
  "Spaced, official-style checkpoints; review before adding new content.",
  [
    n("Baseline assessment logged", "assessment", { priority: "high", tags: ["assessment"] }),
    n("Assessment calendar (spaced)", "planner", { tags: ["assessment", "planner"] }),
    n("Two-pass assessment review", "task", { priority: "high", tags: ["assessment", "review"] }),
  ]);
const dedicatedPlannerCategory = (label = "Dedicated Planner") => cat(label,
  "A planning + execution layer that attaches to the exam — not a second exam.",
  [
    n("Baseline diagnostic", "assessment", { priority: "high", tags: ["dedicated"] }),
    n("Weakness ranking → resource selection", "tracker", { tags: ["dedicated"] }),
    n("Daily plan generator (timed blocks)", "planner", { tags: ["dedicated", "planner"] }),
    n("Simulation + taper phases", "planner", { tags: ["dedicated"] }),
    n("Sleep / recovery safeguards", "task", { tags: ["dedicated", "wellness"] }),
  ]);
const testDayCategory = (label = "Test-Day Readiness") => cat(label,
  "Logistics and the last-mile checklist so prep isn't wasted at the door.",
  [
    n("Exam logistics (ID, center, timing, breaks plan)", "task", { tags: ["logistics"] }),
    n("Final-week taper + simulation", "planner", { tags: ["logistics"] }),
    n("Day-before + day-of checklist", "task", { priority: "high", tags: ["logistics"] }),
  ]);

const ORGAN_SYSTEMS = [
  "Immune system", "Blood & lymphoreticular", "Behavioral health", "Nervous system & special senses",
  "Skin & subcutaneous", "Musculoskeletal", "Cardiovascular", "Respiratory", "Gastrointestinal",
  "Renal & urinary", "Pregnancy/childbirth/puerperium", "Female reproductive & breast",
  "Male reproductive", "Endocrine", "Multisystem / general principles",
];

// ===========================================================================
// LANES
// ===========================================================================
export const BLUEPRINT_LANES: BlueprintLane[] = [
  { id: "step1", mode: "usmle", label: "Step 1", sub: "Basic-science blueprint", blueprintId: "bp-step1" },
  { id: "step2", mode: "usmle", label: "Step 2 CK", sub: "Clinical reasoning blueprint", blueprintId: "bp-step2" },
  { id: "dedicated", mode: "usmle", label: "Dedicated", sub: "Planning + execution layer", blueprintId: "bp-dedicated" },
  { id: "shelf", mode: "usmle", label: "Shelf", sub: "Rotation subject exams", blueprintId: "bp-shelf-im" },
  { id: "step3", mode: "usmle", label: "Step 3", sub: "Independent practice + CCS", blueprintId: "bp-step3" },
  { id: "premed", mode: "prehealth", label: "Pre-Med", sub: "Applicant operating system", blueprintId: "bp-premed" },
  { id: "mcat", mode: "prehealth", label: "MCAT", sub: "AAMC spine + tools", blueprintId: "bp-mcat" },
  { id: "dat", mode: "prehealth", label: "DAT", sub: "Dental admission test", blueprintId: "bp-dat" },
  { id: "casper", mode: "prehealth", label: "CASPer", sub: "Situational judgment", blueprintId: "bp-casper" },
];

export const lanesForMode = (mode: BlueprintMode): BlueprintLane[] =>
  BLUEPRINT_LANES.filter((lane) => lane.mode === mode);

// ===========================================================================
// BLUEPRINTS
// ===========================================================================
export const BLUEPRINTS: BlueprintCatalogEntry[] = [
  // ---------------------------------------------------------------- STEP 1 ---
  {
    id: "bp-step1", laneId: "step1", title: "Step 1 Master Blueprint", short: "Step 1",
    summary: "System-based basic science from the official USMLE Step 1 content outline, run as a question-first operating system.",
    version: 1, source: SRC.usmleStep1,
    crossTags: ["organ-system", "discipline", "mechanism", "pathology", "pharmacology", "microbiology", "clinical-presentation", "question-error-type"],
    categories: [
      cat("Foundations and General Principles", "Mechanisms that travel across every system.", [
        n("General principles of foundational science", "content", { priority: "high", source: SRC.usmleStep1, tags: ["mechanism"] }),
        n("Biostatistics & epidemiology foundations", "content", { tags: ["discipline"] }),
        n("Gene/molecular/cellular principles", "content", { tags: ["mechanism"] }),
      ]),
      cat("Organ Systems", "The spine of the exam — each system cross-tagged by discipline + mechanism.", [
        ...ORGAN_SYSTEMS.map((sys) => n(sys, "content", { source: SRC.usmleStep1, tags: ["organ-system"] })),
      ]),
      cat("Pathology", "Mechanisms of disease as the answer-driving layer.", [
        n("Cellular injury, inflammation, neoplasia", "content", { priority: "high", tags: ["pathology", "mechanism"] }),
        n("System-specific pathology cross-link", "tracker", { tags: ["pathology", "organ-system"] }),
      ]),
      cat("Pharmacology", "Mechanisms, toxicities, and interactions tied to systems.", [
        n("Drug mechanisms & class effects", "content", { priority: "high", tags: ["pharmacology", "mechanism"] }),
        n("Toxicities & antidotes", "content", { tags: ["pharmacology"] }),
      ]),
      cat("Microbiology", "Classification, virulence, and host-defense interactions.", [
        n("Bacteria / virus / fungi / parasite map", "content", { tags: ["microbiology"] }),
        n("Antimicrobial mechanisms & resistance", "content", { tags: ["microbiology", "pharmacology"] }),
      ]),
      cat("Immunology", "Defects, hypersensitivity, and immune mechanisms.", [
        n("Innate vs. adaptive + hypersensitivity", "content", { tags: ["mechanism"] }),
        n("Immunodeficiencies & autoimmunity", "content", { tags: ["pathology"] }),
      ]),
      cat("Biochemistry and Genetics", "Metabolism checkpoints and inheritance logic.", [
        n("Metabolism checkpoints", "content", { tags: ["mechanism"] }),
        n("Genetics & inheritance patterns", "content", { tags: ["mechanism"] }),
      ]),
      cat("Behavioral Science, Ethics, Biostatistics", "The questions that punish vague reasoning.", [
        n("Study design & bias", "content", { tags: ["discipline"] }),
        n("Ethics, consent, capacity", "content", { tags: ["discipline"] }),
        n("Screening math & test characteristics", "task", { tags: ["discipline"] }),
      ]),
      qbankCategory(),
      ankiCategory(),
      errorLogCategory(),
      assessmentCategory(),
      dedicatedPlannerCategory(),
      testDayCategory(),
    ],
  },

  // ---------------------------------------------------------------- STEP 2 ---
  {
    id: "bp-step2", laneId: "step2", title: "Step 2 CK Master Blueprint", short: "Step 2 CK",
    summary: "Clinical reasoning by organ system, clinical task, and discipline — anchored to the official Step 2 CK outline and physician-task framework.",
    version: 1, source: SRC.usmleStep2,
    crossTags: ["organ-system", "clinical-task", "clinical-discipline", "acuity", "setting", "question-style", "error-type"],
    categories: [
      cat("Organ Systems", "Adult + special systems reasoned through tasks, not facts.", [
        ...ORGAN_SYSTEMS.slice(0, 14).map((sys) => n(sys, "content", { source: SRC.usmleStep2, tags: ["organ-system"] })),
      ]),
      cat("Clinical Tasks", "The physician-task spine of CK (the real answer axis).", [
        n("Diagnosis & next-best diagnostic step", "content", { priority: "high", tags: ["clinical-task"] }),
        n("Management & next-best treatment step", "content", { priority: "high", tags: ["clinical-task"] }),
        n("Prognosis & risk", "content", { tags: ["clinical-task"] }),
        n("Health maintenance & screening", "content", { tags: ["clinical-task", "prevention"] }),
      ]),
      cat("Clinical Disciplines", "Carried forward from the core clerkships.", [
        n("Medicine / Surgery / Peds / OB-GYN / Psych / FM / Neuro", "tracker", { tags: ["clinical-discipline"] }),
      ]),
      cat("Acute Care", "Unstable-patient logic and stabilization first.", [
        n("Initial stabilization & ABCs", "content", { priority: "high", tags: ["acuity"] }),
        n("Emergency next-step algorithms", "content", { tags: ["acuity"] }),
      ]),
      cat("Longitudinal Care", "Chronic disease control and follow-up timing.", [
        n("Chronic disease management cadence", "content", { tags: ["setting"] }),
      ]),
      cat("Prevention and Screening", "USPSTF-style screening and risk reduction.", [
        n("Age/risk-based screening map", "content", { tags: ["prevention"] }),
      ]),
      cat("Ethics, Safety, Communication, Systems", "Systems-based practice and safety.", [
        n("Consent / capacity / confidentiality", "content", { tags: ["discipline"] }),
        n("Patient safety & quality improvement", "content", { tags: ["systems"] }),
      ]),
      cat("Biostatistics and Evidence", "Abstract interpretation under time pressure.", [
        n("Abstract & study interpretation drills", "task", { tags: ["discipline"] }),
      ]),
      qbankCategory(),
      errorLogCategory(),
      ankiCategory(),
      assessmentCategory("Assessments"),
      dedicatedPlannerCategory("Dedicated Engine"),
      cat("Clinical Skills and Feedback", "Translate rotation feedback into tested behavior.", [
        n("Feedback → one behavior experiment", "tracker", { tags: ["feedback"] }),
        n("Patient-presentation reps", "task", { tags: ["clinical-task"] }),
      ]),
      cat("Residency Evidence Vault", "Evidence that compounds toward the match.", [
        n("Rotation evaluations & notable cases", "evidence", { tags: ["residency"] }),
      ]),
    ],
  },

  // ------------------------------------------------------------- DEDICATED ---
  {
    id: "bp-dedicated", laneId: "dedicated", title: "Dedicated Engine", short: "Dedicated",
    summary: "A planning + execution layer that attaches to Step 1, Step 2, or Step 3 — diagnostic-driven, weakness-ranked, and recovery-safeguarded.",
    version: 1, source: SRC.godFile, crossTags: ["phase", "weakness", "assessment"],
    categories: [
      cat("Baseline & Weakness", "Start from evidence, not vibes.", [
        n("Baseline diagnostic", "assessment", { priority: "high", tags: ["phase"] }),
        n("Weakness ranking", "metric", { priority: "high", tags: ["weakness"] }),
        n("Resource selection (lock the toolset)", "task", { tags: ["phase"] }),
      ]),
      cat("Daily Execution", "Timed blocks + repair, every day.", [
        n("Daily plan generator", "planner", { priority: "high", tags: ["phase"] }),
        n("Timed blocks", "task", { tags: ["questions"] }),
        n("Error repair queue", "queue", { priority: "high", tags: ["error-log"] }),
      ]),
      cat("Assessment Cadence", "Spaced checkpoints that steer the plan.", [
        n("Assessment calendar", "planner", { tags: ["assessment"] }),
        n("Simulation phase", "planner", { tags: ["phase"] }),
        n("Taper phase", "planner", { tags: ["phase"] }),
      ]),
      cat("Safeguards & Logistics", "Protect the human running the plan.", [
        n("Sleep / recovery safeguards", "task", { priority: "high", tags: ["wellness"] }),
        n("Exam logistics", "task", { tags: ["logistics"] }),
      ]),
    ],
  },

  // ---------------------------------------------------------- SHELF (xN) ------
  ...shelfBlueprints(),

  // ---------------------------------------------------------------- STEP 3 ---
  {
    id: "bp-step3", laneId: "step3", title: "Step 3 Master Blueprint", short: "Step 3",
    summary: "Independent practice, advanced clinical medicine, and CCS as a first-class system — anchored to the official Step 3 outline.",
    version: 1, source: SRC.usmleStep3,
    crossTags: ["task", "setting", "acuity", "ccs", "error-type"],
    categories: [
      cat("Foundations of Independent Practice", "FIP day-one reasoning and systems.", [
        n("Biostatistics, abstracts, drug ads", "content", { priority: "high", tags: ["discipline"] }),
        n("Systems-based practice & safety", "content", { tags: ["systems"] }),
      ]),
      cat("Advanced Clinical Medicine", "Multi-system management and prognosis.", [
        n("Outpatient + longitudinal management", "content", { tags: ["setting"] }),
        n("Preventive medicine & nutrition", "content", { tags: ["prevention"] }),
      ]),
      cat("Emergency & Acute Stabilization", "Triage, orders, monitoring.", [
        n("Initial orders & monitoring", "content", { priority: "high", tags: ["acuity"] }),
      ]),
      cat("CCS Mastery", "Computer-based case simulations — a first-class system.", [
        n("Opening-order templates", "content", { priority: "high", tags: ["ccs"] }),
        n("Site-of-care selection", "content", { tags: ["ccs"] }),
        n("Monitoring & reassessment", "content", { tags: ["ccs"] }),
        n("Consultation & follow-up", "content", { tags: ["ccs"] }),
        n("Clock-advancement discipline", "task", { priority: "high", tags: ["ccs"] }),
        n("CCS error taxonomy", "tracker", { tags: ["ccs", "error-type"] }),
      ]),
      cat("CCS Case Bank", "Reps across presentations and settings.", [
        n("Worked CCS case queue", "queue", { tags: ["ccs"] }),
      ]),
      qbankCategory("QBank and Error Log"),
      errorLogCategory(),
      assessmentCategory("Assessments"),
      dedicatedPlannerCategory("Resident-Compatible Planner"),
      testDayCategory("Test-day logistics"),
    ],
  },

  // ----------------------------------------------------------------- MCAT ----
  {
    id: "bp-mcat", laneId: "mcat", title: "AAMC + Jack Westin Master Blueprint", short: "MCAT",
    summary: "AAMC foundational concepts + content categories as the governing spine; Jack Westin is a topic-navigation and early-practice tool, not the curriculum.",
    version: 1, source: SRC.aamcMcat,
    crossTags: ["section", "foundational-concept", "skill", "passage-type", "question-type"],
    categories: [
      cat("Chem/Phys", "Chemical & Physical Foundations of Biological Systems.", [
        n("General chemistry foundations", "content", { source: SRC.aamcMcat, tags: ["section:cp"] }),
        n("Physics foundations", "content", { tags: ["section:cp"] }),
        n("Organic chemistry foundations", "content", { tags: ["section:cp"] }),
        n("Biochemistry (Chem/Phys context)", "content", { tags: ["section:cp"] }),
      ]),
      cat("CARS", "Critical Analysis and Reasoning Skills — a daily habit.", [
        n("Daily timed CARS passage", "task", { priority: "high", tags: ["section:cars"] }),
        n("Wrong-answer autopsy", "task", { tags: ["section:cars", "error-type"] }),
      ]),
      cat("Bio/Biochem", "Biological & Biochemical Foundations of Living Systems.", [
        n("Biochemistry & molecular biology", "content", { tags: ["section:bb"] }),
        n("Cell & organ-system biology", "content", { tags: ["section:bb"] }),
      ]),
      cat("Psych/Soc", "Psychological, Social, and Biological Foundations of Behavior.", [
        n("Psychology foundations", "content", { tags: ["section:ps"] }),
        n("Sociology foundations", "content", { tags: ["section:ps"] }),
      ]),
      cat("Scientific Inquiry and Reasoning Skills", "The four AAMC SIRS skills.", [
        n("Knowledge of scientific concepts", "content", { tags: ["skill"] }),
        n("Scientific reasoning & evidence", "content", { tags: ["skill"] }),
        n("Reasoning about design & execution", "content", { tags: ["skill"] }),
        n("Data-based & statistical reasoning", "content", { tags: ["skill"] }),
      ]),
      cat("Passage Reasoning", "Passage strategy across science sections.", [
        n("Passage mapping reps", "task", { tags: ["passage-type"] }),
      ]),
      cat("Data Interpretation", "Figures, tables, and experimental data.", [
        n("Graph/table interpretation drills", "task", { tags: ["skill"] }),
      ]),
      cat("Experimental Design", "Independent/dependent variables, controls, validity.", [
        n("Experimental-design drills", "task", { tags: ["skill"] }),
      ]),
      cat("Equation Bank", "Pick two equations weekly until automatic.", [
        n("Equation mastery tracker", "tracker", { tags: ["section:cp"] }),
      ]),
      cat("Lab Methods", "Separations, spectroscopy, assays.", [
        n("Lab-technique reference + drills", "content", { tags: ["section:cp", "section:bb"] }),
      ]),
      cat("Psych/Soc Definitions", "Term confusion is the hidden score leak.", [
        n("Psych/Soc term deck", "queue", { tags: ["anki", "section:ps"] }),
      ]),
      cat("CARS Question-Type Engine", "Classify by question type, not vibes.", [
        n("Question-type classification tracker", "tracker", { tags: ["section:cars", "question-type"] }),
      ]),
      ankiCategory(),
      cat("Passage/QBank Center", "AAMC-first practice; tools as scaffolding.", [
        n("AAMC question packs", "task", { priority: "high", source: SRC.aamcMcat, tags: ["questions"] }),
        n("Jack Westin daily passage", "task", { source: SRC.jackWestin, tags: ["questions", "tool"], resourceLinks: [{ label: "Jack Westin", url: "https://jackwestin.com/", kind: "tool" }] }),
      ]),
      cat("Full-Length Center", "Full-length evidence governs readiness.", [
        n("AAMC full-length schedule + score log", "assessment", { priority: "high", source: SRC.aamcMcat, tags: ["assessment"] }),
      ]),
      errorLogCategory(),
      cat("Timeline Engine", "Phase the runway: content → practice → full-lengths.", [
        n("Phase plan + weekly schedule", "planner", { tags: ["planner"] }),
      ]),
    ],
  },

  // --------------------------------------------------------------- PRE-MED ---
  {
    id: "bp-premed", laneId: "premed", title: "Applicant Operating System", short: "Pre-Med",
    summary: "The full Pre-Med command center: academic map, prerequisites, experiences mapped to AAMC competencies, application cycle, and a longitudinal evidence vault.",
    version: 1, source: SRC.godFile,
    crossTags: ["competency", "evidence-strength", "requirement", "cycle-phase"],
    categories: [
      cat("Mission Control", "One screen: readiness, next-best actions, alerts.", [
        n("Readiness score + gap analysis", "metric", { priority: "high", source: SRC.godFile, tags: ["dashboard"] }),
        n("Next-best-action list", "task", { priority: "high", tags: ["dashboard"] }),
      ]),
      cat("Academic Map", "Identity, pathway intent, term-by-term plan.", [
        n("Pathway intent (MD/DO/Texas/Canada/Caribbean/SGU/MD-PhD…)", "tracker", { tags: ["academic"] }),
        n("Term-by-term course plan", "planner", { tags: ["academic"] }),
      ]),
      cat("Degree Audit", "Separate degree, gen-ed, major, and prereqs.", [
        n("Transcript / DARS import (confirm before locking)", "task", { tags: ["academic"] }),
        n("Degree vs. prereq separation", "tracker", { priority: "high", tags: ["requirement"] }),
        n("GPA / science-GPA trend + recovery", "metric", { tags: ["academic"] }),
      ]),
      cat("Medical School Prerequisites", "Per-school requirements with source + confidence.", [
        n("Prerequisite group map (bio/chem/orgo/physics/biochem/math/stats/writing/psych/soc…)", "tracker", { priority: "high", source: SRC.amcas, tags: ["requirement"] }),
        n("Per-school requirement status (required/recommended/unknown)", "tracker", { tags: ["requirement"] }),
        n("Online/AP/CC/international policy notes (source-cited)", "content", { tags: ["requirement", "policy"] }),
      ]),
      cat("MCAT Readiness", "Bridge to the MCAT lane.", [
        n("Readiness from coursework completion", "metric", { tags: ["mcat"] }),
      ]),
      cat("Experiences and AAMC Competencies", "Map every activity to the 17 competencies.", [
        n("Activity → competency mapping", "tracker", { priority: "high", source: SRC.aamcComp, tags: ["competency"] }),
        n("Competency evidence-strength score", "metric", { tags: ["competency", "evidence-strength"] }),
      ]),
      cat("Clinical Exposure", "Paid/volunteer, direct vs. indirect contact.", [
        n("Clinical hours + direct-contact tracker", "tracker", { tags: ["clinical"] }),
      ]),
      cat("Community Service and Advocacy", "Non-clinical service and populations served.", [
        n("Service hours + impact + reflection", "tracker", { tags: ["service"] }),
      ]),
      cat("Research and Scholarly Work", "From literature review to publication.", [
        n("Research role + outputs tracker", "tracker", { tags: ["research"] }),
      ]),
      cat("Leadership, Teaching, Employment", "Responsibility and sustained contribution.", [
        n("Leadership / teaching / employment tracker", "tracker", { tags: ["leadership"] }),
      ]),
      cat("Letters of Recommendation", "Evaluators, relationship quality, status.", [
        n("LOR tracker (evaluator, ask date, status, waiver)", "tracker", { tags: ["application"] }),
      ]),
      cat("Personal Narrative Vault", "Capture stories while they're still fresh.", [
        n("Story / hardship / growth vault", "evidence", { priority: "high", tags: ["narrative"] }),
      ]),
      cat("School Discovery and Fit", "Build a list by fit, not prestige.", [
        n("School list with fit logic + reason per school", "tracker", { source: SRC.amcas, tags: ["application"] }),
      ]),
      cat("Application Cycle Center", "AMCAS/AACOMAS/TMDSAS + SGU/international.", [
        n("Primary application checklist", "task", { priority: "high", source: SRC.amcas, tags: ["cycle-phase"] }),
      ]),
      cat("Secondary Essay Lab", "Prompts, reuse strategy, drafts, status.", [
        n("Secondary tracker + reuse matrix", "tracker", { tags: ["cycle-phase"] }),
      ]),
      cat("Interview Prep", "Format-specific prep + reflection.", [
        n("Interview format prep + mock log", "task", { tags: ["cycle-phase"] }),
      ]),
      cat("Financial Planning", "Costs, fee assistance, aid.", [
        n("Cost + FAP/fee-assistance tracker", "tracker", { tags: ["cycle-phase"] }),
      ]),
      cat("Gap Year / Reapplication", "Strategy if applicable.", [
        n("Gap-year / reapplication plan", "planner", { tags: ["cycle-phase"] }),
      ]),
      cat("International and SGU Pathways", "Caribbean/international specifics.", [
        n("International / SGU pathway notes (source-cited)", "content", { tags: ["policy"] }),
      ]),
      cat("Wellness and Burnout Safeguards", "Protect the human running the cycle.", [
        n("Wellness + workload safeguards", "task", { tags: ["wellness"] }),
      ]),
      cat("Data Sources / Audit Trail", "Source, version date, confidence, change log.", [
        n("Source + last-verified audit trail", "tracker", { priority: "high", tags: ["policy", "audit"] }),
      ]),
    ],
  },

  // ----------------------------------------------------------------- DAT -----
  {
    id: "bp-dat", laneId: "dat", title: "DAT Master Blueprint", short: "DAT",
    summary: "Dental Admission Test architecture scaffolded against the official ADA DAT specifications; content populated from the official testing authority.",
    version: 1, source: SRC.dat,
    crossTags: ["section", "skill", "question-type"],
    categories: [
      cat("Survey of Natural Sciences — Biology", "Cell/molecular, systems, genetics, ecology, evolution.", [
        n("Biology content map (ADA outline)", "content", { source: SRC.dat, tags: ["section:bio"] }),
      ]),
      cat("Survey of Natural Sciences — General Chemistry", "Stoichiometry, equilibrium, thermo, electrochem.", [
        n("Gen-chem content map (ADA outline)", "content", { source: SRC.dat, tags: ["section:gc"] }),
      ]),
      cat("Survey of Natural Sciences — Organic Chemistry", "Mechanisms, reactions, stereochemistry, lab.", [
        n("Orgo content map (ADA outline)", "content", { source: SRC.dat, tags: ["section:oc"] }),
      ]),
      cat("Perceptual Ability Test", "Six PAT subsections.", [
        n("PAT subsection drills (keyholes, TFE, angles, hole punch, cube counting, pattern folding)", "task", { priority: "high", tags: ["section:pat"] }),
      ]),
      cat("Reading Comprehension", "Dense science passage reasoning.", [
        n("RC timed passages", "task", { tags: ["section:rc"] }),
      ]),
      cat("Quantitative Reasoning", "Math + applied word problems.", [
        n("QR drills + formula recall", "task", { tags: ["section:qr"] }),
      ]),
      cat("Question Bank", "Timed practice by section.", [n("Sectioned timed blocks", "task", { tags: ["questions"] })]),
      cat("PAT Drill Center", "High-rep perceptual training.", [n("Daily PAT reps", "task", { tags: ["section:pat"] })]),
      cat("Formula and Reaction Bank", "Equations + named reactions.", [n("Formula/reaction tracker", "tracker", { tags: ["section:gc", "section:oc"] })]),
      ankiCategory(),
      cat("Full-Length Center", "Official-style full-lengths.", [n("Full-length schedule + score log", "assessment", { tags: ["assessment"] })]),
      errorLogCategory(),
      cat("Timeline / Dedicated Planner", "Phase the DAT runway.", [n("Phase plan + schedule", "planner", { tags: ["planner"] })]),
    ],
  },

  // --------------------------------------------------------------- CASPer ----
  {
    id: "bp-casper", laneId: "casper", title: "Casper SJT Blueprint", short: "CASPer",
    summary: "Situational-judgment architecture scaffolded against the official Acuity Insights Casper format; rubric + scenario content populated from the official authority.",
    version: 1, source: SRC.casper,
    crossTags: ["competency", "response-type", "scenario-type"],
    categories: [
      cat("Situational Judgment Foundations", "How Casper is scored + what it measures.", [
        n("Casper format + scoring overview (official)", "content", { priority: "high", source: SRC.casper, tags: ["competency"] }),
      ]),
      cat("Ethical Reasoning", "Principled, balanced judgment.", [n("Ethics framework + drills", "task", { tags: ["competency"] })]),
      cat("Empathy and Professionalism", "Perspective-taking under pressure.", [n("Empathy/professionalism reps", "task", { tags: ["competency"] })]),
      cat("Conflict and Communication", "De-escalation and clarity.", [n("Conflict-response drills", "task", { tags: ["competency"] })]),
      cat("Equity and Cultural Humility", "Fairness and inclusion.", [n("Equity scenario drills", "task", { tags: ["competency"] })]),
      cat("Time-Pressure Response Drills", "Structure fast, write/speak clearly.", [n("Typed-response structure drills", "task", { priority: "high", tags: ["response-type"] }), n("Video-response structure drills", "task", { tags: ["response-type"] })]),
      cat("Scenario Bank", "Reps across scenario types.", [n("Scenario practice queue", "queue", { tags: ["scenario-type"] })]),
      cat("Feedback Rubric", "Self-score against official competencies.", [n("Rubric self-scoring tracker", "tracker", { tags: ["competency"] })]),
      cat("Error Patterns", "Your recurring response weaknesses.", [n("Error-pattern tracker", "tracker", { tags: ["error-type"] })]),
      cat("Timing Analytics", "Words/minute and completion rate.", [n("Timing analytics", "metric", { tags: ["analytics"] })]),
      cat("Mock Test Center", "Full-length simulated Casper.", [n("Mock Casper + review", "assessment", { tags: ["assessment"] })]),
    ],
  },
];

// 13 installable shelf containers, each with the required clinical sub-structure.
function shelfBlueprints(): BlueprintCatalogEntry[] {
  const shelves = [
    "Internal Medicine", "Surgery", "Pediatrics", "OB/GYN", "Psychiatry", "Family Medicine",
    "Neurology", "Emergency Medicine", "Ambulatory Care", "Geriatrics", "Critical Care",
    "Electives / Sub-I", "CCSE (Comprehensive Clinical Science)",
  ];
  return shelves.map((name) => ({
    id: `bp-shelf-${slug(name)}`,
    laneId: "shelf" as BlueprintLaneId,
    title: `${name} Shelf Blueprint`,
    short: name,
    summary: `${name} shelf prep — presentations, illness scripts, must-not-miss emergencies, and Step-2 carry-forward, anchored to the NBME clinical science outline.`,
    version: 1,
    source: SRC.nbmeShelf,
    crossTags: ["presentation", "discipline", "acuity", "setting", "error-type"],
    categories: [
      cat("Presentations", "The presentations this shelf actually tests.", [n(`${name} high-yield presentations`, "content", { source: SRC.nbmeShelf, tags: ["presentation"] })]),
      cat("Illness Scripts", "Disease scripts you can recall cold.", [n("Illness-script bank", "tracker", { priority: "high", tags: ["presentation"] })]),
      cat("Must-Not-Miss Emergencies", "The can't-miss diagnoses.", [n("Emergency recognition drills", "task", { priority: "high", tags: ["acuity"] })]),
      cat("Management Algorithms", "Next-best-step pathways.", [n("Algorithm bank", "content", { tags: ["clinical-task"] })]),
      cat("Patient Encounter Tracker", "Turn real patients into evidence.", [n("Encounter log (dx, task, feedback, learning point)", "evidence", { tags: ["clinical"] })]),
      cat("Required Skills / Procedures", "Rotation skill checklist.", [n("Skills/procedures checklist", "tracker", { tags: ["skills"] })]),
      qbankCategory("Question Queue"),
      ankiCategory(),
      assessmentCategory("Assessment Plan"),
      cat("Last-Two-Week Mode", "Compressed high-yield endgame.", [n("Final-2-weeks high-yield plan", "planner", { priority: "high", tags: ["planner"] })]),
      cat("Shelf → Step 2 Carry-Forward", "Misses become Step 2 tags, not deletions.", [n("Carry-forward miss tagging", "tracker", { tags: ["error-type", "carry-forward"] })]),
    ],
  }));
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const blueprintById = (id: string): BlueprintCatalogEntry | undefined =>
  BLUEPRINTS.find((bp) => bp.id === id);

export const blueprintsForLane = (laneId: BlueprintLaneId): BlueprintCatalogEntry[] =>
  BLUEPRINTS.filter((bp) => bp.laneId === laneId);
