import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000
const LOCKOUT_MS = 15 * 60 * 1000

/** Combines client IP + a per-endpoint identifier (e.g. username) into a throttling key. */
export function rateLimitKey(req: Request, identifier: string): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  return `${ip}:${identifier}`
}

export async function isRateLimited(
  supabaseAdmin: SupabaseClient,
  key: string,
): Promise<{ limited: boolean; retryAfterSeconds?: number }> {
  const { data: row } = await supabaseAdmin
    .from('login_attempts')
    .select('locked_until')
    .eq('key', key)
    .maybeSingle()

  if (!row?.locked_until) return { limited: false }

  const msRemaining = new Date(row.locked_until).getTime() - Date.now()
  if (msRemaining <= 0) return { limited: false }

  return { limited: true, retryAfterSeconds: Math.ceil(msRemaining / 1000) }
}

export async function recordFailedAttempt(
  supabaseAdmin: SupabaseClient,
  key: string,
): Promise<void> {
  const now = new Date()
  const { data: row } = await supabaseAdmin
    .from('login_attempts')
    .select('attempt_count, first_attempt_at')
    .eq('key', key)
    .maybeSingle()

  const windowExpired = row && now.getTime() - new Date(row.first_attempt_at).getTime() > WINDOW_MS

  if (!row || windowExpired) {
    await supabaseAdmin.from('login_attempts').upsert({
      key,
      attempt_count: 1,
      first_attempt_at: now.toISOString(),
      locked_until: null,
    })
    return
  }

  const attempt_count = row.attempt_count + 1
  const locked_until = attempt_count >= MAX_ATTEMPTS
    ? new Date(now.getTime() + LOCKOUT_MS).toISOString()
    : null

  await supabaseAdmin.from('login_attempts').upsert({
    key,
    attempt_count,
    first_attempt_at: row.first_attempt_at,
    locked_until,
  })
}

export async function clearAttempts(
  supabaseAdmin: SupabaseClient,
  key: string,
): Promise<void> {
  await supabaseAdmin.from('login_attempts').delete().eq('key', key)
}
