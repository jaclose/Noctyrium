import { useEffect, useMemo, useState } from "react";
import {
  BookOpen, Brain, CalendarDays, CheckCircle2, ChevronDown,
  Database, ExternalLink, FlaskConical, Layers, ListChecks, Plus,
  ShieldCheck, Sparkles, Target,
} from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, PanelHeader, Tag } from "../components/ui/primitives";
import { Field, SelectField, TextAreaField } from "../components/ui/Modal";
import { dayKey } from "../lib/scoring";
import { normalizeResourceUrl } from "../lib/resourceUtils";
import type { BoardBlueprintLog, BoardExamId, BoardPrepProfile, PremedExperienceKind } from "../lib/types";

type YieldLevel = "high" | "medium" | "low";
type PrepLeaf = { id: string; title: string; why: string; action: string };
type PrepFolder = { title: string; leaves: PrepLeaf[] };
type PrepArea = {
  id: string;
  title: string;
  yield: YieldLevel;
  weight: number;
  summary: string;
  folders: PrepFolder[];
  tips?: string[];
};
type PrepResource = { id: string; title: string; kind: string; url: string; why: string; tags: string[] };
type ExamConfig = {
  label: string;
  shortLabel: string;
  sourceLabel: string;
  sourceUrl: string;
  structure: string;
  passMeaning: string;
  doneMeaning: string;
  installCopy: string;
  areas: PrepArea[];
  resources: PrepResource[];
  rhythm: { title: string; body: string; chips: string[] }[];
};

const yieldTone: Record<YieldLevel, "green" | "orange" | "neutral"> = {
  high: "green",
  medium: "orange",
  low: "neutral",
};

const PREMED_KINDS: PremedExperienceKind[] = ["Clinical", "Service", "Research", "Shadowing", "Leadership"];

