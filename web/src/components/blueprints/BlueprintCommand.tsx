import { useMemo, useState } from "react";
import { Brain, CheckCircle2, ChevronDown, ExternalLink, ListPlus, Plus } from "lucide-react";
import { GlassCard, GButton, PanelHeader, Tag } from "../ui/primitives";
import { useStore } from "../../lib/store";
import { focusOption } from "../../lib/experience";
import type { BlueprintDefinition } from "../../lib/blueprints";
import { blueprintResourcePayload, blueprintTrackerRows } from "../../lib/blueprints";
import { normalizeResourceUrl } from "../../lib/resourceUtils";
import { trackerItemKey } from "../../lib/pathUtils";

export function BlueprintCommand({
  blueprints,
  allBlueprints,
}: {
  blueprints: BlueprintDefinition[];
  allBlueprints: BlueprintDefinition[];
}) {
  const s = useStore();
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? allBlueprints : blueprints;
  const activeFocus = s.profile.activeFocusId;
  const resourceUrls = useMemo(() => new Set(s.resources.map((r) => normalizeResourceUrl(r.url).toLowerCase())), [s.resources]);
  const trackerKeys = useMemo(() => new Set(s.tracker.map((t) => trackerItemKey(t.path, t.label))), [s.tracker]);

  function activate(blueprint: BlueprintDefinition) {
    if (!blueprint.focusId) return;
    const option = focusOption(blueprint.focusId);
    const nextFocus = [...new Set([blueprint.focusId, ...s.profile.focusSubscriptions])];
    s.updateProfile({
      activeFocusId: blueprint.focusId,
      focusSubscriptions: nextFocus,
      phase: option?.phase ?? s.profile.phase,
      tagline: option?.tagline ?? s.profile.tagline,
      dailyCardTarget: option?.cardTarget ?? s.profile.dailyCardTarget,
      dailyMinuteTarget: option?.minuteTarget ?? s.profile.dailyMinuteTarget,
    });
  }

  function installTrackerRows(blueprint: BlueprintDefinition) {
    const rows = blueprintTrackerRows(blueprint).filter((row) => !trackerKeys.has(trackerItemKey(row.path, row.label)));
    if (rows.length) s.bulkAddTrackerItems(rows);
  }

  function saveResources(blueprint: BlueprintDefinition) {
    const rows = blueprint.resources
      .filter((resource) => !resourceUrls.has(normalizeResourceUrl(resource.url).toLowerCase()))
      .map(blueprintResourcePayload);
    if (rows.length) s.bulkAddResources(rows);
  }

  return (
    <GlassCard pad className="blueprint-command">
      <PanelHeader title="Blueprint Command" sub="Subscribe to the lane you are studying for, then install actionable rows and official resources."
        action={<button className={`filter-pill ${showAll ? "on" : ""}`} onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Showing all" : "Show all blueprints"}
        </button>} />
      <div className="blueprint-command-grid">
        {list.map((blueprint) => {
          const active = blueprint.focusId === activeFocus;
          const rows = blueprintTrackerRows(blueprint);
          const installedRows = rows.filter((row) => trackerKeys.has(trackerItemKey(row.path, row.label))).length;
          const savedResources = blueprint.resources.filter((resource) => resourceUrls.has(normalizeResourceUrl(resource.url).toLowerCase())).length;
          return (
            <details className={`blueprint-accordion ${active ? "active" : ""}`} key={blueprint.id} open={active}>
              <summary>
                <span className="blueprint-icon"><Brain size={17} /></span>
                <span className="grow">
                  <b>{blueprint.title}</b>
                  <small>{blueprint.summary}</small>
                </span>
                {active && <Tag tone="cyan">Active</Tag>}
                <ChevronDown size={15} />
              </summary>
              <div className="blueprint-body">
                <div className="blueprint-meaning">
                  <div><b>One pass</b><span>{blueprint.passMeaning}</span></div>
                  <div><b>Done means</b><span>{blueprint.doneMeaning}</span></div>
                </div>
                <div className="row wrap gap8">
                  {blueprint.focusId && (
                    <GButton size="sm" variant={active ? "default" : "primary"} onClick={() => activate(blueprint)}>
                      <CheckCircle2 size={14} /> {active ? "Subscribed" : "Subscribe / activate"}
                    </GButton>
                  )}
                  <GButton size="sm" onClick={() => installTrackerRows(blueprint)}>
                    <ListPlus size={14} /> Install rows ({installedRows}/{rows.length})
                  </GButton>
                  <GButton size="sm" onClick={() => saveResources(blueprint)}>
                    <Plus size={14} /> Save resources ({savedResources}/{blueprint.resources.length})
                  </GButton>
                  <a className="gbtn sm" href={blueprint.sourceUrl} target="_blank" rel="noreferrer noopener">
                    Source <ExternalLink size={13} />
                  </a>
                </div>
                <div className="blueprint-section-list">
                  {blueprint.sections.map((section) => (
                    <details className="blueprint-section" key={section.title}>
                      <summary><b>{section.title}</b><span>{section.source}</span><ChevronDown size={14} /></summary>
                      <div className="blueprint-items">
                        {section.items.map((item) => (
                          <div className="blueprint-item" key={item.title}>
                            <Tag tone={item.kind === "Requirement" || item.kind === "Milestone" ? "green" : item.kind === "Question Block" || item.kind === "Assessment" ? "orange" : "cyan"}>{item.kind}</Tag>
                            <div className="grow">
                              <b>{item.title}</b>
                              <span>{item.action}</span>
                              <small>Done: {item.done}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </GlassCard>
  );
}
