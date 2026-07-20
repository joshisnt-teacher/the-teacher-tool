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
    // perPage:1000 avoids pagination — default 50 would miss users past page 1
    const listResult = await local.auth.admin.listUsers({ perPage: 1000 })
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

    // 5. Sync classes from the central hub into Pulse (non-fatal if it fails)
    try {
      await syncClasses(central, local, localUserId, teacher.id)
    } catch (syncErr) {
      console.error('class sync failed (non-fatal):', syncErr)
    }

    // 6. Generate a one-time magic link token for the client to establish a session
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

// ---------------------------------------------------------------------------
// syncClasses — mirrors hub classes into Pulse's local classes table
// ---------------------------------------------------------------------------
async function syncClasses(
  central: ReturnType<typeof createClient>,
  local: ReturnType<typeof createClient>,
  localUserId: string,
  hubTeacherId: string,
) {
  const { data: hubClasses, error: hubError } = await central
    .from('classes')
    .select('id, name, year_level, subject, term, class_code, curriculum_authority')
    .eq('teacher_id', hubTeacherId)

  if (hubError || !hubClasses?.length) return

  // Pulse requires school_id, start_date, end_date on every class, none of which
  // exist on the hub. handle_new_user() already assigns every SSO'd-in teacher a
  // Demo College school_id, so this should always resolve.
  const { data: localUser, error: userError } = await local
    .from('users')
    .select('school_id')
    .eq('id', localUserId)
    .single()

  if (userError || !localUser?.school_id) {
    console.warn('class sync skipped: no local school_id for', localUserId)
    return
  }

  const year = new Date().getFullYear()

  for (const hubClass of hubClasses) {
    const { error: upsertErr } = await local
      .from('classes')
      .upsert(
        {
          central_class_id: hubClass.id,
          teacher_id: localUserId,
          school_id: localUser.school_id,
          class_name: hubClass.name,
          year_level: hubClass.year_level,
          subject: hubClass.subject ?? '',
          term: hubClass.term ?? '',
          class_code: hubClass.class_code,
          start_date: `${year}-01-01`,
          end_date: `${year}-12-31`,
        },
        { onConflict: 'central_class_id' },
      )

    if (upsertErr) {
      console.error('class upsert failed', hubClass.id, upsertErr)
    }
  }
}
