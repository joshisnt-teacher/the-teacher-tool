import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const body = await req.json()
  const { question_result_ids, task_id } = body as {
    question_result_ids: string[]
    task_id: string
  }

  if (!question_result_ids?.length || !task_id) {
    return new Response(
      JSON.stringify({ error: 'question_result_ids and task_id are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Resolve task → class → teacher → vault ID
  const { data: task, error: taskError } = await supabaseAdmin
    .from('tasks')
    .select('class_id')
    .eq('id', task_id)
    .single()
  if (taskError || !task) {
    return new Response(JSON.stringify({ error: 'Task not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: cls, error: clsError } = await supabaseAdmin
    .from('classes')
    .select('teacher_id')
    .eq('id', task.class_id)
    .single()
  if (clsError || !cls) {
    return new Response(JSON.stringify({ error: 'Class not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('openai_vault_id')
    .eq('id', cls.teacher_id)
    .single()

  if (!userData?.openai_vault_id) {
    return new Response(
      JSON.stringify({ skipped: true, reason: 'no_api_key' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Decrypt API key from Vault
  const { data: apiKey, error: vaultError } = await supabaseAdmin.rpc(
    'get_decrypted_openai_key',
    { p_vault_id: userData.openai_vault_id }
  )
  if (vaultError || !apiKey) {
    return new Response(
      JSON.stringify({ skipped: true, reason: 'vault_error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const openai = new OpenAI({ apiKey })
  const markedResults: { id: string; score: number; feedback: string }[] = []

  for (const qrId of question_result_ids) {
    // Fetch question result (avoid embedded join — duplicate FKs cause PostgREST ambiguity)
    const { data: qr } = await supabaseAdmin
      .from('question_results')
      .select('id, student_id, question_id, response_data')
      .eq('id', qrId)
      .single()

    if (!qr) continue

    // Fetch question details separately
    const { data: q } = await supabaseAdmin
      .from('questions')
      .select('question, model_answer, max_score, question_type, marking_criteria, blooms_taxonomy')
      .eq('id', qr.question_id)
      .single()

    // Only mark text-based questions
    const qtype = q?.question_type?.toLowerCase()
    if (!q || !qtype || qtype === 'multiple_choice' || qtype === 'mcq') continue

    const studentAnswer = (qr.response_data as { text?: string } | null)?.text || ''
    const maxScore = q.max_score ?? 1
    const criteria = q.marking_criteria as {
      expected_keywords?: string[]
      match_type?: 'all' | 'any'
      case_sensitive?: boolean
    } | null

    const promptLines = [
      "You are an experienced Australian teacher marking a student's written answer. Your job is to award a fair score and give brief, constructive feedback.",
      'Use Australian English spelling throughout (e.g. "analyse" not "analyze", "recognise" not "recognize", "colour" not "color").',
      '',
      `QUESTION: ${q.question}`,
    ]

    if (q.blooms_taxonomy) {
      promptLines.push(`COGNITIVE LEVEL: ${q.blooms_taxonomy} (Bloom's Taxonomy) — calibrate your expectations to this level.`)
    }

    if (q.model_answer) {
      promptLines.push(`MODEL ANSWER: ${q.model_answer}`)
      promptLines.push('Use this as your primary reference for what a full-marks answer looks like.')
    } else {
      promptLines.push('MODEL ANSWER: Not provided — use your subject knowledge to judge the quality of the response.')
    }

    if (criteria?.expected_keywords?.length) {
      const keywords = criteria.expected_keywords.filter(Boolean)
      if (keywords.length > 0) {
        const matchRule = criteria.match_type === 'all'
          ? 'ALL of the following key concepts must be present for full marks'
          : 'Award marks based on how many of the following key concepts are addressed'
        promptLines.push(`KEY CONCEPTS (${matchRule}): ${keywords.join(', ')}`)
      }
    }

    promptLines.push(
      `MAX SCORE: ${maxScore}`,
      '',
      'MARKING GUIDANCE:',
      `- Award between 0 and ${maxScore} (whole numbers only).`,
      maxScore === 1
        ? '- This is a 1-mark question: award 1 if the core idea is correct, 0 if not.'
        : `- Divide marks proportionally: award marks for each correct idea, fact, or key concept identified. A partial answer should earn partial marks.`,
      `- Full marks (${maxScore}) should be awarded whenever the answer clearly demonstrates understanding of the key concept(s) — do not withhold full marks just because extra detail could have been added.`,
      '- Be fair and generous: if the student has understood the main point and answered the question, lean towards the higher mark.',
      '- Do not penalise for spelling or grammar unless it makes the answer unclear.',
      '- An empty or irrelevant answer scores 0.',
      '',
      `STUDENT ANSWER: ${studentAnswer || '(no answer provided)'}`,
      '',
      'Return JSON only — no other text — in exactly this shape:',
      `{ "score": <integer 0 to ${maxScore}>, "feedback": "<feedback string>" }`,
      '',
      'FEEDBACK STYLE RULES:',
      '- Write directly to the student in second person ("you", "your").',
      '- If the answer has something correct or worthwhile, lead with that: "In this answer you correctly identify..." or "You have shown a good understanding of..."',
      '- Follow with what was missing or needs improvement: "To improve your response, remember to..." or "Your answer would be stronger if you also..."',
      '- If the answer is largely incorrect, off-topic, or empty — do not force a positive spin. Be honest but not harsh: "This answer does not address the question. Focus on..."',
      '- Keep it to 1-2 sentences. No filler phrases like "Great job!" or "Well done for trying!"',
      '- Match the tone of a teacher giving a quick verbal comment, not a written report.'
    )

    let score = 0
    let feedback = ''
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: promptLines.join('\n') }],
        response_format: { type: 'json_object' },
      })
      const parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
      score = Math.max(0, Math.min(maxScore, Math.round(Number(parsed.score ?? 0))))
      feedback = String(parsed.feedback ?? '')
    } catch {
      // If OpenAI fails for this question, skip it silently
      continue
    }

    const percentScore = maxScore > 0
      ? Number(((score / maxScore) * 100).toFixed(2))
      : null

    await supabaseAdmin
      .from('question_results')
      .update({ raw_score: score, percent_score: percentScore, ai_feedback: feedback })
      .eq('id', qrId)

    markedResults.push({ id: qrId, score, feedback })
  }

  // Recalculate overall result totals for affected students
  const { data: allUpdatedQRs } = await supabaseAdmin
    .from('question_results')
    .select('student_id')
    .in('id', question_result_ids)

  const studentIds = [...new Set((allUpdatedQRs ?? []).map((r) => r.student_id))]

  const { data: taskData } = await supabaseAdmin
    .from('tasks')
    .select('max_score')
    .eq('id', task_id)
    .single()

  const taskMaxScore = taskData?.max_score ?? 0

  // Get all question IDs for this task (used for per-student recalculation)
  const { data: taskQuestions } = await supabaseAdmin
    .from('questions')
    .select('id')
    .eq('task_id', task_id)
  const taskQuestionIds = (taskQuestions ?? []).map((q) => q.id)

  for (const studentId of studentIds) {
    // Fetch all question results for this student on this task (no embedded join)
    const { data: allQRs } = await supabaseAdmin
      .from('question_results')
      .select('raw_score')
      .eq('student_id', studentId)
      .in('question_id', taskQuestionIds)

    const totalRaw = (allQRs ?? []).reduce((sum, r) => sum + (r.raw_score ?? 0), 0)
    const totalPercent = taskMaxScore > 0
      ? Number(((totalRaw / taskMaxScore) * 100).toFixed(2))
      : null

    await supabaseAdmin
      .from('results')
      .update({ raw_score: totalRaw, percent_score: totalPercent, normalised_percent: totalPercent })
      .eq('task_id', task_id)
      .eq('student_id', studentId)
  }

  return new Response(
    JSON.stringify({ success: true, marked: markedResults }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
