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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const centralAdmin = createClient(
      Deno.env.get('CENTRAL_SUPABASE_URL')!,
      Deno.env.get('CENTRAL_SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'unauthorized' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return json({ error: 'unauthorized' }, 401)
    }

    const { data: profile } = await supabaseAdmin
      .from('teacher_profiles')
      .select('central_teacher_id')
      .eq('id', user.id)
      .single()

    if (!profile?.central_teacher_id) {
      return json({ error: 'no_central_id', message: 'Teacher has not completed SSO setup.' }, 403)
    }

    const { data: usage, error } = await centralAdmin.rpc('get_teacher_ai_usage', {
      p_teacher_id: profile.central_teacher_id,
    })

    if (error || !usage) {
      return json({ error: 'usage_lookup_failed', message: error?.message }, 500)
    }

    return json(usage)
  } catch (err) {
    console.error('Get AI usage error:', err)
    return json({ error: 'internal_server_error' }, 500)
  }
})
