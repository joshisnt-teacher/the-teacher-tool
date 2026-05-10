-- Add RLS policies for authenticated students.
-- Previously, students only had localStorage sessions and queried Supabase as anon.
-- After the auth fix (PIN and SSO login now use verifyOtp), students are authenticated.
-- These policies allow authenticated students to read their own data.

-- 1. Enrolments: students can view their own enrolments
CREATE POLICY "Authenticated students can view their own enrolments"
  ON enrolments FOR SELECT
  TO authenticated
  USING (student_id = ((auth.jwt() -> 'user_metadata' ->> 'student_id'))::uuid);

-- 2. Classes: students can view classes they are enrolled in
CREATE POLICY "Authenticated students can view their classes"
  ON classes FOR SELECT
  TO authenticated
  USING (id IN (
    SELECT class_id FROM enrolments
    WHERE student_id = ((auth.jwt() -> 'user_metadata' ->> 'student_id'))::uuid
  ));

-- 3. Tasks (exit tickets): students can view active tasks for their enrolled classes
CREATE POLICY "Authenticated students can view active tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    AND class_id IN (
      SELECT class_id FROM enrolments
      WHERE student_id = ((auth.jwt() -> 'user_metadata' ->> 'student_id'))::uuid
    )
  );

-- 4. Class resources: students can view active resources for their enrolled classes
CREATE POLICY "Authenticated students can view active class resources"
  ON class_resources FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    AND class_id IN (
      SELECT class_id FROM enrolments
      WHERE student_id = ((auth.jwt() -> 'user_metadata' ->> 'student_id'))::uuid
    )
  );

-- 5. Resources: students can view resource details
CREATE POLICY "Authenticated students can view resources"
  ON resources FOR SELECT
  TO authenticated
  USING (true);

-- 6. Students table: students can view their own student record
CREATE POLICY "Authenticated students can view their own record"
  ON students FOR SELECT
  TO authenticated
  USING (id = ((auth.jwt() -> 'user_metadata' ->> 'student_id'))::uuid);

-- 7. Task responses: students can view their own responses
CREATE POLICY "Authenticated students can view their own task responses"
  ON task_responses FOR SELECT
  TO authenticated
  USING (student_id = ((auth.jwt() -> 'user_metadata' ->> 'student_id'))::uuid);

-- 8. Task responses: students can insert their own responses
CREATE POLICY "Authenticated students can insert their own task responses"
  ON task_responses FOR INSERT
  TO authenticated
  WITH CHECK (student_id = ((auth.jwt() -> 'user_metadata' ->> 'student_id'))::uuid);
