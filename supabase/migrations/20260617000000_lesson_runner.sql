-- Lesson Runner migration
-- Adds lesson_templates, lesson_template_slides, and extends class_sessions
-- for structured lesson mode (slides only, no embedded interactions).

-- ============================================================
-- 1. lesson_templates
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_templates (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title              text NOT NULL,
  description        text,
  success_criteria   jsonb NOT NULL DEFAULT '[]',
  learning_intentions jsonb NOT NULL DEFAULT '[]',
  teacher_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id          uuid,
  source             text NOT NULL DEFAULT 'manual'
                       CHECK (source IN ('atlas', 'manual')),
  atlas_lesson_id    text,
  metadata           jsonb NOT NULL DEFAULT '{}',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lesson_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers own lesson templates"
  ON lesson_templates FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_lesson_templates_teacher
  ON lesson_templates (teacher_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_templates_atlas_lesson
  ON lesson_templates (atlas_lesson_id)
  WHERE atlas_lesson_id IS NOT NULL;

-- ============================================================
-- 2. lesson_template_slides
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_template_slides (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_template_id   uuid NOT NULL
                         REFERENCES lesson_templates(id) ON DELETE CASCADE,
  "order"              integer NOT NULL,
  title                text,
  content_blocks       jsonb NOT NULL DEFAULT '[]',
  layout               text NOT NULL DEFAULT 'default'
                         CHECK (layout IN ('default', 'split', 'image_full', 'title_only')),
  background_colour    text,
  background_image_url text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lesson_template_slides ENABLE ROW LEVEL SECURITY;

-- Teachers manage their own slides
CREATE POLICY "Teachers manage own lesson slides"
  ON lesson_template_slides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lesson_templates lt
      WHERE lt.id = lesson_template_slides.lesson_template_id
        AND lt.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lesson_templates lt
      WHERE lt.id = lesson_template_slides.lesson_template_id
        AND lt.teacher_id = auth.uid()
    )
  );

-- Anonymous students read slides (student sessions are not JWT-based)
CREATE POLICY "Anon students read lesson slides"
  ON lesson_template_slides FOR SELECT
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_lesson_template_slides_template
  ON lesson_template_slides (lesson_template_id, "order");

-- ============================================================
-- 3. Extend class_sessions
-- ============================================================
ALTER TABLE class_sessions
  ADD COLUMN IF NOT EXISTS lesson_template_id    uuid
    REFERENCES lesson_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mode                  text DEFAULT 'freeform'
    CHECK (mode IN ('freeform', 'structured')),
  ADD COLUMN IF NOT EXISTS current_slide_index   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS atlas_feedback_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_class_sessions_lesson_template
  ON class_sessions (lesson_template_id)
  WHERE lesson_template_id IS NOT NULL;
