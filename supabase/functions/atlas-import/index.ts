import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ---------------------------------------------------------------------------
// CORS headers — allow any origin (Atlas → Pulse cross-origin call)
// ---------------------------------------------------------------------------

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SlidePayload {
  order: number
  title: string
  layout: 'default' | 'split' | 'image_full' | 'title_only'
  content_blocks: unknown[]
  background_image_url?: string
  background_colour?: string
}

interface AtlasQuestionOption {
  option_text: string
  is_correct: boolean
  order_index: number
}

interface AtlasMarkingCriteria {
  expected_keywords: string[]
  match_type: 'any' | 'all'
  case_sensitive: boolean
}

interface AtlasQuestion {
  number: number
  question: string
  question_type: 'multiple_choice' | 'short_answer' | 'extended_answer'
  max_score: number
  blooms_taxonomy?: string
  options?: AtlasQuestionOption[]
  marking_criteria?: AtlasMarkingCriteria
  model_answer?: string
}

interface AtlasExitTicketPayload {
  source: string
  version: string
  exit_ticket: {
    name: string
    description?: string
    questions: AtlasQuestion[]
  }
}

interface AtlasLessonPayload {
  central_teacher_id: string
  class_code: string
  atlas_lesson_id: string
  title: string
  description?: string
  learning_intentions: string[]
  success_criteria: string[]
  subject?: string
  year_level?: string
  estimated_minutes?: number
  slides: SlidePayload[]
  resources: unknown[]
  exit_ticket?: AtlasExitTicketPayload
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function isValidPayload(body: unknown): body is AtlasLessonPayload {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  if (typeof b.central_teacher_id !== 'string' || !b.central_teacher_id) return false
  if (typeof b.class_code !== 'string' || !b.class_code) return false
  if (typeof b.atlas_lesson_id !== 'string' || !b.atlas_lesson_id) return false
  if (typeof b.title !== 'string' || !b.title) return false
  if (!Array.isArray(b.learning_intentions)) return false
  if (!Array.isArray(b.success_criteria)) return false
  if (!Array.isArray(b.slides) || b.slides.length === 0) return false
  return true
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // ── 1. Auth: Bearer token check ──────────────────────────────────────────
  const apiKey = Deno.env.get('ATLAS_TO_PULSE_API_KEY')
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!apiKey || !token || token !== apiKey) {
    return new Response(
      JSON.stringify({ error: 'unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // ── 2. Parse and validate body ───────────────────────────────────────────
  let payload: AtlasLessonPayload
  try {
    const raw = await req.json()
    if (!isValidPayload(raw)) {
      return new Response(
        JSON.stringify({ error: 'invalid_payload', message: 'Missing or invalid required fields.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    payload = raw
  } catch {
    return new Response(
      JSON.stringify({ error: 'invalid_json', message: 'Request body is not valid JSON.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // ── Service role client (bypasses RLS for all cross-app writes) ──────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ── 3. Resolve teacher by central_teacher_id ─────────────────────────────
  const { data: teacher, error: teacherErr } = await supabase
    .from('teacher_profiles')
    .select('id, central_teacher_id')
    .eq('central_teacher_id', payload.central_teacher_id)
    .maybeSingle()

  if (teacherErr) {
    return new Response(
      JSON.stringify({ error: 'db_error', message: teacherErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!teacher) {
    return new Response(
      JSON.stringify({
        error: 'teacher_not_in_pulse',
        deep_link: 'https://pulse.edufied.com.au/login',
      }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // ── 4. Resolve class by class_code scoped to this teacher ────────────────
  const { data: cls, error: clsErr } = await supabase
    .from('classes')
    .select('id, school_id, class_code')
    .eq('class_code', payload.class_code)
    .eq('teacher_id', teacher.id)
    .maybeSingle()

  if (clsErr) {
    return new Response(
      JSON.stringify({ error: 'db_error', message: clsErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!cls) {
    return new Response(
      JSON.stringify({ error: 'class_not_in_pulse' }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // ── 5. Upsert lesson_template keyed on atlas_lesson_id ──────────────────

  // Base metadata included on every lesson template insert/update
  const baseMetadata = {
    subject: payload.subject ?? null,
    year_level: payload.year_level ?? null,
    estimated_minutes: payload.estimated_minutes ?? null,
  }

  // Check whether a template for this atlas_lesson_id already exists
  const { data: existing, error: existingErr } = await supabase
    .from('lesson_templates')
    .select('id, metadata')
    .eq('atlas_lesson_id', payload.atlas_lesson_id)
    .maybeSingle()

  if (existingErr) {
    return new Response(
      JSON.stringify({ error: 'db_error', message: existingErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let lessonTemplateId: string

  if (existing) {
    // Update the existing template and delete old slides before re-inserting
    lessonTemplateId = existing.id

    // Clean up old exit ticket if one was previously created for this lesson
    const existingMeta = (existing.metadata ?? {}) as Record<string, unknown>
    const oldTaskId = typeof existingMeta.exit_ticket_task_id === 'string'
      ? existingMeta.exit_ticket_task_id
      : null
    if (oldTaskId) {
      const { data: oldTask } = await supabase
        .from('tasks')
        .select('id, exit_ticket_template_id')
        .eq('id', oldTaskId)
        .maybeSingle()
      if (oldTask) {
        await supabase.from('tasks').delete().eq('id', oldTask.id)
        if (oldTask.exit_ticket_template_id) {
          await supabase.from('exit_ticket_templates').delete().eq('id', oldTask.exit_ticket_template_id)
        }
      }
    }

    const { error: updateErr } = await supabase
      .from('lesson_templates')
      .update({
        title: payload.title,
        description: payload.description ?? null,
        learning_intentions: payload.learning_intentions,
        success_criteria: payload.success_criteria,
        source: 'atlas',
        metadata: baseMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lessonTemplateId)

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: 'db_error', message: updateErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete old slides so we can re-insert fresh ones
    const { error: deleteSlides } = await supabase
      .from('lesson_template_slides')
      .delete()
      .eq('lesson_template_id', lessonTemplateId)

    if (deleteSlides) {
      return new Response(
        JSON.stringify({ error: 'db_error', message: deleteSlides.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } else {
    // Insert a fresh template
    const { data: newTemplate, error: insertErr } = await supabase
      .from('lesson_templates')
      .insert({
        title: payload.title,
        description: payload.description ?? null,
        learning_intentions: payload.learning_intentions,
        success_criteria: payload.success_criteria,
        teacher_id: teacher.id,
        source: 'atlas',
        atlas_lesson_id: payload.atlas_lesson_id,
        metadata: baseMetadata,
      })
      .select('id')
      .single()

    if (insertErr || !newTemplate) {
      return new Response(
        JSON.stringify({ error: 'db_error', message: insertErr?.message ?? 'Failed to create lesson template' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    lessonTemplateId = newTemplate.id
  }

  // ── 6. Insert slides ─────────────────────────────────────────────────────
  if (payload.slides.length > 0) {
    const slideRows = payload.slides.map((slide) => ({
      lesson_template_id: lessonTemplateId,
      order: slide.order,
      title: slide.title ?? null,
      layout: slide.layout ?? 'default',
      content_blocks: slide.content_blocks ?? [],
      background_image_url: slide.background_image_url ?? null,
      background_colour: slide.background_colour ?? null,
    }))

    const { error: slidesErr } = await supabase
      .from('lesson_template_slides')
      .insert(slideRows)

    if (slidesErr) {
      return new Response(
        JSON.stringify({ error: 'db_error', message: slidesErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }

  // ── 7. Import exit ticket (if present) ──────────────────────────────────
  let exitTicketTaskId: string | null = null

  if (payload.exit_ticket) {
    const et = payload.exit_ticket.exit_ticket
    const questions = et.questions ?? []

    let templateId: string | null = null
    let taskId: string | null = null

    try {
      // a. Insert exit_ticket_templates row
      // school_id comes from the resolved class (non-nullable in the DB schema)
      const { data: template, error: tErr } = await supabase
        .from('exit_ticket_templates')
        .insert({
          name: et.name,
          description: et.description ?? null,
          teacher_id: teacher.id,
          school_id: cls.school_id,
        })
        .select('id')
        .single()

      if (tErr || !template) {
        throw new Error(tErr?.message ?? 'Failed to create exit_ticket_templates row')
      }
      templateId = template.id

      // b. Insert template_questions and template_question_options
      for (const q of questions) {
        const { data: tq, error: tqErr } = await supabase
          .from('template_questions')
          .insert({
            template_id: templateId,
            number: q.number,
            question: q.question,
            question_type: q.question_type,
            max_score: q.max_score,
            blooms_taxonomy: q.blooms_taxonomy ?? null,
            content_item: null,
            general_capabilities: null,
            marking_criteria: q.question_type !== 'multiple_choice' ? (q.marking_criteria ?? null) : null,
            model_answer: q.question_type !== 'multiple_choice' ? (q.model_answer ?? null) : null,
          })
          .select('id')
          .single()

        if (tqErr || !tq) {
          throw new Error(tqErr?.message ?? 'Failed to create template_questions row')
        }

        if (q.question_type === 'multiple_choice' && q.options?.length) {
          const { error: optErr } = await supabase
            .from('template_question_options')
            .insert(
              q.options.map((o) => ({
                template_question_id: tq.id,
                option_text: o.option_text,
                is_correct: o.is_correct,
                order_index: o.order_index,
              }))
            )

          if (optErr) {
            throw new Error(optErr.message)
          }
        }
      }

      // c. Insert tasks row
      const totalMaxScore = questions.reduce((sum, q) => sum + (Number(q.max_score) || 0), 0)

      const { data: task, error: taskErr } = await supabase
        .from('tasks')
        .insert({
          name: et.name,
          description: et.description ?? null,
          class_id: cls.id,
          is_exit_ticket: true,
          status: 'draft',
          exit_ticket_template_id: templateId,
          max_score: totalMaxScore,
          task_type: 'Formative',
        })
        .select('id')
        .single()

      if (taskErr || !task) {
        throw new Error(taskErr?.message ?? 'Failed to create tasks row')
      }
      taskId = task.id

      // d. Insert questions and question_options for the task run
      for (const q of questions) {
        const { data: question, error: qErr } = await supabase
          .from('questions')
          .insert({
            task_id: taskId,
            number: q.number,
            question: q.question,
            question_type: q.question_type,
            max_score: q.max_score,
            blooms_taxonomy: q.blooms_taxonomy ?? null,
            content_item: null,
            general_capabilities: null,
            marking_criteria: q.question_type !== 'multiple_choice' ? (q.marking_criteria ?? null) : null,
            model_answer: q.question_type !== 'multiple_choice' ? (q.model_answer ?? null) : null,
          })
          .select('id')
          .single()

        if (qErr || !question) {
          throw new Error(qErr?.message ?? 'Failed to create questions row')
        }

        if (q.question_type === 'multiple_choice' && q.options?.length) {
          const { error: optErr } = await supabase
            .from('question_options')
            .insert(
              q.options.map((o) => ({
                question_id: question.id,
                option_text: o.option_text,
                is_correct: o.is_correct,
                order_index: o.order_index,
              }))
            )

          if (optErr) {
            throw new Error(optErr.message)
          }
        }
      }

      exitTicketTaskId = taskId

      // Persist the task ID in lesson_templates.metadata so re-imports can clean it up
      await supabase
        .from('lesson_templates')
        .update({ metadata: { ...baseMetadata, exit_ticket_task_id: taskId } })
        .eq('id', lessonTemplateId)
    } catch (err: unknown) {
      // Clean up orphaned rows on partial failure (cascades handle child rows)
      if (taskId) {
        await supabase.from('tasks').delete().eq('id', taskId)
      }
      if (templateId) {
        await supabase.from('exit_ticket_templates').delete().eq('id', templateId)
      }

      const message = err instanceof Error ? err.message : 'Unknown error during exit ticket import'
      return new Response(
        JSON.stringify({ error: 'exit_ticket_import_failed', message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }

  // ── 8. Success response ──────────────────────────────────────────────────
  return new Response(
    JSON.stringify({
      lesson_template_id: lessonTemplateId,
      exit_ticket_task_id: exitTicketTaskId,
      class_id: cls.id,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
