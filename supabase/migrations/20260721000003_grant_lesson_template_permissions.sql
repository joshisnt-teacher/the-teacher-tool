-- lesson_templates and lesson_template_slides were created with RLS policies
-- but no table-level GRANTs, so PostgREST returns 42501 "permission denied
-- for table" for authenticated teachers (RLS policies are only consulted
-- after the underlying GRANT allows the operation).

GRANT ALL ON TABLE lesson_templates TO authenticated;
GRANT ALL ON TABLE lesson_template_slides TO authenticated;
GRANT SELECT ON TABLE lesson_template_slides TO anon;

-- ============================================================
-- Students were never covered at all for the lesson-runner flow:
--   - class_sessions has no student-facing policy of any kind
--   - lesson_templates has no student-facing policy of any kind
--   - lesson_template_slides only has an `anon` policy, a leftover from
--     before students were authenticated (they log in via verifyOtp now,
--     so they hit RLS as `authenticated`, not `anon`)
-- This is why the student slide viewer never worked: students couldn't
-- even see that a live lesson session existed, let alone its slides.
-- Same auth.jwt() user_metadata->>'student_id' pattern as
-- 20260505071732_student_auth_rls_policies.sql.
-- ============================================================

CREATE POLICY "Authenticated students can view class sessions for their classes"
  ON class_sessions FOR SELECT
  TO authenticated
  USING (
    class_id IN (
      SELECT class_id FROM enrolments
      WHERE student_id = ((auth.jwt() -> 'user_metadata' ->> 'student_id'))::uuid
    )
  );

CREATE POLICY "Authenticated students can view lesson templates in progress"
  ON lesson_templates FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT cs.lesson_template_id
      FROM class_sessions cs
      JOIN enrolments e ON e.class_id = cs.class_id
      WHERE cs.lesson_template_id IS NOT NULL
        AND e.student_id = ((auth.jwt() -> 'user_metadata' ->> 'student_id'))::uuid
    )
  );

CREATE POLICY "Authenticated students can view lesson slides in progress"
  ON lesson_template_slides FOR SELECT
  TO authenticated
  USING (
    lesson_template_id IN (
      SELECT cs.lesson_template_id
      FROM class_sessions cs
      JOIN enrolments e ON e.class_id = cs.class_id
      WHERE cs.lesson_template_id IS NOT NULL
        AND e.student_id = ((auth.jwt() -> 'user_metadata' ->> 'student_id'))::uuid
    )
  );
