import { useMemo, useState } from "react";
import {
  BookOpen, Brain, CheckCircle2, ClipboardCheck, Clock,
  Database, ExternalLink, FlaskConical, Layers, ListChecks, ListPlus,
  Sparkles, Target,
} from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, PanelHeader, Tag } from "../components/ui/primitives";
import { PASS_COLOR, scopeMastery, suggestMoves } from "../lib/tracker";
import { gradeColor, isoDate, lastNDays, prettyDate, todayGrade } from "../lib/scoring";
import type { BoardExamId, BoardPrepProfile, TrackerItem, TrackerKind } from "../lib/types";

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
  areas: BlueprintArea[];
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

const EXAMS: Record<BoardExamId, ExamConfig> = {
  step1: {
    label: "STEP 1",
    shortLabel: "Step 1",
    prefix: "STEP 1",
    structure: "Current software: 14 blocks x 30 minutes, 8-hour session, up to 280 items.",
    officialOutline: "https://www.usmle.org/exam-resources/step-1-materials/step-1-content-outline-and-specifications",
    practiceMaterials: "https://www.usmle.org/exam-resources/step-1-materials/step-1-sample-test-questions",
    areas: [
      { name: "Human Development", range: "1-3%", focus: "age-related findings and care of the well patient", tags: ["development", "aging", "peds"] },
      { name: "Blood & Immune", range: "9-13%", focus: "hematology, oncology, immune mechanisms, transfusion, inflammation", tags: ["blood", "heme", "immuno", "onc"] },
      { name: "Behavioral Health & Nervous", range: "10-14%", focus: "neuro, psych, special senses, behavior, sleep, substances", tags: ["neuro", "psych", "behavior", "senses"] },
      { name: "Musculoskeletal & Skin", range: "8-12%", focus: "MSK, rheum, derm, connective tissue, trauma", tags: ["msk", "skin", "derm", "rheum"] },
      { name: "Cardiovascular", range: "7-11%", focus: "heart, vessels, hemodynamics, cardio pharm/path", tags: ["cardio", "heart", "vascular"] },
      { name: "Respiratory & Renal", range: "11-15%", focus: "pulm, acid-base, kidney, urinary, fluids, electrolytes", tags: ["resp", "pulm", "renal", "urinary"] },
      { name: "Gastrointestinal", range: "6-10%", focus: "GI anatomy, liver, pancreas, nutrition links, metabolism", tags: ["gi", "gastro", "liver", "pancreas"] },
      { name: "Reproductive & Endocrine", range: "12-16%", focus: "repro, endocrine, diabetes, pregnancy basics, hormones", tags: ["repro", "endocrine", "obgyn", "hormone"] },
      { name: "Multisystem Processes", range: "8-12%", focus: "infection, pathology patterns, pharmacotherapy, shock, sepsis", tags: ["multisystem", "path", "pharm", "micro"] },
      { name: "Biostats & Population Health", range: "4-6%", focus: "biostats, epidemiology, study interpretation, population health", tags: ["biostats", "epi", "population"] },
      { name: "Social Sciences", range: "6-9%", focus: "communication, ethics, interpersonal skills, professionalism", tags: ["ethics", "communication", "professionalism"] },
    ],
  },
  step2: {
    label: "STEP 2 CK",
    shortLabel: "Step 2",
    prefix: "STEP 2 CK",
    structure: "Current software: 16 blocks x 30 minutes, 9-hour session, up to 318 items.",
    officialOutline: "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-content-outline-specifications",
    practiceMaterials: "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-sample-test-questions",
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
  },
};

const RESOURCE_CATALOG: Record<BoardExamId, PrepResource[]> = {
  step1: [
    { id: "usmle-outline", title: "USMLE Step 1 Content Outline", kind: "Official", url: EXAMS.step1.officialOutline, why: "Blueprint anchor for systems, competencies, and weighting.", tags: ["official", "blueprint"] },
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
    title: "Practice testing",
    body: "Use questions as learning events, not just score checks. Explanations become the review queue.",
    source: "Dunlosky et al., 2013",
    url: "https://pubmed.ncbi.nlm.nih.gov/26173288/",
  },
  {
    title: "Distributed practice",
    body: "Space review across days and weeks. Noctyrium turns missed content into repeated tracker passes.",
    source: "Dunlosky et al., 2013",
    url: "https://pubmed.ncbi.nlm.nih.gov/26173288/",
  },
  {
    title: "Retrieval in health professions",
    body: "Distributed and retrieval practice are supported in health-professions education, so the plan prioritizes recall, questions, and retesting.",
    source: "Systematic review, 2023",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11078833/",
  },
  {
    title: "Self-assessment checkpoints",
    body: "NBME self-assessments are treated as scheduled calibration points, not daily study tools.",
    source: "NBME CBSSA",
    url: "https://www.nbme.org/examinees/self-assessments/comprehensive-basic-science-self-assessment",
  },
];

