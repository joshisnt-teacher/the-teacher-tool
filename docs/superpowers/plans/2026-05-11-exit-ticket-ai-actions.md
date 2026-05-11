# Exit Ticket AI Actions + Marking Harshness — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 1–5 marking harshness slider to Settings and an "Actions" tab on exit ticket assessments with three on-demand AI tools: class analysis, per-student feedback, and flagging struggling students.

**Architecture:** Two DB migrations add `marking_harshness` to `users` and a new `ai_action_results` table. The existing `ai-mark-response` edge function is updated to use harshness. A new `ai-class-actions` edge function handles all three action types. The React layer adds a slider to Settings and a new `ActionsTab` component registered in `AssessmentDetail`.

**Tech Stack:** Deno edge functions (OpenAI GPT-4o-mini), Supabase (PostgreSQL + RLS), React 18, TanStack Query, shadcn/ui Slider, date-fns.

---

## File Map

| File | Action |
|------|--------|
| `supabase/migrations/20260511000000_add_marking_harshness.sql` | Create |
| `supabase/migrations/20260511000001_create_ai_action_results.sql` | Create |
| `supabase/functions/ai-mark-response/index.ts` | Modify — add harshness to prompt |
| `supabase/functions/ai-class-actions/index.ts` | Create — new edge function |
| `supabase/config.toml` | Modify — add `[functions.ai-class-actions]` |
| `src/hooks/useCurrentUser.ts` | Modify — add `marking_harshness` to select + interface |
| `src/pages/Settings.tsx` | Modify — add harshness slider to AI Settings card |
| `src/hooks/useClassActions.ts` | Create |
| `src/components/assessment/ActionsTab.tsx` | Create |
| `src/pages/AssessmentDetail.tsx` | Modify — register Actions tab |

---

## Task 1: DB migration — `marking_harshness`

**Files:**
- Create: `supabase/migrations/20260511000000_add_marking_harshness.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/20260511000000_add_marking_harshness.sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS marking_harshness integer NOT NULL DEFAULT 3
  CHECK (marking_harshness BETWEEN 1 AND 5);
```

- [ ] **Step 2: Apply to remote**

```bash
npx supabase db push --project-ref aogorchudxilnkhtfvqq
```

Expected: `Applying migration 20260511000000_add_marking_harshness.sql...` with no errors.

- [ ] **Step 3: Verify in Supabase dashboard**

Open the Supabase dashboard → Table Editor → `users`. Confirm `marking_harshness` column exists with type `integer` and default `3`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260511000000_add_marking_harshness.sql
git commit -m "feat: add marking_harshness column to users"
```

---

## Task 2: DB migration — `ai_action_results`

**Files:**
- Create: `supabase/migrations/20260511000001_create_ai_action_results.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/20260511000001_create_ai_action_results.sql
CREATE TABLE IF NOT EXISTS ai_action_results (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  teacher_id  uuid NOT NULL REFERENCES auth.users(id),
  action_type text NOT NULL CHECK (
    action_type IN ('class_analysis', 'student_feedback', 'struggling_students')
  ),
  output_json jsonb NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE ai_action_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_own" ON ai_action_results
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Required for upsert conflict resolution
CREATE UNIQUE INDEX IF NOT EXISTS ai_action_results_task_action_uidx
  ON ai_action_results (task_id, action_type);
```

- [ ] **Step 2: Apply to remote**

```bash
npx supabase db push --project-ref aogorchudxilnkhtfvqq
```

Expected: `Applying migration 20260511000001_create_ai_action_results.sql...` with no errors.

- [ ] **Step 3: Verify**

Open Supabase dashboard → Table Editor. Confirm `ai_action_results` table exists with the correct columns and the unique index appears under Indexes.

- [ ] **Step 4: Regenerate TypeScript types**

```bash
npx supabase gen types typescript --project-id aogorchudxilnkhtfvqq > src/integrations/supabase/types.ts
```

Expected: `src/integrations/supabase/types.ts` updates to include `ai_action_results` and the new `marking_harshness` column on `users`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260511000001_create_ai_action_results.sql src/integrations/supabase/types.ts
git commit -m "feat: add ai_action_results table and regenerate types"
```

---

## Task 3: Update `useCurrentUser` — add `marking_harshness`

**Files:**
- Modify: `src/hooks/useCurrentUser.ts`

- [ ] **Step 1: Update the `CurrentUser` interface**

In `src/hooks/useCurrentUser.ts`, change the `CurrentUser` interface from:

```typescript
export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  school_id: string | null;
  school?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}
```

To:

```typescript
export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  school_id: string | null;
  marking_harshness: number;
  school?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}
```

- [ ] **Step 2: Add `marking_harshness` to the select query**

Change the `select(...)` call from:

```typescript
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          role,
          school_id,
          schools:school_id (
            id,
            name,
            logo_url
          )
        `)
