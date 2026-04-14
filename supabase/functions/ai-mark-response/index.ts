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
    // Fetch question result + joined question details
    const { data: qr } = await supabaseAdmin
      .from('question_results')
      .select('id, student_id, response_data, questions(question, model_answer, max_score, question_type)')
      .eq('id', qrId)
      .single()

    if (!qr) continue

    const q = qr.questions as {
      question: string | null
      model_answer: string | null
      max_score: number | null
      question_type: string | null
    } | null

    // Only mark text-based questions
    if (!q || !q.question_type || q.question_type === 'multiple_choice') continue

    const studentAnswer = (qr.response_data as { text?: string } | null)?.text || ''
    const maxScore = q.max_score ?? 1

    const promptLines = [
      "You are a teacher's assistant marking a student's answer.",
      `Question: ${q.question}`,
    ]
    if (q.model_answer) promptLines.push(`Model Answer: ${q.model_answer}`)
    promptLines.push(
      `Max Score: ${maxScore}`,
      `Student Answer: ${studentAnswer || '(no answer provided)'}`,
      '',
      'Return JSON only, exactly this shape:',
      `{ "score": <integer 0 to ${maxScore}>, "feedback": "<1-2 sentences explaining the score>" }`
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

  for (const studentId of studentIds) {
    const { data: allQRs } = await supabaseAdmin
      .from('question_results')
      .select('raw_score, questions!inner(task_id)')
      .eq('student_id', studentId)
      .eq('questions.task_id', task_id)

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
