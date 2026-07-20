// Lets a signed-in Pulse teacher pull their latest classes down from the
// central Edufied hub without needing a fresh SSO login. teacher-sso already
// does this sync on every hub->Pulse handoff; this exists for the case where
// a teacher creates a class on the hub in a separate tab while already
// signed into Pulse.
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
    const centralUrl = Deno.env.get('CENTRAL_SUPABASE_URL')
    const centralKey = Deno.env.get('CENTRAL_SUPABASE_SERVICE_ROLE_KEY')

    if (!centralUrl || !centralKey) {
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

    const { data: localUser, error: userRowErr } = await local
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single()

    if (userRowErr || !localUser?.school_id) {
      return json({ error: 'No school assigned to this account' }, 400)
    }

    const central = createClient(centralUrl, centralKey)

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
      const { data, error: hubError } = await central
        .from('classes')
        .select('id, name, year_level, subject, term, class_code, curriculum_authority')
        .eq('teacher_id', profile.central_teacher_id)
        .in('id', activeAssignedIds)
      if (hubError) {
        console.error('Hub classes fetch error:', hubError)
        return json({ error: 'Failed to fetch classes from hub' }, 500)
      }
      hubClasses = data ?? []
    }

    const year = new Date().getFullYear()
    let synced = 0

    for (const hubClass of hubClasses) {
      const { error: upsertErr } = await local
        .from('classes')
        .upsert(
          {
            central_class_id: hubClass.id,
            teacher_id: user.id,
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
        continue
      }
      synced++
    }

    const activeIdSet = new Set(hubClasses.map(c => c.id))
    const { data: locallySynced } = await local
      .from('classes')
      .select('id, central_class_id')
      .eq('teacher_id', user.id)
      .not('central_class_id', 'is', null)
      .is('archived_at', null)

    const staleIds = (locallySynced ?? [])
      .filter(c => !activeIdSet.has(c.central_class_id as string))
      .map(c => c.id as string)

    let archived = 0
    if (staleIds.length > 0) {
      const { error: archiveErr } = await local
        .from('classes')
        .update({ archived_at: new Date().toISOString() })
        .in('id', staleIds)
      if (!archiveErr) archived = staleIds.length
    }

    try {
      await syncStudents(central, local, user.id, profile.central_teacher_id)
    } catch (syncErr) {
      console.error('student sync failed (non-fatal):', syncErr)
    }

    return json({ synced, archived })
  } catch (err) {
    console.error('Sync classes error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})

// ---------------------------------------------------------------------------
// syncStudents — auto-provisions local students from the hub roster for every
// class currently active for Pulse, and prunes local students who have
// dropped out of that roster (deleted centrally, or unenrolled from every
// Pulse-active class). Identical to teacher-sso/index.ts's copy.
// ---------------------------------------------------------------------------
async function syncStudents(
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

  let teacherActiveClassIds: string[] = []
  if (activeAssignedIds.length > 0) {
    const { data: hubClasses } = await central
      .from('classes')
      .select('id')
      .eq('teacher_id', hubTeacherId)
      .in('id', activeAssignedIds)
    teacherActiveClassIds = (hubClasses ?? []).map(c => c.id as string)
  }

  let enrolments: { student_id: string; class_id: string }[] = []
  if (teacherActiveClassIds.length > 0) {
    const { data } = await central
      .from('student_classes')
      .select('student_id, class_id')
      .in('class_id', teacherActiveClassIds)
    enrolments = data ?? []
  }

  const centralStudentIds = [...new Set(enrolments.map(e => e.student_id))]

  if (centralStudentIds.length > 0) {
    const { data: centralStudents } = await central
      .from('students')
      .select('id, first_name, last_name, username, year_level')
      .in('id', centralStudentIds)

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

  const stillValidCentralIds = new Set(centralStudentIds)
  const { data: localLinked } = await local
    .from('students')
    .select('id, central_id')
    .eq('teacher_id', localUserId)
    .not('central_id', 'is', null)

  for (const ls of localLinked ?? []) {
    if (ls.central_id && stillValidCentralIds.has(ls.central_id as string)) continue

    const studentEmail = `student-${ls.id}@pulse.internal`
    const listResult = await local.auth.admin.listUsers({ perPage: 1000 })
    const authUser = listResult.data?.users?.find(u => u.email === studentEmail)
    if (authUser) {
      await local.auth.admin.deleteUser(authUser.id)
    }
    await local.from('students').delete().eq('id', ls.id)
  }
}
