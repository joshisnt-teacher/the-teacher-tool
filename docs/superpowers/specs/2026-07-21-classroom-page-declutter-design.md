# Classroom page declutter — design

## Problem

The Classroom page (`/classroom/:classId`) is meant to be a single-screen dashboard a teacher keeps open during a live lesson. Today it's cluttered:

- Timer, Name Picker, and Group Assigner are three full-height cards stacked in the sidebar, often requiring a scroll.
- Every student tile always shows a checkbox, a toilet button, a strike counter, and a commendation counter — four live controls per tile, times however many students are in the class.
- Toilet tracking only covers toilet visits, not the general case of a student leaving the room for any reason (nurse, office, locker, etc.), and the toilet icon doesn't read as "left the room."
- The slide deck card, a separate "Resources" card (which just re-lists the same slide titles), a Theme Settings card (5 color swatches), and a Session Notes card all compete for space during the live lesson, even though most of that content is either redundant or only useful after the lesson.
- "Launch Presentation" opens a portal-based popup that mirrors whatever slide is currently showing on the main dashboard, but has no navigation controls of its own — advancing slides requires alt-tabbing back to the dashboard tab. It reads as a broken "single shot" rather than a real presentation mode.

## Goals

- Reduce the number of always-visible controls so the page reads as calm/scannable during a live lesson.
- Preserve every existing capability (notes, strikes, commendations, leave-room tracking, theme picker, timer, name picker, group assigner, slide presenting) — nothing is being removed, just reorganized or triggered on demand.
- Fix the presentation launch so it's a real, self-sufficient presenter view, without breaking the existing live sync to the student-facing lesson view.

## Non-goals

- No changes to `ClassroomActivities` (exit tickets / resources assignment section below the student grid) — not flagged as clutter.
- No changes to the underlying `class_sessions` / `student_notes` schema beyond the category label used for leave-room notes (see below).
- No changes to Name Picker / Group Assigner popup mechanics beyond visual sizing.

## Design

### 1. Header

Add a small palette icon button next to the lesson timer/Start-End Lesson control. Clicking it opens a popover with the existing 5 color-swatch theme picker (same `colorThemes` from `ClassroomThemeContext`). This replaces the full-width Theme Settings card that previously sat in the sidebar.

### 2. Slide deck card

Shown only when a structured lesson (Atlas-sourced, has `lesson_template_id`) is active. Collapsed by default:

