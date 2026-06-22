import type { PremedExperienceEntry, PremedExperienceKind } from "./types";

export const PREMED_KINDS: PremedExperienceKind[] = ["Clinical", "Service", "Research", "Shadowing", "Leadership"];

export interface PremedKindScore {
  kind: PremedExperienceKind;
  entries: number;
  hours: number;
  verifiedHours: number;
  evidenceCount: number;
  reflectionCount: number;
  months: number;
  competencies: string[];
  milestones: string[];
}

export interface PremedEvidenceStrength {
  score: number;
  rank: "Starting" | "Developing" | "Strong" | "Compelling";
  rationale: string[];
  nextActions: string[];
  kindScores: PremedKindScore[];
  competencyCount: number;
  verifiedRatio: number;
}

type MilestonePattern = readonly [string, RegExp];

const RESEARCH_PATTERNS: MilestonePattern[] = [
  ["Literature review", /literature|pubmed|background|review/i],
  ["Research training", /citi|irb|training|ethics/i],
  ["Data work", /data|chart review|analysis|coding|spreadsheet|redcap/i],
  ["Abstract", /abstract/i],
  ["Poster", /poster/i],
  ["Presentation", /presentation|presented|oral/i],
  ["Manuscript", /manuscript|draft|writing/i],
  ["Submission", /submitted|submission/i],
  ["Publication / award", /published|publication|grant|award/i],
];

const CLINICAL_SERVICE_PATTERNS: MilestonePattern[] = [
  ["Exposure", /shadow|observe|clinic|hospital|patient/i],
  ["Longitudinal commitment", /weekly|monthly|semester|longitudinal|ongoing|continued/i],
  ["Responsibility", /trained|responsible|coordinated|managed|lead/i],
  ["Patient-facing maturity", /patient|family|counsel|listen|communication/i],
  ["Service impact", /served|impact|community|advocacy|outreach/i],
  ["Reflection quality", /learned|changed|realized|feedback|challenge|mistake/i],
];

const LEADERSHIP_PATTERNS: MilestonePattern[] = [
  ["Membership", /member|joined|club|team/i],
  ["Responsibility", /officer|committee|responsible|coordinated/i],
  ["Project ownership", /founded|built|launched|organized|project/i],
  ["Mentorship", /mentor|tutor|teach|trained/i],
  ["Measurable impact", /\d+|increased|decreased|raised|served|attendance|outcome/i],
  ["Sustained contribution", /semester|year|ongoing|weekly|monthly/i],
];

export function premedEvidenceStrength(entries: PremedExperienceEntry[]): PremedEvidenceStrength {
  const kindScores = PREMED_KINDS.map((kind) => scoreKind(kind, entries.filter((entry) => entry.kind === kind)));
  const totalHours = kindScores.reduce((sum, item) => sum + item.hours, 0);
  const verifiedHours = kindScores.reduce((sum, item) => sum + item.verifiedHours, 0);
  const allCompetencies = new Set(kindScores.flatMap((item) => item.competencies));
  const activeKinds = kindScores.filter((item) => item.entries > 0).length;
  const evidenceCount = kindScores.reduce((sum, item) => sum + item.evidenceCount, 0);
  const reflectionCount = kindScores.reduce((sum, item) => sum + item.reflectionCount, 0);
  const months = new Set(entries.map((entry) => entry.date.slice(0, 7))).size;
  const milestoneCount = new Set(kindScores.flatMap((item) => item.milestones)).size;

  const breadth = Math.min(20, activeKinds * 4);
  const verification = totalHours ? Math.min(20, (verifiedHours / totalHours) * 20) : 0;
  const evidence = Math.min(15, evidenceCount * 3);
  const reflection = Math.min(15, reflectionCount * 2.5);
  const sustainment = Math.min(15, months * 3);
  const competency = Math.min(10, allCompetencies.size * 0.8);
  const progression = Math.min(5, milestoneCount * 0.5);
  const score = Math.round(breadth + verification + evidence + reflection + sustainment + competency + progression);

  const rationale = [
    `${activeKinds}/5 experience domains have entries`,
    `${Math.round(totalHours ? (verifiedHours / totalHours) * 100 : 0)}% of logged hours are verified`,
    `${allCompetencies.size} competency tag${allCompetencies.size === 1 ? "" : "s"} represented`,
    `${months} active month${months === 1 ? "" : "s"} logged`,
  ];
  const nextActions = buildNextActions({ activeKinds, evidenceCount, reflectionCount, verifiedHours, totalHours, months, allCompetencies, kindScores });

  return {
    score,
    rank: rank(score),
    rationale,
    nextActions,
    kindScores,
    competencyCount: allCompetencies.size,
    verifiedRatio: totalHours ? verifiedHours / totalHours : 0,
  };
}

