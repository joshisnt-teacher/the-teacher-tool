-- Lets student-login skip the O(n) listUsers({perPage:1000}) scan on every
-- sign-in by remembering the shadow auth account id after first creation.
alter table public.students add column if not exists auth_user_id uuid;
