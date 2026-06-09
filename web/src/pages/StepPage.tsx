import { useMemo, useState } from "react";
import { Brain, Target, ArrowRight, ListPlus, ExternalLink } from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, PanelHeader, Tag } from "../components/ui/primitives";
import { PASS_COLOR, scopeMastery, suggestMoves } from "../lib/tracker";
import type { TrackerItem, TrackerKind, Yield } from "../lib/types";

type ExamId = "step1" | "step2";

interface BlueprintArea {
  name: string;
  range: string;
  focus: string;
  tags: string[];
}

const EXAMS: Record<ExamId, { label: string; prefix: string; structure: string; source: string; areas: BlueprintArea[] }> = {
  step1: {
    label: "STEP 1",
    prefix: "STEP 1",
    structure: "As of May 14, 2026: 14 blocks x 30 minutes, 8-hour session, up to 20 questions per block.",
    source: "https://www.usmle.org/exam-resources/step-1-materials/step-1-content-outline-and-specifications",
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
    prefix: "STEP 2 CK",
    structure: "As of May 7, 2026: 16 blocks x 30 minutes, 9-hour session, up to 20 questions per block.",
    source: "https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-content-outline-specifications",
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

export function StepPage() {
  const s = useStore();
  const [examId, setExamId] = useState<ExamId>("step1");
  const exam = EXAMS[examId];

  const examItems = useMemo(
    () => s.tracker.filter((t) => t.path.startsWith(exam.prefix) || t.label.toLowerCase().includes(exam.label.toLowerCase())),
    [s.tracker, exam],
  );
  const readiness = scopeMastery(examItems);
  const suggestions = suggestMoves(examItems, 3);

  function installBlueprint() {
    const existing = new Set(s.tracker.map((t) => `${t.path}::${t.label}`.toLowerCase()));
    const next: Omit<TrackerItem, "id" | "updated">[] = [];

    exam.areas.forEach((area) => {
      const highYield = maxPercent(area.range) >= 10;
      const base = `${exam.prefix}/${area.name}`;
      blueprintRows(base, area, highYield).forEach((row) => {
        const key = `${row.path}::${row.label}`.toLowerCase();
        if (!existing.has(key)) next.push(row);
      });
    });

    if (next.length) s.bulkAddTrackerItems(next);
  }

  return (
    <>
      <GlassCard pad>
        <div className="tk-hero">
          <div className="row gap12">
            <span className="folder-icon" style={{ color: "var(--purple)" }}><Brain size={22} /></span>
            <div>
              <div className="step-tabs">
                {(Object.keys(EXAMS) as ExamId[]).map((id) => (
                  <button key={id} className={`filter-pill ${examId === id ? "on" : ""}`} onClick={() => setExamId(id)}>
                    {EXAMS[id].label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 10 }}>{exam.label} Readiness</div>
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
        <div className="row wrap gap8" style={{ marginTop: 16 }}>
          <GButton variant="primary" onClick={installBlueprint}><ListPlus size={14} /> Install {exam.label} blueprint</GButton>
          <a className="gbtn" href={exam.source} target="_blank" rel="noreferrer">Official outline <ExternalLink size={14} /></a>
          <a className="gbtn" href="#resources">Resources <ArrowRight size={14} /></a>
        </div>
      </GlassCard>

      <div className="grid grid-2">
        <GlassCard pad>
          <PanelHeader title={`${exam.label} content map`} sub="USMLE-weighted areas; your passes determine readiness" />
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
          <PanelHeader title="Board next moves" sub="Uses the same adaptive tracker logic as Course Tracker" />
          <div className="stack gap8">
            {suggestions.map((sg, i) => (
              <div className="sugg" key={i}>
                <span className="sugg-dot" style={{ background: sg.color }} />
                <div className="grow">
                  <div className="sugg-title">{sg.title}</div>
                  <div className="sugg-reason">{sg.reason}</div>
                </div>
                <Target size={16} style={{ color: "var(--orange)" }} />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard pad>
        <PanelHeader title="Resource spine" sub="Public scaffolding only; copyrighted deck/PDF contents are not copied into Noctyrium" />
        <div className="resource-spine">
          <a href="https://www.usmle.org/prepare-your-exam/step-1-materials" target="_blank" rel="noreferrer">USMLE Step 1 practice materials</a>
          <a href="https://www.usmle.org/prepare-your-exam/step-2-ck-materials" target="_blank" rel="noreferrer">USMLE Step 2 CK practice materials</a>
          <a href="https://www.ankihub.net/step-deck" target="_blank" rel="noreferrer">AnKing Step Deck on AnkiHub</a>
          <a href="https://mehlmanmedical.com/free-stuff/" target="_blank" rel="noreferrer">Mehlman Medical free HY index</a>
        </div>
      </GlassCard>
    </>
  );
}

function blueprintRows(base: string, area: BlueprintArea, highYield: boolean): Omit<TrackerItem, "id" | "updated">[] {
  const y: Yield = highYield ? "high" : "none";
  return [
    row(`${base}/Lectures`, `${area.name}: first-pass concepts`, "Lecture", y, area.focus),
    row(`${base}/DLAs`, `${area.name}: active recall / DLA`, "DLA", highYield ? "review" : y),
    row(`${base}/PQs`, `${area.name}: board questions`, "PQ", "high"),
    row(`${base}/Anki`, `${area.name}: unlock or make cards`, "Reading", y),
  ];
}

function row(path: string, label: string, kind: TrackerKind, y: Yield, note?: string): Omit<TrackerItem, "id" | "updated"> {
  return { path, label, kind, passes: 0, ankiPasses: 0, yield: y, note };
}

function areaItems(exam: (typeof EXAMS)[ExamId], area: BlueprintArea, items: TrackerItem[]) {
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
