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
      console.error('Token not found, expired, already used, or has no student_id')
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
      .select('id, central_id, first_name, last_name, year_level')
      .eq('central_id', centralStudent.id)
      .maybeSingle()

    if (localError || !localStudent) {
      console.error('Local student lookup error:', JSON.stringify(localError))
      return json({ error: 'Student not found in local DB' }, 401)
    }

    // 5. Find or create a Supabase auth account for this student
    const studentEmail = `student-${localStudent.id}@pulse.internal`

    const listResult = await local.auth.admin.listUsers({ perPage: 1000 })
    const existingUser = listResult.data?.users?.find(u => u.email === studentEmail) ?? null

    let localUserId: string

    if (existingUser) {
      localUserId = existingUser.id
      // Backfill app_metadata.role for accounts created before this was tracked
      // there — ProtectedRoute checks app_metadata (server-set), not the
      // client-editable user_metadata, so student routing depends on this.
      await local.auth.admin.updateUserById(localUserId, { app_metadata: { role: 'student' } })
    } else {
      const { data: newUser, error: createError } = await local.auth.admin.createUser({
        email: studentEmail,
        email_confirm: true,
        app_metadata: { role: 'student' },
        user_metadata: {
          student_id: localStudent.id,
          first_name: localStudent.first_name,
          last_name: localStudent.last_name,
          year_level: localStudent.year_level,
          role: 'student',
        },
      })

      if (createError || !newUser?.user) {
        console.error('Create student auth user error:', JSON.stringify(createError))
        return json({ error: 'Failed to create student account' }, 500)
      }

      localUserId = newUser.user.id
    }

    // 6. Generate a one-time magic link token for the client to establish a session
    const { data: linkData, error: linkError } = await local.auth.admin.generateLink({
      type: 'magiclink',
      email: studentEmail,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('Generate link error:', JSON.stringify(linkError))
      return json({ error: 'Failed to generate session token' }, 500)
    }

    // 7. Return token_hash and student data for client to establish session
    return json({
      token_hash: linkData.properties.hashed_token,
      student_id: localStudent.id,
      central_id: centralStudent.id,
      first_name: localStudent.first_name,
      last_name: localStudent.last_name,
      year_level: localStudent.year_level ?? null,
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
