# Journal Notebook Architecture

The Wave 5.5D working checkpoint implements the **Journal Foundation**. It
deliberately does not implement the later **Journal Cinematic** layer; independent
acceptance is still pending.

## Product boundary

Foundation owns the dependable writing experience:

- a notebook library and customizable hardback cover;
- today and prior-day pages;
- structured closeout fields plus unrestricted free writing;
- a user-editable local Day at a Glance;
- bounded local image attachments;
- previous/next page navigation and lightweight CSS page transitions;
- local export, autosave, keyboard navigation, and reduced motion.

Cinematic remains a separate, later review surface:

- a desk scene and notebook pickup;
- physically animated covers or richer page physics;
- spatial image placement;
- optional sound or device haptics.

Foundation uses ordinary semantic HTML and CSS transforms. It adds no WebGL,
canvas renderer, physics package, audio, or network service. A later cinematic
shell must wrap—never replace—the semantic form and persistence layer.

## Data model and persistence

The workspace remains schema v32 and IndexedDB-first. No database version or
object store changes are required.

Existing `JournalEntry` fields remain canonical for standup, reminder, report,
and readiness behavior. Foundation adds optional fields only:

- `freeWriting`
- `wins` and `losses`
- `attachments`
- `dayAtAGlance`
- `notebookStatus`
- `updatedAt`

Notebook title, subtitle, cover tone, and paper tone live in the optional
`profile.journalNotebook` preference. Profile normalization accepts only known
cover and paper tokens. Legacy workspaces hydrate with the visual defaults and
do not require migration.

Portable backup includes the optional entry fields and notebook preference.
Non-destructive merge continues to merge journal pages by entry ID, and keeps
the current device's profile preferences. Unknown future fields remain governed
by the existing backup compatibility policy.

## Autosave and page turns

The writing page keeps an in-memory draft for responsive typing and writes it to
the existing Zustand/IndexedDB workspace after a short idle interval. It also
flushes before a page turn and when the page component unmounts. New entries are
not created until there is meaningful text, an attachment, or an included
summary. A stable generated entry ID prevents duplicate pages during closely
spaced saves.

Page transitions animate the paper container, not the form state. Navigation
flushes first, then mounts the destination day. Returning to a page reads the
persisted entry, so animation cannot become a source of text loss. Reduced
motion removes the open and page-turn animations entirely.

## Day at a Glance

`selectDayAtAGlance` remains the canonical read-only selector. The Journal maps
that selector into concise sections; it does not create a second scoring engine.
The user may:

- hide a section from the page snapshot;
- enter a correction for the displayed snapshot;
- include the resulting plain-text summary in the journal;
- ignore the summary and write freely.

Corrections affect only the journal snapshot. They do not mutate source logs,
tasks, habits, questions, readiness factors, or daily targets. The interface
states: “AXOM assembled this from today’s local records. Edit or ignore
anything.” No AI or clinical interpretation is claimed.

## Local image attachments

Foundation accepts JPEG, PNG, WebP, and GIF images. SVG and arbitrary files are
rejected. Limits are 3 MB per image and 12 MB per journal page. Data URLs are
stored with the journal entry in the existing IndexedDB-backed workspace.

There is no upload, remote URL lookup, background sync, or cloud fallback.
Users can remove an image from the page or export its original local bytes.
Whole-page Markdown export lists attachment names and sizes but intentionally
does not embed the base64 payload.

These limits protect storage; they are not an image-management system. A future
spatial placement layer should reference the same attachment IDs and must not
duplicate image bytes.

## Accessibility and motion

- Library covers are real buttons with descriptive accessible names.
- Writing controls remain labeled native inputs, textareas, and selects.
- Previous/next are explicit buttons; Arrow Left/Right also work when focus is
  on the notebook rather than inside an editable control.
- A turned page moves focus to the new page heading without forcing scroll.
- Autosave status is announced politely.
- Day-summary corrections and hide/show controls have specific names.
- Color is not the sole evidence signal.
- `prefers-reduced-motion: reduce` removes transforms and transitions.
- Mobile collapses to a single readable page column with 44 px controls and no
  horizontal scrolling.

## Future extension seams

The current notebook model leaves room for multiple notebooks, bookmarks,
search, monthly reflections, pen/ink themes, richer cover materials, and spatial
attachment metadata. Those additions should remain optional and additive. The
cinematic layer must honor these invariants:

1. Writing and navigation work without animation.
2. Text is persisted before any cinematic transition.
3. Attachments remain local unless the user explicitly exports them.
4. No audio or haptic effect is enabled by default.
5. The semantic notebook remains usable if advanced rendering fails.
