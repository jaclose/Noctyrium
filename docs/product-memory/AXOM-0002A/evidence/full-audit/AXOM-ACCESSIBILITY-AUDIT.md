# AXOM Accessibility Audit

## Verdict

YELLOW for closed Alpha. The code and existing tests show deliberate focus restoration, Escape handling, dialog labeling, live-region announcements, keyboard widget reordering, route loading status, touch-size assertions, reduced-motion paths, and non-color status text. The audit route sweep found no overflow at 1440×1000, 768×1024, or 390×844; existing E2E also exercises 1024 and theme persistence. No axe dependency is present, so this is not a complete WCAG conformance claim.

## Supported positives

- App drawer restores focus to the menu trigger after becoming inert (App.tsx 121–145).
- Modals/tours are covered by focus/Escape tests; Productivity tour restores scroll/layout under reduced motion.
- Dashboard editor exposes keyboard reorder controls with polite live announcements.
- Question choices have stable accessible names and pressed state; repair feedback is text, not color-only.
- Q2a read-only diff adds named eliminate/reset/reading/calculator controls and stem focus on advance.
- Daily Word uses gridcell names and preserves responsive/touch behavior in E2E.

## Findings by route/severity

| Severity | Routes | Finding | Required action |
|---|---|---|---|
| High confidence gap | all | No automated WCAG ruleset/contrast scan | Add axe scans for representative populated states in dark/light and fail on serious/critical |
| Medium | secondary routes | Many have only smoke screenshots, no exhaustive keyboard sequence | Add route contracts: landmark/H1, named controls, tab order, Escape/focus return |
| Medium | Question import/player | Dense review state and mapping editor need screen-reader workflow test | Test error association, review status, option repair, progress announcement |
| Medium | 200% zoom | 390px width is an approximation, not a true browser zoom/400% reflow test | Add zoom/reflow manual + automated CSS viewport checks |
| Low | dynamic status | Loading and autosave announcements vary by surface | Standardize polite vs assertive live-region policy |
| Low | touch | Existing 44px assertion is narrow | Inventory all mobile icon-only controls at 390px |

Automated accessibility scanning was unavailable without adding dependencies, which the audit rules prohibited. Contrast therefore requires a dedicated token-level and rendered-state pass before public Alpha.
