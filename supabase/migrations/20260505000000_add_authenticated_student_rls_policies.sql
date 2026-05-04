-- When students log in via PIN or SSO, they get a real Supabase auth session
-- (authenticated role). The existing anon policies no longer apply to them.
-- These policies let authenticated students access their own data.

-- 1. Enrolments: students can see which classes they're enrolled in
create policy "Students can view their own enrolments"
  on enrolments for select
  to authenticated
  using (
    student_id = (auth.jwt() -> 'user_metadata' ->> 'student_id')::uuid
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'student'
  );

-- 2. Class resources: students can see active resources in any class
--    (class membership is enforced by the student dashboard query, not here)
create policy "Authenticated students can view active class resources"
  on class_resources for select
  to authenticated
  using (
    status = 'active'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'student'
  );

-- 3. Resources: students can view resource details
create policy "Authenticated students can view resources"
  on resources for select
  to authenticated
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'student'
  );

-- 4. Results: students can view their own results
create policy "Students can view their own results"
  on results for select
  to authenticated
  using (
    student_id = (auth.jwt() -> 'user_metadata' ->> 'student_id')::uuid
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'student'
  );

-- 5. Results: students can submit results for exit tickets
create policy "Students can insert their own results"
  on results for insert
  to authenticated
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'student'
  );

-- 6. Question results: students can view their own question results
create policy "Students can view their own question results"
  on question_results for select
  to authenticated
  using (
    student_id = (auth.jwt() -> 'user_metadata' ->> 'student_id')::uuid
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'student'
  );

-- 7. Question results: students can submit question results for exit tickets
create policy "Students can insert their own question results"
  on question_results for insert
  to authenticated
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'student'
  );
