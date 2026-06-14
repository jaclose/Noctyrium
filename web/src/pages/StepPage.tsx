import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity, BarChart3, BookOpen, Brain, CalendarClock, CheckCircle2, ClipboardCheck,
  Clock, Database, ExternalLink, FlaskConical, Gauge, ListChecks,
  Sparkles, Trash2, WandSparkles,
} from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag } from "../components/ui/primitives";
import { gradeColor, isoDate, lastNDays, prettyDate, todayGrade } from "../lib/scoring";
import { runAi } from "../services/aiClient";
import type {
  BoardBlueprintDimension, BoardBlueprintLog, BoardBlueprintMode, BoardConfidence,
  BoardExamId, BoardPrepProfile,
} from "../lib/types";

interface BlueprintArea {
  name: string;
  range: string;
  focus: string;
  tags: string[];
}

interface ExamConfig {
  label: string;
  shortLabel: string;
  prefix: string;
  structure: string;
  officialOutline: string;
  practiceMaterials: string;
  sourceNote: string;
  areas: BlueprintArea[];
  competencies: BlueprintArea[];
  disciplines: BlueprintArea[];
}

interface PrepResource {
  id: string;
  title: string;
  kind: string;
  url: string;
  why: string;
  tags: string[];
}

type PlanPhase = "Foundation" | "Retrieval" | "Questions" | "Assessment" | "Final Review";

const CONFIDENCE: Record<BoardConfidence, { label: string; color: string; tone: "red" | "orange" | "green" | "cyan" }> = {
  red: { label: "Red", color: "var(--red)", tone: "red" },
  orange: { label: "Orange", color: "var(--orange)", tone: "orange" },
  green: { label: "Green", color: "var(--green)", tone: "green" },
  blue: { label: "Blue", color: "var(--cyan)", tone: "cyan" },
};

const STEP1_COMPETENCIES: BlueprintArea[] = [
  { name: "Foundational Science Concepts", range: "60-70%", focus: "apply basic science mechanisms to normal and abnormal processes", tags: ["foundational", "mechanism", "basic science"] },
  { name: "Patient Care: Diagnosis", range: "20-25%", focus: "interpret findings, identify diagnoses, and connect pathology to presentation", tags: ["diagnosis", "vignette", "patient care"] },
  { name: "Communication & Interpersonal Skills", range: "6-9%", focus: "communication, ethics-adjacent interpersonal skills, and professionalism", tags: ["communication", "interpersonal"] },
  { name: "Practice-based Learning & Improvement", range: "4-6%", focus: "study interpretation, performance improvement, and evidence use", tags: ["practice based", "improvement", "evidence"] },
];

const STEP1_DISCIPLINES: BlueprintArea[] = [
  { name: "Pathology", range: "45-55%", focus: "disease mechanisms, morphologic changes, complications, and pathophysiology", tags: ["pathology", "path"] },
  { name: "Physiology", range: "30-40%", focus: "normal function, compensation, organ-system mechanisms, and integration", tags: ["physiology", "mechanism"] },
  { name: "Nutrition", range: "15-20%", focus: "nutrition principles, deficiency/excess states, and disease-linked nutrition", tags: ["nutrition", "diet"] },
  { name: "Gross Anatomy & Embryology", range: "10-20%", focus: "gross anatomy, embryologic development, congenital disease, and spatial relationships", tags: ["anatomy", "embryology"] },
  { name: "Microbiology", range: "10-20%", focus: "organisms, host response, antimicrobials, and infectious disease patterns", tags: ["micro", "microbiology", "infection"] },
  { name: "Pharmacology", range: "10-20%", focus: "mechanisms, adverse effects, pharmacotherapy principles, and toxicology", tags: ["pharm", "pharmacology"] },
  { name: "Behavioral Sciences", range: "10-15%", focus: "behavior, psychology, substance use, communication, and social factors", tags: ["behavior", "psych"] },
  { name: "Biochemistry", range: "5-15%", focus: "metabolism, molecular biology, genetics links, and disease mechanisms", tags: ["biochem", "metabolism"] },
  { name: "Histology & Cell Biology", range: "5-15%", focus: "cell structure, tissue organization, microscopy, and cellular response", tags: ["histology", "cell"] },
  { name: "Immunology", range: "5-15%", focus: "immune mechanisms, hypersensitivity, immunodeficiency, and inflammation", tags: ["immunology", "immune"] },
  { name: "Genetics", range: "5-10%", focus: "inheritance, molecular genetics, population genetics, and genetic disease", tags: ["genetics", "inheritance"] },
];

