-- Migration: Multi-class students via enrolments table
-- Students are no longer tied to a single class. teacher_id is added for ownership.
-- The enrolments table becomes the many-to-many join between students and classes.

-- Step 1: Add teacher_id (nullable initially so we can populate before constraining)
ALTER TABLE students ADD COLUMN IF NOT EXISTS teacher_id uuid;

-- Step 2: Populate teacher_id from each student's current class
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
    canonical_id := dup_group.ids[1];
    FOR i IN 2..array_length(dup_group.ids, 1) LOOP
      dup_id := dup_group.ids[i];
      INSERT INTO enrolments (class_id, student_id)
        SELECT class_id, canonical_id FROM enrolments WHERE student_id = dup_id
        ON CONFLICT DO NOTHING;
      DELETE FROM results WHERE student_id = dup_id
        AND task_id IN (SELECT task_id FROM results WHERE student_id = canonical_id);
      UPDATE results SET student_id = canonical_id WHERE student_id = dup_id;
      DELETE FROM question_results WHERE student_id = dup_id
        AND question_id IN (SELECT question_id FROM question_results WHERE student_id = canonical_id);
      UPDATE question_results SET student_id = canonical_id WHERE student_id = dup_id;
      DELETE FROM student_responses WHERE student_id = dup_id
        AND task_id IN (SELECT task_id FROM student_responses WHERE student_id = canonical_id);
      UPDATE student_responses SET student_id = canonical_id WHERE student_id = dup_id;
      DELETE FROM enrolments WHERE student_id = dup_id;
      DELETE FROM students WHERE id = dup_id;
    END LOOP;
  END LOOP;
END $$;

-- Step 5: Make teacher_id NOT NULL
ALTER TABLE students ALTER COLUMN teacher_id SET NOT NULL;

-- Step 6: FK students.teacher_id → auth.users
ALTER TABLE students
  ADD CONSTRAINT students_teacher_id_fkey
  FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 7: FK enrolments.student_id → students
ALTER TABLE enrolments
  ADD CONSTRAINT enrolments_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- Step 8: FK enrolments.class_id → classes
ALTER TABLE enrolments
  ADD CONSTRAINT enrolments_class_id_fkey
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

-- Step 9: Drop all policies that reference students.class_id before dropping the column
DROP POLICY IF EXISTS "Teachers can create students in their classes" ON students;
DROP POLICY IF EXISTS "Teachers can delete students in their classes" ON students;
DROP POLICY IF EXISTS "Teachers can update students in their classes" ON students;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON students;
DROP POLICY IF EXISTS "Teachers can view their students" ON students;
DROP POLICY IF EXISTS "Teachers can manage students in their classes" ON students;
DROP POLICY IF EXISTS "Public can view students for active exit ticket classes" ON students;
DROP POLICY IF EXISTS "Teachers can create question results in their classes" ON question_results;
DROP POLICY IF EXISTS "Teachers can delete question results in their classes" ON question_results;
DROP POLICY IF EXISTS "Teachers can update question results in their classes" ON question_results;
DROP POLICY IF EXISTS "Teachers can view question results in their classes" ON question_results;
DROP POLICY IF EXISTS "Teachers can manage question results for their students" ON question_results;
DROP POLICY IF EXISTS "Teachers can create results in their classes" ON results;
DROP POLICY IF EXISTS "Teachers can delete results in their classes" ON results;
DROP POLICY IF EXISTS "Teachers can update results in their classes" ON results;
DROP POLICY IF EXISTS "Teachers can view results in their classes" ON results;
DROP POLICY IF EXISTS "Teachers can manage results for their students" ON results;
DROP POLICY IF EXISTS "Teachers can view student notes for their classes" ON student_notes;
DROP POLICY IF EXISTS "Teachers can insert student notes for their classes" ON student_notes;
DROP POLICY IF EXISTS "Teachers can update student notes for their classes" ON student_notes;
DROP POLICY IF EXISTS "Teachers can delete student notes for their classes" ON student_notes;
DROP POLICY IF EXISTS "Teachers can manage student notes for their classes" ON student_notes;

-- Step 10: Drop class_id now that enrolments holds that relationship
ALTER TABLE students DROP COLUMN class_id;

-- Step 11: Replace unique constraint
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_class_id_student_id_key;
ALTER TABLE students
  ADD CONSTRAINT students_teacher_id_student_id_key
  UNIQUE (teacher_id, student_id);

-- Step 12: New students policies (direct teacher_id check)
CREATE POLICY "Teachers can view their own students" ON students
  FOR SELECT TO public USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can create their own students" ON students
  FOR INSERT TO public WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Teachers can update their own students" ON students
  FOR UPDATE TO public USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can delete their own students" ON students
  FOR DELETE TO public USING (teacher_id = auth.uid());

-- Step 13: New question_results policies
CREATE POLICY "Teachers can view question results in their classes" ON question_results
  FOR SELECT TO public USING (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers can create question results in their classes" ON question_results
  FOR INSERT TO public WITH CHECK (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers can update question results in their classes" ON question_results
  FOR UPDATE TO public USING (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers can delete question results in their classes" ON question_results
  FOR DELETE TO public USING (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));

-- Step 14: New results policies
CREATE POLICY "Teachers can view results in their classes" ON results
  FOR SELECT TO public USING (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers can create results in their classes" ON results
  FOR INSERT TO public WITH CHECK (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers can update results in their classes" ON results
  FOR UPDATE TO public USING (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers can delete results in their classes" ON results
  FOR DELETE TO public USING (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));

-- Step 15: New student_notes policies
CREATE POLICY "Teachers can view student notes for their classes" ON student_notes
  FOR SELECT TO public USING (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers can insert student notes for their classes" ON student_notes
  FOR INSERT TO public WITH CHECK (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers can update student notes for their classes" ON student_notes
  FOR UPDATE TO public USING (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers can delete student notes for their classes" ON student_notes
  FOR DELETE TO public USING (student_id IN (SELECT id FROM students WHERE teacher_id = auth.uid()));

-- Step 16: Anon policy for enrolments (needed for student-facing ClassJoin page)
CREATE POLICY "Public users can view enrolments for class join" ON enrolments
  AS permissive FOR SELECT TO anon USING (true);
