-- ============================================
-- Add marking_criteria to questions for exit-ticket auto-marking
-- ============================================

ALTER TABLE questions ADD COLUMN IF NOT EXISTS marking_criteria JSONB DEFAULT NULL;

-- Backfill max_score for existing exit tickets
UPDATE tasks t
SET max_score = sub.total_max_score
FROM (
  SELECT task_id, COALESCE(SUM(max_score), 0) AS total_max_score
  FROM questions
  WHERE task_id IN (SELECT id FROM tasks WHERE is_exit_ticket = true)
  GROUP BY task_id
) sub
WHERE t.id = sub.task_id
  AND t.is_exit_ticket = true;
