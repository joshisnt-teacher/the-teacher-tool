# Multi-Class Students Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow students to be enrolled in multiple classes by replacing the direct `class_id` FK on the `students` table with the existing `enrolments` join table, while preserving all assessment data.

**Architecture:** Remove `class_id` from `students` and add `teacher_id` for ownership. The `enrolments` table (already in schema, previously unused) becomes the many-to-many join between students and classes. A SQL migration handles all data transformation — populating `teacher_id`, creating enrolment rows, merging ~8 duplicate student records safely, then dropping the old column.

**Tech Stack:** Supabase (PostgreSQL + PostgREST), React, TypeScript, TanStack React Query

---

## File Map

| File | Change |
|------|--------|
| `supabase/migrations/20260421000000_multi_class_students.sql` | **Create** — full migration |
| `src/integrations/supabase/types.ts` | **Regenerate** via Supabase MCP |
| `src/hooks/useStudents.tsx` | **Modify** — all 3 hooks + Student interface |
| `src/hooks/useProgressAnalytics.tsx` | **Modify** — 2 student queries |
| `src/hooks/useComprehensiveAnalytics.tsx` | **Modify** — 3 student queries |
| `src/hooks/useAssessmentImport.tsx` | **Modify** — find-or-create-enrol pattern |
| `src/components/class-dashboard/adjust-class/ClassStudentsTab.tsx` | **Modify** — add/import/remove logic |

---

## Task 1: Write the SQL Migration

**Files:**
- Create: `supabase/migrations/20260421000000_multi_class_students.sql`

> ⚠️ This migration mutates live data. Read every step before applying. The DO $$ block merges ~8 duplicate students — review the output of the SELECT inside the block first if you want to preview which students will be merged.

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260421000000_multi_class_students.sql

-- Step 1: Add teacher_id (nullable so we can populate before constraining)
ALTER TABLE students ADD COLUMN IF NOT EXISTS teacher_id uuid;

-- Step 2: Populate teacher_id from the class each student currently belongs to
UPDATE students s
SET teacher_id = c.teacher_id
FROM classes c
WHERE s.class_id = c.id;

-- Step 3: Create enrolment rows for all existing student-class memberships
INSERT INTO enrolments (class_id, student_id)
SELECT class_id, id FROM students
ON CONFLICT DO NOTHING;

-- Step 4: Merge duplicate students (same student_id text + same teacher_id = same real person)
DO $$
DECLARE
  dup_group RECORD;
  canonical_id uuid;
  dup_id uuid;
BEGIN
  FOR dup_group IN
    SELECT
      teacher_id,
      student_id,
      array_agg(id ORDER BY created_at ASC) AS ids
    FROM students
    GROUP BY teacher_id, student_id
    HAVING count(*) > 1
  LOOP
    canonical_id := dup_group.ids[1]; -- keep the oldest row

    FOR i IN 2..array_length(dup_group.ids, 1) LOOP
      dup_id := dup_group.ids[i];

      -- Move enrolments from duplicate to canonical (skip class already covered)
      INSERT INTO enrolments (class_id, student_id)
      SELECT class_id, canonical_id
      FROM enrolments
      WHERE student_id = dup_id
      ON CONFLICT DO NOTHING;

      -- Move results — delete any that would conflict first (same task already has canonical result)
      DELETE FROM results
      WHERE student_id = dup_id
        AND task_id IN (SELECT task_id FROM results WHERE student_id = canonical_id);
      UPDATE results SET student_id = canonical_id WHERE student_id = dup_id;

      -- Move question_results — same conflict-safety approach
      DELETE FROM question_results
      WHERE student_id = dup_id
        AND question_id IN (SELECT question_id FROM question_results WHERE student_id = canonical_id);
      UPDATE question_results SET student_id = canonical_id WHERE student_id = dup_id;

      -- Move student_responses
      DELETE FROM student_responses
      WHERE student_id = dup_id
        AND task_id IN (SELECT task_id FROM student_responses WHERE student_id = canonical_id);
      UPDATE student_responses SET student_id = canonical_id WHERE student_id = dup_id;

      -- Clean up duplicate's enrolments (already migrated above)
      DELETE FROM enrolments WHERE student_id = dup_id;

      -- Delete the duplicate student row
      DELETE FROM students WHERE id = dup_id;
    END LOOP;
  END LOOP;