```

To:

```typescript
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          role,
          school_id,
          marking_harshness,
          schools:school_id (
            id,
            name,
            logo_url
          )
        `)
```

- [ ] **Step 3: Ensure `marking_harshness` is included in the returned object**

The return statement in `useCurrentUser.ts` is:

```typescript
      return {
        ...data,
        school: Array.isArray(data.schools) ? data.schools[0] : data.schools
      };
```

The spread `...data` will pick up `marking_harshness` automatically. But add a fallback in case old rows return null:

```typescript
      return {
        ...data,
        marking_harshness: data.marking_harshness ?? 3,
        school: Array.isArray(data.schools) ? data.schools[0] : data.schools
      };
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useCurrentUser.ts
git commit -m "feat: include marking_harshness in useCurrentUser"
```

---

## Task 4: Update `ai-mark-response` — dynamic harshness prompt

**Files:**
- Modify: `supabase/functions/ai-mark-response/index.ts`

- [ ] **Step 1: Add `harshnessBrief` helper function**

Insert this function before `Deno.serve(` (after the `corsHeaders` block at the top of the file):

```typescript
function harshnessBrief(level: number): string {
  switch (level) {
    case 1: return 'Be very generous. If the student shows any understanding of the core concept, award full marks. Give benefit of the doubt at every step.'
    case 2: return 'Be lenient and encouraging. Lean towards the higher mark whenever the answer demonstrates partial understanding.'
    case 4: return 'Apply strict standards. Only award full marks for answers that clearly address all required concepts. Partial credit for partial answers.'
    case 5: return 'Apply rigorous standards. Full marks require a complete and precise answer covering all key concepts. Award marks strictly proportionally to demonstrated knowledge.'
    default: return 'Be fair. If the student understood the main point and answered the question, lean towards the higher mark.'
  }
}
```

- [ ] **Step 2: Fetch `marking_harshness` alongside `openai_vault_id`**

Find this line (around line 55–57):

```typescript
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('openai_vault_id')
    .eq('id', cls.teacher_id)
    .single()
```

Change `.select('openai_vault_id')` to `.select('openai_vault_id, marking_harshness')`:

```typescript
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('openai_vault_id, marking_harshness')
    .eq('id', cls.teacher_id)
    .single()
```

- [ ] **Step 3: Replace the hardcoded "generous" prompt line**

Find this line inside `promptLines.push(...)` (around line 149):

```typescript
      '- Be fair and generous: if the student has understood the main point and answered the question, lean towards the higher mark.',
```

Replace it with:

```typescript
      `- ${harshnessBrief(userData.marking_harshness ?? 3)}`,
```

- [ ] **Step 4: Verify the file compiles — run a quick lint check**

```bash
npx supabase functions serve ai-mark-response --no-verify-jwt
```

