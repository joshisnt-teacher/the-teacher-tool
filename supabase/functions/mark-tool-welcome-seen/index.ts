import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const centralUrl = Deno.env.get('CENTRAL_SUPABASE_URL')
    const centralKey = Deno.env.get('CENTRAL_SUPABASE_SERVICE_ROLE_KEY')

    if (!centralUrl || !centralKey) {
      return json({ error: 'Server misconfiguration: missing central DB secrets' }, 500)
    }

    const local = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Missing auth token' }, 401)
    }

    const localToken = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userErr } = await local.auth.getUser(localToken)
    if (userErr || !user) {
      return json({ error: 'Invalid auth token' }, 401)
    }

    const { app_slug } = await req.json()
    if (!app_slug || !/^[a-z0-9_-]{1,40}$/.test(app_slug)) {
      return json({ error: 'Invalid app_slug' }, 400)
    }

    const { data: profile, error: profileErr } = await local
      .from('teacher_profiles')
      .select('central_teacher_id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileErr) {
      console.error('Profile lookup error:', profileErr)
      return json({ error: 'Failed to load teacher profile' }, 500)
    }

    if (!profile?.central_teacher_id) {
      return json({ error: 'Teacher profile not linked to central account' }, 400)
    }

    const central = createClient(centralUrl, centralKey)
    const { error } = await central
      .from('teacher_tool_welcome_seen')
      .upsert(
        { teacher_id: profile.central_teacher_id, app_slug },
        { onConflict: 'teacher_id,app_slug' }
      )

    if (error) {
      console.error('Mark welcome seen error:', error)
      return json({ error: 'Failed to record welcome state' }, 500)
    }

    return json({ success: true })
  } catch (err) {
    console.error('Mark tool welcome seen error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})