END $$;

-- Step 5: Enforce teacher_id as NOT NULL now that all rows have it
ALTER TABLE students ALTER COLUMN teacher_id SET NOT NULL;

-- Step 6: FK from students.teacher_id to auth.users
ALTER TABLE students
  ADD CONSTRAINT students_teacher_id_fkey
  FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 7: FK from enrolments.student_id to students
ALTER TABLE enrolments
  ADD CONSTRAINT enrolments_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- Step 8: FK from enrolments.class_id to classes (was missing)
ALTER TABLE enrolments
  ADD CONSTRAINT enrolments_class_id_fkey
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

-- Step 9: Drop class_id now that enrolments holds that relationship
ALTER TABLE students DROP COLUMN class_id;

-- Step 10: Replace unique constraint — was (class_id, student_id), now (teacher_id, student_id)
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_class_id_student_id_key;
ALTER TABLE students
  ADD CONSTRAINT students_teacher_id_student_id_key
  UNIQUE (teacher_id, student_id);

-- Step 11: Replace students RLS policies (old ones join through classes, new ones are direct)
DROP POLICY IF EXISTS "Teachers can create students in their classes" ON students;
DROP POLICY IF EXISTS "Teachers can delete students in their classes" ON students;
DROP POLICY IF EXISTS "Teachers can update students in their classes" ON students;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON students;

CREATE POLICY "Teachers can view their own students" ON students
  FOR SELECT TO public USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create their own students" ON students
  FOR INSERT TO public WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own students" ON students
  FOR UPDATE TO public USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own students" ON students
  FOR DELETE TO public USING (teacher_id = auth.uid());

-- Step 12: Allow anonymous users to read enrolments (needed for student-facing ClassJoin page)
CREATE POLICY "Public users can view enrolments for class join" ON enrolments
  AS permissive FOR SELECT TO anon USING (true);
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the `mcp__supabase__apply_migration` tool with the SQL above applied to the production project. Confirm cost before executing.

- [ ] **Step 3: Verify the migration succeeded**

Run this SQL via `mcp__supabase__execute_sql` and confirm all results are 0:

```sql
-- Should be 0: no students still have class_id
SELECT count(*) FROM information_schema.columns
WHERE table_name = 'students' AND column_name = 'class_id';

-- Should be 0: no student appears twice for the same teacher
SELECT teacher_id, student_id, count(*)
FROM students
GROUP BY teacher_id, student_id
HAVING count(*) > 1;

-- Should be > 0: enrolments table has rows
SELECT count(*) FROM enrolments;
```

- [ ] **Step 4: Commit the migration file**

```bash
git add supabase/migrations/20260421000000_multi_class_students.sql
git commit -m "feat: migrate students to multi-class via enrolments table"
```

---

## Task 2: Regenerate Supabase Types

**Files:**
- Modify: `src/integrations/supabase/types.ts`

- [ ] **Step 1: Regenerate types via Supabase MCP**

Use `mcp__supabase__generate_typescript_types` and overwrite `src/integrations/supabase/types.ts` with the output.

- [ ] **Step 2: Commit**

```bash
git add src/integrations/supabase/types.ts
git commit -m "chore: regenerate supabase types after multi-class migration"
```

---

## Task 3: Update useStudents Hooks

**Files:**
- Modify: `src/hooks/useStudents.tsx`

The `Student` interface loses `class_id` and gains `teacher_id`. All three hooks are updated to work through `enrolments`.

- [ ] **Step 1: Replace the entire file**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  year_level?: string;
  teacher_id: string;
  created_at: string;
  updated_at: string;
}

export const useStudents = (classId?: string) => {
  return useQuery({
    queryKey: classId ? ['students', classId] : ['students'],
    queryFn: async () => {
      if (classId) {
        const { data, error } = await supabase
          .from('students')
          .select('id, student_id, first_name, last_name, email, year_level, teacher_id, created_at, updated_at, enrolments!inner(class_id)')
          .eq('enrolments.class_id', classId)
          .order('last_name');
        if (error) throw error;
        // Strip the enrolments embed — it was only needed for the join filter
        return data?.map(({ enrolments: _enrolments, ...student }) => student) as Student[];
      }
      const { data, error } = await supabase
        .from('students')
        .select('id, student_id, first_name, last_name, email, year_level, teacher_id, created_at, updated_at')
        .order('last_name');
      if (error) throw error;
      return data as Student[];
    },
    enabled: true,
  });
};

