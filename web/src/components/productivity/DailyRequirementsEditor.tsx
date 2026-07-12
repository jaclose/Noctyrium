import { useMemo, useState } from "react";
import { CalendarDays, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { localDateKey } from "../../lib/dailyRollover";
import { makeDailyRequirement } from "../../lib/dailySuccess";
import { useStore } from "../../lib/store";
import type { DailySuccessRequirement, DailySuccessSchedule, DailySuccessSource, HabitType } from "../../lib/types";
import { GButton } from "../ui/primitives";

const STANDARD: Array<{
  kind: DailySuccessSource["kind"];
  label: string;
  target: number;
  unit: string;
}> = [
  { kind: "study-minutes", label: "Study minutes", target: 60, unit: "minutes" },
  { kind: "cards-reviewed", label: "Cards reviewed", target: 30, unit: "cards" },
  { kind: "practice-questions", label: "Practice questions", target: 30, unit: "questions" },
  { kind: "journal-closeout", label: "Daily closeout", target: 1, unit: "closeout" },
];

export function DailyRequirementsEditor() {
  const store = useStore();
  const [customName, setCustomName] = useState("");
  const [customTarget, setCustomTarget] = useState("1");
  const [customUnit, setCustomUnit] = useState("times");
  const [customSchedule, setCustomSchedule] = useState<DailySuccessSchedule>({ kind: "daily" });
  const config = store.profile.dailySuccess;
  const today = store.activeDayKey || localDateKey();
  const shown = useMemo(() => config?.requirements ?? legacyPreview(store.profile.dailyMinuteTarget, store.profile.dailyCardTarget, today), [config, store.profile.dailyCardTarget, store.profile.dailyMinuteTarget, today]);
  const activeKinds = new Set(shown.map((requirement) => requirement.source.kind));

  function save(requirements: DailySuccessRequirement[]) {
    store.updateProfile({
      dailySuccess: {
        version: 1,
        configuredAt: config?.configuredAt ?? today,
        requirements,
      },
    });
  }

  function update(id: string, patch: Partial<DailySuccessRequirement>) {
    const changesScoringSemantics = Object.hasOwn(patch, "target") || Object.hasOwn(patch, "schedule");
    save(shown.map((requirement) => requirement.id === id
      ? {
          ...requirement,
          ...patch,
          ...(changesScoringSemantics ? { trackingStartsAt: today } : {}),
          updatedAt: new Date().toISOString(),
        }
      : requirement));
  }

  function remove(id: string) {
    save(shown.filter((requirement) => requirement.id !== id));
  }

  function addStandard(template: typeof STANDARD[number]) {
    const source = { kind: template.kind } as DailySuccessSource;
    save([...shown, makeDailyRequirement({
      id: `daily-${template.kind}`,
      label: template.label,
      source,
      target: template.target,
      unit: template.unit,
      trackingStartsAt: today,
    }, today)]);
  }

  function addCustom() {
    const name = customName.trim();
    if (!name) return;
    const target = Math.max(1, Number(customTarget) || 1);
    const habitType: HabitType = customSchedule.kind === "times-per-week"
      ? "weekly"
      : customSchedule.kind === "weekdays"
        ? "scheduled"
        : target > 1
          ? "count"
          : "binary";
    const habitId = store.addHabit({
      name,
      type: habitType,
      target,
      unit: customUnit.trim() || "times",
      weeklyTarget: customSchedule.kind === "times-per-week" ? customSchedule.times : undefined,
      schedule: customSchedule.kind === "weekdays" ? customSchedule.weekdays : undefined,
      trackingStartsAt: today,
    });
    save([...shown, makeDailyRequirement({
      id: `daily-habit-${habitId}`,
      label: name,
      source: { kind: "habit", habitId },
      target,
      unit: customUnit.trim() || "times",
      schedule: customSchedule,
      trackingStartsAt: today,
    }, today)]);
    setCustomName("");
    setCustomTarget("1");
  }

  return (
    <details className="daily-requirements-editor" data-tour="requirements">
      <summary><SlidersHorizontal size={14} aria-hidden="true" /> Daily requirements <span>{shown.length}</span></summary>
      <div className="daily-requirements-body">
        <p>
          Only enabled, scheduled requirements count. New requirements start today—AXOM never creates past misses.
          {config ? "" : " Your current minute/card rules remain active until you change this list."}
        </p>
        <div className="daily-requirement-list">
          {shown.length === 0 && <div className="daily-requirement-empty">No requirement is enabled. Today stays neutral until you choose one.</div>}
          {shown.map((requirement) => (
            <div className="daily-requirement-row" key={requirement.id}>
              <label className="daily-requirement-toggle">
                <input type="checkbox" checked={requirement.enabled} onChange={(event) => update(requirement.id, { enabled: event.target.checked, trackingStartsAt: today })} />
                <span><b>{requirement.label}</b><small>{sourceDescription(requirement.source)}</small></span>
              </label>
              <label><span>Target</span><input className="field" type="number" min="1" value={requirement.target} onChange={(event) => update(requirement.id, { target: Math.max(1, Number(event.target.value) || 1) })} /></label>
              <label><span>Schedule</span><select className="field" value={requirement.schedule.kind} onChange={(event) => update(requirement.id, { schedule: scheduleFromKind(event.target.value) })}>
                <option value="daily">Daily</option>
                <option value="weekdays">Selected weekdays</option>
                <option value="times-per-week">Times per week</option>
              </select></label>
              {requirement.schedule.kind === "weekdays" && (
                <WeekdayPicker value={requirement.schedule.weekdays} onChange={(weekdays) => update(requirement.id, { schedule: { kind: "weekdays", weekdays } })} />
              )}
              {requirement.schedule.kind === "times-per-week" && (
                <label><span>Times</span><input className="field" type="number" min="1" max="7" value={requirement.schedule.times} onChange={(event) => update(requirement.id, { schedule: { kind: "times-per-week", times: Math.max(1, Math.min(7, Number(event.target.value) || 1)), weekStartsOn: 1 } })} /></label>
              )}
              <button type="button" className="daily-requirement-remove" aria-label={`Remove ${requirement.label} requirement`} onClick={() => remove(requirement.id)}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        <div className="daily-requirement-add">
          <span>Add a standard signal</span>
          <div className="row wrap gap6">
            {STANDARD.filter((template) => !activeKinds.has(template.kind)).map((template) => (
              <GButton size="sm" key={template.kind} onClick={() => addStandard(template)}><Plus size={13} /> {template.label}</GButton>
            ))}
          </div>
        </div>

        <details className="daily-custom-requirement">
          <summary><CalendarDays size={14} /> Add a custom recurring requirement</summary>
          <div className="daily-custom-grid">
            <label><span>Name</span><input className="field" placeholder="Gym, reading, prayer, steps…" value={customName} onChange={(event) => setCustomName(event.target.value)} /></label>
            <label><span>Target</span><input className="field" type="number" min="1" value={customTarget} onChange={(event) => setCustomTarget(event.target.value)} /></label>
            <label><span>Unit</span><input className="field" placeholder="times" value={customUnit} onChange={(event) => setCustomUnit(event.target.value)} /></label>
            <label><span>Schedule</span><select className="field" value={customSchedule.kind} onChange={(event) => setCustomSchedule(scheduleFromKind(event.target.value))}>
              <option value="daily">Daily</option>
              <option value="weekdays">Monday–Friday</option>
              <option value="times-per-week">Times per week</option>
            </select></label>
            {customSchedule.kind === "times-per-week" && <label><span>Times</span><input className="field" type="number" min="1" max="7" value={customSchedule.times} onChange={(event) => setCustomSchedule({ ...customSchedule, times: Math.max(1, Math.min(7, Number(event.target.value) || 1)) })} /></label>}
            <GButton variant="primary" onClick={addCustom}><Plus size={14} /> Add requirement</GButton>
          </div>
        </details>
      </div>
    </details>
  );
}

function legacyPreview(minutes: number, cards: number, today: string): DailySuccessRequirement[] {
  return [
    makeDailyRequirement({ id: "legacy-study-minutes", label: "Study minutes", source: { kind: "study-minutes" }, target: Math.max(1, minutes || 240), unit: "minutes", trackingStartsAt: today }, today),
    makeDailyRequirement({ id: "legacy-cards-reviewed", label: "Cards reviewed", source: { kind: "cards-reviewed" }, target: Math.max(1, cards || 120), unit: "cards", trackingStartsAt: today }, today),
  ];
}

function scheduleFromKind(kind: string): DailySuccessSchedule {
  if (kind === "weekdays") return { kind: "weekdays", weekdays: [1, 2, 3, 4, 5] };
  if (kind === "times-per-week") return { kind: "times-per-week", times: 3, weekStartsOn: 1 };
  return { kind: "daily" };
}

function WeekdayPicker({ value, onChange }: { value: number[]; onChange: (value: number[]) => void }) {
  const labels = [
    ["S", "Sunday"], ["M", "Monday"], ["T", "Tuesday"], ["W", "Wednesday"],
    ["T", "Thursday"], ["F", "Friday"], ["S", "Saturday"],
  ] as const;
  return <fieldset className="daily-weekdays"><legend>Eligible days</legend>{labels.map(([short, label], day) => {
    const checked = value.includes(day);
    const lastSelected = checked && value.length === 1;
    return <label key={day}><input type="checkbox" aria-label={label} checked={checked} disabled={lastSelected} onChange={(event) => {
      const next = event.target.checked ? [...new Set([...value, day])].sort() : value.filter((item) => item !== day);
      if (next.length) onChange(next);
    }} /><span>{short}</span></label>;
  })}</fieldset>;
}

function sourceDescription(source: DailySuccessSource): string {
  if (source.kind === "study-minutes") return "Academic study logs";
  if (source.kind === "cards-reviewed") return "Optional card counts";
  if (source.kind === "practice-questions") return "Question quantities";
  if (source.kind === "journal-closeout") return "One completed closeout";
  if (source.kind === "habit") return "Linked recurring habit";
  return "Linked productivity tracker";
}
