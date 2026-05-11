-- supabase/migrations/20260511000001_create_ai_action_results.sql
CREATE TABLE IF NOT EXISTS ai_action_results (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  teacher_id  uuid NOT NULL REFERENCES auth.users(id),
  action_type text NOT NULL CHECK (
    action_type IN ('class_analysis', 'student_feedback', 'struggling_students')
  ),
  output_json jsonb NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE ai_action_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_own" ON ai_action_results
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Required for upsert conflict resolution
CREATE UNIQUE INDEX IF NOT EXISTS ai_action_results_task_action_uidx
  ON ai_action_results (task_id, action_type);