export const useStudentCounts = () => {
  return useQuery({
    queryKey: ['student-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrolments')
        .select('class_id, student_id');
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach(enrolment => {
        counts[enrolment.class_id] = (counts[enrolment.class_id] || 0) + 1;
      });
      return counts;
    },
    enabled: true,
  });
};

export const useTotalStudentCount = () => {
  return useQuery({
    queryKey: ['total-student-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrolments')
        .select('student_id, classes!inner(is_demo)')
        .eq('classes.is_demo', false);
      if (error) throw error;
      // Count distinct students (a student in two non-demo classes counts once)
      const uniqueStudents = new Set(data?.map(e => e.student_id));
      return uniqueStudents.size;
    },
    enabled: true,
  });
};
```

- [ ] **Step 2: Start the dev server and verify no TypeScript errors**

```bash
npm run dev
```

Check the terminal output — there should be no TypeScript errors in `useStudents.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useStudents.tsx
git commit -m "feat: update useStudents to join through enrolments table"
```

---

## Task 4: Update Analytics Hooks

**Files:**
- Modify: `src/hooks/useProgressAnalytics.tsx` — 2 locations
- Modify: `src/hooks/useComprehensiveAnalytics.tsx` — 3 locations

Each location that does `.from('students').select('...').eq('class_id', classId)` gets the same fix: add `enrolments!inner(class_id)` to the select and filter on `enrolments.class_id`.

- [ ] **Step 1: Fix useProgressAnalytics.tsx — first query (line ~30)**

Find this block:
```typescript
const { data: students, error: studentsError } = await supabase
  .from('students')
  .select('id, first_name, last_name')
  .eq('class_id', classId)
  .order('last_name');
```

Replace with:
```typescript
const { data: studentsRaw, error: studentsError } = await supabase
  .from('students')
  .select('id, first_name, last_name, enrolments!inner(class_id)')
  .eq('enrolments.class_id', classId)
  .order('last_name');
const students = studentsRaw?.map(({ enrolments: _, ...s }) => s);
```

- [ ] **Step 2: Fix useProgressAnalytics.tsx — second query (line ~157)**

Find this block:
```typescript
const { data: students, error: studentsError } = await supabase
  .from('students')
  .select('id, first_name, last_name')
  .eq('class_id', classId)
  .order('last_name');
```

Replace with:
```typescript
const { data: studentsRaw, error: studentsError } = await supabase
  .from('students')
  .select('id, first_name, last_name, enrolments!inner(class_id)')
  .eq('enrolments.class_id', classId)
  .order('last_name');
const students = studentsRaw?.map(({ enrolments: _, ...s }) => s);
```

- [ ] **Step 3: Fix useComprehensiveAnalytics.tsx — all three queries**

Find and replace all three occurrences of this pattern (they appear at approximately lines 45, 241, and 346):

Find:
```typescript
const { data: students, error: studentsError } = await supabase
  .from('students')
  .select('id, first_name, last_name')
  .eq('class_id', classId)
  .order('last_name');
```

Replace each with:
```typescript
const { data: studentsRaw, error: studentsError } = await supabase
  .from('students')
  .select('id, first_name, last_name, enrolments!inner(class_id)')
  .eq('enrolments.class_id', classId)
  .order('last_name');
const students = studentsRaw?.map(({ enrolments: _, ...s }) => s);
```

- [ ] **Step 4: Verify no TypeScript errors**

```bash
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useProgressAnalytics.tsx src/hooks/useComprehensiveAnalytics.tsx
git commit -m "feat: update analytics hooks to query students via enrolments"
```

---

## Task 5: Update useAssessmentImport

**Files:**
- Modify: `src/hooks/useAssessmentImport.tsx`

Replace Step 3 (get or create students) with the find-or-create-enrol pattern. Students are now looked up by `(teacher_id, student_id text)` rather than `class_id`.

- [ ] **Step 1: Find Step 3 in useAssessmentImport.tsx (around line 80)**

Locate this block:
```typescript
// Step 3: Get or create students
const existingStudents = await supabase
  .from('students')
  .select('*')
  .eq('class_id', classId)
  .order('last_name');

