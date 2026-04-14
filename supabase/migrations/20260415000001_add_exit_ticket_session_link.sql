-- ============================================
-- Link exit tickets to class sessions and track completion
-- ============================================

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS class_session_id UUID REFERENCES class_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;

-- Backfill existing exit tickets
UPDATE tasks
SET is_completed = false,
    class_session_id = NULL
WHERE is_exit_ticket = true;