function scoreKind(kind: PremedExperienceKind, entries: PremedExperienceEntry[]): PremedKindScore {
  const text = entries.map((entry) => `${entry.title} ${entry.organization} ${entry.reflection} ${entry.notes ?? ""} ${(entry.competencyTags ?? []).join(" ")}`).join(" ");
  const patterns = kind === "Research" ? RESEARCH_PATTERNS
    : kind === "Leadership" ? LEADERSHIP_PATTERNS
      : CLINICAL_SERVICE_PATTERNS;
  return {
    kind,
    entries: entries.length,
    hours: round1(entries.reduce((sum, entry) => sum + entry.hours, 0)),
    verifiedHours: round1(entries.filter((entry) => entry.verified).reduce((sum, entry) => sum + entry.hours, 0)),
    evidenceCount: entries.filter((entry) => Boolean(entry.evidenceLink || entry.contact || entry.verified)).length,
    reflectionCount: entries.filter((entry) => entry.reflection.trim().split(/\s+/).filter(Boolean).length >= 10).length,
    months: new Set(entries.map((entry) => entry.date.slice(0, 7))).size,
    competencies: [...new Set(entries.flatMap((entry) => entry.competencyTags ?? []))].sort(),
    milestones: patterns.filter(([, rx]) => rx.test(text)).map(([label]) => label),
  };
}

function buildNextActions({
  activeKinds, evidenceCount, reflectionCount, verifiedHours, totalHours, months, allCompetencies, kindScores,
}: {
  activeKinds: number;
  evidenceCount: number;
  reflectionCount: number;
  verifiedHours: number;
  totalHours: number;
  months: number;
  allCompetencies: Set<string>;
  kindScores: PremedKindScore[];
}): string[] {
  const actions: string[] = [];
  if (activeKinds < 3) actions.push("Add one meaningful entry in a missing domain before adding more raw hours.");
  if (totalHours > 0 && verifiedHours / totalHours < 0.5) actions.push("Attach verifier/contact or evidence links to your strongest existing entries.");
  if (reflectionCount < Math.max(2, evidenceCount / 2)) actions.push("Rewrite two reflections with what you did, what changed, and what competency it proves.");
  if (months < 3 && totalHours > 0) actions.push("Favor a repeatable weekly commitment over scattered one-off logs.");
  if (allCompetencies.size < 6) actions.push("Tag entries to AAMC-style competencies so application stories are easier to retrieve.");
  const research = kindScores.find((item) => item.kind === "Research");
  if (research && research.entries > 0 && !research.milestones.some((m) => /Abstract|Poster|Presentation|Manuscript|Publication/.test(m))) {
    actions.push("For research, define the next output: abstract, poster, manuscript contribution, presentation, or award.");
  }
  return actions.slice(0, 4);
}

function rank(score: number): PremedEvidenceStrength["rank"] {
  if (score >= 78) return "Compelling";
  if (score >= 58) return "Strong";
  if (score >= 30) return "Developing";
  return "Starting";
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
