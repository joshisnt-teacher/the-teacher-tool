-- Links a class session to the Atlas lesson that was taught.
-- Nullable: existing sessions and manually-started sessions are unaffected.
ALTER TABLE class_sessions
  ADD COLUMN IF NOT EXISTS atlas_lesson_ref_id UUID
    REFERENCES atlas_lesson_references(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_class_sessions_atlas_lesson_ref
  ON class_sessions (atlas_lesson_ref_id)
  WHERE atlas_lesson_ref_id IS NOT NULL;
