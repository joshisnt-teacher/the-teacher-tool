-- Add post-lesson teacher notes field to class_sessions
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS teacher_notes TEXT DEFAULT NULL;
