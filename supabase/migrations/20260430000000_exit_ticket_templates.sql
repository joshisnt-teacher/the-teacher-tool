-- ============================================================
-- Exit Ticket Templates: separate definitions from class runs
-- ============================================================

CREATE TABLE exit_ticket_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exit_ticket_templates_teacher_id ON exit_ticket_templates(teacher_id);
CREATE INDEX idx_exit_ticket_templates_school_id  ON exit_ticket_templates(school_id);

ALTER TABLE exit_ticket_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage own templates" ON exit_ticket_templates
  FOR ALL USING (teacher_id = auth.uid());

-- ----

CREATE TABLE template_questions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id          UUID NOT NULL REFERENCES exit_ticket_templates(id) ON DELETE CASCADE,
  number               INTEGER NOT NULL,
  question             TEXT,
  question_type        TEXT,
  max_score            NUMERIC,
  blooms_taxonomy      TEXT,
  content_item         TEXT,
  general_capabilities TEXT[],
  marking_criteria     JSONB,
  model_answer         TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_template_questions_template_id ON template_questions(template_id);
ALTER TABLE template_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage template questions" ON template_questions
  FOR ALL USING (
    template_id IN (
      SELECT id FROM exit_ticket_templates WHERE teacher_id = auth.uid()
    )
  );

-- ----

CREATE TABLE template_question_options (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_question_id UUID NOT NULL REFERENCES template_questions(id) ON DELETE CASCADE,
  option_text          TEXT NOT NULL,
  is_correct           BOOLEAN NOT NULL DEFAULT false,
  order_index          INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_template_question_options_tq_id ON template_question_options(template_question_id);
ALTER TABLE template_question_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage template question options" ON template_question_options
  FOR ALL USING (
    template_question_id IN (
      SELECT tq.id FROM template_questions tq
      JOIN exit_ticket_templates ett ON tq.template_id = ett.id
      WHERE ett.teacher_id = auth.uid()
    )
  );

-- ----

ALTER TABLE tasks
  ADD COLUMN exit_ticket_template_id UUID
    REFERENCES exit_ticket_templates(id) ON DELETE SET NULL;

CREATE INDEX idx_tasks_exit_ticket_template_id ON tasks(exit_ticket_template_id);
