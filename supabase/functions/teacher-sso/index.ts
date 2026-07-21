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

    // 2. Fetch teacher details from central DB
    const { data: teacher, error: teacherError } = await central
      .from('teachers')
      .select('id, email, first_name, last_name')
      .eq('id', tokenRow.teacher_id)
      .single()

    if (teacherError || !teacher) {
      return json({ error: 'Teacher not found' }, 401)
    }

    // 3. Mark token as used now that we know the token resolves to a real
    // teacher — burning it any earlier meant a mid-flight failure below
    // forced the teacher back through the hub for a fresh SSO link.
    await central
      .from('sso_tokens')
      .update({ used: true })
      .eq('id', tokenRow.id)

    // 4. Find or create local auth account for this teacher.
    // Fast path: we've synced this central teacher before, so teacher_profiles
    // already has the local auth user id — skip scanning every auth user.
    let localUserId: string

    const { data: existingProfile } = await local
      .from('teacher_profiles')
      .select('id')
      .eq('central_teacher_id', teacher.id)
      .maybeSingle()

    if (existingProfile?.id) {
      localUserId = existingProfile.id
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

      if (newUser?.user) {
        localUserId = newUser.user.id
      } else {
        // First time seeing this central teacher locally, and createUser failed —
        // almost certainly a legacy direct-login account with the same email that
        // predates SSO. Only now fall back to a full scan to find it.
        // perPage:1000 avoids pagination — default 50 would miss users past page 1.
        const listResult = await local.auth.admin.listUsers({ perPage: 1000 })
        const existingAuthUser = listResult.data?.users?.find(u => u.email === teacher.email) ?? null
        if (!existingAuthUser) {
          console.error('Create user error:', JSON.stringify(createError))
          return json({ error: 'Failed to create account' }, 500)
        }
        localUserId = existingAuthUser.id
      }
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

    // 5b. Sync students from the central hub into Pulse (non-fatal if it fails)
    try {
      await syncStudents(central, local, localUserId, teacher.id)
    } catch (syncErr) {
      console.error('student sync failed (non-fatal):', syncErr)
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
  const { data: assignments } = await central
    .from('app_assignments')
    .select('class_id')
    .eq('app_slug', 'pulse')
    .eq('is_active', true)
  const activeAssignedIds = (assignments ?? []).map(a => a.class_id as string)

  let hubClasses: {
    id: string
    name: string
    year_level: string | null
    subject: string | null
    term: string | null
    class_code: string
    curriculum_authority: string
  }[] = []

  if (activeAssignedIds.length > 0) {
    const { data, error } = await central
      .from('classes')
      .select('id, name, year_level, subject, term, class_code, curriculum_authority')
      .eq('teacher_id', hubTeacherId)
      .in('id', activeAssignedIds)
    if (error) {
      // Bail out rather than treating a fetch failure as "no active classes" —
      // that would archive every synced class below.
      console.error('hub classes fetch failed, skipping class sync this run', error)
      return
    }
    hubClasses = data ?? []
  }

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
          archived_at: null,
        },
        { onConflict: 'central_class_id' },
      )

    if (upsertErr) {
      console.error('class upsert failed', hubClass.id, upsertErr)
    }
  }

  // Archive local classes no longer actively assigned to Pulse. Never delete —
  // class_sessions, tasks (exit tickets/assessments), and student_notes hang off class_id.
  const activeIdSet = new Set(hubClasses.map(c => c.id))
  const { data: locallySynced } = await local
    .from('classes')
    .select('id, central_class_id')
    .eq('teacher_id', localUserId)
    .not('central_class_id', 'is', null)
    .is('archived_at', null)

  const staleIds = (locallySynced ?? [])
    .filter(c => !activeIdSet.has(c.central_class_id as string))
    .map(c => c.id as string)

  if (staleIds.length > 0) {
    const { error: archiveErr } = await local
      .from('classes')
      .update({ archived_at: new Date().toISOString() })
      .in('id', staleIds)
    if (archiveErr) console.error('class archive failed', staleIds, archiveErr)
  }
}

