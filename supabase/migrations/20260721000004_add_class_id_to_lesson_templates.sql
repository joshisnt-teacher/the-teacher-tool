-- lesson_templates had no class_id, even though every Atlas lesson is already
-- scoped to exactly one class in Atlas's own data model (atlas-import already
-- resolves class_code -> a local classes.id per import, it just never stored
-- it). Without this, ClassDashboard had no way to know which Atlas lessons
-- belong to a given class and fell back to a separate, now-dead
-- atlas_lesson_references table that atlas-import stopped writing to once
-- pulse-send-lesson.ts was rewired to call atlas-import directly. This also
-- lets the "Start Lesson" flow skip re-asking which class to run it in.
ALTER TABLE lesson_templates
  ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES classes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lesson_templates_class
  ON lesson_templates (class_id)
  WHERE class_id IS NOT NULL;
