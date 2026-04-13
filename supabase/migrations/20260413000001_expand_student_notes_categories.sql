-- Expand the category CHECK constraint on student_notes to include Toilet, Strike, and Commendation
ALTER TABLE student_notes DROP CONSTRAINT IF EXISTS student_notes_category_check;

ALTER TABLE student_notes
  ADD CONSTRAINT student_notes_category_check
  CHECK (category IN ('Academic', 'Pastoral', 'Other', 'Toilet', 'Strike', 'Commendation'));
