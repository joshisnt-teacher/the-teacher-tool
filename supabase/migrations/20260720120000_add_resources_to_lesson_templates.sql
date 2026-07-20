ALTER TABLE lesson_templates
  ADD COLUMN resources JSONB NOT NULL DEFAULT '[]';
