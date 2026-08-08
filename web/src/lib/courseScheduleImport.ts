import type { TrackerItem, TrackerKind } from "./types";

export interface ScheduleCandidate { id: string; date?: string; label: string; kind: TrackerKind; sourceLine: number; selected: boolean; duplicate: "exact" | "likely" | "none"; }
const KIND_MAP: Array<[RegExp, TrackerKind]> = [[/\b(exam|quiz|assessment|imcq)\b/i,"Assessment"],[/\b(dla|daily learning)\b/i,"DLA"],[/\b(lab|practical)\b/i,"Lab"],[/\b(question|pq|qbank)\b/i,"PQ"],[/\b(review)\b/i,"Review Loop"],[/\b(reading|chapter)\b/i,"Reading"],[/\b(assignment|deadline|requirement)\b/i,"Requirement"]];
export function parseCourseSchedule(text: string, existing: readonly TrackerItem[] = []): ScheduleCandidate[] {
  const exact = new Set(existing.map((item) => identity(item.label, item.kind, dateFrom(item.assessmentDate, item.note))));
  const labels = new Set(existing.map((item) => normalize(item.label)));
  return text.split(/\r?\n/).flatMap((raw, index) => {
    const line = raw.trim(); if (!line || /^date[,\t]/i.test(line)) return [];
    const cells = line.includes(",") ? line.split(",").map((cell) => cell.trim()) : line.split(/\t+/).map((cell) => cell.trim());
    const date = parseDate(cells[0]); const body = date ? cells.slice(1).join(" ") : line;
    const lastIndex = cells.length - 1;
    const explicitKindIndex = cells.length >= 3 && KIND_MAP.some(([pattern]) => pattern.test(cells[lastIndex])) ? lastIndex : -1;
    const kind = detectKind(explicitKindIndex >= 0 ? cells[explicitKindIndex] : body);
    const label = date && explicitKindIndex >= 0 ? cells.slice(1, explicitKindIndex).join(" ").trim() : cleanLabel(body, kind);
    if (!label) return [];
    const key = identity(label, kind, date); const duplicate = exact.has(key) ? "exact" : labels.has(normalize(label)) ? "likely" : "none";
    return [{ id: `schedule-${index + 1}-${normalize(label).slice(0,20)}`, date, label, kind, sourceLine: index + 1, selected: duplicate !== "exact", duplicate }];
  });
}
export function scheduleCandidatesToTracker(candidates: readonly ScheduleCandidate[], path: string): Array<Omit<TrackerItem,"id"|"updated">> {
  return candidates.filter((candidate) => candidate.selected && candidate.duplicate !== "exact").map((candidate) => ({ path, label: candidate.label, kind: candidate.kind, passes: 0, ankiPasses: 0, yield: "none", assessmentDate: candidate.kind === "Assessment" ? candidate.date : undefined, note: candidate.date ? `Scheduled ${candidate.date}` : undefined }));
}
function detectKind(value:string):TrackerKind { return KIND_MAP.find(([pattern]) => pattern.test(value))?.[1] ?? "Lecture"; }
function cleanLabel(value:string,kind:TrackerKind){return value.replace(/^\d{4}-\d{1,2}-\d{1,2}[,\t\s-]*/i,"").replace(new RegExp(`\\b${kind.replace(" ","[ -]?")}\\b`,"ig"),"").replace(/^[,\s:-]+|[,\s:-]+$/g,"").trim();}
function parseDate(value:string):string|undefined { const iso=value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); if(iso)return `${iso[1]}-${iso[2].padStart(2,"0")}-${iso[3].padStart(2,"0")}`; const us=value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/); if(us)return `${us[3].length===2?`20${us[3]}`:us[3]}-${us[1].padStart(2,"0")}-${us[2].padStart(2,"0")}`; return undefined; }
function identity(label:string,kind:TrackerKind,date?:string){return `${normalize(label)}|${kind}|${date??""}`;}
function normalize(value:string){return value.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();}
function dateFrom(value?:string,note?:string){return value??note?.match(/Scheduled (\d{4}-\d{2}-\d{2})/)?.[1];}