const EXAMS: Record<BoardExamId, ExamConfig> = {
  step1: {
    label: "USMLE Step 1 Blueprint",
    shortLabel: "Step 1",
    sourceLabel: "USMLE Content Outline 2026 + local Blueprint God file",
    sourceUrl: "https://www.usmle.org/exam-resources/step-1-materials/step-1-content-outline-and-specifications",
    structure: "Basic-science blueprint folders by system, discipline, and competency. Install the map, then complete final items as evidence accumulates.",
    passMeaning: "A pass is a board-work cycle: questions or review, explanation repair, and a logged weak-area decision.",
    doneMeaning: "Done means the final item has evidence: stable questions, repaired misses, or a retested weak point. It is not a lecture pass.",
    installCopy: "Install Step 1 blueprint",
    areas: [
      area("step1-foundations", "Foundations and general principles", "high", 1.1, "Mechanisms that travel across every organ system.", [
        folder("Biochemistry and molecular biology", ["Amino acids and protein structure", "Enzymes and kinetics", "Metabolism checkpoints", "Genetics and gene expression"]),
        folder("Micro, immune, pharm, path", ["Host defense map", "Microbiology classification", "Drug mechanisms and toxicities", "Inflammation and neoplasia principles"]),
        folder("Biostats, ethics, communication", ["Study design and bias", "Screening math", "Patient safety and ethics", "Communication frameworks"]),
      ], ["Start broad, then let missed questions choose the next subfolder.", "Biostats grows fastest when every missed method is rewritten in your own words."]),
      area("step1-cardiopulmrenal", "Cardio, pulmonary, renal", "high", 1.2, "Physiology-heavy systems where equations, graphs, and compensation logic matter.", [
        folder("Cardiovascular", ["Pressure-volume loops", "Murmurs and hemodynamics", "Cardio pharm", "Shock and heart failure"]),
        folder("Respiratory", ["Ventilation and perfusion", "Obstructive vs restrictive disease", "Pulmonary vascular disease", "Respiratory acid-base"]),
        folder("Renal", ["Nephron transport", "Acid-base disorders", "Electrolytes and fluids", "Renal pathology and pharm"]),
      ], ["Draw the graph before reading answer choices when a question is physiology-first."]),
      area("step1-body-systems", "GI, endocrine, reproductive, neuro, MSK", "high", 1.0, "Large system folders for disease scripts, pathways, and pharmacology tie-ins.", [
        folder("GI and nutrition", ["Hepatobiliary disease", "Pancreas and digestion", "Malabsorption and vitamins", "GI neoplasia"]),
        folder("Endocrine and reproductive", ["Diabetes and thyroid", "Adrenal and pituitary", "Pregnancy physiology", "Male/female/transgender repro"]),
        folder("Neuro, behavior, MSK, skin", ["Neuro localization", "Psych and sleep", "Derm/rheum patterns", "Bone, muscle, connective tissue"]),
      ]),
      area("step1-readiness", "Assessments and error repair", "medium", 0.9, "NBME-style checkpoints, sample items, and error-log cleanup.", [
        folder("Assessment loop", ["Official sample questions", "NBME/CBSSA review", "Two-pass error log", "Retest repeat misses"]),
        folder("Recall artifacts", ["Anki for repeat misses", "One-page weak-area repair", "Formula/scheme sheet", "48-hour retest queue"]),
      ]),
    ],
    resources: [
      res("usmle-step1-outline", "USMLE Step 1 Content Outline", "Official", "https://www.usmle.org/exam-resources/step-1-materials/step-1-content-outline-and-specifications", "Official Step 1 content and specifications.", ["official", "blueprint"]),
      res("usmle-step1-samples", "USMLE Step 1 Sample Questions", "Official", "https://www.usmle.org/exam-resources/step-1-materials/step-1-sample-test-questions", "Official item format and testing experience.", ["official", "practice"]),
      res("nbme-cbssa", "NBME CBSSA", "Assessment", "https://www.nbme.org/examinees/self-assessments/comprehensive-basic-science-self-assessment", "Comprehensive Basic Science readiness check.", ["nbme", "assessment"]),
      res("anking-step", "AnKing Step Deck", "Anki", "https://www.ankihub.net/step-deck", "Spaced retrieval for missed facts.", ["anki", "retrieval"]),
    ],
    rhythm: [
      rhythm("Daily board loop", "Questions first, explanation review second, recall artifact third.", ["40-80 questions", "missed-fact repair", "48h retest"]),
      rhythm("Weekly checkpoint", "One mixed block or NBME-style review day to expose cross-system drift.", ["mixed systems", "biostats touch", "weak-area queue"]),
    ],
  },
  step2: {
    label: "USMLE Step 2 CK Blueprint",
    shortLabel: "Step 2",
    sourceLabel: "USMLE Step 2 CK outline + clinical task framework",
    sourceUrl: "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-content-outline-specifications",
    structure: "Clinical reasoning folders for diagnosis, management, screening, and patient safety.",
    passMeaning: "A pass is a clinical-reasoning cycle: questions, management algorithm review, and a logged decision error.",
    doneMeaning: "Done means diagnosis/next-step errors have been retested and shelf/Step 2 evidence is improving.",
    installCopy: "Install Step 2 blueprint",
    areas: [
      area("step2-medicine", "Medicine and emergency reasoning", "high", 1.2, "Adult systems, unstable patients, and next-best-step logic.", [
        folder("Adult systems", ["Cardio/pulm/renal", "GI/endocrine/heme", "Infectious disease", "Rheum/derm/neuro"]),
        folder("Acute care", ["Initial stabilization", "Diagnostic next step", "Disposition", "Medication safety"]),
      ]),
      area("step2-rotations", "Core clerkships", "high", 1.0, "Shelf domains carried forward into Step 2.", [
        folder("Surgery, peds, OB/GYN", ["Acute abdomen/trauma", "Pediatric milestones", "Pregnancy and postpartum", "Gynecology"]),
        folder("Psych, family, ambulatory", ["Risk and safety", "Screening and prevention", "Substance use", "Longitudinal care"]),
      ]),
      area("step2-quality", "Ethics, safety, biostats", "medium", 0.8, "The questions that punish vague reasoning.", [
        folder("Systems and evidence", ["Quality improvement", "Patient safety", "Abstract interpretation", "Consent/capacity/confidentiality"]),
      ]),
    ],
    resources: [
      res("usmle-step2-outline", "USMLE Step 2 CK Content Outline", "Official", "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-content-outline-specifications", "Official Step 2 CK specifications.", ["official", "blueprint"]),
      res("usmle-step2-samples", "USMLE Step 2 CK Sample Questions", "Official", "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-sample-test-questions", "Official sample item style.", ["official", "practice"]),
      res("nbme-clinical-self", "NBME Clinical Science Self-Assessments", "Assessment", "https://www.nbme.org/examinees/self-assessments/clinical-science-subject-exams", "Shelf and clinical readiness checks.", ["nbme", "assessment"]),
    ],
    rhythm: [
      rhythm("Rotation weekday", "Questions plus one algorithm repair tied to the patients you saw.", ["20-60 questions", "one algorithm", "patient tie-in"]),
      rhythm("Shelf carry-forward", "Shelf misses become Step 2 tags instead of disappearing after the rotation.", ["missed themes", "management errors", "retest"]),
    ],
  },
  step3: {
    label: "USMLE Step 3 Blueprint",
    shortLabel: "Step 3",
    sourceLabel: "USMLE Step 3 outline",
    sourceUrl: "https://www.usmle.org/exam-resources/step-3-materials/step-3-content-outline-and-specifications",
    structure: "Management, prognosis, ambulatory care, inpatient care, and CCS-style decision timing.",
    passMeaning: "A pass is a management/CCS cycle: orders, monitoring, reassessment, and safety check.",
    doneMeaning: "Done means safe management patterns are consistent and CCS timing errors are repaired.",
    installCopy: "Install Step 3 blueprint",
    areas: [
      area("step3-ambulatory", "Ambulatory and chronic care", "high", 1.0, "Outpatient diagnosis, follow-up, prevention, and chronic disease control.", [
        folder("Longitudinal care", ["Hypertension/diabetes", "Preventive visits", "Medication monitoring", "Follow-up timing"]),
      ]),
      area("step3-inpatient", "Emergency, inpatient, CCS", "high", 1.2, "Triage, orders, monitoring, and reassessment.", [
        folder("Acute management", ["Initial orders", "Diagnostic sequencing", "Monitoring", "Disposition"]),
        folder("CCS cases", ["Clock management", "Consults and procedures", "Complication prevention", "Case closure"]),
      ]),
      area("step3-systems", "Biostats, ethics, systems", "medium", 0.8, "Abstracts, systems-based practice, patient safety, and professionalism.", [
        folder("Systems reasoning", ["Drug ads/abstracts", "Quality and safety", "Ethics/legal", "Population health"]),
      ]),
    ],
    resources: [
      res("usmle-step3-outline", "USMLE Step 3 Content Outline", "Official", "https://www.usmle.org/exam-resources/step-3-materials/step-3-content-outline-and-specifications", "Official Step 3 specifications.", ["official", "blueprint"]),
      res("usmle-step3-samples", "USMLE Step 3 Sample Questions", "Official", "https://www.usmle.org/exam-resources/step-3-materials/step-3-sample-test-questions", "Official practice materials.", ["official", "practice"]),
    ],
    rhythm: [rhythm("Management day", "Mix MCQs with CCS so content and timing improve together.", ["MCQs", "CCS case", "safety review"])],
  },
  shelf: {
    label: "Shelf Exams Blueprint",
    shortLabel: "Shelf",
    sourceLabel: "NBME Clinical Science Subject Exams",
    sourceUrl: "https://www.nbme.org/educators/assess-learn/subject-exams/clinical-science",
    structure: "Rotation-specific shelf folders with patient encounter evidence and NBME-style review.",
    passMeaning: "A pass is one rotation cycle: patient/task exposure, questions, explanation review, and algorithm repair.",
    doneMeaning: "Done means the shelf domain was retested and the clinical behavior or algorithm is clearer.",
    installCopy: "Install shelf blueprint",
    areas: [
      area("shelf-core", "Core clinical shelves", "high", 1.1, "Medicine, surgery, pediatrics, OB/GYN, psychiatry, family medicine.", [
        folder("Clinical science subjects", ["Medicine", "Surgery", "Pediatrics", "OB/GYN", "Psychiatry", "Family medicine"]),
      ]),
      area("shelf-patient-evidence", "Patient encounter evidence", "medium", 0.9, "Turn real clinical exposure into exam and feedback signal.", [
        folder("Encounter loop", ["Diagnosis seen", "Management decision", "Feedback received", "One behavior to test next shift"]),
      ]),
    ],
    resources: [
      res("nbme-clinical", "NBME Clinical Science Subject Exams", "Official", "https://www.nbme.org/educators/assess-learn/subject-exams/clinical-science", "Content outlines and sample items by shelf.", ["official", "nbme"]),
      res("nbme-subject-exams", "NBME Subject Exams", "Official", "https://www.nbme.org/examinees/subject-exams", "Subject exam information for examinees.", ["official", "nbme"]),
    ],
    rhythm: [rhythm("Rotation week", "Tie qbank misses to one patient, one algorithm, and one feedback experiment.", ["patients", "questions", "feedback"])],
  },
  mcat: {
    label: "MCAT Blueprint",
    shortLabel: "MCAT",
    sourceLabel: "AAMC MCAT outline + local MCAT topic file + Blueprint God file",
    sourceUrl: "https://students-residents.aamc.org/prepare-mcat-exam/whats-mcat-exam-pdf-outline",
    structure: "AAMC-style section folders with daily CARS, content/passages, full-length review, equations, and pathways.",
    passMeaning: "A pass is a section cycle: content, passages, error log, and next-day review. CARS is a daily habit, not an occasional topic.",
    doneMeaning: "Done means the final item has practice evidence, and full-length review confirms the weakness is not recurring.",
    installCopy: "Install MCAT blueprint",
    areas: [
      area("mcat-cp", "Chemical and Physical Foundations", "high", 1.05, "General chemistry, organic chemistry, physics, biochemistry, and lab reasoning.", [
        folder("Physics equations", ["Kinematics and forces", "Work/energy/power", "Fluids", "Circuits", "Optics and waves", "Radioactive decay"]),
        folder("Chemistry", ["Stoichiometry and equilibrium", "Acid/base and buffers", "Thermodynamics", "Electrochemistry", "Organic reactions and lab techniques"]),
      ], ["Pick two equations weekly and work them until units and assumptions are automatic."]),
      area("mcat-cars", "CARS daily reasoning", "high", 1.2, "Passage reasoning, author profile, tone, inference, and review.", [
        folder("Daily passage loop", ["Timed passage", "Main idea in one sentence", "Author profile", "Wrong-answer autopsy"]),
        folder("Reading practice", ["10 pages non-fiction/fiction", "Paragraph gist notes", "End summary", "Timing audit"]),
      ], ["Think inside the passage boundaries.", "Build a mental profile of the author before answering tone/inference.", "If CARS is stubborn, protect daily contact without letting it eat the entire day."]),
      area("mcat-bb", "Biological and Biochemical Foundations", "high", 1.1, "Biology, biochemistry, pathways, proteins, genetics, and experimental design.", [
        folder("Biochemistry", ["Amino acids", "Protein structure", "Enzyme kinetics", "Metabolic pathways"]),
        folder("Biology", ["Cell biology", "Genetics", "Organ systems", "Experimental reasoning"]),
      ], ["Pathways should be toggled as systems, enzymes, regulation, and disease links - not memorized as a poster."]),
      area("mcat-ps", "Psych/Soc and full-length loop", "medium", 0.9, "Psychology, sociology, research methods, diagnostics, and full-length evidence.", [
        folder("Psych/Soc", ["Learning and memory", "Development and behavior", "Social structure", "Research methods"]),
        folder("Full-length review", ["Diagnostic", "Full-length score log", "Every miss/guess reviewed", "Weak category retest"]),
      ]),
    ],
    resources: [
      res("aamc-mcat-outline", "AAMC What's on the MCAT Exam? PDF Outline", "Official", "https://students-residents.aamc.org/prepare-mcat-exam/whats-mcat-exam-pdf-outline", "Official content outline and competencies.", ["official", "blueprint"]),
      res("aamc-mcat-study-plan", "AAMC Creating Your MCAT Study Plan", "Official", "https://students-residents.aamc.org/prepare-mcat-exam/creating-your-mcat-exam-study-plan", "Official study-plan guidance.", ["official", "planning"]),
      res("aamc-mcat-prep", "AAMC Prepare for the MCAT", "Official", "https://students-residents.aamc.org/prepare-mcat-exam/prepare-mcat-exam", "Official practice and prep hub.", ["official", "practice"]),
      res("jack-westin-cars", "Jack Westin CARS", "CARS", "https://jackwestin.com/mcat-question-of-the-day", "Useful daily CARS habit builder.", ["cars", "daily"]),
      res("khan-mcat", "Khan Academy MCAT", "Content", "https://www.khanacademy.org/test-prep/mcat", "Free content review aligned to MCAT prep.", ["free", "content"]),
    ],
    rhythm: [
      rhythm("Normal MCAT day", "Anki or warm-up, CARS, one main topic, questions, then next-day review of yesterday's misses.", ["Anki", "CARS", "topic block", "error log"]),
      rhythm("Sunday accessory day", "CARS, equations, pathways, mobility/rest, and weekly schedule reset.", ["CARS", "2 equations", "pathways", "reset"]),
    ],
  },
  premed: {
    label: "Pre-Med Operating System",
    shortLabel: "Pre-Med",
    sourceLabel: "Blueprint God file + AAMC competencies + AMCAS/AACOMAS guidance",
    sourceUrl: "https://students-residents.aamc.org/real-stories-demonstrating-premed-competencies/premed-competencies-entering-medical-students",
    structure: "Prerequisites, competencies, experience evidence, application cycle, school fit, and narrative vault.",
    passMeaning: "Pre-med items are requirements and evidence. A prerequisite is not a lecture pass; an experience is useful when hours and reflection are both captured.",
    doneMeaning: "Done means completed course/verified evidence/submitted artifact, with uncertainty labeled instead of invented.",
    installCopy: "Install Pre-Med operating system",
    areas: [
      area("premed-academic", "Academic map and prerequisites", "high", 1.2, "Degree audit, transcript, GPA trend, prerequisites, MCAT-relevant coursework.", [
        folder("Academic record", ["Transcript/DARS entered", "AP/IB/transfer noted", "Science GPA trend", "Repeated/withdrawn courses flagged"]),
        folder("Prerequisite map", ["Bio sequence", "Chem/organic/biochem", "Physics/math/stats", "Writing/psych/soc", "Target-school unknowns labeled"]),
      ]),
      area("premed-experiences", "Experiences and competencies", "high", 1.1, "Clinical exposure, service, research, shadowing, leadership, employment, and reflections.", [
        folder("Evidence vault", ["Clinical hours", "Non-clinical service", "Research/scholarly work", "Shadowing", "Leadership/teaching/employment"]),
        folder("Competency signal", ["Professional competency note", "Thinking/reasoning example", "Science competency evidence", "Meaningful story captured"]),
      ]),
      area("premed-application", "Application cycle and school fit", "medium", 1.0, "AMCAS/AACOMAS/TMDSAS, letters, personal statement, secondaries, interview prep.", [
        folder("Application build", ["Letters tracked", "Personal statement draft", "Activities descriptions", "School list fit logic"]),
        folder("Cycle execution", ["Primary application", "Secondaries", "Interviews", "Financial planning", "Waitlist/reapplication plan"]),
      ]),
      area("premed-mcat", "MCAT runway", "high", 1.0, "Diagnostic, section plan, daily CARS, content schedule, full-length review.", [
        folder("MCAT readiness", ["Diagnostic score", "Content map", "CARS routine", "Full-length schedule", "Error log"]),
      ]),
    ],
    resources: [
      res("aamc-competencies", "AAMC Premed Competencies", "Official", "https://students-residents.aamc.org/real-stories-demonstrating-premed-competencies/premed-competencies-entering-medical-students", "17 competencies for entering medical students.", ["official", "competencies"]),
      res("amcas-guide", "AAMC AMCAS Applicant Guide", "Official", "https://students-residents.aamc.org/applying-medical-school-amcas/publication/2027-amcas-applicant-guide", "Current AMCAS application process and policies.", ["official", "amcas"]),
      res("aacom-apply", "AACOMAS Apply to Medical School", "Official", "https://www.aacom.org/become-a-doctor/apply-to-medical-school", "DO application pathway.", ["official", "do"]),
      res("msar", "AAMC MSAR", "Official", "https://students-residents.aamc.org/medical-school-admission-requirements/medical-school-admission-requirements-msar-applicants", "School requirements and fit research.", ["official", "school-list"]),
    ],
    rhythm: [
      rhythm("Weekly pre-med audit", "One small audit: hours, GPA/prereqs, MCAT readiness, or application artifact.", ["hours", "grades", "MCAT", "artifact"]),
      rhythm("Evidence capture", "After meaningful experiences, log hours and reflection before the details fade.", ["what happened", "who verified", "why it matters"]),
    ],
  },
};

