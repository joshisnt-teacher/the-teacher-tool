-- Fix UPDATE and DELETE policies on class_resources to match the SELECT policy.
-- The old policies used `teacher_id = auth.uid()` which silently blocks updates
-- when the stored teacher_id differs from the current auth session (e.g. after
-- re-login via SSO). Use class ownership instead, consistent with SELECT.

DROP POLICY IF EXISTS "Teachers can update their own class_resources" ON class_resources;
DROP POLICY IF EXISTS "Teachers can delete their own class_resources" ON class_resources;

CREATE POLICY "Teachers can update their own class_resources"
  ON class_resources FOR UPDATE
  USING (class_id IN (
    SELECT id FROM classes WHERE teacher_id = auth.uid()
  ));

CREATE POLICY "Teachers can delete their own class_resources"
  ON class_resources FOR DELETE
  USING (class_id IN (
    SELECT id FROM classes WHERE teacher_id = auth.uid()
  ));
