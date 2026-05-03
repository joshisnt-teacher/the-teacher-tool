-- Allow anonymous (student) users to read active class resources and their details.
-- Students use localStorage sessions (not Supabase auth) so they hit Supabase as
-- the anon role. Without these policies the student dashboard resource section
-- returns nothing even when resources are assigned and set to active.

create policy "Students can view active class resources"
  on class_resources for select
  to anon
  using (status = 'active');

create policy "Students can view resources"
  on resources for select
  to anon
  using (true);
