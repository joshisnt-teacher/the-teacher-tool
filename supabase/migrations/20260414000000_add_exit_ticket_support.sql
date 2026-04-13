-- ============================================
-- Phase 1: Drop old activity tables (clean up)
-- ============================================
DROP TABLE IF EXISTS activity_forms CASCADE;
DROP TABLE IF EXISTS quiz_answers CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS activity_quizzes CASCADE;
DROP TABLE IF EXISTS activities CASCADE;

-- ============================================
-- Phase 2: Add class_code to classes
-- ============================================
ALTER TABLE classes ADD COLUMN IF NOT EXISTS class_code TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_classes_class_code ON classes(class_code);

-- Backfill existing classes with random 6-char codes
DO $$
DECLARE
  rec RECORD;
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  FOR rec IN SELECT id FROM classes WHERE class_code IS NULL LOOP
    LOOP
      new_code := upper(substring(md5(random()::text), 1, 6));
      SELECT EXISTS(SELECT 1 FROM classes WHERE class_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    UPDATE classes SET class_code = new_code WHERE id = rec.id;
  END LOOP;
END $$;

-- ============================================
-- Phase 3: Add exit-ticket columns to tasks
-- ============================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_exit_ticket BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- ============================================
-- Phase 4: Create question_options table
-- ============================================
CREATE TABLE IF NOT EXISTS question_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);

-- Enable RLS
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;

-- Teachers can manage question options in their classes
CREATE POLICY "Teachers can view question options in their classes" ON question_options
  FOR SELECT USING (
    question_id IN (
      SELECT q.id FROM questions q
      JOIN tasks t ON q.task_id = t.id
      JOIN classes c ON t.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert question options in their classes" ON question_options
  FOR INSERT WITH CHECK (
    question_id IN (
      SELECT q.id FROM questions q
      JOIN tasks t ON q.task_id = t.id
      JOIN classes c ON t.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update question options in their classes" ON question_options
  FOR UPDATE USING (
    question_id IN (
      SELECT q.id FROM questions q
      JOIN tasks t ON q.task_id = t.id
      JOIN classes c ON t.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete question options in their classes" ON question_options
  FOR DELETE USING (
    question_id IN (
      SELECT q.id FROM questions q
      JOIN tasks t ON q.task_id = t.id
      JOIN classes c ON t.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- Public can view question options for active exit tickets (student answering)
CREATE POLICY "Public can view question options for active exit tickets" ON question_options
  FOR SELECT TO anon USING (
    question_id IN (
      SELECT q.id FROM questions q
      JOIN tasks t ON q.task_id = t.id
      WHERE t.is_exit_ticket = true AND t.status = 'active'
    )
  );

-- ============================================
-- Phase 5: Add response_data to question_results
-- ============================================
ALTER TABLE question_results ADD COLUMN IF NOT EXISTS response_data JSONB DEFAULT NULL;

-- Public users can create question results for exit tickets
CREATE POLICY "Public users can create question results for exit tickets" ON question_results
  FOR INSERT TO anon WITH CHECK (
    question_id IN (
      SELECT q.id FROM questions q
      JOIN tasks t ON q.task_id = t.id
      WHERE t.is_exit_ticket = true AND t.status = 'active'
    )
  );

-- ============================================
-- Phase 6: Public read access for classes by class_code and active exit tickets
-- ============================================
CREATE POLICY "Public can view classes by class code" ON classes
  FOR SELECT TO anon USING (class_code IS NOT NULL);

CREATE POLICY "Public can view active exit tickets" ON tasks
  FOR SELECT TO anon USING (is_exit_ticket = true AND status = 'active');

-- ============================================
-- Phase 7: Public read access for students in classes with active exit tickets
-- ============================================
CREATE POLICY "Public can view students for active exit ticket classes" ON students
  FOR SELECT TO anon USING (
    class_id IN (
      SELECT class_id FROM tasks
      WHERE is_exit_ticket = true AND status = 'active'
    )
  );

-- ============================================
-- Phase 8: Teachers can manage exit ticket status
-- ============================================
-- (Existing teacher policies on tasks already cover this, but we ensure
--  the status column is editable by teachers.)
