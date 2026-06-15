import { useMemo, useState } from "react";
import {
  Brain, CheckCircle2, ClipboardCheck, Database, ExternalLink, FlaskConical,
  ListChecks, ListPlus, Plus, Sparkles, WandSparkles,
} from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, PanelHeader, Tag } from "../components/ui/primitives";
import { PASS_COLOR, scopeMastery, suggestMoves } from "../lib/tracker";
import type { BoardExamId, BoardPrepProfile, TrackerItem, Yield } from "../lib/types";

// ---------------------------------------------------------------------------
// STEP / boards = a *simple, big-picture* blueprint. Installing a blueprint
// drops one editable Course-Tracker row per major domain (no first-pass /
// missed-fact granularity). You add detail later; everything is modular.
// ---------------------------------------------------------------------------

interface Domain {
  name: string;
  weight: "high" | "medium" | "low";
  focus: string;
}

interface ExamConfig {
  label: string;
  shortLabel: string;
  prefix: string; // tracker path root, e.g. "STEP 1"
  structure: string;
  officialOutline: string;
  practiceMaterials: string;
  domains: Domain[];
}

interface PrepResource { id: string; title: string; kind: string; url: string; why: string; tags: string[]; }

const EXAMS: Record<BoardExamId, ExamConfig> = {
  step1: {
    label: "STEP 1", shortLabel: "Step 1", prefix: "STEP 1",
    structure: "Big-picture USMLE Step 1 domains. Install once, then add detail under any domain as you go.",
    officialOutline: "https://www.usmle.org/exam-resources/step-1-materials/step-1-content-outline-and-specifications",
    practiceMaterials: "https://www.usmle.org/exam-resources/step-1-materials/step-1-sample-test-questions",
    domains: [
      { name: "Cardiovascular", weight: "high", focus: "hemodynamics, heart & vessel pathology, cardio pharm" },
      { name: "Respiratory", weight: "high", focus: "gas exchange, pulmonary pathology, acid–base" },
      { name: "Renal", weight: "high", focus: "filtration, electrolytes, fluids, acid–base, renal path" },
      { name: "Gastrointestinal", weight: "high", focus: "GI/liver/pancreas, metabolism, nutrition links" },
      { name: "Reproductive & Endocrine", weight: "high", focus: "hormones, diabetes, repro, pregnancy basics" },
      { name: "Neuro, Behavioral & Senses", weight: "high", focus: "neuroanatomy, psych, behavior, sleep, special senses" },
      { name: "MSK, Skin & Connective", weight: "medium", focus: "derm, rheum, bone, muscle, connective tissue" },
      { name: "Blood & Immune", weight: "medium", focus: "heme, immune mechanisms, inflammation, neoplasia" },
      { name: "Multisystem (Micro/Pharm/Path)", weight: "high", focus: "microbiology, pharmacology, pathology patterns, sepsis" },
      { name: "Biostats, Ethics & Comm.", weight: "medium", focus: "biostats, epidemiology, ethics, communication" },
    ],
  },
  step2: {
    label: "STEP 2 CK", shortLabel: "Step 2", prefix: "STEP 2 CK",
    structure: "Big-picture clinical domains for Step 2 CK. Diagnosis and management across the systems.",
    officialOutline: "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-content-outline-specifications",
    practiceMaterials: "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-sample-test-questions",
    domains: [
      { name: "Medicine", weight: "high", focus: "cardio, pulm, renal, endo, GI, heme/onc, ID" },
      { name: "Surgery & Emergency", weight: "medium", focus: "acute abdomen, trauma, perioperative, unstable patients" },
      { name: "Pediatrics", weight: "medium", focus: "development, prevention, pediatric disease, emergencies" },
      { name: "OB/GYN", weight: "medium", focus: "pregnancy, postpartum, gynecology, repro endocrine" },
      { name: "Psychiatry", weight: "medium", focus: "diagnosis, risk, therapy, substance use" },
      { name: "Ethics, Safety & Biostats", weight: "medium", focus: "capacity, consent, QI, screening, literature" },
    ],
  },
  step3: {
    label: "STEP 3", shortLabel: "Step 3", prefix: "STEP 3",
    structure: "Big-picture management-focused domains for Step 3 and CCS-style care.",
    officialOutline: "https://www.usmle.org/exam-resources/step-3-materials/step-3-content-outline-and-specifications",
    practiceMaterials: "https://www.usmle.org/exam-resources/step-3-materials/step-3-sample-test-questions",
    domains: [
      { name: "Ambulatory Medicine", weight: "high", focus: "outpatient diagnosis, chronic disease, prevention" },
      { name: "Emergency & Inpatient", weight: "high", focus: "triage, disposition, acute management" },
      { name: "CCS Case Management", weight: "high", focus: "orders, monitoring, timing, reassessment, safety" },
      { name: "Biostats, Ethics & Systems", weight: "medium", focus: "abstracts, quality, safety, legal/ethical" },
    ],
  },
  shelf: {
    label: "Shelf Exams", shortLabel: "Shelf", prefix: "SHELF",
    structure: "Big-picture rotation shelves. Add the rotation you're on, then expand it.",
    officialOutline: "https://www.nbme.org/subject-exams/clinical-science",
    practiceMaterials: "https://www.nbme.org/examinees/self-assessments/clinical-science-subject-exams",
    domains: [
      { name: "Medicine", weight: "high", focus: "adult systems, diagnosis, management, prevention" },
      { name: "Surgery", weight: "medium", focus: "acute abdomen, trauma, perioperative, emergencies" },
      { name: "Pediatrics", weight: "medium", focus: "development, prevention, pediatric presentations" },
      { name: "OB/GYN", weight: "medium", focus: "pregnancy, gynecology, postpartum, emergencies" },
      { name: "Psychiatry", weight: "medium", focus: "diagnosis, risk, therapy, substance use" },
      { name: "Family Medicine", weight: "medium", focus: "screening, prevention, ambulatory care" },
    ],
  },
  mcat: {
    label: "MCAT", shortLabel: "MCAT", prefix: "MCAT",
    structure: "Big-picture AAMC sections. Expand each into subjects later.",
    officialOutline: "https://students-residents.aamc.org/prepare-mcat-exam/whats-mcat-exam",
    practiceMaterials: "https://students-residents.aamc.org/prepare-mcat-exam/prepare-mcat-exam",
    domains: [
      { name: "Chem/Phys", weight: "high", focus: "gen chem, organic, physics, biochem, passages" },
      { name: "CARS", weight: "high", focus: "passage reasoning, main idea, tone, inference, timing" },
      { name: "Bio/Biochem", weight: "high", focus: "biology, biochemistry, experimental reasoning" },
      { name: "Psych/Soc", weight: "high", focus: "behavior, sociology, psychology, study interpretation" },
    ],
  },
  premed: {
    label: "Pre-Med", shortLabel: "Pre-Med", prefix: "PRE-MED",
    structure: "Big-picture pre-med tracks: coursework, experiences, application, and the MCAT runway.",
    officialOutline: "https://students-residents.aamc.org/applying-medical-school-amcas/applying-medical-school-amcas",
    practiceMaterials: "https://students-residents.aamc.org/prepare-mcat-exam/prepare-mcat-exam",
    domains: [
      { name: "Prerequisites", weight: "high", focus: "bio, chem, physics, math, writing, GPA protection" },
      { name: "Clinical & Service", weight: "medium", focus: "clinical exposure, volunteering, reflection" },
      { name: "Research & Leadership", weight: "medium", focus: "research, presentations, leadership" },
      { name: "Application Materials", weight: "medium", focus: "personal statement, activities, school list, letters" },
      { name: "MCAT Runway", weight: "medium", focus: "content map, diagnostic, schedule, practice" },
    ],
  },
};