Expected: function starts without Deno errors. Press Ctrl+C to stop.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/ai-mark-response/index.ts
git commit -m "feat: apply marking_harshness to ai-mark-response prompt"
```

---

## Task 5: Create `ai-class-actions` edge function + config

**Files:**
- Create: `supabase/functions/ai-class-actions/index.ts`
- Modify: `supabase/config.toml`

- [ ] **Step 1: Add function config to `supabase/config.toml`**

Append after the last `[functions.*]` block (after `[functions.save-openai-key]`):

```toml
[functions.ai-class-actions]
verify_jwt = false
```

- [ ] **Step 2: Create the edge function file**

Create `supabase/functions/ai-class-actions/index.ts` with this content:

```typescript
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
```

- [ ] **Step 3: Verify the file parses — start the function locally**

```bash
npx supabase functions serve ai-class-actions --no-verify-jwt
```

Expected: function starts without errors. Press Ctrl+C to stop.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/ai-class-actions/index.ts supabase/config.toml
git commit -m "feat: add ai-class-actions edge function"
```

---

## Task 6: Deploy both edge functions

- [ ] **Step 1: Deploy `ai-mark-response`**

```bash
npx supabase functions deploy ai-mark-response --project-ref aogorchudxilnkhtfvqq --no-verify-jwt
```

Expected: `Deployed Function ai-mark-response` with no errors.

- [ ] **Step 2: Deploy `ai-class-actions`**

```bash
npx supabase functions deploy ai-class-actions --project-ref aogorchudxilnkhtfvqq --no-verify-jwt
```

Expected: `Deployed Function ai-class-actions` with no errors.

- [ ] **Step 3: Smoke test `ai-class-actions` from the Supabase dashboard**

In Supabase dashboard → Edge Functions → `ai-class-actions` → Logs, confirm the function appears and has no deploy errors.

---

## Task 7: Add harshness slider to Settings

**Files:**
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Import `Slider`**

At the top of `src/pages/Settings.tsx`, add `Slider` to the imports. Find the existing shadcn/ui import block and add:

```typescript
import { Slider } from '@/components/ui/slider';
```

- [ ] **Step 2: Add `harshness` state**

In the state declarations section (around line 56, after `const [showKey, setShowKey] = useState(false)`), add:

```typescript
const [harshness, setHarshness] = useState<number>(3);
const harshnessSaveRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
```

- [ ] **Step 3: Sync harshness from loaded user data**

In the existing `useEffect` that syncs `name` (around line 79):

```typescript
  useEffect(() => {
    if (currentUser?.name) setName(currentUser.name);
  }, [currentUser]);
```

Add a second effect below it:

```typescript
  useEffect(() => {
    if (currentUser?.marking_harshness != null) {
      setHarshness(currentUser.marking_harshness);
    }
  }, [currentUser]);
```

- [ ] **Step 4: Add the harshness change handler**

After the `handleSaveKey` function (around line 182), add:

```typescript
  const HARSHNESS_LABELS: Record<number, string> = {
    1: 'Very Lenient',
    2: 'Lenient',
    3: 'Standard',
    4: 'Strict',
    5: 'Very Strict',
  };

  const handleHarshnesChange = (value: number[]) => {
    const level = value[0];
    setHarshness(level);
    if (harshnessSaveRef.current) clearTimeout(harshnessSaveRef.current);
    harshnessSaveRef.current = setTimeout(async () => {
      if (!currentUser) return;
      const { error } = await supabase
        .from('users')
        .update({ marking_harshness: level })
        .eq('id', currentUser.id);
      if (!error) {
        toast.success('Marking harshness updated');
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
    }, 600);
  };
```

- [ ] **Step 5: Add the slider UI inside the AI Settings card**

In the AI Settings card, after the closing `</form>` tag of the API key form (around line 544, just before `</CardContent>` of the AI card), add:

