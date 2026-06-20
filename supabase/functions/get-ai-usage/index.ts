import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const local = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userErr } = await local.auth.getUser(token)
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: profile } = await local
    .from('teacher_profiles')
    .select('central_teacher_id')
    .eq('id', user.id)
    .single()

  if (!profile?.central_teacher_id) {
    return new Response(JSON.stringify({ used: 0, cap: 75, plan: 'free' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const central = createClient(
    Deno.env.get('CENTRAL_SUPABASE_URL')!,
    Deno.env.get('CENTRAL_SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: usage } = await central.rpc('get_teacher_ai_usage', {
    p_teacher_id: profile.central_teacher_id,
  })

  return new Response(
    JSON.stringify(usage ?? { used: 0, cap: 75, plan: 'free' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
