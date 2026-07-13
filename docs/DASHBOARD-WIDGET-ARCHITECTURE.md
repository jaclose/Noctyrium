# Dashboard widget architecture (design only)

Status: proposed for a later isolated checkpoint. Wave 5.5C does **not** implement a resizing engine, change the persisted widget shape, or migrate existing layouts.

## Size contract

- **Small**: one primary value or action, one short state label, no hidden essential meaning.
- **Medium / full**: the normal working view with context, primary action, and one concise interpretation.
- **Extra-large**: a focused workspace with supporting detail and controls; never an excuse to duplicate the whole page.

Each widget owns a typed content map describing which fields appear at each size. A smaller size may omit secondary detail, but it must preserve the widget's name, current state, and accessible route/action.

| Widget family | Small | Medium / full | Extra-large |
| --- | --- | --- | --- |
| Plan / Command Brief | next action, effort | reason, outcome, alternate win | inspectable evidence and catch-up preview |
| Daily success | completion state | scheduled targets and progress | target editor shortcut and provenance |
| Focus timer | time and start/pause | target, intention, presets | full custom controls and session context |
| Trends / weekly | current total and direction | eligible-day chart and interpretation | metric switcher and daily inspection |
| Course / question status | due or weak count | top scope and next action | scoped list with filters |
| Utilities | primary status/action | preferences relevant to the utility | detailed controls only when they remain comprehensible |

Legacy widgets without an explicit map render their accepted medium view until they are audited. No field is guessed from another widget.

### Accepted-widget content map

| Widget ID | Small fields | Medium / full fields | Extra-large additions |
| --- | --- | --- | --- |
| `winDay` | intention state, open action | intention, wins, review state | full review controls |
| `todayScore` | scheduled completion | eligible targets, progress | provenance and target shortcut |
| `examCountdown` | days, exam label | phase, question target | milestone context |
| `pomodoro` | time, phase, start/pause | target, intention, preset | accepted custom controls |
| `weekly` | effort total, eligible days | daily bars, selected-day summary | metric comparison |
| `suggested` | first suggestion | ranked suggestions and reasons | evidence details; legacy optional surface |
| `aiActions` | provider/status only | reviewed proposal queue | proposal provenance; legacy hidden surface |
| `schedule` | next dated item | calendar and active-day totals | daily inspection |
| `termMap` | current term progress | course sequence and weak scope | module detail |
| `localData` | storage health | backup state and export action | diagnostics link, never raw payload |
| `latestStandup` | latest status | concise entry summary | remediation/history links |
| `productivityTrend` | direction and eligible denominator | trend, source, interpretation | metric switching |
| `premedHours` | total and category | category progress | evidence/verification detail |
| `resourceFocus` | pinned resource | pinned list and source status | category management shortcut |
| `boardBlueprint` | current lane/mastery | lane progress and next object | sourced objective detail |

## Settings control

Every configurable widget uses the same top-right settings-button contract:

- an icon button with an accessible name containing the widget title;
- `aria-expanded` and `aria-controls` when it reveals local settings;
- focus moves into an opened dialog/popover and returns to the trigger on close;
- Escape and outside dismissal follow the existing shell primitives;
- destructive or data-changing actions remain outside the layout/settings flip.

A visual flip is optional presentation. With reduced motion, settings appear immediately without rotation. The front and back must never both be exposed to assistive technology.

## Responsive grid

The future grid should use named span tokens rather than pixel widths. A desktop implementation may use twelve logical columns: small spans four, medium spans six or twelve according to its content contract, and extra-large spans twelve with additional row capacity. Tablet collapses to two logical columns; mobile renders every widget full width in persisted order.

DOM order remains the keyboard and screen-reader order. Dragging cannot be the only arrangement method; Move earlier/later controls are required. Content must not overflow at 390px or depend on pointer hover.

## Extra-large soft limit

The default recommendation is at most one extra-large widget on a dashboard. Selecting another shows the consequence and offers an explicit override. The limit is advisory, never destructive: no existing widget is resized or removed automatically.

## Persistence and backup

A later implementation may add optional profile data such as a versioned map of widget ID to size and per-widget display preferences. Before doing so it must:

- decide whether the optional shape can remain schema v32 or needs a migration;
- normalize unknown widget IDs/sizes without deleting legacy preferences;
- include the map in replace restore and deterministic merge rules;
- keep workspace data in IndexedDB, not a localStorage payload;
- preserve accepted order and hidden-widget fields;
- define defaults only for profiles that have no explicit choice.

## Motion and accessibility

- Layout changes use short transform/opacity transitions only; reduced motion is immediate.
- Resizing does not steal focus or announce every intermediate drag position.
- Settings, size, and reorder controls have text alternatives and 44px mobile targets.
- Charts retain text summaries; size never removes the only expression of status.
- Extra-large override warnings are associated with the triggering control.
- Backup/restore and keyboard-only behavior receive regression coverage before release.

## Explicit non-goals for Wave 5.5C

No resizing UI, grid migration, widget flip animation, extra-large enforcement, persisted size map, or route-level performance work is included in this checkpoint.