```tsx
              <div className="border-t pt-4 space-y-3">
                <div className="space-y-1">
                  <Label>Marking Harshness</Label>
                  <p className="text-xs text-muted-foreground">
                    Controls how strictly the AI marks student written responses.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Lenient</span>
                    <span className="font-medium text-foreground">{HARSHNESS_LABELS[harshness]}</span>
                    <span>Strict</span>
                  </div>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[harshness]}
                    onValueChange={handleHarshnesChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground px-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n}>{n}</span>
                    ))}
                  </div>
                </div>
              </div>
```

- [ ] **Step 6: Manual verification**

Run `npm run dev`, open Settings → AI Settings. Confirm:
- Slider shows with Lenient/Strict labels
- Moving the slider updates the label beneath it (Very Lenient → Strict etc.)
- After 600ms, a "Marking harshness updated" toast appears
- Refreshing the page restores the saved value

- [ ] **Step 7: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: add marking harshness slider to Settings"
```

---

## Task 8: Create `useClassActions` hook

**Files:**
- Create: `src/hooks/useClassActions.ts`

- [ ] **Step 1: Create the hook file**

```typescript
// src/hooks/useClassActions.ts
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ActionType = 'class_analysis' | 'student_feedback' | 'struggling_students';

export interface ActionResult {
  output_json: Record<string, unknown>;
  created_at: string;
}

export type SavedResults = Record<ActionType, ActionResult | null>;

const EMPTY_RESULTS: SavedResults = {
  class_analysis: null,
  student_feedback: null,
  struggling_students: null,
};

export const useClassActions = (taskId: string | undefined) => {
  const queryClient = useQueryClient();
  const [runningAction, setRunningAction] = useState<ActionType | null>(null);

  const { data: savedResults = EMPTY_RESULTS } = useQuery<SavedResults>({
    queryKey: ['ai-action-results', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_action_results')
        .select('action_type, output_json, created_at')
        .eq('task_id', taskId!);
      if (error) throw error;
      const map: SavedResults = { ...EMPTY_RESULTS };
      for (const row of data ?? []) {
        map[row.action_type as ActionType] = {
          output_json: row.output_json as Record<string, unknown>,
          created_at: row.created_at,
        };
      }
      return map;
    },
    enabled: !!taskId,
  });

  const runAction = async (actionType: ActionType) => {
    setRunningAction(actionType);
    try {
      const { data, error } = await supabase.functions.invoke('ai-class-actions', {
        body: { task_id: taskId, action_type: actionType },
      });
      if (error) throw error;
      if (data?.skipped) {
        toast.error('No OpenAI key found. Add your key in Settings → AI Marking.');
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['ai-action-results', taskId] });
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI action failed';
      toast.error(message);
      throw err;
    } finally {
      setRunningAction(null);
    }
  };

  return { savedResults, runAction, runningAction };
};
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useClassActions.ts
git commit -m "feat: add useClassActions hook"
```

---

## Task 9: Create `ActionsTab` component

**Files:**
- Create: `src/components/assessment/ActionsTab.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/assessment/ActionsTab.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BrainCircuit, MessageSquare, AlertTriangle,
  Copy, Download, RefreshCw, Loader2,
} from 'lucide-react';
import { useClassActions, ActionType } from '@/hooks/useClassActions';
import { useOpenAIKeyStatus } from '@/hooks/useAISettings';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Props {
  taskId: string;
}

interface ClassAnalysisOutput {
  summary: string;
  strengths: string[];
  gaps: string[];
  reteach_topics: string[];
}

interface StudentFeedbackOutput {
  students: { student_id: string; first_name: string; last_name: string; feedback: string }[];
}

interface StrugglingOutput {
  at_risk: { student_id: string; first_name: string; last_name: string; score_percent: number | null; reason: string }[];
}

const formatTs = (iso: string) => format(new Date(iso), 'dd MMM yyyy, h:mm a');