const existingStudentIds = new Set<string>();
existingStudents.data?.forEach(student => {
  if (student.student_id) {
    existingStudentIds.add(student.student_id);
  }
});

// Create missing students (only for standard imports where an ID is provided)
const studentsToCreate =
  assessmentData.sourceFormat === 'standard'
    ? assessmentData.students
        .filter(s => s.studentId && !existingStudentIds.has(s.studentId))
        .map(s => ({
          student_id: s.studentId,
          first_name: s.firstName,
          last_name: s.lastName,
          class_id: classId,
        }))
    : [];

if (studentsToCreate.length > 0) {
  const { error: createStudentsError } = await supabase
    .from('students')
    .insert(studentsToCreate);

  if (createStudentsError) throw createStudentsError;
}

// Get all students for the class (including newly created ones)
const { data: allStudents, error: studentsError } = await supabase
  .from('students')
  .select('*')
  .eq('class_id', classId)
  .order('last_name');

if (studentsError) throw studentsError;
```

- [ ] **Step 2: Replace that entire block with**

```typescript
// Step 3: Get or create students, then ensure they are enrolled in this class
const { data: { user: currentUser } } = await supabase.auth.getUser();
if (!currentUser) throw new Error('Not authenticated');
const teacherId = currentUser.id;

// Collect the student IDs we expect to find/create
const incomingStudentIds = assessmentData.students
  .filter(s => s.studentId)
  .map(s => s.studentId);

// Fetch any that already exist for this teacher
const { data: existingStudents, error: fetchExistingError } = await supabase
  .from('students')
  .select('*')
  .eq('teacher_id', teacherId)
  .in('student_id', incomingStudentIds.length > 0 ? incomingStudentIds : ['__none__']);
if (fetchExistingError) throw fetchExistingError;

const existingStudentMap = new Map<string, typeof existingStudents[0]>(
  existingStudents?.map(s => [s.student_id, s]) ?? []
);

// Create students that don't exist yet (standard imports only — single_mark has no student IDs)
if (assessmentData.sourceFormat === 'standard') {
  const studentsToCreate = assessmentData.students
    .filter(s => s.studentId && !existingStudentMap.has(s.studentId))
    .map(s => ({
      student_id: s.studentId,
      first_name: s.firstName,
      last_name: s.lastName,
      teacher_id: teacherId,
    }));

  if (studentsToCreate.length > 0) {
    const { data: newStudents, error: createStudentsError } = await supabase
      .from('students')
      .insert(studentsToCreate)
      .select('*');
    if (createStudentsError) throw createStudentsError;
    newStudents?.forEach(s => existingStudentMap.set(s.student_id, s));
  }
}

// Enrol all found/created students in this class (skip if already enrolled)
const studentUuids = [...existingStudentMap.values()].map(s => s.id);
if (studentUuids.length > 0) {
  const { error: enrolError } = await supabase
    .from('enrolments')
    .upsert(
      studentUuids.map(id => ({ class_id: classId, student_id: id })),
      { ignoreDuplicates: true }
    );
  if (enrolError) throw enrolError;
}

// Fetch all students now enrolled in this class (for building the result-mapping below)
const { data: allStudents, error: studentsError } = await supabase
  .from('students')
  .select('id, student_id, first_name, last_name, email, year_level, teacher_id, created_at, updated_at, enrolments!inner(class_id)')
  .eq('enrolments.class_id', classId)
  .order('last_name');
