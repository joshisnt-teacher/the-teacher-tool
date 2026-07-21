import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Validates the caller's Supabase session JWT (sent via `supabase.functions.invoke`,
 * which attaches it automatically) and returns their local auth user id.
 * Mirrors the pattern already used in mint-teacher-sso/index.ts.
 */
export async function requireTeacher(
  req: Request,
  supabaseAdmin: SupabaseClient,
  corsHeaders: Record<string, string>,
): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing auth token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Invalid auth token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return { userId: user.id }
}

/** 403 response for when the caller is authenticated but doesn't own the resource. */
export function forbiddenResponse(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: 'forbidden' }), {
    status: 403,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