const EXAMS: Record<BoardExamId, ExamConfig> = {
  step1: {
    label: "STEP 1",
    shortLabel: "Step 1",
    prefix: "STEP 1",
    structure: "Blueprint logging: systems + physician tasks + disciplines, not lecture/PQ/Anki rows.",
    officialOutline: "https://www.usmle.org/exam-resources/step-1-materials/step-1-content-outline-and-specifications",
    practiceMaterials: "https://www.usmle.org/exam-resources/step-1-materials/step-1-sample-test-questions",
    sourceNote: "Based on the official USMLE Step 1 specifications: integrated content outline, physician tasks/competencies, and discipline ranges.",
    areas: [
      { name: "Human Development", range: "1-3%", focus: "age-related findings and care of the well patient", tags: ["development", "aging", "peds"] },
      { name: "Blood & Lymphoreticular/Immune Systems", range: "9-13%", focus: "hematology, oncology, immune mechanisms, transfusion, inflammation", tags: ["blood", "heme", "immuno", "onc"] },
      { name: "Behavioral Health & Nervous Systems/Special Senses", range: "10-14%", focus: "neuro, psych, special senses, behavior, sleep, substances", tags: ["neuro", "psych", "behavior", "senses"] },
      { name: "Musculoskeletal, Skin & Subcutaneous Tissue", range: "8-12%", focus: "MSK, rheum, derm, connective tissue, trauma", tags: ["msk", "skin", "derm", "rheum"] },
      { name: "Cardiovascular System", range: "7-11%", focus: "heart, vessels, hemodynamics, cardio pharm/path", tags: ["cardio", "heart", "vascular"] },
      { name: "Respiratory & Renal/Urinary Systems", range: "11-15%", focus: "pulm, acid-base, kidney, urinary, fluids, electrolytes", tags: ["resp", "pulm", "renal", "urinary"] },
      { name: "Gastrointestinal System", range: "6-10%", focus: "GI anatomy, liver, pancreas, nutrition links, metabolism", tags: ["gi", "gastro", "liver", "pancreas"] },
      { name: "Reproductive & Endocrine Systems", range: "12-16%", focus: "repro, endocrine, diabetes, pregnancy basics, hormones", tags: ["repro", "endocrine", "obgyn", "hormone"] },
      { name: "Multisystem Processes & Disorders", range: "8-12%", focus: "infection, pathology patterns, pharmacotherapy, shock, sepsis", tags: ["multisystem", "path", "pharm", "micro"] },
      { name: "Biostatistics & Epidemiology/Population Health", range: "4-6%", focus: "biostats, epidemiology, study interpretation, population health", tags: ["biostats", "epi", "population"] },
      { name: "Social Sciences: Communication & Interpersonal Skills", range: "6-9%", focus: "communication, ethics, interpersonal skills, professionalism", tags: ["ethics", "communication", "professionalism"] },
    ],
    competencies: STEP1_COMPETENCIES,
    disciplines: STEP1_DISCIPLINES,
  },
  step2: {
    label: "STEP 2 CK",
    shortLabel: "Step 2",
    prefix: "STEP 2 CK",
    structure: "Clinical blueprint logging: clinical systems, tasks, questions, and assessment repair.",
    officialOutline: "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-content-outline-specifications",
    practiceMaterials: "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-sample-test-questions",
    sourceNote: "Step 2 uses the USMLE clinical content outline and clinical task orientation.",
    areas: [
      { name: "Nutrition", range: "15-20%", focus: "evidence-based nutrition, prevention, counseling, disease nutrition", tags: ["nutrition", "diet", "prevention"] },
      { name: "Legal/Ethical & Patient Safety", range: "10-15%", focus: "ethics, professionalism, systems-based practice, safety", tags: ["ethics", "safety", "professionalism", "systems"] },
      { name: "Renal/Urinary & Reproductive", range: "7-13%", focus: "renal, urinary, male/female reproductive care", tags: ["renal", "urinary", "repro", "obgyn"] },
      { name: "Cardiovascular", range: "6-12%", focus: "diagnosis, management, prevention, acute and chronic cardiac care", tags: ["cardio", "heart", "vascular"] },
      { name: "MSK/Skin", range: "6-12%", focus: "orthopedics, rheum, derm, trauma, outpatient management", tags: ["msk", "skin", "derm", "rheum"] },
      { name: "Behavioral Health", range: "5-10%", focus: "psychiatry, substance use, counseling, risk, safety", tags: ["psych", "behavior", "substance"] },
      { name: "Blood & Immune", range: "5-10%", focus: "heme/onc, immune disease, infections, therapies", tags: ["heme", "immune", "onc", "infection"] },
      { name: "Gastrointestinal", range: "5-10%", focus: "GI diagnosis, liver disease, acute abdomen, management", tags: ["gi", "gastro", "liver"] },
      { name: "Nervous & Special Senses", range: "5-10%", focus: "neurology, ophthalmology, ENT, imaging and diagnostics", tags: ["neuro", "senses", "ophtho", "ent"] },
      { name: "Respiratory", range: "5-10%", focus: "pulmonary diagnosis, oxygenation, infections, chronic disease", tags: ["resp", "pulm", "oxygen"] },
      { name: "Multisystem Processes", range: "4-8%", focus: "sepsis, shock, trauma, perioperative care, undifferentiated illness", tags: ["multisystem", "shock", "sepsis", "trauma"] },
      { name: "Endocrine", range: "3-7%", focus: "diabetes, thyroid, adrenal, endocrine management", tags: ["endocrine", "diabetes", "thyroid"] },
      { name: "Pregnancy & Puerperium", range: "3-7%", focus: "pregnancy, labor, postpartum care, obstetric emergencies", tags: ["pregnancy", "obgyn", "postpartum"] },
      { name: "Biostats/Epi/Literature", range: "3-5%", focus: "statistics, epidemiology, abstracts, medical literature", tags: ["biostats", "epi", "abstract", "literature"] },
      { name: "Human Development", range: "2-4%", focus: "age-related care, screening, prevention across lifespan", tags: ["development", "aging", "screening"] },
    ],
    competencies: [
      { name: "Diagnosis", range: "high", focus: "recognize illness scripts, select next tests, and interpret results", tags: ["diagnosis", "test"] },
      { name: "Management", range: "high", focus: "choose next best treatment, prevention, and disposition", tags: ["management", "treatment"] },
      { name: "Health Maintenance", range: "medium", focus: "screening, vaccination, risk reduction, and counseling", tags: ["screening", "prevention"] },
      { name: "Patient Safety", range: "medium", focus: "systems, handoffs, errors, ethics, and quality improvement", tags: ["safety", "quality"] },
    ],
    disciplines: [
      { name: "Internal Medicine", range: "high", focus: "adult inpatient/outpatient medicine and integrated clinical reasoning", tags: ["medicine", "adult"] },
      { name: "Surgery", range: "medium", focus: "acute abdomen, trauma, perioperative, and procedural decision-making", tags: ["surgery", "trauma"] },
      { name: "Pediatrics", range: "medium", focus: "age-based disease, prevention, development, and emergencies", tags: ["peds", "children"] },
      { name: "OB/GYN", range: "medium", focus: "pregnancy, reproduction, gynecologic care, and emergencies", tags: ["obgyn", "pregnancy"] },
      { name: "Psychiatry", range: "medium", focus: "diagnosis, risk, therapy, pharmacology, and safety", tags: ["psych", "risk"] },
    ],
  },
};

