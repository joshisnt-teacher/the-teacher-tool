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

    // Local DB — service role for admin auth operations
    const local = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Validate SSO token — must be unused, not expired, and for a teacher
    const { data: tokenRow, error: tokenError } = await central
      .from('sso_tokens')
      .select('id, teacher_id, used, expires_at')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .not('teacher_id', 'is', null)
      .maybeSingle()

    if (tokenError || !tokenRow) {
      return json({ error: 'Invalid or expired token' }, 401)
    }

    // 2. Mark token as used immediately to prevent replay
    await central
      .from('sso_tokens')
      .update({ used: true })
      .eq('id', tokenRow.id)

    // 3. Fetch teacher details from central DB
    const { data: teacher, error: teacherError } = await central
      .from('teachers')
      .select('id, email, first_name, last_name')
      .eq('id', tokenRow.teacher_id)
      .single()

    if (teacherError || !teacher) {
      return json({ error: 'Teacher not found' }, 401)
    }

    // 4. Find or create local auth account for this teacher
    let localUserId: string

    // Look for an existing auth user by email (handles previous direct logins)
    const listResult = await local.auth.admin.listUsers()
    const existingAuthUser = listResult.data?.users?.find(u => u.email === teacher.email) ?? null

    if (existingAuthUser) {
      localUserId = existingAuthUser.id
    } else {
      const { data: newUser, error: createError } = await local.auth.admin.createUser({
        email: teacher.email,
        email_confirm: true,
        user_metadata: {
          first_name: teacher.first_name,
          last_name: teacher.last_name,
          central_teacher_id: teacher.id,
        },
      })

      if (createError || !newUser?.user) {
        console.error('Create user error:', JSON.stringify(createError))
        return json({ error: 'Failed to create account' }, 500)
      }

      localUserId = newUser.user.id
    }

    // Upsert teacher_profiles bridge record (non-fatal — don't block SSO if table is missing)
    try {
      await local.from('teacher_profiles').upsert({
        id: localUserId,
        central_teacher_id: teacher.id,
        email: teacher.email,
        first_name: teacher.first_name,
        last_name: teacher.last_name,
      }, { onConflict: 'id' })
    } catch (profileErr) {
      console.warn('teacher_profiles upsert skipped:', profileErr)
    }

    // 5. Generate a one-time magic link token for the client to establish a session
    const { data: linkData, error: linkError } = await local.auth.admin.generateLink({
      type: 'magiclink',
      email: teacher.email,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('Generate link error:', JSON.stringify(linkError))
      return json({ error: 'Failed to generate session token' }, 500)
    }

    return json({ token_hash: linkData.properties.hashed_token, email: teacher.email })

  } catch (err) {
    console.error('Teacher SSO error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
