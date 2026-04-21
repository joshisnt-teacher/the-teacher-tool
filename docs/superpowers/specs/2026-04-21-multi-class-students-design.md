# Multi-Class Students — Design Spec

**Date:** 2026-04-21  
**Status:** Approved

## Problem

The `students` table has `class_id` baked in as a direct FK, meaning each student row represents one student in one class. Students who are in multiple classes exist as duplicate rows with different UUIDs but the same `student_id` text value (a 3-digit school ID number). There are approximately 8 such duplicates currently in the database. Assessment marks for both classes must be preserved through the fix.

## Solution

Use the existing (but currently unused) `enrolments` table as a proper many-to-many join between students and classes. Remove `class_id` from `students`, add `teacher_id` for ownership, and migrate all existing data automatically in the SQL migration.

---

## Section 1 — Database Schema

### `students` table changes

| Column | Change |
|--------|--------|
| `class_id` | **Removed** |
| `teacher_id` | **Added** (uuid, NOT NULL, FK → `auth.users.id`) |

Unique constraint changes from `(class_id, student_id)` → `(teacher_id, student_id)`.  
One student per teacher per school ID number, regardless of class count.

### `enrolments` table (already exists)

Add a missing FK: `enrolments.student_id` → `students.id ON DELETE CASCADE`.  
This table is now the source of truth for class membership.

```
enrolments: class_id (FK → classes.id), student_id (FK → students.id)
```

### RLS policy updates

`students` policies change from join-through-class pattern to direct ownership:
- Select/Insert/Update/Delete: `teacher_id = auth.uid()`

`enrolments` policies already exist and are correct (check via `class_id IN (classes owned by teacher)`).

### Data migration steps (automated in SQL migration)

1. Add `teacher_id` column to `students` (nullable initially), populate via `class_id → classes.teacher_id`.
2. Insert `enrolments` rows for every current `(students.class_id, students.id)` pair.
3. For each group of duplicate students (same `student_id` + same `teacher_id`):
   - Pick the row with the oldest `created_at` as the canonical record.
   - `UPDATE results SET student_id = <canonical> WHERE student_id = <duplicate>`
   - `UPDATE question_results SET student_id = <canonical> WHERE student_id = <duplicate>`
   - `UPDATE student_responses SET student_id = <canonical> WHERE student_id = <duplicate>`
   - `DELETE FROM enrolments WHERE student_id = <duplicate>` (already inserted canonical ones above)
   - `DELETE FROM students WHERE id = <duplicate>`
4. Drop `class_id` from `students`.
5. Set `teacher_id` NOT NULL.
6. Drop old unique constraint `students_class_id_student_id_key`, add `(teacher_id, student_id)`.
7. Add FK `enrolments.student_id → students.id ON DELETE CASCADE`.
8. Update RLS policies.

No unique constraint conflicts expected during merge: `results` is unique on `(student_id, task_id)` and tasks are class-scoped, so a student's Class A tasks and Class B tasks are distinct.

---

## Section 2 — Application Hooks & Data Layer

### `Student` TypeScript interface

Remove `class_id` field. No other field changes.

### Hook changes

| Hook | Change |
|------|--------|
| `useStudents(classId)` | Query via `enrolments → students` join filtered by `class_id`. Returns same `Student[]` shape. |
| `useStudentCounts` | Count enrolments grouped by `class_id` instead of students by `class_id`. |
| `useTotalStudentCount` | Count distinct students enrolled in non-demo classes via enrolments join. |
| `useAssessmentImport` | "Find or create + enrol" pattern: look up existing student by `(student_id text, teacher_id)`, create if not found, insert enrolment row if not already enrolled. |

Any other hook that references `students.class_id` directly must be updated to join through `enrolments`.

### "Find or create + enrol" pattern (used in import and manual add)

```
1. SELECT id FROM students WHERE student_id = $input_id AND teacher_id = $teacher
2. If not found → INSERT INTO students (teacher_id, student_id, first_name, last_name, ...) RETURNING id
3. INSERT INTO enrolments (class_id, student_id) VALUES ($class, $student_uuid)
   ON CONFLICT DO NOTHING
```

The `ON CONFLICT DO NOTHING` handles the case where a student is already enrolled in the class (e.g. re-importing a CSV).

---

## Section 3 — UI Changes

### What changes visually: nothing

The class roster still shows students in that class. The Adjust Class Data component UI (manual add and CSV import) looks identical. The behaviour behind the scenes uses the find-or-create-enrol pattern instead of always inserting a new student row.

### Edge cases

- **Student already in class:** `ON CONFLICT DO NOTHING` on the enrolments insert silently skips. Optionally show a small "already enrolled" warning in the import results summary.
- **Student exists, new class:** Existing student is found, only a new enrolment row is added — no duplicate student created.
- **Brand new student:** Created fresh, then enrolled.

### Out of scope

A "search and enrol existing student" UI (finding a student by name/ID across classes and enrolling them without re-entering details) is a logical next feature but is not part of this change.

---

## Files Affected

### Database
- `supabase/migrations/YYYYMMDD_multi_class_students.sql` — new migration (all steps above)

### Hooks (all query `students` by `class_id` directly)
- `src/hooks/useStudents.tsx` — `useStudents`, `useStudentCounts`, `useTotalStudentCount`
- `src/hooks/useProgressAnalytics.tsx` — 2 queries: `.from('students').eq('class_id', classId)`
- `src/hooks/useComprehensiveAnalytics.tsx` — 3 queries: `.from('students').eq('class_id', classId)`
- `src/hooks/useAssessmentImport.tsx` — find-or-create-enrol pattern replaces current insert

### Components
- `src/components/class-dashboard/adjust-class/ClassStudentsTab.tsx` — manual add and CSV insert use new find-or-create-enrol pattern; delete button becomes "Remove from Class" (deletes the enrolment row; student row itself only deleted if no other enrolments exist)

### Types
- `src/integrations/supabase/types.ts` — regenerate after migration to reflect schema changes