const RESOURCE_CATALOG: Record<BoardExamId, PrepResource[]> = {
  step1: [
    { id: "usmle-outline", title: "USMLE Step 1 Content Outline", kind: "Official", url: EXAMS.step1.officialOutline, why: "Blueprint anchor for systems, competencies, and discipline weighting.", tags: ["official", "blueprint"] },
    { id: "usmle-samples", title: "USMLE Step 1 Sample Questions", kind: "Official", url: EXAMS.step1.practiceMaterials, why: "Format calibration and official item style.", tags: ["official", "practice"] },
    { id: "nbme-cbssa", title: "NBME CBSSA", kind: "Assessment", url: "https://www.nbme.org/examinees/self-assessments/comprehensive-basic-science-self-assessment", why: "Readiness checks for Step 1 using NBME self-assessment reporting.", tags: ["nbme", "assessment"] },
    { id: "qbank", title: "Question bank block review", kind: "Qbank", url: "https://www.amboss.com/us", why: "Daily retrieval practice, mixed blocks, and explanation review.", tags: ["qbank", "questions"] },
    { id: "anking", title: "AnKing Step Deck / AnkiHub", kind: "Anki", url: "https://www.ankihub.net/step-deck", why: "Spaced retrieval layer for missed facts and durable retention.", tags: ["anki", "spaced"] },
    { id: "mehlman", title: "Mehlman Medical HY PDFs", kind: "Review", url: "https://mehlmanmedical.com/free-stuff/", why: "Targeted high-yield review after questions reveal weak areas.", tags: ["hy", "review"] },
  ],
  step2: [
    { id: "usmle-outline", title: "USMLE Step 2 CK Content Outline", kind: "Official", url: EXAMS.step2.officialOutline, why: "Blueprint anchor for clinical content and physician tasks.", tags: ["official", "blueprint"] },
    { id: "usmle-samples", title: "USMLE Step 2 CK Sample Questions", kind: "Official", url: EXAMS.step2.practiceMaterials, why: "Official item style and software familiarity.", tags: ["official", "practice"] },
    { id: "nbme-ccssa", title: "NBME CCSSA", kind: "Assessment", url: "https://www.nbme.org/examinees/self-assessments/comprehensive-clinical-science-self-assessment", why: "Readiness checks for Step 2 CK using NBME self-assessment reporting.", tags: ["nbme", "assessment"] },
    { id: "qbank", title: "Mixed clinical qbank blocks", kind: "Qbank", url: "https://www.amboss.com/us", why: "Interleaved diagnosis and management practice.", tags: ["qbank", "questions"] },
    { id: "anki", title: "Clinical Anki maintenance", kind: "Anki", url: "https://www.ankihub.net/step-deck", why: "Retain missed algorithms, tables, and management thresholds.", tags: ["anki", "spaced"] },
  ],
};

const EVIDENCE = [
  {
    title: "Official blueprint",
    body: "Track Step 1 against systems, physician tasks, and disciplines. The outline is a test-construction map, not a lecture checklist.",
    source: "USMLE Step 1 specifications",
    url: EXAMS.step1.officialOutline,
  },
  {
    title: "Practice testing",
    body: "Questions become learning events: explanation review, error log, then a retest.",
    source: "Dunlosky et al., 2013",
    url: "https://pubmed.ncbi.nlm.nih.gov/26173288/",
  },
  {
    title: "Distributed practice",
    body: "Space review across days and weeks. Noctyrium converts red/orange areas into repeat exposure.",
    source: "Dunlosky et al., 2013",
    url: "https://pubmed.ncbi.nlm.nih.gov/26173288/",
  },
  {
    title: "Self-assessment checkpoints",
    body: "Use NBME-style self-assessments as calibration points, then repair weak systems.",
    source: "NBME CBSSA",
    url: "https://www.nbme.org/examinees/self-assessments/comprehensive-basic-science-self-assessment",
  },
];

