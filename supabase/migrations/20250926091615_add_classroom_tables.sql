-- Create class_sessions table
CREATE TABLE class_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_notes table
CREATE TABLE student_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= -5 AND rating <= 5),
  category TEXT NOT NULL CHECK (category IN ('Academic', 'Pastoral', 'Other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_class_sessions_class_id ON class_sessions(class_id);
CREATE INDEX idx_class_sessions_started_at ON class_sessions(started_at);
CREATE INDEX idx_student_notes_student_id ON student_notes(student_id);
CREATE INDEX idx_student_notes_class_session_id ON student_notes(class_session_id);
CREATE INDEX idx_student_notes_created_at ON student_notes(created_at);

-- Enable Row Level Security
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for class_sessions
CREATE POLICY "Teachers can view class sessions for their classes" ON class_sessions
  FOR SELECT USING (
    class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert class sessions for their classes" ON class_sessions
  FOR INSERT WITH CHECK (
    class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update class sessions for their classes" ON class_sessions
  FOR UPDATE USING (
    class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  );

-- Create RLS policies for student_notes
CREATE POLICY "Teachers can view student notes for their classes" ON student_notes
  FOR SELECT USING (
    student_id IN (
      SELECT s.id FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert student notes for their classes" ON student_notes
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT s.id FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update student notes for their classes" ON student_notes
  FOR UPDATE USING (
    student_id IN (
      SELECT s.id FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_class_sessions_updated_at 
  BEFORE UPDATE ON class_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_notes_updated_at 
  BEFORE UPDATE ON student_notes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