- One row: lesson title, slide count, a chevron to expand/collapse, and a **Launch Presentation** button.
- Expanded: shows the full slide list (numbered, same as today's dot-strip but now presented as a real list/thumbnail strip when expanded) so the teacher can preview or jump to any slide inline without leaving the dashboard. Clicking a slide number still updates `current_slide_index` via `useUpdateCurrentSlide` and broadcasts via `useClassSessionRealtime`, exactly as today.

The separate "Resources" card (`lessonTemplateContent.slides` re-listed as plain text) is removed — it was a duplicate of this card's content. `lessonTemplateContent.resources` (actual linked resources, not slides) continue to render via `LessonResourcesList` as today, unchanged, inside `LessonPresenter`.

### 3. Presenter page (new route)

Replace `PresentationWindow.tsx`'s portal-based popup with a real routed page:

- **Route:** `/classroom/:classId/present/:sessionId`, added to `App.tsx` under the same `ProtectedRoute` treatment as `/classroom/:classId`.
- **New page component**, modeled on the existing student-facing `StudentLesson.tsx` pattern (`/lesson/:sessionId`), which already proves this approach works for a synced slide view:
  - Fetches the session row (`class_sessions` by `sessionId`) and its `lesson_template_id` content directly — self-sufficient, doesn't depend on the dashboard tab being open.
  - Subscribes to the same `classroom:{sessionId}` realtime channel via `useClassSessionRealtime`.
  - Renders the current slide full-bleed via the existing `SlideViewer`.
  - Has its own Prev/Next buttons, plus arrow-key and spacebar navigation, built into the page.
  - On navigation, calls the same `useUpdateCurrentSlide` mutation and `realtime.sendSlideChange` that `LessonPresenter` uses today — this is what keeps the DB row (`current_slide_index`) and the student-facing `/lesson/:sessionId` view in sync. That behavior is fully preserved; only the teacher-side popup mechanism changes.
- **Launching it:** the "Launch Presentation" button calls `window.open(url, 'lesson-presentation', '<screen-sized dims>')` — a genuine new browser window/tab with its own URL, not a portal. The teacher can drag this window to a projector/second display and use native browser fullscreen (F11) on it independently. If the window is closed and reopened, or the dashboard's slide-jump is used while the presenter window is open, all views reconcile to the same `current_slide_index` because the DB row is the single source of truth and every view (dashboard, presenter window, student view) just reflects it via realtime + initial fetch.
- `PresentationWindow.tsx` and the `isPresenting` toggle/inline slide-viewer duplication in `LessonPresenter.tsx` are removed, since the new page replaces that mechanism.

### 4. Student grid

**Tile:** avatar, name, student ID, selection checkbox (top-left, unchanged — still drives Name Picker/Group Assigner eligibility via `selectedStudents`). Strike count, commendation count, and leave-room status become small badges rather than always-visible buttons:

- A student with strikes shows a small red badge (e.g. "2/3") in a corner.
- A student with commendations shows a small yellow badge with a count.
- A student currently out of the room: tile dims (as today) and shows a "Left Room" badge with elapsed time.

No other buttons render on the tile itself. Clicking anywhere on the tile (outside the checkbox) opens the unified action dialog for that student.

**Unified action dialog** (replaces the separate Note / Strike / Commendation / Toilet-return dialogs): one dialog, four tab sections:

1. **Note** — unchanged: quick-notes buttons, textarea, -5..+5 rating, category select.
2. **Strike** — unchanged: reason textarea, 3-strike cap, same `"Strike n/3: <reason>"` note format.
3. **Commend** — unchanged: reason textarea, same `"Commendation: <reason>"` note format.
4. **Leave Room** (replaces Toilet) — door icon (`DoorOpen`/`LogOut` from lucide, not `Toilet`). "Mark as left room" button when not out; once marked, shows elapsed time and a "Confirm return" button. Confirming return logs a note: `"<Name> left the room at <time>, returned after <duration>."` Same 2-minute/5-minute reminder toast cadence as today, copy updated to "left the room" instead of "at the toilet."

**Shortcut behavior preserved:** if a student is currently marked as out of the room, clicking their tile opens the dialog directly on the **Leave Room** tab (pre-showing the return confirmation), rather than defaulting to the Note tab — matches today's behavior where an at-toilet tile skips straight to the return dialog.

**Data:** new leave-room notes are saved with `category: "Left Room"` (was `"Toilet"`). Existing historical notes keep their `"Toilet"` category value untouched — nothing else in the codebase (checked: Pulse and Analytics) filters or displays that string specially, so this is a safe rename with no migration needed.

### 5. Sidebar tool cards (Timer / Name Picker / Group Assigner)

Stay as three separate cards (not merged into tabs). Each gets tightened visual sizing: reduced card/content padding, smaller preset-time buttons, more compact controls — enough that all three visibly fit in the sidebar column without requiring a long scroll on a typical laptop screen. No functional changes to any of the three tools.

### 6. Session notes

Removed from the live page entirely. The existing End Lesson dialog (`showEndLessonDialog`) gains a read-only review list of the session's notes (student name, rating badge, note text, category) above the title/description fields — same data (`sessionNotes`), same query, just relocated from a live-page card into the end-of-lesson review step where it's actually useful.

## Component-level change summary

| File | Change |
|---|---|
| `src/pages/Classroom.tsx` | Remove Theme Settings card, Resources card, live Session Notes card. Add header palette icon button (theme popover). Add session notes list into End Lesson dialog. |
| `src/components/classroom/LessonPresenter.tsx` | Collapse/expand slide list UI; remove inline `isPresenting` state and `PresentationWindow` usage; "Launch Presentation" becomes `window.open` to new route. |
| `src/components/classroom/PresentationWindow.tsx` | Deleted — replaced by the new routed presenter page. |
| `src/pages/ClassroomPresenter.tsx` (new) | New presenter page: fetch session + slides, realtime subscribe, full-bleed `SlideViewer`, Prev/Next + keyboard nav, writes `current_slide_index`. |
| `src/App.tsx` | Add protected route `/classroom/:classId/present/:sessionId`. |
| `src/components/classroom/StudentGrid.tsx` | Tile simplified to avatar/name/ID/checkbox/badges. Note/Strike/Commendation/Toilet dialogs merged into one tabbed dialog. Toilet → Leave Room (icon, copy, category value, note text). |
| `src/components/classroom/EnhancedTimer.tsx`, `EnhancedNamePicker.tsx`, `EnhancedGroupAssigner.tsx` | Visual-only: reduced padding/button sizing. |
| `src/contexts/ClassroomThemeContext.tsx` | No change (consumed by new header popover instead of a full card). |

## Testing

No test runner is configured for this repo (per `CLAUDE.md`). Verification will be manual, in the running dev server:

- Start a lesson, confirm all four student-tile dialog tabs (Note/Strike/Commend/Leave Room) save correctly and produce the same `student_notes` rows as today.
- Confirm a student marked "left the room" dims their tile, shows the elapsed-time badge, triggers the 2-min/5-min toasts, and clicking the tile jumps straight to the Leave Room tab.
- Confirm the theme popover changes the Timer/Name Picker/Group Assigner popup gradients as before.
- Launch Presentation, confirm the new window navigates independently (buttons + arrow keys), and that a second browser tab on `/lesson/:sessionId` (simulating a student) stays in sync as slides change.
- Confirm End Lesson dialog shows the session's notes and still saves/deletes lessons correctly.