export function StepPage() {
  const s = useStore();
  const [examId, setExamId] = useState<BoardExamId>("step1");
  const [dimension, setDimension] = useState<BoardBlueprintDimension>("system");
  const [flash, setFlash] = useState<{ msg: string; href: string } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiStatus, setAiStatus] = useState("AI uses the existing mock/provider endpoint when available, with local rules as fallback.");
  const exam = EXAMS[examId];
  const prep = s.boardPrep?.[examId] ?? defaultPrep(examId);
  const resources = RESOURCE_CATALOG[examId];
  const dimensionAreas = areasForDimension(exam, dimension);
  const [draft, setDraft] = useState({
    area: dimensionAreas[0]?.name ?? "",
    mode: "Questions" as BoardBlueprintMode,
    minutes: "60",
    questions: "40",
    correct: "26",
    confidence: "orange" as BoardConfidence,
    notes: "",
  });

  const logs = prep.blueprintLogs ?? [];
  const stats = useMemo(() => summarizeBlueprint(exam, logs), [exam, logs]);
  const dimensionRows = useMemo(() => summarizeDimension(exam, logs, dimension), [exam, logs, dimension]);
  const suggestions = buildBoardSuggestions(exam, prep, stats);
  const schedule = buildPrepSchedule(exam, prep, stats.weakAreas);
  const weekLog = summarizeRecentBoardLog(s.logs, exam.prefix);
  const resourcePct = Math.round((prep.resourcesDone.length / Math.max(resources.length, 1)) * 100);
  const officialInstalled = resources.every((res) => s.resources.some((r) => r.url === res.url));
  const nbmeAssessmentUrl = examId === "step1"
    ? "https://www.nbme.org/examinees/self-assessments/comprehensive-basic-science-self-assessment"
    : "https://www.nbme.org/examinees/self-assessments/comprehensive-clinical-science-self-assessment";

  useEffect(() => {
    const areas = areasForDimension(exam, dimension);
    if (!areas.some((area) => area.name === draft.area)) {
      setDraft((current) => ({ ...current, area: areas[0]?.name ?? "" }));
    }
  }, [dimension, draft.area, exam]);

  function announce(msg: string, href: string) {
    setFlash({ msg, href });
    window.setTimeout(() => setFlash(null), 6000);
  }

  function patchPrep(patch: Partial<BoardPrepProfile>) {
    s.updateBoardPrep(examId, patch);
  }

  function toggleResource(id: string) {
    const next = prep.resourcesDone.includes(id)
      ? prep.resourcesDone.filter((x) => x !== id)
      : [...prep.resourcesDone, id];
    patchPrep({ resourcesDone: next });
  }

  function installResourceSpine() {
    const existing = new Set(s.resources.map((r) => r.url));
    const next = resources
      .filter((res) => !existing.has(res.url))
      .map((res) => ({
        title: res.title,
        url: res.url,
        category: exam.label,
        tags: res.tags,
        note: res.why,
        favorite: res.kind === "Official" || res.kind === "Assessment",
      }));
    if (next.length) s.bulkAddResources(next);
    announce(
      next.length ? `Activated ${next.length} resources. Find them on Resources.` : "These resources are already on your Resources page.",
      "#resources",
    );
  }

  function createWeekTasks() {
    const due = isoDate(schedule.weeks[0]?.start ?? new Date());
    const week = schedule.weeks[0];
    if (!week) return;
    s.addTask(`${exam.shortLabel}: ${week.phase} - ${week.area.name}`, due, exam.label);
    s.addTask(`${exam.shortLabel}: ${prep.questionTarget} reviewed questions`, due, `${exam.label}/Blueprint`);
    s.addTask(`${exam.shortLabel}: update weak-area log`, due, `${exam.label}/AI`);
    announce("Created 3 board-prep tasks for this week.", "#tasks");
  }

  function addBlueprintLog(override?: Partial<typeof draft>) {
    const next = { ...draft, ...override };
    const minutes = Math.max(0, Number(next.minutes) || 0);
    const questions = Math.max(0, Number(next.questions) || 0);
    const correct = Math.min(questions, Math.max(0, Number(next.correct) || 0));
    if (!next.area.trim() && dimensionAreas[0]) next.area = dimensionAreas[0].name;
    s.addBoardBlueprintLog(examId, {
      date: isoDate(new Date()),
      dimension,
      area: next.area,
      mode: next.mode,
      minutes,
      questions,
      correct,
      confidence: next.confidence,
      notes: next.notes.trim() || undefined,
    });
    s.logStudy({
      type: `${exam.prefix} ${next.mode}`,
      minutes,
      note: `${next.area}${questions ? ` · ${correct}/${questions} questions` : ""}${next.notes ? ` · ${next.notes}` : ""}`,
    });
    setDraft((current) => ({ ...current, notes: "" }));
  }

  async function refreshAiPlan() {
    setAiBusy(true);
    setAiStatus("Generating strategy...");
    if (isPlainViteDev()) {
      const text = localAiStrategy(exam, prep, stats);
      patchPrep({ aiStrategy: text });
      setAiStatus("Frontend-only dev server detected; used local strategist. Vercel/root dev will use the AI endpoint.");
      setAiBusy(false);
      return;
    }
    try {
      const response = await runAi("step-planner", {
        userId: s.profile.userId,
        context: {
          exam: exam.label,
          examDate: prep.examDate,
          weeklyHours: prep.weeklyHours,
          questionTarget: prep.questionTarget,
          confidence: prep.confidence,
          resources: prep.resourcesDone,
          weakSystems: stats.weakAreas,
          blueprintReadiness: stats.readiness,
          recentMinutes: weekLog.minutes,
          recentQuestions: stats.questions,
          otherResources: prep.otherResources,
        },
      });
      const text = formatAiStrategy(response.result, response.provider);
      patchPrep({ aiStrategy: text });
      setAiStatus(`AI strategy refreshed via ${response.provider}.`);
    } catch (error) {
      const text = localAiStrategy(exam, prep, stats);
      patchPrep({ aiStrategy: text });
      setAiStatus(error instanceof Error ? `Backend unavailable; used local strategist. ${error.message}` : "Backend unavailable; used local strategist.");
    } finally {
      setAiBusy(false);
    }
  }

  const aiText = prep.aiStrategy || localAiStrategy(exam, prep, stats);

  return (
    <>
      <GlassCard pad className="step-command">
        <div className="tk-hero">
          <div className="row gap12">
            <span className="folder-icon" style={{ color: "var(--purple)" }}><Brain size={22} /></span>
            <div>
              <div className="step-tabs">
                {(Object.keys(EXAMS) as BoardExamId[]).map((id) => (
                  <button key={id} className={`filter-pill ${examId === id ? "on" : ""}`} onClick={() => setExamId(id)}>
                    {EXAMS[id].label}
                  </button>
                ))}
              </div>
              <div className="step-title">{exam.label} Blueprint Command</div>
              <div className="sub">{exam.structure}</div>
            </div>
          </div>
          <div className="ring" style={{ width: 96, height: 96 }}>
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="41" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
              <circle cx="48" cy="48" r="41" fill="none" stroke="var(--purple)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 41} strokeDashoffset={2 * Math.PI * 41 * (1 - stats.readiness / 100)}
                transform="rotate(-90 48 48)" style={{ transition: "stroke-dashoffset .5s ease" }} />
            </svg>
            <div className="ring-label">{stats.readiness}%</div>
          </div>
        </div>

        <div className="step-actions">
          <GButton variant="primary" onClick={() => addBlueprintLog({ mode: "Questions", minutes: "70", questions: String(prep.questionTarget || 40) })}>
            <ClipboardCheck size={14} /> Log question block
          </GButton>
          <GButton onClick={installResourceSpine} disabled={officialInstalled}><Database size={14} /> Activate resources</GButton>
          <GButton onClick={createWeekTasks}><ListChecks size={14} /> Create week tasks</GButton>
          <a className="gbtn" href={exam.officialOutline} target="_blank" rel="noreferrer noopener">Official outline <ExternalLink size={14} /></a>
        </div>
        {flash && (
          <a className="step-flash" href={flash.href}>
            <CheckCircle2 size={15} /> <span>{flash.msg}</span> <span className="step-flash-go">Open</span>
          </a>
        )}
      </GlassCard>

      <div className="step-top-grid">
        <ScheduleCard exam={exam} prep={prep} schedule={schedule} />
        <AiStrategyCard
          aiBusy={aiBusy}
          aiStatus={aiStatus}
          aiText={aiText}
          onRefresh={refreshAiPlan}
          suggestions={suggestions}
        />
      </div>

      <div className="step-overview-grid">
        <GlassCard pad>
          <PanelHeader title="Blueprint logging" sub="Step work is logged by USMLE dimension, not by lecture/PQ/Anki convention"
            action={<Tag tone={stats.readiness >= 70 ? "green" : stats.readiness >= 35 ? "orange" : "neutral"}>{logs.length} logs</Tag>} />
          <div className="blueprint-dimension-tabs">
            {(["system", "competency", "discipline"] as BoardBlueprintDimension[]).map((key) => (
              <button key={key} className={`filter-pill ${dimension === key ? "on" : ""}`} onClick={() => setDimension(key)}>
                {dimensionLabel(key)}
              </button>
            ))}
          </div>
          <div className="step-form-grid board-log-form">
            <label className="stack gap6">
              <span className="field-label">Blueprint area</span>
              <select className="field" value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })}>
                {dimensionAreas.map((area) => <option key={area.name}>{area.name}</option>)}
              </select>
            </label>
            <label className="stack gap6">
              <span className="field-label">Mode</span>
              <select className="field" value={draft.mode} onChange={(e) => setDraft({ ...draft, mode: e.target.value as BoardBlueprintMode })}>
                {(["Content", "Retrieval", "Questions", "Assessment", "Review"] as BoardBlueprintMode[]).map((mode) => <option key={mode}>{mode}</option>)}
              </select>
            </label>
            <label className="stack gap6">
              <span className="field-label">Minutes</span>
              <input className="field" type="number" min={0} value={draft.minutes} onChange={(e) => setDraft({ ...draft, minutes: e.target.value })} />
            </label>
            <label className="stack gap6">
              <span className="field-label">Questions</span>
              <input className="field" type="number" min={0} value={draft.questions} onChange={(e) => setDraft({ ...draft, questions: e.target.value })} />
            </label>
            <label className="stack gap6">
              <span className="field-label">Correct</span>
              <input className="field" type="number" min={0} value={draft.correct} onChange={(e) => setDraft({ ...draft, correct: e.target.value })} />
            </label>
            <label className="stack gap6">
              <span className="field-label">Confidence</span>
              <select className="field" value={draft.confidence} onChange={(e) => setDraft({ ...draft, confidence: e.target.value as BoardConfidence })}>
                {(Object.keys(CONFIDENCE) as BoardConfidence[]).map((key) => <option key={key} value={key}>{CONFIDENCE[key].label}</option>)}
              </select>
            </label>
          </div>
          <div className="board-log-note-row">
            <input className="field" placeholder="Weak point, NBME miss, resource used, or next retest target"
              value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            <GButton variant="primary" onClick={() => addBlueprintLog()}><Activity size={14} /> Add log</GButton>
          </div>
          <div className="board-quick-row">
            <button onClick={() => addBlueprintLog({ mode: "Retrieval", minutes: "30", questions: "0", correct: "0", confidence: "orange" })}>+ Retrieval repair</button>
            <button onClick={() => addBlueprintLog({ mode: "Assessment", minutes: "240", questions: "0", correct: "0", confidence: "red" })}>+ NBME/assessment</button>
            <button onClick={() => addBlueprintLog({ mode: "Review", minutes: "45", questions: "0", correct: "0", confidence: "green" })}>+ HY review</button>
          </div>
        </GlassCard>

        <GlassCard pad className="step-log-card">
          <PanelHeader title="Board telemetry" sub={`${weekLog.minutes}m logged in the last 7 days`}
            action={<Tag tone={stats.averageCorrect >= 70 ? "green" : stats.averageCorrect >= 55 ? "orange" : "neutral"}>{stats.averageCorrect}% correct</Tag>} />
          <div className="board-metrics-grid">
            <Metric icon={<Gauge size={16} />} label="Readiness" value={`${stats.readiness}%`} note={`${stats.coveredAreas}/${stats.totalAreas} systems touched`} />
            <Metric icon={<ClipboardCheck size={16} />} label="Questions" value={`${stats.questions}`} note={`${stats.correct} correct logged`} />
            <Metric icon={<Clock size={16} />} label="Minutes" value={`${stats.minutes}m`} note={`${logs.length} blueprint entries`} />
            <Metric icon={<BarChart3 size={16} />} label="Weak areas" value={`${stats.weakAreas.length}`} note={stats.weakAreas[0] ?? "None yet"} />
          </div>
          <div className="step-week-mini">
            {weekLog.days.map((day) => (
              <span key={day.key} title={`${prettyDate(day.key)}: ${day.minutes}m`}>
                <i style={{ height: `${day.active ? Math.max(12, day.intensity) : 5}%`, background: day.active ? gradeColor(day.grade) : "rgba(255,255,255,0.12)" }} />
                <b>{day.label}</b>
              </span>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-2">
        <GlassCard pad>
          <PanelHeader title={`${exam.label} ${dimensionLabel(dimension)} map`} sub={exam.sourceNote} />
          <div className="stack gap8">
            {dimensionRows.map((row) => (
              <div className="blueprint-row board-blueprint-row" key={row.area.name}>
                <div className="grow">
                  <div className="spread">
                    <div className="bp-title">{row.area.name}</div>
                    <div className="row gap6">
                      <Tag tone={maxPercent(row.area.range) >= 10 || row.area.range === "high" ? "green" : "neutral"}>{row.area.range}</Tag>
                      <Tag tone={CONFIDENCE[row.confidence].tone}>{CONFIDENCE[row.confidence].label}</Tag>
                    </div>
                  </div>
                  <div className="bp-focus">{row.area.focus}</div>
                  <div className="track" style={{ marginTop: 8 }}>
                    <div className="track-fill" style={{ width: `${row.score}%`, background: CONFIDENCE[row.confidence].color }} />
                  </div>
                </div>
                <div className="bp-score">
                  <b>{row.score}%</b>
                  <span>{row.questions} q · {row.minutes}m</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard pad>
          <PanelHeader title="Recent board log" sub="Delete mistakes freely; logs are local-first and included in JSON/cloud backup" />
          <div className="board-log-list">
            {logs.slice(0, 8).map((log) => (
              <div className="board-log-row" key={log.id}>
                <span className="board-log-dot" style={{ background: CONFIDENCE[log.confidence].color }} />
                <div className="grow">
                  <b>{log.area}</b>
                  <span>{prettyDate(log.date)} · {dimensionLabel(log.dimension)} · {log.mode} · {log.minutes}m{log.questions ? ` · ${log.correct}/${log.questions}` : ""}</span>
                  {log.notes && <small>{log.notes}</small>}
                </div>
                <GhostButton className="danger" title="Delete log" onClick={() => s.removeBoardBlueprintLog(examId, log.id)}><Trash2 size={14} /></GhostButton>
              </div>
            ))}
            {!logs.length && <div className="dim">No board logs yet. Add one above after a question block, NBME review, or weak-area repair.</div>}
          </div>
        </GlassCard>
      </div>

      <div className="step-overview-grid">
        <GlassCard pad>
          <PanelHeader title={`Customize ${exam.shortLabel}`} sub="Saved locally under your profile"
            action={<Tag tone={prep.confidence === "high" ? "green" : prep.confidence === "low" ? "orange" : "purple"}>{resourcePct}% resource setup</Tag>} />
          <div className="step-form-grid">
            <label className="stack gap6">
              <span className="field-label">Medical school year</span>
              <select className="field" value={prep.medYear} onChange={(e) => patchPrep({ medYear: e.target.value })}>
                {["MS1", "MS2", "MS3", "MS4", "Graduate / IMG", "Other"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </label>
            <label className="stack gap6">
              <span className="field-label">Step content started</span>
              <select className="field" value={prep.contentStarted} onChange={(e) => patchPrep({ contentStarted: e.target.value as BoardPrepProfile["contentStarted"] })}>
                <option value="not-started">Not started</option>
                <option value="light">Light exposure</option>
                <option value="half">About half covered</option>
                <option value="most">Most content covered</option>
                <option value="dedicated">Dedicated review</option>
              </select>
            </label>
            <label className="stack gap6">
              <span className="field-label">Target exam date</span>
              <input className="field" type="date" value={prep.examDate ?? ""} onChange={(e) => patchPrep({ examDate: e.target.value || undefined })} />
            </label>
            <label className="stack gap6">
              <span className="field-label">Weekly hours</span>
              <input className="field" type="number" min={1} max={80} value={prep.weeklyHours}
                onChange={(e) => patchPrep({ weeklyHours: Number(e.target.value) || 1 })} />
            </label>
            <label className="stack gap6">
              <span className="field-label">Daily question target</span>
              <input className="field" type="number" min={0} max={240} value={prep.questionTarget}
                onChange={(e) => patchPrep({ questionTarget: Number(e.target.value) || 0 })} />
            </label>
            <label className="stack gap6">
              <span className="field-label">Confidence</span>
              <select className="field" value={prep.confidence} onChange={(e) => patchPrep({ confidence: e.target.value as BoardPrepProfile["confidence"] })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
          <label className="stack gap6" style={{ marginTop: 12 }}>
            <span className="field-label">Other resources / constraints</span>
            <input className="field" placeholder="School CBSE, Bootcamp, Pathoma, UWorld, mentor plan..." value={prep.otherResources}
              onChange={(e) => patchPrep({ otherResources: e.target.value })} />
          </label>
        </GlassCard>

        <GlassCard pad>
          <PanelHeader title="Resource activation" sub="Check what you have already started or completed" />
          <div className="resource-checks">
            {resources.map((res) => (
              <button key={res.id} className={`resource-check ${prep.resourcesDone.includes(res.id) ? "on" : ""}`} onClick={() => toggleResource(res.id)}>
                <CheckCircle2 size={16} />
                <div>
                  <b>{res.title}</b>
                  <span>{res.kind} - {res.why}</span>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-2">
        <GlassCard pad>
          <PanelHeader title="Evidence-backed rules" sub="How the schedule decides what matters" />
          <div className="evidence-grid">
            {EVIDENCE.map((item) => (
              <a className="evidence-card" href={item.url} target="_blank" rel="noreferrer" key={item.title}>
                <span><FlaskConical size={15} /></span>
                <div>
                  <b>{item.title}</b>
                  <small>{item.body}</small>
                  <em>{item.source}</em>
                </div>
              </a>
            ))}
          </div>
        </GlassCard>

        <GlassCard pad>
          <PanelHeader title="Source spine" sub="Official + evidence sources used by this page" />
          <div className="resource-spine">
            <a href={exam.officialOutline} target="_blank" rel="noreferrer">USMLE official content outline <ExternalLink size={13} /></a>
            <a href={exam.practiceMaterials} target="_blank" rel="noreferrer">USMLE official sample questions <ExternalLink size={13} /></a>
            <a href={nbmeAssessmentUrl} target="_blank" rel="noreferrer">NBME self-assessment readiness checks <ExternalLink size={13} /></a>
            <a href="https://pubmed.ncbi.nlm.nih.gov/26173288/" target="_blank" rel="noreferrer">Dunlosky learning techniques review <ExternalLink size={13} /></a>
          </div>
        </GlassCard>
      </div>
    </>
  );
}

function ScheduleCard({ exam, prep, schedule }: { exam: ExamConfig; prep: BoardPrepProfile; schedule: ReturnType<typeof buildPrepSchedule> }) {
  return (
    <GlassCard pad className="step-schedule-card elevated-schedule">
      <PanelHeader title={`${exam.shortLabel} Schedule`} sub={schedule.subtitle}
        action={<Tag tone={schedule.urgency === "red" ? "red" : schedule.urgency === "orange" ? "orange" : "green"}>{schedule.weeksLeft} weeks</Tag>} />
      <div className="phase-strip">
        {schedule.phases.map((phase) => <PhasePill key={phase.name} phase={phase.name} active={phase.name === schedule.currentPhase} pct={phase.pct} />)}
      </div>
      <div className="step-week-grid compact">
        {schedule.weeks.slice(0, 4).map((week) => (
          <div className={`step-week ${week.isCurrent ? "on" : ""}`} key={week.key}>
            <div className="spread">
              <b>{week.label}</b>
              <Tag tone={phaseTone(week.phase)}>{week.phase}</Tag>
            </div>
            <div className="week-date">{prettyDate(week.key)}</div>
            <div className="week-area">{week.area.name}</div>
            <div className="week-focus">{week.focus}</div>
            <div className="week-prescription">
              <span><BookOpen size={13} /> {week.conceptHours}h concepts</span>
              <span><ClipboardCheck size={13} /> {Math.max(prep.questionTarget, week.questions)} questions</span>
              <span><CalendarClock size={13} /> retest weak</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function AiStrategyCard({
  aiBusy, aiStatus, aiText, onRefresh, suggestions,
}: {
  aiBusy: boolean;
  aiStatus: string;
  aiText: string;
  onRefresh: () => void;
  suggestions: { title: string; reason: string; color: string }[];
}) {
  return (
    <GlassCard pad className="ai-strategy-card">
      <PanelHeader title="Noctyrium AI strategist" sub={aiStatus}
        action={<GButton size="sm" variant="primary" onClick={onRefresh} disabled={aiBusy}><WandSparkles size={14} /> {aiBusy ? "Thinking" : "Refresh AI"}</GButton>} />
      <div className="ai-plan-text">
        {aiText.split("\n").filter(Boolean).map((line) => <p key={line}>{line}</p>)}
      </div>
      <div className="stack gap8">
        {suggestions.slice(0, 3).map((sg) => (
          <div className="sugg compact" key={sg.title}>
            <span className="sugg-dot" style={{ background: sg.color }} />
            <div className="grow">
              <div className="sugg-title">{sg.title}</div>
              <div className="sugg-reason">{sg.reason}</div>
            </div>
            <Sparkles size={15} style={{ color: "var(--cyan)" }} />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function Metric({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return (
    <div className="metric-tile">
      <span>{icon}</span>
      <div>
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
        <div className="metric-note">{note}</div>
      </div>
    </div>
  );
}

function PhasePill({ phase, active, pct }: { phase: PlanPhase; active: boolean; pct: number }) {
  return (
    <div className={`phase-pill ${active ? "on" : ""}`}>
      <span>{phase}</span>
      <i><b style={{ width: `${pct}%` }} /></i>
    </div>
  );
}

function areasForDimension(exam: ExamConfig, dimension: BoardBlueprintDimension): BlueprintArea[] {
  if (dimension === "competency") return exam.competencies;
  if (dimension === "discipline") return exam.disciplines;
  return exam.areas;
}

function dimensionLabel(dimension: BoardBlueprintDimension) {
  if (dimension === "competency") return "Tasks";
  if (dimension === "discipline") return "Disciplines";
  return "Systems";
}

function summarizeBlueprint(exam: ExamConfig, logs: BoardBlueprintLog[]) {
  const systemRows = summarizeDimension(exam, logs, "system");
  const touched = systemRows.filter((row) => row.logs.length > 0);
  const minutes = logs.reduce((sum, log) => sum + log.minutes, 0);
  const questions = logs.reduce((sum, log) => sum + log.questions, 0);
  const correct = logs.reduce((sum, log) => sum + log.correct, 0);
  const averageCorrect = questions ? Math.round((correct / questions) * 100) : 0;
  const confidenceScore = logs.length
    ? Math.round(logs.reduce((sum, log) => sum + confidenceValue(log.confidence), 0) / logs.length)
    : 0;
  const coverageScore = Math.round((touched.length / Math.max(exam.areas.length, 1)) * 100);
  const questionScore = Math.min(100, Math.round((questions / 800) * 100));
  const readiness = Math.round((coverageScore * 0.42) + (averageCorrect * 0.32) + (confidenceScore * 0.16) + (questionScore * 0.1));
  const weakAreas = systemRows
    .filter((row) => row.logs.length === 0 || row.confidence === "red" || row.confidence === "orange" || row.accuracy < 60)
    .sort((a, b) => maxPercent(b.area.range) - maxPercent(a.area.range))
    .map((row) => row.area.name)
    .slice(0, 5);

  return {
    readiness,
    minutes,
    questions,
    correct,
    averageCorrect,
    coveredAreas: touched.length,
    totalAreas: exam.areas.length,
    weakAreas,
  };
}

function summarizeDimension(exam: ExamConfig, logs: BoardBlueprintLog[], dimension: BoardBlueprintDimension) {
  return areasForDimension(exam, dimension).map((area) => {
    const rowLogs = logs.filter((log) => log.dimension === dimension && log.area === area.name);
    const minutes = rowLogs.reduce((sum, log) => sum + log.minutes, 0);
    const questions = rowLogs.reduce((sum, log) => sum + log.questions, 0);
    const correct = rowLogs.reduce((sum, log) => sum + log.correct, 0);
    const accuracy = questions ? Math.round((correct / questions) * 100) : 0;
    const latest = rowLogs[0];
    const confidence = latest?.confidence ?? "red";
    const score = Math.min(100, Math.round(
      (Math.min(minutes / 240, 1) * 24) +
      (Math.min(questions / 80, 1) * 30) +
      (accuracy * 0.28) +
      (confidenceValue(confidence) * 0.18),
    ));
    return { area, logs: rowLogs, minutes, questions, correct, accuracy, confidence, score };
  });
}

function confidenceValue(confidence: BoardConfidence) {
  if (confidence === "blue") return 100;
  if (confidence === "green") return 78;
  if (confidence === "orange") return 48;
  return 18;
}

function maxPercent(range: string): number {
  if (range === "high") return 100;
  if (range === "medium") return 50;
  const nums = range.match(/\d+/g)?.map(Number) ?? [0];
  return Math.max(...nums);
}

function buildBoardSuggestions(exam: ExamConfig, prep: BoardPrepProfile, stats: ReturnType<typeof summarizeBlueprint>) {
  const out: { title: string; reason: string; color: string }[] = [];
  const firstWeak = stats.weakAreas[0];
  if (!stats.coveredAreas) {
    out.push({ title: "Log your first blueprint block", reason: "Pick the highest-weighted system and record questions, confidence, and weak notes.", color: "var(--purple)" });
  }
  if (firstWeak) {
    out.push({ title: `Repair ${firstWeak}`, reason: "Weak systems get retrieval, questions, then a retest. Passive rereading does not count as repaired.", color: "var(--orange)" });
  }
  if (stats.questions < 120) {
    out.push({ title: "Build the question floor", reason: `${exam.shortLabel} tracking is question-weighted. Aim for reviewed blocks, not just raw completion.`, color: "var(--cyan)" });
  }
  if (!prep.resourcesDone.includes("qbank")) {
    out.push({ title: "Choose one question engine", reason: "Keep resources tight: one qbank, one review spine, one spaced-repetition workflow.", color: "var(--green)" });
  }
  if (prep.contentStarted === "not-started" || prep.confidence === "low") {
    out.push({ title: "Start with mechanism-first content", reason: "Do content only as a bridge into retrieval and questions.", color: "var(--red)" });
  }
  if (!out.length) out.push({ title: "Protect mixed review", reason: "Keep rotating systems so mastered material stays retrievable.", color: "var(--green)" });
  return out.slice(0, 4);
}

function buildPrepSchedule(exam: ExamConfig, prep: BoardPrepProfile, weakAreas: string[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = prep.examDate ? dateFromKey(prep.examDate) : undefined;
  const weeksLeftRaw = examDate ? Math.max(1, Math.ceil((examDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000))) : recommendedWeeks(prep);
  const weeksLeft = Math.max(1, Math.min(weeksLeftRaw, 32));
  const currentPhase = phaseFor(prep, weeksLeft);
  const urgency = weeksLeft <= 4 ? "red" : weeksLeft <= 8 ? "orange" : "green";
  const phases = phaseDistribution(prep, weeksLeft);
  const weighted = [...exam.areas].sort((a, b) => maxPercent(b.range) - maxPercent(a.range));
  const weakFirst = weakAreas
    .map((name) => weighted.find((area) => area.name === name))
    .filter((area): area is BlueprintArea => Boolean(area));
  const areaOrder = [...weakFirst, ...weighted.filter((area) => !weakFirst.some((weak) => weak.name === area.name))];
  const visibleWeeks = Math.min(weeksLeft, 8);
  const weeks = Array.from({ length: visibleWeeks }, (_, idx) => {
    const start = new Date(today);
    start.setDate(today.getDate() + idx * 7);
    const phase = phaseForWeek(idx, weeksLeft, prep);
    const area = areaOrder[idx % areaOrder.length];
    const questionMultiplier = phase === "Questions" || phase === "Assessment" ? 5 : phase === "Final Review" ? 4 : 3;
    return {
      key: isoDate(start),
      start,
      label: idx === 0 ? "This week" : `Week ${idx + 1}`,
      isCurrent: idx === 0,
      phase,
      area,
      focus: focusForPhase(phase, area),
      conceptHours: conceptHoursFor(phase, prep.weeklyHours),
      questions: Math.max(prep.questionTarget, prep.questionTarget * questionMultiplier),
    };
  });
  const subtitle = prep.examDate
    ? `${prettyDate(prep.examDate)} target - schedule recalculates from today's calendar date`
    : "No exam date set - adaptive rolling plan uses blueprint weight + weak areas";

  return { weeksLeft, currentPhase, urgency, phases, weeks, subtitle };
}

function recommendedWeeks(prep: BoardPrepProfile): number {
  if (prep.contentStarted === "dedicated") return 6;
  if (prep.contentStarted === "most") return 8;
  if (prep.contentStarted === "half") return 12;
  if (prep.contentStarted === "light") return 16;
  return 20;
}

function phaseFor(prep: BoardPrepProfile, weeksLeft: number): PlanPhase {
  if (weeksLeft <= 2) return "Final Review";
  if (weeksLeft <= 5) return "Assessment";
  if (prep.contentStarted === "not-started" || prep.contentStarted === "light") return "Foundation";
  if (prep.contentStarted === "half") return "Retrieval";
  return "Questions";
}

function phaseForWeek(index: number, totalWeeks: number, prep: BoardPrepProfile): PlanPhase {
  const remaining = totalWeeks - index;
  if (remaining <= 2) return "Final Review";
  if (remaining <= 5 || index % 4 === 3) return "Assessment";
  if ((prep.contentStarted === "not-started" || prep.contentStarted === "light") && index < Math.max(2, Math.ceil(totalWeeks * 0.25))) return "Foundation";
  if (index % 2 === 0) return "Questions";
  return "Retrieval";
}

function phaseDistribution(prep: BoardPrepProfile, weeksLeft: number) {
  const weeks = Array.from({ length: weeksLeft }, (_, i) => phaseForWeek(i, weeksLeft, prep));
  const names: PlanPhase[] = ["Foundation", "Retrieval", "Questions", "Assessment", "Final Review"];
  return names.map((name) => ({
    name,
    pct: Math.round((weeks.filter((w) => w === name).length / Math.max(weeks.length, 1)) * 100),
  }));
}

function focusForPhase(phase: PlanPhase, area: BlueprintArea): string {
  if (phase === "Foundation") return `Build mechanisms first: ${area.focus}.`;
  if (phase === "Retrieval") return "Closed-notes recall, then log confidence and patch misses.";
  if (phase === "Questions") return "Timed questions, explanation review, error log, then retest.";
  if (phase === "Assessment") return "Assessment block, score review, and weak-system repair.";
  return "Light mixed review, sleep protection, formulas/ethics/biostats polish.";
}

function conceptHoursFor(phase: PlanPhase, weeklyHours: number) {
  const ratio = phase === "Foundation" ? 0.55 : phase === "Retrieval" ? 0.35 : phase === "Questions" ? 0.18 : phase === "Assessment" ? 0.12 : 0.18;
  return Math.max(1, Math.round(weeklyHours * ratio));
}

function phaseTone(phase: PlanPhase): "cyan" | "green" | "purple" | "neutral" | "orange" | "red" {
  if (phase === "Foundation") return "cyan";
  if (phase === "Retrieval") return "purple";
  if (phase === "Questions") return "orange";
  if (phase === "Assessment") return "green";
  return "red";
}

function summarizeRecentBoardLog(logs: ReturnType<typeof useStore.getState>["logs"], prefix: string) {
  const days = lastNDays(7).map((date) => {
    const key = isoDate(date);
    const relevant = logs.filter((log) => log.dayKey === key && log.type.toLowerCase().includes(prefix.toLowerCase()));
    const minutes = relevant.reduce((sum, log) => sum + log.minutes, 0);
    const cards = relevant.reduce((sum, log) => sum + log.cards, 0);
    const grade = todayGrade(minutes, cards);
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
      minutes,
      grade,
      active: minutes > 0 || cards > 0,
      intensity: Math.min(100, Math.max((minutes / 240) * 100, (cards / 200) * 100)),
    };
  });
  return {
    days,
    minutes: days.reduce((sum, day) => sum + day.minutes, 0),
  };
}

function formatAiStrategy(result: Record<string, unknown>, provider: string) {
  const priorities = Array.isArray(result.priorities) ? result.priorities.map(String) : [];
  const template = Array.isArray(result.weekTemplate)
    ? result.weekTemplate.map((row) => {
        if (!row || typeof row !== "object") return String(row);
        const item = row as Record<string, unknown>;
        return `${item.day ?? "Block"}: ${item.work ?? ""}`;
      })
    : [];
  const lines = [
    `Provider: ${provider}`,
    ...priorities.map((line, index) => `${index + 1}. ${line}`),
    ...template.map((line) => `• ${line}`),
  ];
  return lines.filter(Boolean).join("\n") || "AI returned a strategy shell. Add logs and refresh again.";
}

function localAiStrategy(exam: ExamConfig, prep: BoardPrepProfile, stats: ReturnType<typeof summarizeBlueprint>) {
  const weak = stats.weakAreas[0] ?? exam.areas.sort((a, b) => maxPercent(b.range) - maxPercent(a.range))[0]?.name ?? "highest-weighted system";
  const pace = prep.examDate ? `Work backward from ${prettyDate(prep.examDate)}.` : "No exam date is set, so use a rolling weekly plan.";
  return [
    "Provider: local strategist",
    `1. ${pace}`,
    `2. Repair ${weak} first with retrieval plus reviewed questions.`,
    `3. Keep the weekly floor at ${prep.weeklyHours}h and ${prep.questionTarget} reviewed questions/day when active.`,
    "• Mon-Thu: one system repair block + timed questions",
    "• Fri: mixed block + error-log cleanup",
    "• Weekend: assessment/review, then light spaced recall",
  ].join("\n");
}

function defaultPrep(exam: BoardExamId): BoardPrepProfile {
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

function isPlainViteDev() {
  return import.meta.env.DEV && location.port === "5173";
}

function dateFromKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
