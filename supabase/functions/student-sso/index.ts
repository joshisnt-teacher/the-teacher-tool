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

    const { token } = await req.json()

    if (!token) {
      return json({ error: 'Missing token' }, 400)
    }

    // Central DB — service role to bypass RLS
    const central = createClient(centralUrl, centralKey)

    // Local DB — service role to query students
    const local = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Validate and atomically claim the SSO token
    const { data: tokenRow, error: tokenError } = await central
      .from('sso_tokens')
      .select('id, student_id, used, expires_at')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .not('student_id', 'is', null)
      .maybeSingle()

    if (tokenError) {
      console.error('Token lookup error:', JSON.stringify(tokenError))
      return json({ error: 'Failed to validate token' }, 500)
    }

    if (!tokenRow) {
      return json({ error: 'Invalid or expired token' }, 401)
    }

    // 2. Mark token as used immediately to prevent replay
    await central
      .from('sso_tokens')
      .update({ used: true })
      .eq('id', tokenRow.id)

    // 3. Fetch student details from central DB
    const { data: centralStudent, error: studentError } = await central
      .from('students')
      .select('id, first_name, last_name, year_level')
      .eq('id', tokenRow.student_id)
      .single()

    if (studentError || !centralStudent) {
      console.error('Central student lookup error:', JSON.stringify(studentError))
      return json({ error: 'Student not found in central DB' }, 401)
    }

    // 4. Find matching local student by central_id
    const { data: localStudent, error: localError } = await local
      .from('students')
      .select('id, central_id')
      .eq('central_id', centralStudent.id)
      .maybeSingle()

    if (localError || !localStudent) {
      console.error('Local student lookup error:', JSON.stringify(localError))
      return json({ error: 'Student not found in local DB' }, 401)
    }

    // 5. Return student data for client to set session
    return json({
      student_id: localStudent.id,
      central_id: centralStudent.id,
      first_name: centralStudent.first_name,
      last_name: centralStudent.last_name,
      year_level: centralStudent.year_level ?? null,
    })

  } catch (err) {
    console.error('Student SSO error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
