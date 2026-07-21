-- Tracks failed student PIN login attempts per (ip, username) so student-login
-- can throttle brute-force guessing of short numeric PINs. Only ever touched by
-- edge functions via the service-role key, so RLS denies all client access.
create table if not exists public.login_attempts (
  key text primary key,
  attempt_count integer not null default 0,
  first_attempt_at timestamptz not null default now(),
  locked_until timestamptz
);

alter table public.login_attempts enable row level security;
