-- Extend anonymous RLS policies to include homework exit tickets
-- (previously only status='active' was accessible; homework tasks with a
--  future due_date are now also accessible to anonymous students)

DROP POLICY IF EXISTS "Public can view active exit tickets" ON tasks;
CREATE POLICY "Public can view active exit tickets" ON tasks
  FOR SELECT TO anon USING (
    is_exit_ticket = true AND (
      status = 'active'
      OR (status = 'homework' AND due_date >= CURRENT_DATE)
    )
  );

DROP POLICY IF EXISTS "Public can view questions for active exit tickets" ON questions;
CREATE POLICY "Public can view questions for active exit tickets" ON questions
  FOR SELECT TO anon USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE is_exit_ticket = true AND (
        status = 'active'
        OR (status = 'homework' AND due_date >= CURRENT_DATE)
      )
    )
  );

DROP POLICY IF EXISTS "Public can view question options for active exit tickets" ON question_options;
CREATE POLICY "Public can view question options for active exit tickets" ON question_options
  FOR SELECT TO anon USING (
    question_id IN (
      SELECT q.id FROM questions q
      JOIN tasks t ON q.task_id = t.id
      WHERE t.is_exit_ticket = true AND (
        t.status = 'active'
        OR (t.status = 'homework' AND t.due_date >= CURRENT_DATE)
      )
    )
  );

DROP POLICY IF EXISTS "Public users can create results for exit tickets" ON results;
CREATE POLICY "Public users can create results for exit tickets" ON results
  FOR INSERT TO anon WITH CHECK (
    task_id IN (
      SELECT id FROM tasks
      WHERE is_exit_ticket = true AND (
        status = 'active'
        OR (status = 'homework' AND due_date >= CURRENT_DATE)
      )
    )
  );

DROP POLICY IF EXISTS "Public users can create question results for exit tickets" ON question_results;
CREATE POLICY "Public users can create question results for exit tickets" ON question_results
  FOR INSERT TO anon WITH CHECK (
    question_id IN (
      SELECT q.id FROM questions q
      JOIN tasks t ON q.task_id = t.id
      WHERE t.is_exit_ticket = true AND (
        t.status = 'active'
        OR (t.status = 'homework' AND t.due_date >= CURRENT_DATE)
      )
    )
  );
