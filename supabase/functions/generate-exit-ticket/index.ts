import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

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

/** Find a content item code from the AI's output, tolerating case differences. */
function resolveCode(
  input: string,
  items: { code: string }[]
): string | undefined {
  if (!input) return undefined
  const trimmed = input.trim()
  // Exact match first
  const exact = items.find((ci) => ci.code === trimmed)
  if (exact) return exact.code
  // Case-insensitive fallback
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
    question_types?: 'mcq' | 'short_answer' | 'extended' | 'mix'
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
  const types = question_types || 'mix'

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

  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('openai_vault_id')
    .eq('id', cls.teacher_id)
    .single()

  if (!userData?.openai_vault_id) {
    return new Response(
      JSON.stringify({ error: 'no_api_key', message: 'No OpenAI API key configured for this teacher.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Decrypt API key from Vault
  const { data: apiKey, error: vaultError } = await supabaseAdmin.rpc(
    'get_decrypted_openai_key',
    { p_vault_id: userData.openai_vault_id }
  )
  if (vaultError || !apiKey) {
    return new Response(
      JSON.stringify({ error: 'vault_error', message: 'Could not decrypt OpenAI API key.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
  // the mapping call can still find the best match (e.g. civics questions for
  // a class that has both geography and civics descriptors).
  let contentItems = allContentItems
  if (allContentItems.length > 0) {
    const scored = allContentItems
      .map((ci) => ({ ci, score: relevanceScore(ci, content.trim()) }))
      .sort((a, b) => b.score - a.score)

    const topScored = scored.filter((s) => s.score > 0).slice(0, 15)
    // When nothing matches by keyword, send everything — don't guess by position
    contentItems = topScored.length > 0 ? topScored.map((s) => s.ci) : allContentItems
  }

  // ---------------------------------------------------------------------------
  // PASS 1 — Generate questions (no content descriptor selection here)
  // ---------------------------------------------------------------------------
  const openai = new OpenAI({ apiKey })

  const typeMap: Record<string, string> = {
    mcq: 'multiple choice only',
    short_answer: 'short answer only',
    extended: 'extended answer only',
    mix: 'a mix of multiple choice, short answer, and extended answer',
  }

  const pass1Lines: string[] = [
    'You are an experienced Australian teacher. Generate an exit ticket (a short formative assessment) based on the teacher\'s request.',
    'Use Australian English spelling throughout (e.g. "analyse" not "analyze", "recognise" not "recognize", "organise" not "organize").',
    '',
    'CLASS CONTEXT:',
    `Subject: ${cls.subject || 'Not specified'}`,
    `Year Level: ${cls.year_level || 'Not specified'}`,
    '',
    'TEACHER REQUEST:',
    content.trim(),
    '',
    `Generate exactly ${count} question${count === 1 ? '' : 's'}.`,
    `Question type constraint: ${typeMap[types] || typeMap.mix}.`,
    '',
    'GUIDELINES:',
    '- Assign each question a Bloom\'s Taxonomy level (Remember, Understand, Apply, Analyse, Evaluate, Create). Vary the levels to build progressively more challenging questions.',
    '- For multiple choice questions: provide 3–4 options with exactly one correct answer.',
    '- For short/extended answer questions: include marking_criteria with expected_keywords and a model_answer.',
    '- Max scores: 1 for MCQs, 1–3 for short answer, 3–5 for extended answer.',
    '',
    'Return ONLY a JSON object (no markdown):',
    JSON.stringify({
      name: '<concise title>',
      description: '<1-2 sentence summary>',
      questions: [
        {
          question: '<question text>',
          question_type: '<multiple_choice | short_answer | extended_answer>',
          max_score: 1,
          blooms_taxonomy: '<Remember | Understand | Apply | Analyse | Evaluate | Create>',
          options: [
            { option_text: '<option A>', is_correct: false },
            { option_text: '<option B>', is_correct: true },
          ],
          marking_criteria: {
            expected_keywords: ['<keyword 1>'],
            match_type: 'any',
            case_sensitive: false,
          },
          model_answer: '<exemplar answer>',
        },
      ],
    }, null, 2),
    '',
    'RULES:',
    '- "options" REQUIRED for multiple_choice; OMIT for short_answer and extended_answer.',
    '- "marking_criteria" and "model_answer" REQUIRED for short_answer and extended_answer; OMIT for multiple_choice.',
    '- blooms_taxonomy REQUIRED on every question.',
    '- Exactly one option must have is_correct: true for each multiple_choice question.',
  ]

  let rawPass1: string
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: pass1Lines.join('\n') }],
      response_format: { type: 'json_object' },
    })
    rawPass1 = completion.choices[0].message.content ?? '{}'
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: 'openai_error', message: e?.message || 'OpenAI request failed' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawPass1)
  } catch {
    return new Response(
      JSON.stringify({ error: 'parse_error', message: 'OpenAI returned invalid JSON.' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Sanitize Pass 1 output
  const validBlooms = ['Remember', 'Understand', 'Apply', 'Analyse', 'Analyze', 'Evaluate', 'Create']
  const validTypes = ['multiple_choice', 'short_answer', 'extended_answer']

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

  for (const q of rawQuestions) {
    if (!q || typeof q !== 'object') continue
    const qtype = String(q.question_type || '').trim().toLowerCase()
    const type = validTypes.includes(qtype) ? (qtype as 'multiple_choice' | 'short_answer' | 'extended_answer') : 'short_answer'
    const maxScore = Math.max(0, Math.min(20, Math.round(Number(q.max_score || 1))))
    const questionText = String(q.question || '').trim()
    if (!questionText) continue

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
      JSON.stringify({ error: 'generation_failed', message: 'OpenAI did not return any valid questions.' }),
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
      const pass2Completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: pass2Lines.join('\n') }],
        response_format: { type: 'json_object' },
      })

      const pass2Raw = pass2Completion.choices[0].message.content ?? '{}'
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