const RESOURCE_CATALOG: Record<BoardExamId, PrepResource[]> = {
  step1: [
    { id: "usmle-outline", title: "USMLE Step 1 Content Outline", kind: "Official", url: EXAMS.step1.officialOutline, why: "The blueprint these domains come from.", tags: ["official", "blueprint"] },
    { id: "usmle-samples", title: "USMLE Step 1 Sample Questions", kind: "Official", url: EXAMS.step1.practiceMaterials, why: "Official item style and format.", tags: ["official", "practice"] },
    { id: "nbme-cbssa", title: "NBME CBSSA", kind: "Assessment", url: "https://www.nbme.org/examinees/self-assessments/comprehensive-basic-science-self-assessment", why: "Readiness checks.", tags: ["nbme", "assessment"] },
    { id: "qbank", title: "Question bank (AMBOSS/UWorld)", kind: "Qbank", url: "https://www.amboss.com/us", why: "Daily retrieval + explanation review.", tags: ["qbank"] },
    { id: "anking", title: "AnKing Step Deck", kind: "Anki", url: "https://www.ankihub.net/step-deck", why: "Spaced retrieval for missed facts.", tags: ["anki"] },
    { id: "mehlman", title: "Mehlman Medical HY PDFs", kind: "Review", url: "https://mehlmanmedical.com/free-stuff/", why: "Targeted high-yield review.", tags: ["hy"] },
  ],
  step2: [
    { id: "usmle-outline", title: "USMLE Step 2 CK Content Outline", kind: "Official", url: EXAMS.step2.officialOutline, why: "Blueprint anchor.", tags: ["official"] },
    { id: "qbank", title: "UWorld Step 2 CK", kind: "Qbank", url: "https://www.uworld.com/", why: "Primary clinical qbank.", tags: ["qbank"] },
    { id: "nbme", title: "NBME CCSSA", kind: "Assessment", url: "https://www.nbme.org/examinees/self-assessments", why: "Readiness checks.", tags: ["nbme"] },
  ],
  step3: [
    { id: "usmle-outline", title: "USMLE Step 3 Content Outline", kind: "Official", url: EXAMS.step3.officialOutline, why: "Blueprint anchor.", tags: ["official"] },
    { id: "ccs", title: "CCS case practice", kind: "Practice", url: "https://www.usmle.org/exam-resources/step-3-materials", why: "Order/monitor/reassess practice.", tags: ["ccs"] },
  ],
  shelf: [
    { id: "nbme-clinical", title: "NBME Clinical Science Subject Exams", kind: "Official", url: EXAMS.shelf.officialOutline, why: "Rotation anchor.", tags: ["official"] },
    { id: "qbank", title: "Rotation qbank blocks", kind: "Qbank", url: "https://www.amboss.com/us", why: "Daily shelf reasoning.", tags: ["qbank"] },
  ],
  mcat: [
    { id: "aamc-overview", title: "AAMC MCAT Overview", kind: "Official", url: EXAMS.mcat.officialOutline, why: "Official section structure.", tags: ["official"] },
    { id: "aamc-prep", title: "AAMC MCAT Prep Hub", kind: "Official", url: EXAMS.mcat.practiceMaterials, why: "Official practice + full-lengths.", tags: ["practice"] },
  ],
  premed: [
    { id: "amcas", title: "AAMC AMCAS Hub", kind: "Official", url: EXAMS.premed.officialOutline, why: "Application timeline + materials.", tags: ["application"] },
    { id: "mcat-prep", title: "AAMC MCAT Prep Hub", kind: "Official", url: EXAMS.premed.practiceMaterials, why: "MCAT runway.", tags: ["mcat"] },
  ],
};

