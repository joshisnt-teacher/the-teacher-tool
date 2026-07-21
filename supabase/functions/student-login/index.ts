import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import bcrypt from 'https://esm.sh/bcryptjs@2.4.3'
import { rateLimitKey, isRateLimited, recordFailedAttempt, clearAttempts } from '../_shared/rateLimit.ts'

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
      console.error('Missing secrets')
      return json({ error: 'Server misconfiguration' }, 500)
    }

    const { username, pin } = await req.json()
    if (!username || !pin) {
      return json({ error: 'Missing username or pin' }, 400)
    }

    // Central DB — service role to bypass RLS
    const central = createClient(centralUrl, centralKey)

    // Local DB — service role for admin auth operations
    const local = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const limitKey = rateLimitKey(req, username.trim().toLowerCase())
    const rateLimit = await isRateLimited(local, limitKey)
    if (rateLimit.limited) {
      return json(
        { error: 'Too many attempts. Please try again later.', retry_after_seconds: rateLimit.retryAfterSeconds },
        429
      )
    }

    // 1. Look up student in central DB by username
    const { data: centralStudent, error: centralError } = await central
      .from('students')
      .select('id, username, pin, first_name, last_name, year_level')
      .eq('username', username.trim())
      .single()

    if (centralError || !centralStudent) {
      await recordFailedAttempt(local, limitKey)
      return json({ error: 'Invalid username or PIN' }, 401)
    }

    // 2. Verify PIN against bcrypt hash
    const pinMatches = await bcrypt.compare(pin.trim(), centralStudent.pin)
    if (!pinMatches) {
      await recordFailedAttempt(local, limitKey)
      return json({ error: 'Invalid username or PIN' }, 401)
    }

    await clearAttempts(local, limitKey)

    // 3. Find local student by central_id
    const { data: localStudent, error: localError } = await local
      .from('students')
      .select('id, first_name, last_name, year_level')
      .eq('central_id', centralStudent.id)
      .single()

    if (localError || !localStudent) {
      console.error('Local student not found for central_id:', centralStudent.id)
      return json({ error: 'Student account not found. Please ask your teacher.' }, 404)
    }

    // 4. Find or create a Supabase auth account for this student.
    // Fast path: auth_user_id was stored on a previous login — skip the scan.
    // Email convention: student-{local-uuid}@pulse.internal
    const studentEmail = `student-${localStudent.id}@pulse.internal`

    const { data: studentAuthRow } = await local
      .from('students')
      .select('auth_user_id')
      .eq('id', localStudent.id)
      .maybeSingle()

    let localUserId: string

    if (studentAuthRow?.auth_user_id) {
      localUserId = studentAuthRow.auth_user_id as string
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

      if (newUser?.user) {
        localUserId = newUser.user.id
      } else {
        // First login for this student row, and createUser failed — almost
        // certainly a leftover account from before auth_user_id was tracked.
        // perPage:1000 avoids pagination — default 50 would miss users past page 1.
        const listResult = await local.auth.admin.listUsers({ perPage: 1000 })
        const existingUser = listResult.data?.users?.find(u => u.email === studentEmail) ?? null
        if (!existingUser) {
          console.error('Create student auth user error:', JSON.stringify(createError))
          return json({ error: 'Failed to create student account' }, 500)
        }
        localUserId = existingUser.id
      }

      await local.from('students').update({ auth_user_id: localUserId }).eq('id', localStudent.id)
    }

    // 5. Generate a one-time magic link token for the client to establish a session
    const { data: linkData, error: linkError } = await local.auth.admin.generateLink({
      type: 'magiclink',
      email: studentEmail,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('Generate link error:', JSON.stringify(linkError))
      return json({ error: 'Failed to generate session token' }, 500)
    }

    return json({
      token_hash: linkData.properties.hashed_token,
      student_id: localStudent.id,
      central_id: centralStudent.id,
      first_name: localStudent.first_name,
      last_name: localStudent.last_name,
      year_level: localStudent.year_level,
    })

  } catch (err) {
    console.error('Student login error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
