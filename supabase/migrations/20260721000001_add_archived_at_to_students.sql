-- Lets the hub-roster sync (teacher-sso, sync-classes) archive students that
-- drop out of the active roster instead of hard-deleting them, which used to
-- cascade-delete their results/question_results/student_responses.
alter table public.students add column if not exists archived_at timestamptz;
