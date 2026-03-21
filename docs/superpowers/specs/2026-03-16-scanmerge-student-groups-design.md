# ScanMerge — Student Groups Mode Design

**Date:** 2026-03-16
**File:** `C:\Users\joshu\Desktop\ScanMerge.py`
**Status:** Approved

---

## Overview

Add a "Merge into Groups" mode to ScanMerge that lets a teacher import a batch of scanned student test PDFs, group them by student, and export one merged PDF per student — all without leaving the app.

---

## Mode Switcher

A row of three mode buttons is added at the very top of the existing sidebar:

- **Merge into Groups** — new student grouping workflow
- **Merge All into One** — existing single-merge behavior (unchanged)
- **Rename with Formula** — existing batch rename behavior (unchanged)

The active mode button is highlighted. Switching mode re-renders the main content area but keeps `self.items` and `self.groups` intact. File loading (Open Folder / Open SD Card) in the top bar is always visible. The top-bar "Merge & Export" button is hidden in Groups Mode.

**Selection clearing rules:**
- Clicking any left-panel row: clears `self.group_mode_selected_group_idx` and `self.group_mode_selected_item_idx`
- Clicking any group card PDF row: clears `self.groups_left_selected`
- The two selection systems (`groups_left_selected` and intra-group selection) are mutually exclusive: only one can be non-empty at any time
- Intra-group selection is **single-item maximum, application-wide** — at most one PDF across all groups can be selected at once
- Any folder load (whether a confirm dialog was shown or not) clears both selection systems and `self.groups`

---

## Groups Mode — Layout

### Left Panel — Unassigned PDFs

- `self.items` is **never mutated by group assignment.** Assigning a PDF adds a reference to `group.items` but does not remove it from `self.items`. The unassigned view is computed on each render:
  ```python
  assigned_ids = {id(item) for g in self.groups for item in g.items}
  unassigned = [item for item in self.items if id(item) not in assigned_ids]
  ```
- Same row style as existing file list (index badge, filename, size, page count)
- **`self.groups_left_selected`** is a `set[int]` of indices into `unassigned` (the computed list above). This set is remapped on every render. It is independent of intra-group selection
- Left-panel actions (Delete, Rotate, Rename, Select All, Select None) operate only on `self.groups_left_selected`:
  - **Delete Selected:** removes item from `self.items` AND removes any references to that `ScanItem` from all `group.items` lists. No separate confirmation for group removal
  - **Rotate CW / Rotate CCW:** disabled when `groups_left_selected` is empty
  - **Rename Selected:** disabled when `len(groups_left_selected) != 1`; uses existing `simpledialog.askstring` with no filename sanitisation (display name only)
  - **Select All:** selects all items in the current computed unassigned list
  - **Select None:** clears `self.groups_left_selected`
- Drag a left-panel row → drop onto a group card to assign. Only left-panel rows draggable. Group card PDF rows are not draggable. No drag-to-reorder within the left panel in Groups Mode
- **Drag visual:** cursor changes to `"fleur"` during drag (existing behavior); the group card currently under the cursor during drag receives a highlight border; no ghost image

### Right Panel — Student Groups (300px fixed width)

- Scrollable list of group cards
- "＋ Add Student" button pinned to the top → `simpledialog.askstring` with empty initial value → sanitise name → new group card appended at bottom
- Each group card:
  - **Header row:** student name label | pencil icon (rename) | trash icon (delete group)
  - **Body:** list of assigned PDFs in order. Each row: filename + page count + ✕ to unassign. Clicking a PDF row sets intra-group selection (clears `groups_left_selected`; sets `self.group_mode_selected_group_idx` and `self.group_mode_selected_item_idx`). Only one PDF across all groups can be selected at once
  - **Footer:** total page count for the group
- **Drop target hit-testing:** at drag release, use `winfo_containing(event.x_root, event.y_root)` and walk up its parent hierarchy to find a group card frame. The entire card area (header, body, footer) is valid, including empty cards. Dropping appends to end of group list. Cursor not over any card at release = drag cancelled with no change
- Drag-to-reorder within a group card is not supported; use sidebar Move Up/Down