function area(id: string, title: string, y: YieldLevel, weight: number, summary: string, folders: PrepFolder[], tips?: string[]): PrepArea {
  return { id, title, yield: y, weight, summary, folders, tips };
}

function folder(title: string, leaves: string[]): PrepFolder {
  const base = slug(title);
  return {
    title,
    leaves: leaves.map((title, index) => ({
      id: `${base}-${index}`,
      title,
      why: "Final actionable item inside this blueprint folder.",
      action: "Toggle when you have evidence from questions, review, a verified requirement, or a submitted artifact.",
    })),
  };
}

function res(id: string, title: string, kind: string, url: string, why: string, tags: string[]): PrepResource {
  return { id, title, kind, url, why, tags };
}

function rhythm(title: string, body: string, chips: string[]) {
  return { title, body, chips };
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function defaultPrep(exam: BoardExamId): BoardPrepProfile {
  return {
    medYear: exam === "premed" || exam === "mcat" ? "Pre-Med" : exam === "step2" || exam === "shelf" ? "MS3" : "MS2",
    contentStarted: exam === "step1" || exam === "mcat" || exam === "shelf" ? "light" : "not-started",
    weeklyHours: exam === "step1" ? 18 : exam === "step2" ? 14 : exam === "mcat" ? 12 : 10,
    questionTarget: exam === "premed" ? 15 : exam === "shelf" ? 25 : exam === "step3" ? 30 : 40,
    resourcesDone: [],
    installedBlueprintAreas: [],
    completedBlueprintItems: [],
    otherResources: "",
    confidence: "medium",
    blueprintLogs: [],
    aiStrategy: "",
    updated: new Date().toISOString(),
  };
}

function allLeafIds(config: ExamConfig) {
  return config.areas.flatMap((area) => area.folders.flatMap((folder) => folder.leaves.map((leaf) => leafId(area.id, leaf.id))));
}

function leafId(areaId: string, id: string) {
  return `${areaId}/${id}`;
}

function areaLeafIds(area: PrepArea) {
  return area.folders.flatMap((folder) => folder.leaves.map((leaf) => leafId(area.id, leaf.id)));
}

function pct(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0;
}

function boardReadiness(logs: BoardBlueprintLog[], completion: number): number {
  const confidenceScore: Record<BoardBlueprintLog["confidence"], number> = { red: 18, orange: 45, green: 72, blue: 92 };
  const recent = logs.slice(0, 20);
  const confidence = recent.length ? recent.reduce((sum, log) => sum + confidenceScore[log.confidence], 0) / recent.length : 0;
  const withQuestions = recent.filter((log) => log.questions > 0);
  const accuracy = withQuestions.length
    ? withQuestions.reduce((sum, log) => sum + (log.correct / Math.max(1, log.questions)) * 100, 0) / withQuestions.length
    : 0;
  return Math.round(completion * 0.42 + confidence * 0.28 + accuracy * 0.3);
}

export function StepPage({ initialExam = "step1" }: { initialExam?: BoardExamId }) {
  const s = useStore();
  const [examId, setExamId] = useState<BoardExamId>(initialExam);
  const [openArea, setOpenArea] = useState<string>(EXAMS[initialExam].areas[0]?.id ?? "");
  const [flash, setFlash] = useState<string | null>(null);
  const [logArea, setLogArea] = useState(EXAMS[initialExam].areas[0]?.title ?? "");
  const [logMode, setLogMode] = useState<BoardBlueprintLog["mode"]>("Questions");
  const [logMinutes, setLogMinutes] = useState("45");
  const [logQuestions, setLogQuestions] = useState("20");
  const [logCorrect, setLogCorrect] = useState("0");
  const [logConfidence, setLogConfidence] = useState<BoardBlueprintLog["confidence"]>("orange");
  const [logNotes, setLogNotes] = useState("");

  const config = EXAMS[examId];
  const prep = s.boardPrep?.[examId] ?? defaultPrep(examId);
  const installed = new Set(prep.installedBlueprintAreas ?? []);
  const completed = new Set(prep.completedBlueprintItems ?? []);
  const resourceUrls = useMemo(() => new Set(s.resources.map((r) => normalizeResourceUrl(r.url))), [s.resources]);
  const installedAreaIds = config.areas.filter((area) => installed.has(area.id)).map((area) => area.id);
  const installedLeaves = config.areas.filter((area) => installed.has(area.id)).flatMap(areaLeafIds);
  const completion = pct(installedLeaves.filter((id) => completed.has(id)).length, installedLeaves.length || allLeafIds(config).length);
  const readiness = boardReadiness(prep.blueprintLogs, completion);
  const savedResources = config.resources.filter((r) => resourceUrls.has(normalizeResourceUrl(r.url))).length;

  useEffect(() => {
    const first = EXAMS[examId].areas[0];
    setOpenArea(first?.id ?? "");
    setLogArea(first?.title ?? EXAMS[examId].shortLabel);
  }, [examId]);

  function announce(msg: string) {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 4500);
  }

  function patchPrep(patch: Partial<BoardPrepProfile>) {
    s.updateBoardPrep(examId, patch);
  }

  function installBlueprint() {
    patchPrep({ installedBlueprintAreas: [...new Set([...prep.installedBlueprintAreas ?? [], ...config.areas.map((area) => area.id)])] });
    announce(`${config.shortLabel} blueprint installed as dedicated prep folders.`);
  }

  function toggleArea(area: PrepArea) {
    const next = new Set(prep.installedBlueprintAreas ?? []);
    const completedNext = new Set(prep.completedBlueprintItems ?? []);
    if (next.has(area.id)) {
      next.delete(area.id);
      for (const id of areaLeafIds(area)) completedNext.delete(id);
    } else {
      next.add(area.id);
      setOpenArea(area.id);
    }
    patchPrep({ installedBlueprintAreas: [...next], completedBlueprintItems: [...completedNext] });
  }

  function toggleLeaf(id: string) {
    const next = new Set(prep.completedBlueprintItems ?? []);
    next.has(id) ? next.delete(id) : next.add(id);
    patchPrep({ completedBlueprintItems: [...next] });
  }

  function saveAllResources() {
    const next = config.resources
      .filter((r) => !resourceUrls.has(normalizeResourceUrl(r.url)))
      .map((r) => ({ title: r.title, url: r.url, category: config.shortLabel, tags: r.tags, note: r.why, favorite: r.kind === "Official" || r.kind === "Assessment" }));
    if (next.length) s.bulkAddResources(next);
    announce(next.length ? `Saved ${next.length} resource${next.length === 1 ? "" : "s"} to Resources.` : "All blueprint resources are already saved.");
  }

  function saveResource(resource: PrepResource) {
    if (resourceUrls.has(normalizeResourceUrl(resource.url))) return;
    s.addResource({ title: resource.title, url: resource.url, category: config.shortLabel, tags: resource.tags, note: resource.why, favorite: resource.kind === "Official" || resource.kind === "Assessment" });
    announce(`Saved ${resource.title} to Resources.`);
  }

  function addBlueprintLog() {
    const questions = Math.max(0, Number(logQuestions) || 0);
    s.addBoardBlueprintLog(examId, {
      date: dayKey(),
      dimension: examId === "shelf" ? "discipline" : examId === "premed" ? "competency" : "system",
      area: logArea || config.shortLabel,
      mode: logMode,
      minutes: Math.max(0, Number(logMinutes) || 0),
      questions,
      correct: Math.max(0, Math.min(Number(logCorrect) || 0, questions)),
      confidence: logConfidence,
      notes: logNotes.trim() || undefined,
    });
    setLogNotes("");
    announce(`Logged ${config.shortLabel} work for ${logArea}.`);
  }

  return (
    <>
      <GlassCard pad className="step-command prep-command-center" data-tour="step">
        <div className="prep-hero">
          <div className="prep-hero-copy">
            <div className="step-tabs">
              {(Object.keys(EXAMS) as BoardExamId[]).map((id) => (
                <button key={id} className={`filter-pill ${examId === id ? "on" : ""}`} onClick={() => setExamId(id)}>{EXAMS[id].shortLabel}</button>
              ))}
            </div>
            <div className="step-title">{config.label}</div>
            <div className="sub">{config.structure}</div>
            <div className="prep-source-line">
              <ShieldCheck size={14} /> Built from {config.sourceLabel}. Yield is guidance, not permission to ignore anything.
            </div>
          </div>
          <div className="prep-readiness">
            <div className="ring" style={{ width: 104, height: 104 }}>
              <svg width="104" height="104" viewBox="0 0 104 104">
                <circle cx="52" cy="52" r="43" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                <circle cx="52" cy="52" r="43" fill="none" stroke="var(--cyan)" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 43} strokeDashoffset={2 * Math.PI * 43 * (1 - readiness / 100)}
                  transform="rotate(-90 52 52)" />
              </svg>
              <div className="ring-label">{readiness}%</div>
            </div>
            <span>{installedAreaIds.length}/{config.areas.length} areas installed</span>
          </div>
        </div>
        <div className="step-actions">
          <GButton variant="primary" onClick={installBlueprint}><ListChecks size={14} /> {config.installCopy}</GButton>
          <GButton onClick={saveAllResources}><Database size={14} /> Save resources ({savedResources}/{config.resources.length})</GButton>
          <a className="gbtn" href={config.sourceUrl} target="_blank" rel="noreferrer noopener">Official source <ExternalLink size={14} /></a>
        </div>
        {flash && <div className="step-flash"><CheckCircle2 size={15} /> <span>{flash}</span></div>}
      </GlassCard>

      <div className="prep-progress-explainer">
        <div className="ppe-item">
          <span className="ppe-dot" style={{ background: "var(--cyan)" }} />
          <div><b>What progress means</b><span>{config.passMeaning}</span></div>
        </div>
        <div className="ppe-item">
          <span className="ppe-dot" style={{ background: "var(--green)" }} />
          <div><b>When it is done</b><span>{config.doneMeaning}</span></div>
        </div>
      </div>

      {examId === "premed" && <PremedExperiencePanel />}

      <div className="step-overview-grid blueprint-main-grid">
        <GlassCard pad>
          <PanelHeader title="Blueprint Library" sub="Install areas, open folders, then complete final items with evidence." />
          <div className="blueprint-tree-grid">
            {config.areas.map((area) => {
              const ids = areaLeafIds(area);
              const areaPct = pct(ids.filter((id) => completed.has(id)).length, ids.length);
              const isInstalled = installed.has(area.id);
              const isOpen = openArea === area.id;
              return (
                <div key={area.id} className={`prep-area ${isInstalled ? "installed" : ""} ${isOpen ? "open" : ""}`}>
                  <button type="button" className="prep-area-head" onClick={() => setOpenArea(isOpen ? "" : area.id)}>
                    <span className="prep-area-icon"><Brain size={17} /></span>
                    <span className="grow">
                      <span className="prep-area-title">{area.title}</span>
                      <span className="prep-area-summary">{area.summary}</span>
                    </span>
                    <Tag tone={yieldTone[area.yield]}>{area.yield} yield</Tag>
                    <span className="prep-area-score">{areaPct}%</span>
                    <ChevronDown size={15} />
                  </button>
                  <div className="track prep-area-track"><div className="track-fill" style={{ width: `${areaPct}%` }} /></div>
                  {isOpen && (
                    <div className="prep-area-body">
                      <div className="row wrap gap8">
                        <GButton size="sm" variant={isInstalled ? "default" : "primary"} onClick={() => toggleArea(area)}>
                          {isInstalled ? <CheckCircle2 size={14} /> : <Plus size={14} />} {isInstalled ? "Subscribed" : "Subscribe area"}
                        </GButton>
                        <Tag tone="neutral">weight {area.weight.toFixed(1)}x</Tag>
                      </div>
                      {area.folders.map((folder) => (
                        <details className="prep-folder" key={folder.title} open={isInstalled}>
                          <summary><BookOpen size={15} /><b>{folder.title}</b><ChevronDown size={14} /></summary>
                          <div className="prep-leaf-grid">
                            {folder.leaves.map((leaf) => {
                              const id = leafId(area.id, leaf.id);
                              const done = completed.has(id);
                              return (
                                <button key={id} type="button" className={`prep-leaf ${done ? "done" : ""}`} onClick={() => toggleLeaf(id)} disabled={!isInstalled}>
                                  <span>{done ? <CheckCircle2 size={14} /> : <CircleDot />}</span>
                                  <b>{leaf.title}</b>
                                  <small>{leaf.action}</small>
                                </button>
                              );
                            })}
                          </div>
                        </details>
                      ))}
                      {area.tips?.length ? (
                        <div className="prep-tip-list">
                          {area.tips.map((tip) => <span key={tip}><Sparkles size={13} /> {tip}</span>)}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>

        <div className="stack gap16">
          <GlassCard pad>
            <PanelHeader title={`${config.shortLabel} resources`} sub={`${savedResources}/${config.resources.length} saved to Resources`}
              action={<GButton size="sm" onClick={saveAllResources}><Plus size={14} /> Add all</GButton>} />
            <div className="prep-resource-list">
              {config.resources.map((resource) => {
                const saved = resourceUrls.has(normalizeResourceUrl(resource.url));
                return (
                  <div className={`prep-resource-row ${saved ? "saved" : ""}`} key={resource.id}>
                    <span className="prep-resource-mark">{saved ? <CheckCircle2 size={16} /> : <Database size={16} />}</span>
                    <div className="grow">
                      <b>{resource.title}</b>
                      <span><Tag tone="neutral">{resource.kind}</Tag> {resource.why}</span>
                    </div>
                    <a className="gbtn sm" href={resource.url} target="_blank" rel="noreferrer noopener">Open <ExternalLink size={13} /></a>
                    {saved ? <Tag tone="green">In library</Tag> : <GButton size="sm" onClick={() => saveResource(resource)}>Add</GButton>}
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard pad className="step-schedule-card">
            <PanelHeader title="Suggested rhythm" sub="A starter operating cadence you can adapt." />
            <div className="prep-rhythm-list">
              {config.rhythm.map((item) => (
                <div className="prep-rhythm" key={item.title}>
                  <CalendarDays size={15} />
                  <div>
                    <b>{item.title}</b>
                    <span>{item.body}</span>
                    <div>{item.chips.map((chip) => <Tag key={chip} tone="cyan">{chip}</Tag>)}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      <div className="step-overview-grid">
        <GlassCard pad className="step-log-card">
          <PanelHeader title={`${config.shortLabel} work log`} sub="Board/prep logging stays separate from lecture, DLA, and PQ course tracking." />
          <div className="step-form-grid board-log-form">
            <label className="stack gap6">
              <span className="field-label">Area</span>
              <select className="field" value={logArea} onChange={(e) => setLogArea(e.target.value)}>
                {config.areas.map((area) => <option key={area.id}>{area.title}</option>)}
              </select>
            </label>
            <label className="stack gap6">
              <span className="field-label">Mode</span>
              <select className="field" value={logMode} onChange={(e) => setLogMode(e.target.value as BoardBlueprintLog["mode"])}>
                {["Questions", "Assessment", "Missed facts", "First pass", "Review"].map((mode) => <option key={mode}>{mode}</option>)}
              </select>
            </label>
            <Field label="Minutes" type="number" min="0" value={logMinutes} onChange={(e) => setLogMinutes(e.target.value)} />
            <Field label="Questions" type="number" min="0" value={logQuestions} onChange={(e) => setLogQuestions(e.target.value)} />
            <Field label="Correct" type="number" min="0" value={logCorrect} onChange={(e) => setLogCorrect(e.target.value)} />
            <label className="stack gap6">
              <span className="field-label">Confidence</span>
              <select className="field" value={logConfidence} onChange={(e) => setLogConfidence(e.target.value as BoardBlueprintLog["confidence"])}>
                <option value="red">Red</option>
                <option value="orange">Orange</option>
                <option value="green">Green</option>
                <option value="blue">Blue</option>
              </select>
            </label>
          </div>
          <div className="board-log-note-row">
            <input className="field" value={logNotes} onChange={(e) => setLogNotes(e.target.value)} placeholder="Missed themes, next repair, resource used..." />
            <GButton variant="primary" onClick={addBlueprintLog}><Plus size={14} /> Log work</GButton>
          </div>
          <div className="board-quick-row">
            <button onClick={() => { setLogMode("Questions"); setLogMinutes("60"); setLogQuestions("40"); }}>40Q block</button>
            <button onClick={() => { setLogMode("Missed facts"); setLogMinutes("25"); setLogQuestions("0"); }}>Missed-fact repair</button>
            <button onClick={() => { setLogMode("Assessment"); setLogMinutes("240"); setLogQuestions("0"); }}>Assessment review</button>
          </div>
        </GlassCard>

        <GlassCard pad>
          <PanelHeader title="Recent evidence" sub={`${prep.blueprintLogs.length} board/prep log${prep.blueprintLogs.length === 1 ? "" : "s"}`} />
          {prep.blueprintLogs.length ? (
            <div className="board-log-list">
              {prep.blueprintLogs.slice(0, 8).map((log) => (
                <div className="board-log-row" key={log.id}>
                  <span className="board-log-dot" style={{ color: confidenceColor(log.confidence), background: confidenceColor(log.confidence) }} />
                  <div className="grow">
                    <b>{log.area}</b>
                    <span>{log.date} - {log.mode} - {log.minutes}m{log.questions ? ` - ${log.correct}/${log.questions}` : ""}</span>
                    {log.notes && <small>{log.notes}</small>}
                  </div>
                  <button className="ghost-btn danger" onClick={() => s.removeBoardBlueprintLog(examId, log.id)}>Remove</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No board/prep logs yet. Install a blueprint, do one small block, then log the evidence.</div>
          )}
        </GlassCard>
      </div>

      <GlassCard pad>
        <PanelHeader title="Why this is not the Course Tracker" sub="Course Tracker stays for lectures, DLAs, PQs, and term work. Blueprint Prep tracks exam readiness and application evidence." />
        <div className="evidence-grid prep-evidence-grid">
          <a className="evidence-card" href={config.sourceUrl} target="_blank" rel="noreferrer noopener">
            <span><FlaskConical size={15} /></span>
            <div><b>Source anchored</b><small>Official exam outlines and your local Blueprint God file define the folder structure.</small><em>{config.sourceLabel}</em></div>
          </a>
          <div className="evidence-card">
            <span><Target size={15} /></span>
            <div><b>Completion is evidence</b><small>Toggle final items only when you have practice, verification, retest, or application evidence.</small><em>No fake lecture passes</em></div>
          </div>
          <div className="evidence-card">
            <span><Layers size={15} /></span>
            <div><b>Modular by design</b><small>Subscribe to only the exam or pathway you need; hidden tracks stay available from customization.</small><em>Calmer mobile experience</em></div>
          </div>
        </div>
      </GlassCard>
    </>
  );
}

function CircleDot() {
  return <span className="circle-dot" aria-hidden="true" />;
}

function confidenceColor(confidence: BoardBlueprintLog["confidence"]) {
  if (confidence === "blue") return "var(--grade-blue)";
  if (confidence === "green") return "var(--green)";
  if (confidence === "orange") return "var(--orange)";
  return "var(--red)";
}

function PremedExperiencePanel() {
  const s = useStore();
  const [kind, setKind] = useState<PremedExperienceKind>("Clinical");
  const [date, setDate] = useState(dayKey());
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [contact, setContact] = useState("");
  const [hours, setHours] = useState("2");
  const [verified, setVerified] = useState(false);
  const [reflection, setReflection] = useState("");
  const entries = s.premedExperiences ?? [];
  const totals = PREMED_KINDS.map((k) => ({
    kind: k,
    hours: entries.filter((entry) => entry.kind === k).reduce((sum, entry) => sum + entry.hours, 0),
    verified: entries.filter((entry) => entry.kind === k && entry.verified).reduce((sum, entry) => sum + entry.hours, 0),
  }));
  const totalHours = totals.reduce((sum, item) => sum + item.hours, 0);
  const verifiedHours = totals.reduce((sum, item) => sum + item.verified, 0);
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const max = Math.max(1, ...totals.map((item) => item.hours));

  function save() {
    const amount = Math.max(0, Number(hours) || 0);
    if (!title.trim() || !organization.trim() || amount <= 0) return;
    s.addPremedExperience({
      date,
      kind,
      title: title.trim(),
      organization: organization.trim(),
      contact: contact.trim() || undefined,
      hours: amount,
      verified,
      reflection: reflection.trim(),
    });
    setTitle("");
    setOrganization("");
    setContact("");
    setHours("2");
    setVerified(false);
    setReflection("");
  }

  return (
    <GlassCard pad className="premed-hours-card">
      <PanelHeader title="Pre-Med Experience Log" sub="Clinical exposure, service, research, shadowing, leadership, and verification evidence"
        action={<Tag tone={verifiedHours >= 50 ? "green" : verifiedHours > 0 ? "cyan" : "neutral"}>{verifiedHours} verified hours</Tag>} />
      <div className="premed-hours-layout">
        <div className="premed-hours-form">
          <div className="step-form-grid">
            <SelectField label="Category" value={kind} onChange={(e) => setKind(e.target.value as PremedExperienceKind)}>
              {PREMED_KINDS.map((k) => <option key={k}>{k}</option>)}
            </SelectField>
            <Field label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Field label="Hours" type="number" min="0" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
          <Field label="What did you do?" placeholder="e.g. Shadowed cardiology clinic" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="step-form-grid">
            <Field label="Organization / physician / service" value={organization} onChange={(e) => setOrganization(e.target.value)} />
            <Field label="Verification contact" placeholder="email, supervisor, club officer" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <TextAreaField label="Reflection / evidence" placeholder="What mattered? What did you learn? What proof exists?" value={reflection} onChange={(e) => setReflection(e.target.value)} />
          <div className="premed-log-actions">
            <label className="promise-check compact">
              <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
              <span>Verified or verification path exists</span>
            </label>
            <GButton variant="primary" onClick={save}>Log experience</GButton>
          </div>
        </div>
        <div className="premed-hours-dashboard">
          <div className="premed-hours-total">
            <b>{totalHours}</b>
            <span>total hours logged</span>
          </div>
          <div className="premed-hour-bars">
            {totals.map((item) => (
              <div className="premed-hour-bar" key={item.kind}>
                <div className="spread"><span>{item.kind}</span><b>{item.hours}h</b></div>
                <div className="track">
                  <div className="track-fill" style={{ width: `${Math.round((item.hours / max) * 100)}%`, background: item.verified ? "var(--green)" : "var(--cyan)" }} />
                </div>
                <small>{item.verified}h verified</small>
              </div>
            ))}
          </div>
          <div className="premed-trend-note">
            {entries.length
              ? `${recent[0].kind} was your latest signal. Keep reflections specific enough to become application material later.`
              : "Start with one honest entry. Verified hours are useful; reflective detail is what makes them usable."}
          </div>
        </div>
      </div>
      {recent.length > 0 && (
        <div className="premed-recent-list">
          {recent.map((entry) => (
            <div className="premed-recent-row" key={entry.id}>
              <Tag tone={entry.verified ? "green" : "neutral"}>{entry.kind}</Tag>
              <div className="grow">
                <b>{entry.title}</b>
                <span>{entry.date} - {entry.organization} - {entry.hours}h{entry.verified ? " - verified" : ""}</span>
              </div>
              <button className="ghost-btn danger" onClick={() => s.removePremedExperience(entry.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
