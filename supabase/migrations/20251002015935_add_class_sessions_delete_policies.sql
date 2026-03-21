-- Add missing DELETE policy for class_sessions table
CREATE POLICY "Teachers can delete class sessions for their classes" ON class_sessions
  FOR DELETE USING (
    class_id IN ( SELECT classes.id
      FROM classes
      WHERE (classes.teacher_id = auth.uid())
    )
  );

-- Add missing DELETE policy for student_notes table
CREATE POLICY "Teachers can delete student notes for their classes" ON student_notes
  FOR DELETE USING (
    student_id IN (
      SELECT s.id FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );
