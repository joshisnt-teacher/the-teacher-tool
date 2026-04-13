ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.classes.is_demo IS
  'When true, this class is excluded from dashboard statistics (Total Classes, Active Students, Avg Score, Upcoming Assessments).';