if (studentsError) throw studentsError;
const allStudentsClean = allStudents?.map(({ enrolments: _, ...s }) => s) ?? [];
```

- [ ] **Step 3: Update the reference to `allStudents` on the lines immediately after**

Find every subsequent reference to `allStudents` in the same `mutationFn` (it builds `studentIdMap` and `normalizedNameMap`). Change `allStudents` to `allStudentsClean`:

```typescript
// Before:
allStudents?.forEach(student => {
// After:
allStudentsClean.forEach(student => {
```

- [ ] **Step 4: Verify no TypeScript errors**

```bash
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAssessmentImport.tsx
git commit -m "feat: update assessment import to find-or-create-enrol pattern"
```

---

## Task 6: Update ClassStudentsTab

**Files:**
- Modify: `src/components/class-dashboard/adjust-class/ClassStudentsTab.tsx`

Three changes: (1) `parseStudentsCSV` no longer receives `classId`; (2) `handleAddStudent` uses find-or-create-enrol; (3) `handleCSVUpload` uses bulk find-or-create-enrol; (4) delete becomes "Remove from Class" (removes enrolment, deletes student only if no other enrolments remain); (5) confirmation dialog text updated.

- [ ] **Step 1: Update `parseStudentsCSV` to remove classId**

Find:
```typescript
const parseStudentsCSV = (csvText: string, classId: string) => {
```
Replace with:
```typescript
const parseStudentsCSV = (csvText: string) => {
```

Find inside the function:
```typescript
    students.push({
      student_id: student_id.trim(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      class_id: classId,
    });
```
Replace with:
```typescript
    students.push({
      student_id: student_id.trim(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
    });
```

- [ ] **Step 2: Replace `handleAddStudent`**

Find the entire `handleAddStudent` function and replace it:
```typescript
  const handleAddStudent = async () => {
    if (!newStudent.first_name || !newStudent.last_name || !newStudent.student_id) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all student fields (first name, last name, and student ID).',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingStudent(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find existing student for this teacher with the same student_id
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('student_id', newStudent.student_id)
        .maybeSingle();

      let studentUuid: string;
      if (existing) {
        studentUuid = existing.id;
      } else {
        const { data: created, error: createError } = await supabase
          .from('students')
          .insert({
            first_name: newStudent.first_name,
            last_name: newStudent.last_name,
            student_id: newStudent.student_id,
            teacher_id: user.id,
          })
          .select('id')
          .single();
        if (createError) throw createError;
        studentUuid = created.id;
      }

      // Enrol in this class (silent no-op if already enrolled)
      const { error: enrolError } = await supabase
        .from('enrolments')
        .upsert({ class_id: classData.id, student_id: studentUuid }, { ignoreDuplicates: true });
      if (enrolError) throw enrolError;

      await queryClient.invalidateQueries({ queryKey: ['students', classData.id] });
      setNewStudent({ first_name: '', last_name: '', student_id: '' });
      toast({ title: 'Student Added', description: `${newStudent.first_name} ${newStudent.last_name} has been added to the class.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to add student.', variant: 'destructive' });
    } finally {
      setIsAddingStudent(false);
    }
  };
```

- [ ] **Step 3: Replace `handleDeleteStudent` with `handleRemoveFromClass`**

Find the entire `handleDeleteStudent` function and replace it:
```typescript
  const handleRemoveFromClass = async (studentId: string, studentName: string) => {
    setDeletingStudentId(studentId);
    try {
      // Remove the enrolment for this class only
      const { error: enrolError } = await supabase
        .from('enrolments')
        .delete()
        .eq('class_id', classData.id)
        .eq('student_id', studentId);
      if (enrolError) throw enrolError;

      // If no enrolments remain, clean up the student record entirely
      const { data: remainingEnrolments } = await supabase
        .from('enrolments')
        .select('class_id')
        .eq('student_id', studentId);

      if (!remainingEnrolments || remainingEnrolments.length === 0) {
        await supabase.from('students').delete().eq('id', studentId);
      }

      await queryClient.invalidateQueries({ queryKey: ['students', classData.id] });
      toast({ title: 'Student Removed', description: `${studentName} has been removed from this class.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to remove student.', variant: 'destructive' });
    } finally {
      setDeletingStudentId(null);
    }
  };
```

- [ ] **Step 4: Replace `handleCSVUpload`**

Find the entire `handleCSVUpload` function and replace it:
```typescript
  const handleCSVUpload = async () => {
    if (!csvFile) {
      toast({ title: 'No File Selected', description: 'Please select a CSV file to upload.', variant: 'destructive' });
      return;
    }

    setIsUploadingCSV(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const csvText = await csvFile.text();
      const parsedStudents = parseStudentsCSV(csvText);

      if (parsedStudents.length === 0) {
        toast({ title: 'No Students Found', description: 'The CSV file appears to be empty or contains no valid student data.', variant: 'destructive' });
        return;
      }

      const incomingIds = parsedStudents.map(s => s.student_id);

      // Find students that already exist for this teacher
      const { data: existing, error: fetchError } = await supabase
        .from('students')
        .select('id, student_id')
        .eq('teacher_id', user.id)
        .in('student_id', incomingIds);
      if (fetchError) throw fetchError;

      const existingMap = new Map<string, string>(existing?.map(s => [s.student_id, s.id]) ?? []);

      // Create any students not yet in the system
      const toCreate = parsedStudents.filter(s => !existingMap.has(s.student_id));
      if (toCreate.length > 0) {
        const { data: created, error: createError } = await supabase
          .from('students')
          .insert(toCreate.map(s => ({ ...s, teacher_id: user.id })))
          .select('id, student_id');
        if (createError) throw createError;
        created?.forEach(s => existingMap.set(s.student_id, s.id));
      }

      // Enrol all in this class (skip already-enrolled)
      const { error: enrolError } = await supabase
        .from('enrolments')
        .upsert(
          [...existingMap.values()].map(id => ({ class_id: classData.id, student_id: id })),
          { ignoreDuplicates: true }
        );
      if (enrolError) throw enrolError;

      await queryClient.invalidateQueries({ queryKey: ['students', classData.id] });
      setCsvFile(null);
      toast({
        title: 'Students Processed',
        description: `${parsedStudents.length} student${parsedStudents.length !== 1 ? 's' : ''} added or confirmed in this class.`,
      });
    } catch (error: any) {
      toast({ title: 'CSV Upload Error', description: error.message || 'Failed to process CSV file.', variant: 'destructive' });
    } finally {
      setIsUploadingCSV(false);
    }
  };
```

- [ ] **Step 5: Update all references to `handleDeleteStudent` in the JSX**

Find in the JSX:
```typescript
onClick={() => handleDeleteStudent(student.id, `${student.first_name} ${student.last_name}`)}
```
Replace with:
```typescript
onClick={() => handleRemoveFromClass(student.id, `${student.first_name} ${student.last_name}`)}
```

- [ ] **Step 6: Update the confirmation dialog text**

Find:
```typescript
<AlertDialogDescription>
  Are you sure you want to remove {student.first_name} {student.last_name} from this class?
  This action cannot be undone and will remove all their assessment data and progress records.
</AlertDialogDescription>
```
Replace with:
```typescript
<AlertDialogDescription>
  Are you sure you want to remove {student.first_name} {student.last_name} from this class?
  This only removes them from this class — their record and any other class enrolments will not be affected.
</AlertDialogDescription>
```

- [ ] **Step 7: Verify no old `students` variable or `class_id` references remain in this file**

Search the file for `class_id` and `parseStudentsCSV(csvText, classData.id)` — both should be gone after the rewrites above. If any remain, remove them.

- [ ] **Step 8: Verify no TypeScript errors**

```bash
npm run lint
```

- [ ] **Step 9: Commit**

```bash
git add src/components/class-dashboard/adjust-class/ClassStudentsTab.tsx
git commit -m "feat: update ClassStudentsTab to find-or-create-enrol and remove-from-class"
```

---

## Task 7: Smoke Test

No automated test runner is configured. Verify the key flows manually in the browser.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Navigate to `http://localhost:8080` and log in.

- [ ] **Step 2: Verify class roster loads**

Open a class. The students list should load as before. Check the browser console — no errors.

- [ ] **Step 3: Verify student counts on the dashboard**

Go to the Dashboard. Class student counts and "Active Students" total should match what you expect.

- [ ] **Step 4: Add a student manually**

Go to a class → Adjust Class Data → Students tab. Add a new student with a unique student ID. Verify they appear in the roster.

- [ ] **Step 5: Add the same student to a second class**

Go to a different class → Adjust Class Data → Students tab. Add the same student (same student ID, same name). Verify:
- They appear in the second class roster
- They still appear in the first class roster
- The student count for each class is correct

- [ ] **Step 6: Remove a shared student from one class**

In one of the two classes, click the trash icon next to the shared student. Confirm the dialog and verify:
- They are gone from that class
- They still appear in the other class

- [ ] **Step 7: Test CSV import**

Upload a CSV with 2–3 students to a class. Verify they all appear in the roster.

- [ ] **Step 8: Verify analytics pages**

Open a class that has assessment results. Check that the analytics charts and student progress data still render correctly.

- [ ] **Step 9: Final commit**

```bash
git add -A
git commit -m "feat: multi-class students — complete implementation"
```