const EVIDENCE = [
  { title: "Start broad", body: "A big-picture blueprint beats an exhaustive checklist on day one. Add detail where questions reveal weak areas.", source: "USMLE specifications", url: EXAMS.step1.officialOutline },
  { title: "Practice testing", body: "Questions are learning events: explanation review, error log, then a retest.", source: "Dunlosky et al., 2013", url: "https://pubmed.ncbi.nlm.nih.gov/26173288/" },
  { title: "Distributed practice", body: "Space review across days. Noctyrium turns weak domains into repeat tracker passes.", source: "Dunlosky et al., 2013", url: "https://pubmed.ncbi.nlm.nih.gov/26173288/" },
];

const weightTone: Record<Domain["weight"], "green" | "cyan" | "neutral"> = { high: "green", medium: "cyan", low: "neutral" };
const weightYield: Record<Domain["weight"], Yield> = { high: "high", medium: "none", low: "low" };

function defaultPrep(exam: BoardExamId): BoardPrepProfile {
  return {
    medYear: exam === "step1" ? "MS2" : exam === "premed" ? "Pre-Med" : "MS3",
    contentStarted: exam === "step1" ? "light" : "not-started",
    weeklyHours: exam === "step1" ? 18 : 12,
    questionTarget: 40, resourcesDone: [], otherResources: "", confidence: "medium",
    blueprintLogs: [], updated: new Date().toISOString(),
  };
}

