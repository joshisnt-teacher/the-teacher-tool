import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const centralUrl = Deno.env.get('CENTRAL_SUPABASE_URL')
    const centralKey = Deno.env.get('CENTRAL_SUPABASE_SERVICE_ROLE_KEY')

    if (!centralUrl || !centralKey) {
      console.error('Missing secrets: CENTRAL_SUPABASE_URL=' + !!centralUrl + ' CENTRAL_SUPABASE_SERVICE_ROLE_KEY=' + !!centralKey)
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
    if (!app_slug) {
      return json({ error: 'Missing app_slug' }, 400)
    }

    // Look up central_teacher_id from teacher_profiles
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

    // Mint SSO token via central RPC
    const central = createClient(centralUrl, centralKey)
    const { data: ssoData, error: ssoErr } = await central
      .rpc('mint_teacher_sso_token_for_service', {
        _teacher_id: profile.central_teacher_id,
        _app_slug: app_slug,
      })

    if (ssoErr) {
      console.error('SSO mint error:', ssoErr)
      return json({ error: 'Failed to mint SSO token' }, 500)
    }

    // RPC returns table(redirect_url text), so ssoData is an array — extract the string
    const redirectUrl = Array.isArray(ssoData) ? ssoData[0]?.redirect_url : ssoData
    return json({ redirect_url: redirectUrl })

  } catch (err) {
    console.error('Mint teacher SSO error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
