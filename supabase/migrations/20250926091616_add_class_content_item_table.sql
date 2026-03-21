-- Create class_content_item table to link classes with content items
CREATE TABLE class_content_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    content_item_id UUID REFERENCES content_item(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (class_id, content_item_id) -- prevent duplicates
);

-- Create indexes for better performance
CREATE INDEX idx_class_content_item_class_id ON class_content_item(class_id);
CREATE INDEX idx_class_content_item_content_item_id ON class_content_item(content_item_id);

-- Enable Row Level Security
ALTER TABLE class_content_item ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for class_content_item
CREATE POLICY "Teachers can view class content items for their classes" ON class_content_item
  FOR SELECT USING (
    class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert class content items for their classes" ON class_content_item
  FOR INSERT WITH CHECK (
    class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete class content items for their classes" ON class_content_item
  FOR DELETE USING (
    class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  );
