import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const apiKey = Deno.env.get('ATLAS_TO_PULSE_API_KEY')
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!apiKey || !token || token !== apiKey) {
    return new Response(
      JSON.stringify({ error: 'unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let body: { central_teacher_id?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'invalid_json' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!body.central_teacher_id) {
    return new Response(
      JSON.stringify({ error: 'central_teacher_id required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ── 3. Resolve teacher ────────────────────────────────────────────────────
  const { data: teacher, error: teacherErr } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('central_teacher_id', body.central_teacher_id)
    .maybeSingle()

  if (teacherErr) {
    return new Response(
      JSON.stringify({ error: 'db_error', message: teacherErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!teacher) {
    return new Response(
      JSON.stringify({ classes: [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // ── 4. Fetch classes ──────────────────────────────────────────────────────
  const { data: classes, error: classesErr } = await supabase
    .from('classes')
    .select('id, class_name, class_code, subject')
    .eq('teacher_id', teacher.id)
    .order('class_name', { ascending: true })

  if (classesErr) {
    return new Response(
      JSON.stringify({ error: 'db_error', message: classesErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ classes: classes ?? [] }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
