import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Score how relevant a content descriptor is to the teacher's prompt using
 *  simple keyword overlap. Returns a count of matching words (≥ 4 chars). */
function relevanceScore(descriptor: { code: string; description: string }, prompt: string): number {
  const words = prompt.toLowerCase().match(/\b\w{4,}\b/g) ?? []
  const haystack = `${descriptor.code} ${descriptor.description}`.toLowerCase()
  return words.filter((w) => haystack.includes(w)).length
}

/** Strip markdown code fences from AI responses before JSON.parse(). */
function stripFence(text: string): string {
  const trimmed = text.trim()
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  return match ? match[1].trim() : trimmed
}

/** Find a content item code from the AI's output, tolerating case differences. */
function resolveCode(
  input: string,
  items: { code: string }[]
): string | undefined {
  if (!input) return undefined
  const trimmed = input.trim()
  const exact = items.find((ci) => ci.code === trimmed)
  if (exact) return exact.code
  const lower = trimmed.toLowerCase()
  const ci = items.find((item) => item.code.toLowerCase() === lower)
  return ci?.code
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const centralAdmin = createClient(
    Deno.env.get('CENTRAL_SUPABASE_URL')!,
    Deno.env.get('CENTRAL_SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { content, question_count, question_types, class_id } = body as {
    content?: string
    question_count?: number
    // Array of per-question types, e.g. ['multiple_choice', 'short_answer', 'multiple_choice']
    question_types?: string[]
    class_id?: string
  }

  if (!content?.trim()) {
    return new Response(
      JSON.stringify({ error: 'content is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!class_id) {
    return new Response(
      JSON.stringify({ error: 'class_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const count = Math.max(1, Math.min(10, Math.round(Number(question_count || 3))))

  // Validate and normalise the per-question types array.
  // Fall back to 'multiple_choice' for any unrecognised value.
  const validTypes = ['multiple_choice', 'short_answer', 'extended_answer']
  const typesArray: string[] = Array.isArray(question_types) && question_types.length > 0
    ? question_types.slice(0, count).map((t) => validTypes.includes(String(t)) ? String(t) : 'multiple_choice')
    : Array(count).fill('multiple_choice')

  // Ensure the array length matches count (pad if needed)
  while (typesArray.length < count) {
    typesArray.push('multiple_choice')
  }

  // Resolve class → teacher → vault ID
  const { data: cls, error: clsError } = await supabaseAdmin
    .from('classes')
    .select('teacher_id, class_name, year_level, subject')
    .eq('id', class_id)
    .single()

  if (clsError || !cls) {
    return new Response(
      JSON.stringify({ error: 'Class not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Look up central_teacher_id from teacher_profiles
  const { data: profile } = await supabaseAdmin
    .from('teacher_profiles')
    .select('central_teacher_id')
    .eq('id', cls.teacher_id)
    .single()

  if (!profile?.central_teacher_id) {
    return new Response(
      JSON.stringify({ error: 'no_central_id', message: 'Teacher has not completed SSO setup.' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Atomic quota check: checks usage AND records the action in one RPC call
  const { data: quota } = await centralAdmin.rpc('check_and_record_ai_action', {
    p_teacher_id: profile.central_teacher_id,
    p_app_slug: 'pulse',
    p_action_type: 'generate_exit_ticket',
  })

  if (!quota?.allowed) {
    return new Response(
      JSON.stringify({
        error: 'quota_exceeded',
        message: `AI limit reached (${quota?.used ?? 0}/${quota?.cap ?? 75} actions this month). Upgrade to Pro for more.`,
        used: quota?.used,
        cap: quota?.cap,
        plan: quota?.plan,
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Fetch curriculum context for the class
  const { data: curriculumRows } = await supabaseAdmin
    .from('class_content_item')
    .select(`
      content_item:content_item_id (
        id,
        code,
        description,
        content_item_tag (
          tag:tag_id (name, type)
        )
      )
    `)
    .eq('class_id', class_id)

  const allContentItems: {
    id: string
    code: string
    description: string
    tags: { name: string; type: string }[]
  }[] = []

  for (const row of curriculumRows || []) {
    const ci = (row as any).content_item
    if (!ci) continue
    const item = Array.isArray(ci) ? ci[0] : ci
    const tags: { name: string; type: string }[] = []
    for (const cit of item.content_item_tag || []) {
      const t = Array.isArray(cit.tag) ? cit.tag[0] : cit.tag
      if (t) tags.push(t)
    }
    allContentItems.push({
      id: item.id,
      code: item.code,
      description: item.description,
      tags,
    })
  }

  // Pre-filter: pick the top 15 most topic-relevant descriptors to keep the
  // mapping prompt focused. If no descriptors score > 0, send ALL of them so
  // the mapping call can still find the best match.
  let contentItems = allContentItems
  if (allContentItems.length > 0) {
    const scored = allContentItems
      .map((ci) => ({ ci, score: relevanceScore(ci, content.trim()) }))
      .sort((a, b) => b.score - a.score)

    const topScored = scored.filter((s) => s.score > 0).slice(0, 15)
    contentItems = topScored.length > 0 ? topScored.map((s) => s.ci) : allContentItems
  }

  // ---------------------------------------------------------------------------
  // PASS 1 — Generate questions
  // ---------------------------------------------------------------------------
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

  // Human-readable type labels for the prompt
  const typeLabel: Record<string, string> = {
    multiple_choice: 'Multiple Choice (MCQ)',
    short_answer: 'Short Answer',
    extended_answer: 'Extended Answer',
  }

  // Build the per-question type specification
  const questionTypeSpec = typesArray
    .map((t, i) => `  - Question ${i + 1}: ${typeLabel[t] || 'Short Answer'}`)
    .join('\n')

  // Count how many are MCQ — used to decide whether to include MCQ guidelines
  const mcqCount = typesArray.filter((t) => t === 'multiple_choice').length

  const pass1Lines: string[] = [
    'You are an experienced Australian teacher and assessment design expert.',
    'Generate an exit ticket (a short formative assessment used at the END of a lesson) based on the teacher\'s request.',
    'Use Australian English spelling throughout (e.g. "analyse" not "analyze", "recognise" not "recognize", "organise" not "organize").',
    '',
    'CLASS CONTEXT:',
    `Subject: ${cls.subject || 'Not specified'}`,
    `Year Level: ${cls.year_level || 'Not specified'}`,
    '',
    'TEACHER REQUEST:',
    content.trim(),
    '',
    `Generate exactly ${count} question${count === 1 ? '' : 's'} with the EXACT types listed below (do not change them):`,
    questionTypeSpec,
    '',
    'GENERAL GUIDELINES:',
    '- These are END-OF-LESSON formative checks — questions should be completable in 5–10 minutes total.',
    '- Use language appropriate for the year level — accessible but not condescending.',
    '- Assign each question a Bloom\'s Taxonomy level (Remember, Understand, Apply, Analyse, Evaluate, Create).',
    '- Order questions so they build in cognitive demand (easier → harder across the set).',
    '- For short/extended answer questions: include marking_criteria with expected_keywords and a model_answer.',
    '- Max scores: 1 for MCQs, 1–3 for short answer, 3–5 for extended answer.',
    '',
  ]

  // Add MCQ-specific diagnostic guidelines if any MCQs are requested
  if (mcqCount > 0) {
    pass1Lines.push(
      'MCQ DESIGN GUIDELINES (apply to every Multiple Choice question):',
      '- Purpose: diagnostic — questions must reveal WHETHER and WHY a student doesn\'t understand, not just whether they got it right.',
      '- Design the stem to target a specific concept or decision point (not just recall of a fact).',
      '- Distractors (wrong options) MUST be plausible — each distractor should represent a specific, common student misconception or error pattern.',
      '  Example: if the correct answer requires applying a rule, distractors should reflect what a student who MISAPPLIED that rule would choose.',
      '- Avoid generic distractors like random numbers, clearly silly answers, "all of the above", or "none of the above".',
      '- Make all options parallel in length, grammatical form, and structure — the correct answer must not stand out visually.',
      '- Aim for 3–4 options total (3 is ideal for clarity; 4 for harder discrimination).',
      '- Vary MCQ formats when there are multiple MCQs:',
      '  * Standard: "Which of the following is correct?"',
      '  * Negative: "Which does NOT ..."',
      '  * Best explanation: "Which best explains why ..."',
      '  * Combination: "Which TWO of the following ..." (use sparingly)',
      '- After generating, check: could a teacher look at which wrong answer a student chose and know EXACTLY what to reteach? If yes, the distractors are diagnostic.',
      '',
    )
  }

  pass1Lines.push(
    'Return ONLY a JSON object (no markdown):',
    JSON.stringify({
      name: '<concise exit ticket title>',
      description: '<1-2 sentence summary of what this exit ticket checks>',
      questions: [
        {
          question: '<question text>',
          question_type: '<multiple_choice | short_answer | extended_answer>',
          max_score: 1,
          blooms_taxonomy: '<Remember | Understand | Apply | Analyse | Evaluate | Create>',
          options: [
            { option_text: '<option A — plausible distractor representing a common misconception>', is_correct: false },
            { option_text: '<option B — correct answer>', is_correct: true },
            { option_text: '<option C — plausible distractor representing a different misconception>', is_correct: false },
          ],
          marking_criteria: {
            expected_keywords: ['<keyword 1>'],
            match_type: 'any',
            case_sensitive: false,
          },
          model_answer: '<exemplar answer a student at this year level should be able to write>',
        },
      ],
    }, null, 2),
    '',
    'STRICT RULES:',
    '- "options" REQUIRED for multiple_choice; OMIT for short_answer and extended_answer.',
    '- "marking_criteria" and "model_answer" REQUIRED for short_answer and extended_answer; OMIT for multiple_choice.',
    '- blooms_taxonomy REQUIRED on every question.',
    '- Exactly one option must have is_correct: true for each multiple_choice question.',
    '- You MUST generate each question with the exact type specified in the question list above — do not substitute types.',
  )

  let rawPass1: string
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: 'Respond with valid JSON only. No markdown, no code blocks.',
      messages: [{ role: 'user', content: pass1Lines.join('\n') }],
    })
    rawPass1 = stripFence(msg.content[0].type === 'text' ? msg.content[0].text : '{}')
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: 'ai_error', message: e?.message || 'AI request failed' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawPass1)
  } catch {
    return new Response(
      JSON.stringify({ error: 'parse_error', message: 'AI returned invalid JSON.' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Sanitize Pass 1 output
  const validBlooms = ['Remember', 'Understand', 'Apply', 'Analyse', 'Analyze', 'Evaluate', 'Create']
  const validQuestionTypes = ['multiple_choice', 'short_answer', 'extended_answer']

  const sanitized: {
    name: string
    description: string
    questions: {
      question: string
      question_type: 'multiple_choice' | 'short_answer' | 'extended_answer'
      max_score: number
      blooms_taxonomy?: string
      content_item_id?: string
      options?: { option_text: string; is_correct: boolean }[]
      marking_criteria?: {
        expected_keywords: string[]
        match_type: 'all' | 'any'
        case_sensitive: boolean
      }
      model_answer?: string
    }[]
  } = {
    name: String(parsed.name || 'Generated Exit Ticket').trim(),
    description: String(parsed.description || '').trim(),
    questions: [],
  }

  const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : []

  for (let idx = 0; idx < rawQuestions.length; idx++) {
    const q = rawQuestions[idx]
    if (!q || typeof q !== 'object') continue

    const questionText = String(q.question || '').trim()
    if (!questionText) continue

    // Enforce the teacher-specified type for this slot; fall back to AI's suggestion if within range
    const enforcedType = typesArray[idx] || 'multiple_choice'
    const qtype = String(q.question_type || '').trim().toLowerCase()
    const type = validQuestionTypes.includes(enforcedType)
      ? (enforcedType as 'multiple_choice' | 'short_answer' | 'extended_answer')
      : validQuestionTypes.includes(qtype)
        ? (qtype as 'multiple_choice' | 'short_answer' | 'extended_answer')
        : 'short_answer'

    const maxScore = Math.max(0, Math.min(20, Math.round(Number(q.max_score || 1))))

    const item: typeof sanitized.questions[number] = {
      question: questionText,
      question_type: type,
      max_score: maxScore || 1,
    }

    const qBlooms = String(q.blooms_taxonomy || '').trim()
    if (validBlooms.includes(qBlooms)) {
      item.blooms_taxonomy = qBlooms
    }

    if (type === 'multiple_choice') {
      const rawOptions = Array.isArray(q.options) ? q.options : []
      const options = rawOptions
        .filter((o: any) => o && typeof o === 'object')
        .map((o: any) => ({
          option_text: String(o.option_text || '').trim(),
          is_correct: Boolean(o.is_correct),
        }))
        .filter((o) => o.option_text)

      if (options.length >= 2) {
        const correctCount = options.filter((o) => o.is_correct).length
        if (correctCount !== 1) {
          options.forEach((o) => (o.is_correct = false))
          options[0].is_correct = true
        }
        item.options = options
      } else {
        item.options = [
          { option_text: 'True', is_correct: true },
          { option_text: 'False', is_correct: false },
        ]
      }
    } else {
      const rawCriteria = q.marking_criteria && typeof q.marking_criteria === 'object' ? q.marking_criteria : {}
      const expectedKeywords = Array.isArray(rawCriteria.expected_keywords)
        ? rawCriteria.expected_keywords.map((k: any) => String(k || '').trim()).filter(Boolean)
        : []
      item.marking_criteria = {
        expected_keywords: expectedKeywords.length > 0 ? expectedKeywords : [''],
        match_type: rawCriteria.match_type === 'all' ? 'all' : 'any',
        case_sensitive: Boolean(rawCriteria.case_sensitive),
      }
      item.model_answer = String(q.model_answer || '').trim()
    }

    sanitized.questions.push(item)
  }

  if (sanitized.questions.length === 0) {
    return new Response(
      JSON.stringify({ error: 'generation_failed', message: 'AI did not return any valid questions.' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // ---------------------------------------------------------------------------
  // PASS 2 — Map questions to content descriptors (only if descriptors exist)
  // ---------------------------------------------------------------------------
  if (contentItems.length > 0) {
    const descriptorList = contentItems
      .map((ci) => `${ci.code}: ${ci.description}`)
      .join('\n')

    const questionList = sanitized.questions
      .map((q, i) => `${i + 1}. ${q.question}`)
      .join('\n')

    const pass2Lines = [
      'You are a curriculum expert. Your only task is to map each question to the most relevant content descriptor from the list below.',
      'Return a JSON object with a "mapping" array. Each entry has "question_index" (0-based) and "content_item_code" (exact code from the list).',
      'Only include questions where a descriptor genuinely fits. If none fit a question, omit it.',
      '',
      'AVAILABLE CONTENT DESCRIPTORS:',
      descriptorList,
      '',
      'QUESTIONS TO MAP:',
      questionList,
      '',
      'Return ONLY this JSON (no markdown):',
      '{ "mapping": [ { "question_index": 0, "content_item_code": "<exact code>" } ] }',
      '',
      'RULES:',
      '- Use the EXACT code string from the list (e.g. "BME-U3-ENV-OWNERSHIP").',
      '- Do not invent codes. Only use codes from the list above.',
      '- It is fine to map multiple questions to the same descriptor if that is the best fit.',
    ]

    try {
      const pass2Msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: 'Respond with valid JSON only. No markdown, no code blocks.',
        messages: [{ role: 'user', content: pass2Lines.join('\n') }],
      })
      const pass2Raw = stripFence(pass2Msg.content[0].type === 'text' ? pass2Msg.content[0].text : '{}')
      const pass2Parsed = JSON.parse(pass2Raw)
      const mapping: { question_index: number; content_item_code: string }[] = Array.isArray(pass2Parsed.mapping)
        ? pass2Parsed.mapping
        : []

      for (const entry of mapping) {
        const idx = Math.round(Number(entry.question_index ?? -1))
        if (idx < 0 || idx >= sanitized.questions.length) continue
        const resolvedCode = resolveCode(String(entry.content_item_code || ''), contentItems)
        if (resolvedCode) {
          sanitized.questions[idx].content_item_id = resolvedCode
        }
      }
    } catch {
      // Mapping failed — return questions without content descriptors rather than error
    }
  }

  return new Response(
    JSON.stringify(sanitized),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