### Preview

The existing right-side preview panel is removed in Groups Mode. A fixed-height area (160×210px thumbnail + filename label) sits below the left panel. Updates on hover of left-panel rows using the existing `make_thumbnail` function. Hovering group card rows does not trigger preview. Shows placeholder "Select a file to preview" on initial load and when cursor is not over a left-panel row.

---

## Groups Mode — Sidebar

Sections in order:

1. **Mode selector** (top, always visible)
2. **Group Actions:**
   - Move Up — moves the selected intra-group PDF one position up within its group. Disabled when `group_mode_selected_item_idx is None` or item is already first
   - Move Down — same, downward; disabled when already last
3. **File Actions** (left panel):
   - Delete Selected — disabled when `groups_left_selected` is empty
   - Rotate CW / Rotate CCW — disabled when `groups_left_selected` is empty
   - Rename Selected — disabled when `len(groups_left_selected) != 1`
   - Select All — selects all items in computed unassigned list
   - Select None — clears `groups_left_selected`
4. **Export** (bottom):
   - "Merge & Export Groups" button (green accent)

Hidden in Groups Mode: Delete Flagged, Batch Rename, Threshold / Re-flag.

---

## Data Model

```python
class StudentGroup:
    name: str           # sanitised on input
    items: list[ScanItem]  # ordered references into self.items
```

App state additions:
- `self.groups: list[StudentGroup]`
- `self.groups_left_selected: set[int]` — indices into computed unassigned list
- `self.group_mode_selected_group_idx: int | None` — index into `self.groups`
- `self.group_mode_selected_item_idx: int | None` — index into that group's `items`

**Loading a new folder:** if `self.groups` is non-empty, show confirmation dialog on both Open Folder and Open SD Card. Confirmed: clear `self.groups`, both selection systems, then load. Cancelled: abort. If `self.groups` is empty: load without dialog, clear both selection systems regardless.

**Rotation:** assignment is by object reference; mutations to `ScanItem.rotation` at any point are reflected at export.

---

## Validation Rules

**Duplicate student names:** allowed. A `⚠ duplicate name` warning label appears on the card. On export, if two groups produce the same sanitised filename (whether from identical names or from different names that collide after sanitisation), the second silently overwrites the first. The summary dialog notes: "Warning: '{sanitised_name}.pdf' was written more than once; only the last version was kept."

**Invalid filename characters** (`/ \ : * ? " < > |`): on confirm (Add Student or Rename Group), illegal characters are replaced with `_`. The user sees the sanitised result after the dialog is dismissed. Applies to group names only — left-panel Rename Selected does not sanitise.

---

## Rename Group Interaction

Clicking the pencil icon opens `simpledialog.askstring` with the current group name pre-populated. If the user confirms a non-empty string, the same sanitisation rules apply and the card updates immediately.

---

## Export Behaviour

1. User clicks "Merge & Export Groups"
2. If no group has any PDFs assigned, show info dialog and abort
3. Folder picker opens
4. For each group with ≥ 1 PDF, in list order:
   - Merge its PDFs in listed order applying each item's `rotation` (same logic as existing merge)
   - **Output filename:** `{sanitised_group_name}.pdf` in the chosen folder
   - Write to a temp file created in the export folder: `tempfile.NamedTemporaryFile(dir=export_folder, delete=False, suffix=".pdf")`, then `os.replace(tmp_path, final_path)` on success (avoids cross-device rename on Windows)
   - On any exception: delete temp file if it exists, record `"{group_name}: {str(exception)}"`, continue to next group
5. Groups with zero PDFs are skipped silently
6. Summary dialog:
   - "Exported {N} group(s) to {folder}"
   - Per-group errors: "• {group_name}: {error_message}"
   - Filename collision warnings: "Warning: '{sanitised_name}.pdf' was written more than once; only the last version was kept."

---

## Out of Scope

- Auto-detection of student names from filenames
- Reordering group cards themselves
- Multi-page PDF preview
- Undo/redo
- Drag-to-reorder within a group card
- Dragging PDFs directly between group cards
