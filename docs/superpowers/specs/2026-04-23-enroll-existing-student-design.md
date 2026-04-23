# Enroll Existing Student — Design Spec

**Date:** 2026-04-23
**Status:** Approved

---

## Overview

Teachers need to enroll students who already exist in one class into another class (e.g. Year 7 HASS → Year 7 DigiTech) in a couple of clicks. The `enrolments` table already supports multi-class students — this feature just needs a UI to exercise it.

---

## UI Structure

The "Add New Student" card in `ClassStudentsTab.tsx` gains two tabs at the top of its `CardContent`:

- **"New Student"** — existing form unchanged (first name, last name, student ID, CSV upload)
- **"Existing Student"** — new panel containing:
  1. **Class filter dropdown** — lists all the teacher's other classes (excluding the current one). Default: "All classes"
  2. **Name search box** — filters the list by first or last name as you type
  3. **Scrollable checklist** — matching students not already enrolled in this class. Each row shows: full name + student ID. When a specific source class is selected, a badge showing that class name appears on each row. When "All classes" is selected, no class badge is shown (we don't fetch full enrolment data for the unfiltered view).
  4. **"Enroll X Selected" button** — disabled when nothing is ticked, shows "Enrolling..." during the request. Upserts all selected students into `enrolments` in one batch.

---

## Data Flow

### Sources
- `useStudents()` (no classId) — full pool of all teacher's students, ordered by last name. Already exists.
- `useClasses()` — all teacher's classes for the dropdown. Already exists.
- `useStudents(selectedClassId)` — students in the selected source class (for class-filtered view). Already exists.

### Client-side filtering
1. Build a `Set` of student IDs already enrolled in the current class (from the existing students list passed as prop).
2. Exclude already-enrolled students from the candidate pool.
3. If a source class is selected: use `useStudents(selectedClassId)` as the pool instead of all students.
4. If a name search is active: filter candidates by `toLowerCase().includes()` on first + last name.

### Enroll action
```ts
supabase
  .from('enrolments')
  .upsert(
    selectedIds.map(id => ({ class_id: classData.id, student_id: id })),
    { ignoreDuplicates: true }
  )
```
On success: invalidate `['students', classData.id]`, clear selection, show success toast.

### No new hooks required
Everything composes from existing `useStudents(classId?)` and `useClasses()`.

---

## Error Handling & Edge Cases

| Scenario | Behaviour |
|---|---|
| Teacher only has one class | "Existing Student" tab shows: "You don't have any other classes to enroll students from yet." |
| All students already enrolled | Empty checklist with message: "All your students are already enrolled in this class." |
| Enroll request fails | Destructive toast with error message. Selection preserved so teacher can retry. |
| Duplicate enrolment | `ignoreDuplicates: true` on upsert prevents duplicates at the DB level regardless of UI filter. |
| Loading state | Button shows "Enrolling..." and is disabled during the request. |

---

## Files to Change

- `src/components/class-dashboard/adjust-class/ClassStudentsTab.tsx` — add tab switcher, new "Existing Student" panel, enroll handler. All changes contained to this one file.

---

## Out of Scope

- Creating a new dedicated hook (not needed — existing hooks compose cleanly)
- Any changes to the database schema (enrolments table already supports this)
- Any changes to the student-facing ClassJoin flow