export function StepPage() {
  const s = useStore();
  const [examId, setExamId] = useState<BoardExamId>("step1");
  const [flash, setFlash] = useState<{ msg: string; href: string } | null>(null);
  function announce(msg: string, href: string) {
    setFlash({ msg, href });
    window.setTimeout(() => setFlash(null), 6000);
  }
  const exam = EXAMS[examId];
  const prep = s.boardPrep?.[examId] ?? defaultPrep(examId);
  const resources = RESOURCE_CATALOG[examId];
  const nbmeAssessmentUrl = examId === "step1"
    ? "https://www.nbme.org/examinees/self-assessments/comprehensive-basic-science-self-assessment"
    : "https://www.nbme.org/examinees/self-assessments/comprehensive-clinical-science-self-assessment";

  const examItems = useMemo(
    () => s.tracker.filter((t) => t.path.startsWith(exam.prefix) || t.label.toLowerCase().includes(exam.label.toLowerCase())),
    [s.tracker, exam],
  );
  const readiness = scopeMastery(examItems);
  const suggestions = buildBoardSuggestions(exam, prep, examItems);
  const schedule = buildPrepSchedule(exam, prep);
  const weekLog = summarizeRecentBoardLog(s.logs, exam.prefix);
  const resourcePct = Math.round((prep.resourcesDone.length / Math.max(resources.length, 1)) * 100);
  const officialInstalled = resources.every((res) => s.resources.some((r) => r.url === res.url));

  function patchPrep(patch: Partial<BoardPrepProfile>) {
    s.updateBoardPrep(examId, patch);
  }

  function toggleResource(id: string) {
    const next = prep.resourcesDone.includes(id)
      ? prep.resourcesDone.filter((x) => x !== id)
      : [...prep.resourcesDone, id];
    patchPrep({ resourcesDone: next });
  }

  function installBlueprint() {
    const existing = new Set(s.tracker.map((t) => `${t.path}::${t.label}`.toLowerCase()));
    const next: Omit<TrackerItem, "id" | "updated">[] = [];

    exam.areas.forEach((area) => {
      const base = `${exam.prefix}/${area.name}`;
      blueprintRows(base, area).forEach((rowItem) => {
        const key = `${rowItem.path}::${rowItem.label}`.toLowerCase();
        if (!existing.has(key)) next.push(rowItem);
      });
    });

    if (next.length) s.bulkAddTrackerItems(next);
    announce(
      next.length ? `✓ Installed ${next.length} tracker rows into Course Tracker.` : "All blueprint rows already exist in your tracker.",
      "#tracker",
    );
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
      next.length ? `✓ Activated ${next.length} resources — find them on the Resources page.` : "These resources are already on your Resources page.",
      "#resources",
    );
  }

  function createWeekTasks() {
    const due = isoDate(schedule.weeks[0]?.start ?? new Date());
    let count = 0;
    schedule.weeks.slice(0, 1).forEach((week) => {
      s.addTask(`${exam.shortLabel}: ${week.phase} - ${week.area.name}`, due, exam.label);
      s.addTask(`${exam.shortLabel}: ${prep.questionTarget} reviewed questions`, due, `${exam.label}/PQs`);
      s.addTask(`${exam.shortLabel}: missed facts into Anki`, due, `${exam.label}/Anki`);
      count += 3;
    });
    announce(`✓ Created ${count} tasks for this week — open Tasks to work them.`, "#tasks");
  }

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
              <div className="step-title">{exam.label} Control Surface</div>
              <div className="sub">{exam.structure}</div>
            </div>
          </div>
          <div className="ring" style={{ width: 96, height: 96 }}>
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="41" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
              <circle cx="48" cy="48" r="41" fill="none" stroke="var(--purple)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 41} strokeDashoffset={2 * Math.PI * 41 * (1 - readiness / 100)}
                transform="rotate(-90 48 48)" style={{ transition: "stroke-dashoffset .5s ease" }} />
            </svg>
            <div className="ring-label">{readiness}%</div>
          </div>
        </div>

        <div className="step-actions">
          <GButton variant="primary" onClick={installBlueprint}><ListPlus size={14} /> Install blueprint</GButton>
          <GButton onClick={installResourceSpine} disabled={officialInstalled}><Database size={14} /> Activate resources</GButton>
          <GButton onClick={createWeekTasks}><ListChecks size={14} /> Create week tasks</GButton>
          <a className="gbtn" href={exam.officialOutline} target="_blank" rel="noreferrer noopener">Official outline <ExternalLink size={14} /></a>
        </div>
        {flash && (
          <a className="step-flash" href={flash.href}>
            <CheckCircle2 size={15} /> <span>{flash.msg}</span> <span className="step-flash-go">Open →</span>
          </a>
        )}
      </GlassCard>

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

        <GlassCard pad className="step-log-card">
          <PanelHeader title="Log board work" sub={`${weekLog.minutes}m and ${weekLog.cards} cards logged in the last 7 days`} />
          <div className="step-log-grid">
            <GButton onClick={() => s.logStudy({ type: exam.prefix, minutes: 60, note: `${exam.label} concept block` })}><Clock size={14} /> Concept +60m</GButton>
            <GButton onClick={() => s.logStudy({ type: `${exam.prefix} PQ`, minutes: 70, note: `${exam.label} question block + explanation review` })}><ClipboardCheck size={14} /> PQ block +70m</GButton>
            <GButton onClick={() => s.logStudy({ type: `${exam.prefix} Anki`, minutes: 30, cards: 80, note: `${exam.label} missed-fact cards` })}><Layers size={14} /> Anki +80</GButton>
            <GButton onClick={() => s.logStudy({ type: `${exam.prefix} Assessment`, minutes: 240, note: `${exam.label} self-assessment/review` })}><Target size={14} /> Assessment</GButton>
          </div>
          <div className="step-week-mini">
            {weekLog.days.map((day) => (
              <span key={day.key} title={`${prettyDate(day.key)}: ${day.minutes}m, ${day.cards} cards`}>
                <i style={{ height: `${day.active ? Math.max(12, day.intensity) : 5}%`, background: day.active ? gradeColor(day.grade) : "rgba(255,255,255,0.12)" }} />
                <b>{day.label}</b>
              </span>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="step-overview-grid">
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

        <GlassCard pad>
          <PanelHeader title="Personalized next moves" sub="Uses your customization, tracker, and resource state" />
          <div className="stack gap8">
            {suggestions.map((sg) => (
              <div className="sugg" key={sg.title}>
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
      </div>

      <GlassCard pad className="step-schedule-card">
        <PanelHeader title={`${exam.shortLabel} Schedule`} sub={schedule.subtitle}
          action={<Tag tone={schedule.urgency === "red" ? "red" : schedule.urgency === "orange" ? "orange" : "green"}>{schedule.weeksLeft} weeks</Tag>} />
        <div className="phase-strip">
          {schedule.phases.map((phase) => <PhasePill key={phase.name} phase={phase.name} active={phase.name === schedule.currentPhase} pct={phase.pct} />)}
        </div>
        <div className="step-week-grid">
          {schedule.weeks.map((week) => (
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
                <span><ClipboardCheck size={13} /> {week.questions} questions</span>
                <span><Layers size={13} /> missed facts</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid grid-2">
        <GlassCard pad>
          <PanelHeader title={`${exam.label} content map`} sub="USMLE-weighted areas; tracker passes determine readiness" />
          <div className="stack gap8">
            {exam.areas.map((area) => {
              const items = areaItems(exam, area, s.tracker);
              const pct = scopeMastery(items);
              const highYield = maxPercent(area.range) >= 10;
              return (
                <div className="blueprint-row" key={area.name}>
                  <div className="grow">
                    <div className="spread">
                      <div className="bp-title">{area.name}</div>
                      <Tag tone={highYield ? "green" : "neutral"}>{area.range}</Tag>
                    </div>
                    <div className="bp-focus">{area.focus}</div>
                    <div className="track" style={{ marginTop: 8 }}>
                      <div className="track-fill" style={{ width: `${pct}%`, background: pct >= 75 ? PASS_COLOR.mastered : pct >= 50 ? PASS_COLOR.mature : pct > 0 ? PASS_COLOR.red : "rgba(255,255,255,0.12)" }} />
                    </div>
                  </div>
                  <div className="bp-score">
                    <b>{pct}%</b>
                    <span>{items.length} items</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

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
      </div>

      <GlassCard pad>
        <PanelHeader title="Source spine" sub="Official + evidence sources used by this page" />
        <div className="resource-spine">
          <a href={exam.officialOutline} target="_blank" rel="noreferrer">USMLE official content outline <ExternalLink size={13} /></a>
          <a href={exam.practiceMaterials} target="_blank" rel="noreferrer">USMLE official sample questions <ExternalLink size={13} /></a>
          <a href={nbmeAssessmentUrl} target="_blank" rel="noreferrer">NBME self-assessment readiness checks <ExternalLink size={13} /></a>
          <a href="https://pubmed.ncbi.nlm.nih.gov/26173288/" target="_blank" rel="noreferrer">Dunlosky learning techniques review <ExternalLink size={13} /></a>
          <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11078833/" target="_blank" rel="noreferrer">Distributed/retrieval practice in health professions <ExternalLink size={13} /></a>
        </div>
      </GlassCard>
    </>
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

function blueprintRows(base: string, area: BlueprintArea): Omit<TrackerItem, "id" | "updated">[] {
  return [
    row(`${base}/Concepts`, `${area.name}: first-pass concepts`, "Lecture", area.focus),
    row(`${base}/Active Recall`, `${area.name}: retrieval pass`, "DLA"),
    row(`${base}/PQs`, `${area.name}: board questions`, "PQ"),
    row(`${base}/Anki`, `${area.name}: missed-fact cards`, "Reading"),
  ];
}

function row(path: string, label: string, kind: TrackerKind, note?: string): Omit<TrackerItem, "id" | "updated"> {
  return { path, label, kind, passes: 0, ankiPasses: 0, yield: "none", note };
}

function areaItems(exam: ExamConfig, area: BlueprintArea, items: TrackerItem[]) {
  const needle = area.name.toLowerCase();
  return items.filter((t) => {
    const hay = `${t.path} ${t.label}`.toLowerCase();
    return t.path.startsWith(`${exam.prefix}/${area.name}`) || hay.includes(needle) || area.tags.some((tag) => hay.includes(tag));
  });
}

function maxPercent(range: string): number {
  const nums = range.match(/\d+/g)?.map(Number) ?? [0];
  return Math.max(...nums);
}

function buildBoardSuggestions(exam: ExamConfig, prep: BoardPrepProfile, items: TrackerItem[]) {
  const out = suggestMoves(items, 2).map((sg) => ({ title: sg.title, reason: sg.reason, color: sg.color }));
  if (!items.length) {
    out.unshift({ title: `Install the ${exam.shortLabel} blueprint`, reason: "Create content, active recall, PQ, and Anki tracker rows before planning detail.", color: "var(--purple)" });
  }
  if (!prep.resourcesDone.includes("qbank")) {
    out.push({ title: "Choose a question engine", reason: "Practice testing is the highest-yield engine. Even 20-40 reviewed questions beats passive review.", color: "var(--orange)" });
  }
  if (!prep.resourcesDone.some((id) => id.includes("nbme") || id.includes("cbssa") || id.includes("ccssa"))) {
    out.push({ title: "Schedule the first self-assessment", reason: "Use it as calibration after enough question exposure, then convert weak systems into tracker rows.", color: "var(--cyan)" });
  }
  if (prep.contentStarted === "not-started" || prep.confidence === "low") {
    out.push({ title: "Start with foundation plus retrieval", reason: "Pair each concept block with a short recall pass the same day and a spaced pass later.", color: PASS_COLOR.untouched });
  }
  return out.slice(0, 4);
}

function buildPrepSchedule(exam: ExamConfig, prep: BoardPrepProfile) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = prep.examDate ? dateFromKey(prep.examDate) : undefined;
  const weeksLeftRaw = examDate ? Math.max(1, Math.ceil((examDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000))) : recommendedWeeks(prep);
  const weeksLeft = Math.max(1, Math.min(weeksLeftRaw, 32));
  const currentPhase = phaseFor(prep, weeksLeft);
  const urgency = weeksLeft <= 4 ? "red" : weeksLeft <= 8 ? "orange" : "green";
  const phases = phaseDistribution(prep, weeksLeft);
  const areaOrder = [...exam.areas].sort((a, b) => maxPercent(b.range) - maxPercent(a.range));
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
    : "No exam date set - using an adaptive rolling plan";

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
  if (phase === "Retrieval") return "Closed-notes recall, then patch misses into tracker/Anki.";
  if (phase === "Questions") return "Timed mixed questions, explanation review, then missed-fact cards.";
  if (phase === "Assessment") return "Assessment block, error log, and weak-system repair.";
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
      cards,
      grade,
      active: minutes > 0 || cards > 0,
      intensity: Math.min(100, Math.max((minutes / 240) * 100, (cards / 200) * 100)),
    };
  });
  return {
    days,
    minutes: days.reduce((sum, day) => sum + day.minutes, 0),
    cards: days.reduce((sum, day) => sum + day.cards, 0),
  };
}

function dateFromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
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
    updated: new Date().toISOString(),
  };
}