export function StepPage() {
  const s = useStore();
  const [examId, setExamId] = useState<BoardExamId>("step1");
  const [flash, setFlash] = useState<{ msg: string; href: string } | null>(null);
  const exam = EXAMS[examId];
  const prep = s.boardPrep?.[examId] ?? defaultPrep(examId);
  const resources = RESOURCE_CATALOG[examId];

  const examItems = useMemo(() => s.tracker.filter((t) => t.path === exam.prefix || t.path.startsWith(exam.prefix + "/")), [s.tracker, exam.prefix]);
  const readiness = scopeMastery(examItems);
  const installedNames = new Set(examItems.map((t) => t.label));
  const installedCount = exam.domains.filter((d) => installedNames.has(d.name)).length;
  const officialInstalled = resources.every((res) => s.resources.some((r) => r.url === res.url));
  const suggestions = suggestMoves(examItems, 3);

  function announce(msg: string, href: string) {
    setFlash({ msg, href });
    window.setTimeout(() => setFlash(null), 6000);
  }
  function patchPrep(patch: Partial<BoardPrepProfile>) { s.updateBoardPrep(examId, patch); }

  function domainRow(d: Domain): Omit<TrackerItem, "id" | "updated"> {
    return { path: exam.prefix, label: d.name, kind: "Lecture", passes: 0, ankiPasses: 0, yield: weightYield[d.weight], note: d.focus };
  }
  function installDomain(d: Domain) {
    if (installedNames.has(d.name)) return;
    s.addTrackerItem(domainRow(d));
    announce(`Added “${d.name}” to the Course Tracker under ${exam.prefix}.`, "#tracker");
  }
  function installAll() {
    const next = exam.domains.filter((d) => !installedNames.has(d.name)).map(domainRow);
    if (next.length) s.bulkAddTrackerItems(next);
    announce(next.length ? `Installed ${next.length} big domains into the Course Tracker.` : "All big domains are already in your tracker.", "#tracker");
  }
  function installResources() {
    const existing = new Set(s.resources.map((r) => r.url));
    const next = resources.filter((r) => !existing.has(r.url)).map((r) => ({
      title: r.title, url: r.url, category: exam.label, tags: r.tags, note: r.why,
      favorite: r.kind === "Official" || r.kind === "Assessment",
    }));
    if (next.length) s.bulkAddResources(next);
    announce(next.length ? `Activated ${next.length} resources on the Resources page.` : "These resources are already saved.", "#resources");
  }
  function toggleResource(id: string) {
    patchPrep({ resourcesDone: prep.resourcesDone.includes(id) ? prep.resourcesDone.filter((x) => x !== id) : [...prep.resourcesDone, id] });
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
                  <button key={id} className={`filter-pill ${examId === id ? "on" : ""}`} onClick={() => setExamId(id)}>{EXAMS[id].shortLabel}</button>
                ))}
              </div>
              <div className="step-title">{exam.label} Blueprint</div>
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
          <GButton variant="primary" onClick={installAll}><ListPlus size={14} /> Install blueprint ({installedCount}/{exam.domains.length})</GButton>
          <GButton onClick={installResources} disabled={officialInstalled}><Database size={14} /> Activate resources</GButton>
          <a className="gbtn" href="#tracker"><ListChecks size={14} /> Open in Course Tracker</a>
          <a className="gbtn" href={exam.officialOutline} target="_blank" rel="noreferrer noopener">Official outline <ExternalLink size={14} /></a>
        </div>
        {flash && <a className="step-flash" href={flash.href}><CheckCircle2 size={15} /> <span>{flash.msg}</span> <span className="step-flash-go">Open →</span></a>}
        <div className="sub" style={{ marginTop: 10 }}>
          <WandSparkles size={13} style={{ verticalAlign: -2, marginRight: 4, color: "var(--cyan)" }} />
          Generated locally from the official {exam.shortLabel} outline — superficial big-picture domains only. Add lectures, DLAs, and PQs under any domain in the Course Tracker.
        </div>
      </GlassCard>

      <GlassCard pad>
        <PanelHeader title="Big-picture domains" sub="One row per major domain — install all, or add them individually" />
        <div className="stack gap8">
          {exam.domains.map((d) => {
            const installed = installedNames.has(d.name);
            const items = examItems.filter((t) => t.label === d.name || t.path.startsWith(`${exam.prefix}/${d.name}`));
            const pct = scopeMastery(items);
            return (
              <div className="blueprint-row" key={d.name}>
                <div className="grow">
                  <div className="spread">
                    <div className="bp-title">{d.name}</div>
                    <Tag tone={weightTone[d.weight]}>{d.weight} yield</Tag>
                  </div>
                  <div className="bp-focus">{d.focus}</div>
                  {installed && (
                    <div className="track" style={{ marginTop: 8 }}>
                      <div className="track-fill" style={{ width: `${pct}%`, background: pct >= 75 ? PASS_COLOR.mastered : pct >= 50 ? PASS_COLOR.mature : pct > 0 ? PASS_COLOR.red : "rgba(255,255,255,0.12)" }} />
                    </div>
                  )}
                </div>
                {installed
                  ? <Tag tone="green"><CheckCircle2 size={12} /> Installed</Tag>
                  : <GButton size="sm" onClick={() => installDomain(d)}><Plus size={13} /> Add</GButton>}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <div className="step-overview-grid">
        <GlassCard pad>
          <PanelHeader title={`Customize ${exam.shortLabel}`} sub="Saved locally under your profile" />
          <div className="step-form-grid">
            <label className="stack gap6">
              <span className="field-label">Med-school year</span>
              <select className="field" aria-label="Med-school year" value={prep.medYear} onChange={(e) => patchPrep({ medYear: e.target.value })}>
                {["Pre-Med", "MS1", "MS2", "MS3", "MS4", "Graduate / IMG", "Other"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </label>
            <label className="stack gap6">
              <span className="field-label">Content started</span>
              <select className="field" aria-label="Content started" value={prep.contentStarted} onChange={(e) => patchPrep({ contentStarted: e.target.value as BoardPrepProfile["contentStarted"] })}>
                <option value="not-started">Not started</option>
                <option value="light">Light exposure</option>
                <option value="half">About half</option>
                <option value="most">Most covered</option>
                <option value="dedicated">Dedicated review</option>
              </select>
            </label>
            <label className="stack gap6">
              <span className="field-label">Target date</span>
              <input className="field" type="date" value={prep.examDate ?? ""} onChange={(e) => patchPrep({ examDate: e.target.value || undefined })} />
            </label>
            <label className="stack gap6">
              <span className="field-label">Weekly hours</span>
              <input className="field" type="number" min={1} max={80} value={prep.weeklyHours} onChange={(e) => patchPrep({ weeklyHours: Number(e.target.value) || 1 })} />
            </label>
            <label className="stack gap6">
              <span className="field-label">Daily questions</span>
              <input className="field" type="number" min={0} max={240} value={prep.questionTarget} onChange={(e) => patchPrep({ questionTarget: Number(e.target.value) || 0 })} />
            </label>
            <label className="stack gap6">
              <span className="field-label">Confidence</span>
              <select className="field" aria-label="Confidence" value={prep.confidence} onChange={(e) => patchPrep({ confidence: e.target.value as BoardPrepProfile["confidence"] })}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </label>
          </div>
          <label className="stack gap6" style={{ marginTop: 12 }}>
            <span className="field-label">Other resources / constraints</span>
            <input className="field" placeholder="Pathoma, Sketchy, UWorld, mentor plan…" value={prep.otherResources} onChange={(e) => patchPrep({ otherResources: e.target.value })} />
          </label>
        </GlassCard>

        <GlassCard pad>
          <PanelHeader title="Resource activation" sub="Check what you already use" />
          <div className="resource-checks">
            {resources.map((res) => (
              <button key={res.id} className={`resource-check ${prep.resourcesDone.includes(res.id) ? "on" : ""}`} onClick={() => toggleResource(res.id)}>
                <CheckCircle2 size={16} />
                <div><b>{res.title}</b><span>{res.kind} — {res.why}</span></div>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="step-overview-grid">
        <GlassCard pad>
          <PanelHeader title="Suggested next move" sub="From your installed domains + tracker state" />
          <div className="stack gap8">
            {suggestions.map((sg) => (
              <div className="sugg" key={sg.title}>
                <span className="sugg-dot" style={{ background: sg.color }} />
                <div className="grow"><div className="sugg-title">{sg.title}</div><div className="sugg-reason">{sg.reason}</div></div>
                <Sparkles size={15} style={{ color: "var(--cyan)" }} />
              </div>
            ))}
            <GButton size="sm" onClick={() => { s.addTask(`${exam.shortLabel}: ${prep.questionTarget} reviewed questions`, undefined, exam.label); announce("Added a question-block task to Tasks.", "#tasks"); }}>
              <ClipboardCheck size={14} /> Add today's question block to Tasks
            </GButton>
          </div>
        </GlassCard>

        <GlassCard pad>
          <PanelHeader title="Why big-picture first" sub="Evidence behind the approach" />
          <div className="evidence-grid">
            {EVIDENCE.map((item) => (
              <a className="evidence-card" href={item.url} target="_blank" rel="noreferrer noopener" key={item.title}>
                <span><FlaskConical size={15} /></span>
                <div><b>{item.title}</b><small>{item.body}</small><em>{item.source}</em></div>
              </a>
            ))}
          </div>
        </GlassCard>
      </div>
    </>
  );
}
