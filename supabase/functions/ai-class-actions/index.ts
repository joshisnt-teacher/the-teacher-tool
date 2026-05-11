import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ActionType = 'class_analysis' | 'student_feedback' | 'struggling_students'

function harshnessBrief(level: number): string {
  switch (level) {
    case 1: return 'Be very generous. If the student shows any understanding of the core concept, award full marks. Give benefit of the doubt at every step.'
    case 2: return 'Be lenient and encouraging. Lean towards the higher mark whenever the answer demonstrates partial understanding.'
    case 4: return 'Apply strict standards. Only award full marks for answers that clearly address all required concepts. Partial credit for partial answers.'
    case 5: return 'Apply rigorous standards. Full marks require a complete and precise answer covering all key concepts. Award marks strictly proportionally to demonstrated knowledge.'
    default: return 'Be fair. If the student understood the main point and answered the question, lean towards the higher mark.'
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let body: { task_id?: string; action_type?: ActionType }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { task_id, action_type } = body

  if (!task_id || !action_type) {
    return new Response(JSON.stringify({ error: 'task_id and action_type are required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Resolve task → class → teacher
  const { data: task } = await supabaseAdmin
    .from('tasks').select('class_id').eq('id', task_id).single()
  if (!task) {
    return new Response(JSON.stringify({ error: 'Task not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: cls } = await supabaseAdmin
    .from('classes').select('teacher_id').eq('id', task.class_id).single()
  if (!cls) {
    return new Response(JSON.stringify({ error: 'Class not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('openai_vault_id, marking_harshness')
    .eq('id', cls.teacher_id)
    .single()

  if (!userData?.openai_vault_id) {
    return new Response(JSON.stringify({ skipped: true, reason: 'no_api_key' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: apiKey } = await supabaseAdmin.rpc(
    'get_decrypted_openai_key',
    { p_vault_id: userData.openai_vault_id }
  )
  if (!apiKey) {
    return new Response(JSON.stringify({ skipped: true, reason: 'vault_error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const openai = new OpenAI({ apiKey })
  const harshness = userData.marking_harshness ?? 3

  // Fetch text-based questions for the task
  const { data: questions } = await supabaseAdmin
    .from('questions')
    .select('id, number, question, max_score, question_type, model_answer')
    .eq('task_id', task_id)
    .order('number', { ascending: true })

  const textQuestions = (questions ?? []).filter((q) => {
    const t = q.question_type?.toLowerCase()
    return t !== 'multiple_choice' && t !== 'mcq'
  })

  if (textQuestions.length === 0) {
    return new Response(JSON.stringify({ error: 'No text-based questions found for this task' }), {
      status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const questionIds = textQuestions.map((q) => q.id)

  // Fetch all question results
  const { data: questionResults } = await supabaseAdmin
    .from('question_results')
    .select('id, question_id, student_id, raw_score, percent_score, response_data')
    .in('question_id', questionIds)

  // Fetch student names
  const studentIds = [...new Set((questionResults ?? []).map((r) => r.student_id))]
  const { data: students } = await supabaseAdmin
    .from('students')
    .select('id, first_name, last_name')
    .in('id', studentIds)

  const studentMap = Object.fromEntries((students ?? []).map((s) => [s.id, s]))

  // Fetch overall results for score percentages
  const { data: overallResults } = await supabaseAdmin
    .from('results')
    .select('student_id, percent_score')
    .eq('task_id', task_id)

  const overallMap = Object.fromEntries((overallResults ?? []).map((r) => [r.student_id, r.percent_score]))

  // Build per-student response map
  type StudentEntry = {
    student_id: string
    first_name: string
    last_name: string
    responses: { question: string; answer: string }[]
  }

  const studentResponses: Record<string, StudentEntry> = {}
  for (const qr of (questionResults ?? [])) {
    const q = textQuestions.find((q) => q.id === qr.question_id)
    if (!q) continue
    const student = studentMap[qr.student_id]
    if (!student) continue
    const answer = (qr.response_data as { text?: string } | null)?.text ?? ''
    if (!studentResponses[qr.student_id]) {
      studentResponses[qr.student_id] = {
        student_id: qr.student_id,
        first_name: student.first_name,
        last_name: student.last_name,
        responses: [],
      }
    }
    studentResponses[qr.student_id].responses.push({ question: q.question, answer })
  }

  let outputJson: Record<string, unknown>

  // ── CLASS ANALYSIS ───────────────────────────────────────────────────────────
  if (action_type === 'class_analysis') {
    const responseBlocks = textQuestions.map((q) => {
      const answers = (questionResults ?? [])
        .filter((qr) => qr.question_id === q.id)
        .map((qr) => (qr.response_data as { text?: string } | null)?.text ?? '(no answer)')
      return `QUESTION: ${q.question}\nSTUDENT ANSWERS:\n${answers.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
    }).join('\n\n')

    const prompt = [
      'You are an experienced Australian teacher reviewing exit ticket responses from a class.',
      'Use Australian English spelling throughout.',
      '',
      'Here are all student responses:',
      '',
      responseBlocks,
      '',
      'Based on these responses, provide a class-wide analysis. Return JSON only:',
      '{ "summary": "<2-3 sentence overview>", "strengths": ["<strength>", ...], "gaps": ["<gap>", ...], "reteach_topics": ["<topic>", ...] }',
      '',
      'Guidelines:',
      '- summary: what the class overall understood and what was missing',
      '- strengths: 2-4 things the class did well',
      '- gaps: 2-4 areas where understanding was weak or incomplete',
      '- reteach_topics: specific concepts or skills the teacher should revisit next lesson',
    ].join('\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })
    outputJson = JSON.parse(completion.choices[0].message.content ?? '{}')

  // ── STUDENT FEEDBACK ─────────────────────────────────────────────────────────
  } else if (action_type === 'student_feedback') {
    const feedbackList: { student_id: string; first_name: string; last_name: string; feedback: string }[] = []

    for (const s of Object.values(studentResponses)) {
      const responsePairs = s.responses
        .map((r) => `Q: ${r.question}\nA: ${r.answer || '(no answer)'}`)
        .join('\n\n')

      const prompt = [
        'You are an experienced Australian teacher writing brief written feedback for a student.',
        'Use Australian English spelling throughout.',
        `${harshnessBrief(harshness)}`,
        '',
        'Write 2-3 sentences of feedback for this student based on their exit ticket responses.',
        'Write directly to the student in second person ("you", "your").',
        '',
        responsePairs,
        '',
        'Return JSON only: { "feedback": "<feedback string>" }',
        '',
        'Style: honest but specific to what they wrote. No filler phrases like "Great job!" or "Well done for trying!"',
      ].join('\n')

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        })
        const parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
        feedbackList.push({
          student_id: s.student_id,
          first_name: s.first_name,
          last_name: s.last_name,
          feedback: String(parsed.feedback ?? ''),
        })
      } catch {
        feedbackList.push({
          student_id: s.student_id,
          first_name: s.first_name,
          last_name: s.last_name,
          feedback: '',
        })
      }
    }

    outputJson = { students: feedbackList }

  // ── STRUGGLING STUDENTS ───────────────────────────────────────────────────────
  } else {
    const atRisk: {
      student_id: string
      first_name: string
      last_name: string
      score_percent: number | null
      reason: string
    }[] = []

    for (const s of Object.values(studentResponses)) {
      const scorePercent = overallMap[s.student_id] ?? null
      const responsePairs = s.responses
        .map((r) => `Q: ${r.question}\nA: ${r.answer || '(no answer)'}`)
        .join('\n\n')

      const prompt = [
        "You are an experienced Australian teacher reviewing a student's exit ticket responses.",
        'Use Australian English spelling throughout.',
        '',
        `Student: ${s.first_name} ${s.last_name}`,
        scorePercent !== null ? `Overall score: ${scorePercent}%` : 'Overall score: not recorded',
        '',
        responsePairs,
        '',
        'Assess whether this student shows concerning gaps that warrant teacher follow-up.',
        'Return JSON only: { "flag": true/false, "reason": "<one sentence if flagged, empty string if not>" }',
        '',
        'Flag if: answers are consistently off-topic, show fundamental misunderstanding, are mostly blank, or the student appears significantly behind.',
        'Do not flag for minor errors or leaving one question blank if overall understanding is evident.',
      ].join('\n')

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        })
        const parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
        if (parsed.flag === true) {
          atRisk.push({
            student_id: s.student_id,
            first_name: s.first_name,
            last_name: s.last_name,
            score_percent: scorePercent,
            reason: String(parsed.reason ?? ''),
          })
        }
      } catch {
        // skip student on error
      }
    }

    outputJson = { at_risk: atRisk }
  }

  // Upsert result (replace prior run for this task + action_type)
  await supabaseAdmin
    .from('ai_action_results')
    .upsert(
      {
        task_id,
        teacher_id: cls.teacher_id,
        action_type,
        output_json: outputJson,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'task_id,action_type' }
    )

  return new Response(
    JSON.stringify({ success: true, action_type, data: outputJson }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