// ---------------------------------------------------------------------------
// syncStudents — auto-provisions local students from the hub roster for every
// class currently active for Pulse, and prunes local students who have
// dropped out of that roster (deleted centrally, or unenrolled from every
// Pulse-active class).
// ---------------------------------------------------------------------------
async function syncStudents(
  central: ReturnType<typeof createClient>,
  local: ReturnType<typeof createClient>,
  localUserId: string,
  hubTeacherId: string,
) {
  // Any failure below is treated as "roster unknown" rather than "roster empty" —
  // bailing out avoids the pruning step at the bottom mistaking a transient
  // fetch failure for every student having left the class and hard-deleting them.
  const { data: assignments, error: assignmentsErr } = await central
    .from('app_assignments')
    .select('class_id')
    .eq('app_slug', 'pulse')
    .eq('is_active', true)
  if (assignmentsErr) {
    console.error('app_assignments fetch failed, skipping student sync this run', assignmentsErr)
    return
  }
  const activeAssignedIds = (assignments ?? []).map(a => a.class_id as string)

  let teacherActiveClassIds: string[] = []
  if (activeAssignedIds.length > 0) {
    const { data: hubClasses, error: hubClassesErr } = await central
      .from('classes')
      .select('id')
      .eq('teacher_id', hubTeacherId)
      .in('id', activeAssignedIds)
    if (hubClassesErr) {
      console.error('hub classes fetch failed, skipping student sync this run', hubClassesErr)
      return
    }
    teacherActiveClassIds = (hubClasses ?? []).map(c => c.id as string)
  }

  let enrolments: { student_id: string; class_id: string }[] = []
  if (teacherActiveClassIds.length > 0) {
    const { data, error: enrolErr } = await central
      .from('student_classes')
      .select('student_id, class_id')
      .in('class_id', teacherActiveClassIds)
    if (enrolErr) {
      console.error('student_classes fetch failed, skipping student sync this run', enrolErr)
      return
    }
    enrolments = data ?? []
  }

  const centralStudentIds = [...new Set(enrolments.map(e => e.student_id))]

  if (centralStudentIds.length > 0) {
    const { data: centralStudents, error: centralStudentsErr } = await central
      .from('students')
      .select('id, first_name, last_name, username, year_level')
      .in('id', centralStudentIds)
    if (centralStudentsErr) {
      console.error('central students fetch failed, skipping student sync this run', centralStudentsErr)
      return
    }

    const { data: localClasses } = await local
      .from('classes')
      .select('id, central_class_id')
      .eq('teacher_id', localUserId)
      .in('central_class_id', teacherActiveClassIds)
    const localClassIdByCentral = new Map(
      (localClasses ?? []).map(c => [c.central_class_id as string, c.id as string])
    )

    for (const cs of centralStudents ?? []) {
      const { data: existing } = await local
        .from('students')
        .select('id')
        .eq('central_id', cs.id)
        .maybeSingle()

      let localStudentId: string
      if (existing) {
        localStudentId = existing.id
        await local.from('students').update({
          first_name: cs.first_name,
          last_name: cs.last_name,
          year_level: cs.year_level,
          archived_at: null,
        }).eq('id', localStudentId)
      } else {
        const { data: inserted, error: insertErr } = await local
          .from('students')
          .insert({
            central_id: cs.id,
            teacher_id: localUserId,
            first_name: cs.first_name,
            last_name: cs.last_name,
            year_level: cs.year_level,
            // Pulse's `student_id` column is a free-text school-provided ID unrelated
            // to hub identity; the hub doesn't have one to give us, so the hub
            // username (already unique) is the closest stable placeholder.
            student_id: cs.username,
          })
          .select('id')
          .single()
        if (insertErr || !inserted) {
          console.error('student insert failed', cs.id, insertErr)
          continue
        }
        localStudentId = inserted.id
      }

      const classIdsForStudent = enrolments
        .filter(e => e.student_id === cs.id)
        .map(e => localClassIdByCentral.get(e.class_id))
        .filter((id): id is string => !!id)

      for (const classId of classIdsForStudent) {
        await local.from('student_classes')
          .upsert({ student_id: localStudentId, class_id: classId }, { onConflict: 'student_id,class_id' })
      }
    }
  }

  // Archive rather than delete — a hard delete cascades to results/responses
  // (ON DELETE CASCADE), permanently destroying a student's academic history
  // whenever the hub roster looks smaller than it should for any reason.
  const stillValidCentralIds = new Set(centralStudentIds)
  const { data: localLinked } = await local
    .from('students')
    .select('id, central_id')
    .eq('teacher_id', localUserId)
    .not('central_id', 'is', null)
    .is('archived_at', null)

  for (const ls of localLinked ?? []) {
    if (ls.central_id && stillValidCentralIds.has(ls.central_id as string)) continue

    await local.from('students').update({ archived_at: new Date().toISOString() }).eq('id', ls.id)
  }
}
