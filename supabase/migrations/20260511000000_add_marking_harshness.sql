-- supabase/migrations/20260511000000_add_marking_harshness.sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS marking_harshness integer NOT NULL DEFAULT 3
  CHECK (marking_harshness BETWEEN 1 AND 5);
