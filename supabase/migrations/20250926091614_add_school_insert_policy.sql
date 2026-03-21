-- Add INSERT policy for schools table to allow authenticated users to create schools

-- Allow authenticated users to create new schools
create policy "Authenticated users can create schools"
on "public"."schools"
as permissive
for insert
to authenticated
with check (true);

-- Allow users to view all schools (for selection purposes)
create policy "Authenticated users can view all schools"
on "public"."schools"
as permissive
for select
to authenticated
using (true);