export const ActionsTab = ({ taskId }: Props) => {
  const { savedResults, runAction, runningAction } = useClassActions(taskId);
  const { data: keyStatus } = useOpenAIKeyStatus();

  if (!keyStatus?.hasKey) {
    return (
      <div className="p-8 text-center text-muted-foreground space-y-2">
        <BrainCircuit className="w-8 h-8 mx-auto opacity-40" />
        <p className="font-medium">AI actions require an OpenAI API key.</p>
        <p className="text-sm">
          Add your key in{' '}
          <Link to="/settings" className="underline hover:text-foreground">
            Settings → AI Marking
          </Link>
          .
        </p>
      </div>
    );
  }

  const downloadFeedbackCSV = (data: StudentFeedbackOutput) => {
    const rows = [
      ['First Name', 'Last Name', 'Feedback'],
      ...data.students.map((s) => [
        s.first_name,
        s.last_name,
        `"${s.feedback.replace(/"/g, '""')}"`,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-feedback.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const RunButton = ({
    action,
    label,
    runningLabel,
  }: {
    action: ActionType;
    label: string;
    runningLabel: string;
  }) => {
    const hasSaved = !!savedResults[action];
    const isRunning = runningAction === action;
    return (
      <Button
        size="sm"
        variant={hasSaved ? 'outline' : 'default'}
        onClick={() => runAction(action)}
        disabled={runningAction !== null}
      >
        {isRunning ? (
          <>
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            {runningLabel}
          </>
        ) : hasSaved ? (
          <>
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Re-run
          </>
        ) : (
          label
        )}
      </Button>
    );
  };

  const classResult = savedResults.class_analysis;
  const feedbackResult = savedResults.student_feedback;
  const strugglingResult = savedResults.struggling_students;

  const classData = classResult?.output_json as ClassAnalysisOutput | undefined;
  const feedbackData = feedbackResult?.output_json as StudentFeedbackOutput | undefined;
  const strugglingData = strugglingResult?.output_json as StrugglingOutput | undefined;

  return (
    <div className="space-y-4 p-1">

      {/* ── CLASS ANALYSIS ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <CardTitle className="text-base">Class Analysis</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Analyse class-wide strengths and gaps
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {classResult && (
                <p className="text-xs text-muted-foreground">
                  Last run: {formatTs(classResult.created_at)}
                </p>
              )}
              <RunButton action="class_analysis" label="Run Analysis" runningLabel="Analysing…" />
            </div>
          </div>
        </CardHeader>
        {classData && (
          <CardContent className="pt-0 space-y-3 border-t">
            <p className="text-sm text-muted-foreground pt-3">{classData.summary}</p>
            {(
              [
                { label: 'Class Strengths', items: classData.strengths, colour: 'text-green-700 dark:text-green-400' },
                { label: 'Areas to Reteach', items: classData.reteach_topics, colour: 'text-amber-700 dark:text-amber-400' },
                { label: 'Common Gaps', items: classData.gaps, colour: 'text-red-700 dark:text-red-400' },
              ] as const
            ).map(({ label, items, colour }) =>
              items?.length > 0 ? (
                <div key={label}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${colour}`}>
                    {label}
                  </p>
                  <ul className="space-y-1">
                    {items.map((item, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STUDENT FEEDBACK ───────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <CardTitle className="text-base">Student Feedback</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Generate a written comment for each student
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {feedbackResult && (
                <p className="text-xs text-muted-foreground">
                  Last run: {formatTs(feedbackResult.created_at)}
                </p>
              )}
              <RunButton
                action="student_feedback"
                label="Generate Feedback"
                runningLabel="Generating…"
              />
            </div>
          </div>
        </CardHeader>
        {feedbackData?.students && feedbackData.students.length > 0 && (
          <CardContent className="pt-0 space-y-2 border-t">
            <div className="pt-3 space-y-2">
              {feedbackData.students.map((s) => (
                <div
                  key={s.student_id}
                  className="flex items-start justify-between gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {s.first_name} {s.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">{s.feedback}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="flex-shrink-0 h-7 w-7"
                    onClick={() => {
                      navigator.clipboard.writeText(s.feedback);
                      toast.success('Copied');
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => downloadFeedbackCSV(feedbackData)}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download as CSV
            </Button>
          </CardContent>
        )}
      </Card>

      {/* ── STRUGGLING STUDENTS ────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <CardTitle className="text-base">Flag Struggling Students</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Identify students who may need extra support
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {strugglingResult && (
                <p className="text-xs text-muted-foreground">
                  Last run: {formatTs(strugglingResult.created_at)}
                </p>
              )}
              <RunButton
                action="struggling_students"
                label="Identify Students"
                runningLabel="Identifying…"
              />
            </div>
          </div>
        </CardHeader>
        {strugglingData && (
          <CardContent className="pt-0 border-t">
            {strugglingData.at_risk.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3 pt-4">
                No students flagged as struggling — great result!
              </p>
            ) : (
              <div className="pt-3 space-y-2">
                {strugglingData.at_risk.map((s) => (
                  <div
                    key={s.student_id}
                    className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {s.first_name} {s.last_name}
                        </p>
                        {s.score_percent !== null && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(s.score_percent)}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{s.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/assessment/ActionsTab.tsx
git commit -m "feat: add ActionsTab component for exit ticket AI actions"
```

---

## Task 10: Register Actions tab in AssessmentDetail

**Files:**
- Modify: `src/pages/AssessmentDetail.tsx`

- [ ] **Step 1: Import `ActionsTab`**

At the top of `src/pages/AssessmentDetail.tsx`, add:

```typescript
import { ActionsTab } from '@/components/assessment/ActionsTab';
```

- [ ] **Step 2: Add the tab trigger**

Find the `TabsList` block (around line 709):

```tsx
            <TabsTrigger value="results">Results</TabsTrigger>
            {assessment.is_exit_ticket && <TabsTrigger value="responses">Responses</TabsTrigger>}
            <TabsTrigger value="heatmap">Question Heatmap</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
```

Add the Actions trigger after Insights:

```tsx
            <TabsTrigger value="results">Results</TabsTrigger>
            {assessment.is_exit_ticket && <TabsTrigger value="responses">Responses</TabsTrigger>}
            <TabsTrigger value="heatmap">Question Heatmap</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            {assessment.is_exit_ticket && <TabsTrigger value="actions">Actions</TabsTrigger>}
```

- [ ] **Step 3: Add the tab content**

Find the last `</TabsContent>` (around line 1155) and add after it:

```tsx
          {assessment.is_exit_ticket && (
            <TabsContent value="actions">
              <ActionsTab taskId={assessmentId!} />
            </TabsContent>
          )}
```

- [ ] **Step 4: Manual verification**

Run `npm run dev`. Open an exit ticket's Assessment Detail page. Confirm:
- "Actions" tab appears in the tab list
- Clicking it shows three action cards
- Each card has a "Run" button
- Non-exit-ticket assessments do NOT show the Actions tab

- [ ] **Step 5: Final end-to-end test**

On a completed exit ticket with student responses:
1. Click "Run Analysis" → spinner shows → result expands with Summary, Strengths, Areas to Reteach, Common Gaps
2. Click "Generate Feedback" → result expands with per-student comments + Copy buttons + Download CSV
3. Click "Identify Students" → either "No students flagged" or a list of at-risk students with reasons
4. Refresh the page → all three results are still visible (saved to DB)
5. Click "Re-run" on any card → result updates

- [ ] **Step 6: Commit**

```bash
git add src/pages/AssessmentDetail.tsx
git commit -m "feat: register Actions tab in AssessmentDetail for exit tickets"
```

---

## Done

All tasks complete. The feature is fully live when:
- Both migrations are applied to remote ✓
- Both edge functions are deployed ✓
- Settings shows the harshness slider ✓
- Exit ticket Assessment Detail pages show the Actions tab ✓
