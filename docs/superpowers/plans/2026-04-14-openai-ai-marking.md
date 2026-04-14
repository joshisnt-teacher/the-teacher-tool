# OpenAI AI Marking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add OpenAI-powered AI marking for exit ticket text responses, with API key stored securely in Supabase Vault, triggering both automatically on student submission and manually from the teacher's Responses tab.

**Architecture:** API key is encrypted at rest in Supabase Vault; `users.openai_vault_id` stores only the UUID reference. Two Edge Functions handle key storage (`save-openai-key`) and marking (`ai-mark-response`). Client-side hooks call these functions; keyword marking remains as fallback when no key is set.

**Tech Stack:** Supabase Edge Functions (Deno), Supabase Vault (pg_vault), OpenAI `gpt-4o-mini`, React + TanStack Query, TypeScript.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `supabase/migrations/20260415000001_add_ai_marking_fields.sql` | Create | New columns + vault wrapper SQL functions |
| `supabase/functions/save-openai-key/index.ts` | Create | Edge Function: store/delete API key in Vault |
| `supabase/functions/ai-mark-response/index.ts` | Create | Edge Function: call OpenAI, update scores + feedback |
| `src/integrations/supabase/types.ts` | Modify | Add new columns to generated types |
| `src/hooks/useQuestions.tsx` | Modify | Add `model_answer` to `Question` interface |
| `src/hooks/useAISettings.ts` | Create | Hooks for key status, save, remove |
| `src/hooks/useAIMarking.ts` | Create | Hook for triggering AI marking from teacher UI |
| `src/hooks/useSubmitExitTicket.ts` | Modify | Auto-call AI marking after submission |
| `src/pages/Settings.tsx` | Modify | Add AI Settings card |
| `src/pages/CreateExitTicket.tsx` | Modify | Add model answer textarea per question |
| `src/pages/AssessmentDetail.tsx` | Modify | AI feedback display + AI Mark All + Re-mark buttons |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260415000001_add_ai_marking_fields.sql`

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/20260415000001_add_ai_marking_fields.sql` with this exact content:

```sql
-- ============================================================
-- AI Marking: new columns and Vault wrapper functions
-- ============================================================

-- 1. Vault secret reference on users (stores UUID, not the key)
ALTER TABLE users ADD COLUMN IF NOT EXISTS openai_vault_id UUID DEFAULT NULL;

-- 2. Model answer teachers write for AI to mark against
ALTER TABLE questions ADD COLUMN IF NOT EXISTS model_answer TEXT DEFAULT NULL;

-- 3. AI-generated feedback stored per question result
ALTER TABLE question_results ADD COLUMN IF NOT EXISTS ai_feedback TEXT DEFAULT NULL;

-- ============================================================
-- Vault wrapper functions (SECURITY DEFINER so Edge Functions
-- can access vault schema through service_role)
-- ============================================================

-- Create or update a user's OpenAI API key in Vault
CREATE OR REPLACE FUNCTION public.upsert_openai_vault_secret(p_user_id uuid, p_secret text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_vault_id uuid;
BEGIN
  SELECT openai_vault_id INTO v_vault_id FROM users WHERE id = p_user_id;
  IF v_vault_id IS NOT NULL THEN
    PERFORM vault.update_secret(v_vault_id, p_secret);
    RETURN v_vault_id;
  ELSE
    v_vault_id := vault.create_secret(p_secret, 'openai_key_' || p_user_id::text);
    UPDATE users SET openai_vault_id = v_vault_id WHERE id = p_user_id;
    RETURN v_vault_id;
  END IF;
END;
$$;

-- Delete a user's OpenAI API key from Vault
CREATE OR REPLACE FUNCTION public.delete_openai_vault_secret(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_vault_id uuid;
BEGIN
  SELECT openai_vault_id INTO v_vault_id FROM users WHERE id = p_user_id;
  IF v_vault_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = v_vault_id;
    UPDATE users SET openai_vault_id = NULL WHERE id = p_user_id;
  END IF;
END;
$$;

-- Retrieve a decrypted secret by vault UUID (service_role only)
CREATE OR REPLACE FUNCTION public.get_decrypted_openai_key(p_vault_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE id = p_vault_id;
  RETURN v_secret;
END;
$$;

-- Restrict vault functions to service_role only (not anon/authenticated browser clients)
REVOKE EXECUTE ON FUNCTION public.upsert_openai_vault_secret(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_openai_vault_secret(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_decrypted_openai_key(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_openai_vault_secret(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_openai_vault_secret(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_decrypted_openai_key(uuid) TO service_role;
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the `mcp__plugin_supabase_supabase__apply_migration` tool with:
- `project_id`: `aogorchudxilnkhtfvqq`
- `name`: `add_ai_marking_fields`
- `query`: (content of the file above)

Expected: `{ "success": true }`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260415000001_add_ai_marking_fields.sql
git commit -m "feat: add AI marking columns and vault wrapper functions"
```

---

## Task 2: Update Supabase Types

**Files:**
- Modify: `src/integrations/supabase/types.ts`

- [ ] **Step 1: Add `openai_vault_id` to users Row/Insert/Update**

In the `users` table section, add to `Row`:
```ts
openai_vault_id: string | null
```
Add to `Insert`:
```ts
openai_vault_id?: string | null
```
Add to `Update`:
```ts
openai_vault_id?: string | null
```

- [ ] **Step 2: Add `model_answer` to questions Row/Insert/Update**

In the `questions` table section, add to `Row`:
```ts
model_answer: string | null
```
Add to `Insert`:
```ts
model_answer?: string | null
```
Add to `Update`:
```ts
model_answer?: string | null
```

- [ ] **Step 3: Add `ai_feedback` to question_results Row/Insert/Update**

In the `question_results` table section, add to `Row`:
```ts
ai_feedback: string | null
```
Add to `Insert`:
```ts
ai_feedback?: string | null
```
Add to `Update`:
```ts
ai_feedback?: string | null
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd c:/Users/joshu/CodingProjects/the-teacher-tool && npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors (or only pre-existing errors unrelated to these fields).

- [ ] **Step 5: Commit**

```bash
git add src/integrations/supabase/types.ts
git commit -m "feat: update supabase types for AI marking columns"
```

---

## Task 3: Update Question Interface

**Files:**
- Modify: `src/hooks/useQuestions.tsx`

- [ ] **Step 1: Add `model_answer` to the Question interface**

In `src/hooks/useQuestions.tsx`, update the `Question` interface (currently at line 5) to add:

```ts
export interface Question {
  id: string;
  task_id: string;
  number: number;
  question: string | null;
  max_score: number | null;
  question_type: string | null;
  content_item: string | null;
  general_capabilities: string[] | null;
  blooms_taxonomy: string | null;
  marking_criteria: Record<string, unknown> | null;
  model_answer: string | null;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd c:/Users/joshu/CodingProjects/the-teacher-tool && npx tsc --noEmit 2>&1 | head -30
```
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useQuestions.tsx
git commit -m "feat: add model_answer to Question interface"
```

---

## Task 4: save-openai-key Edge Function

**Files:**
- Create: `supabase/functions/save-openai-key/index.ts`

- [ ] **Step 1: Create the Edge Function**

Create `supabase/functions/save-openai-key/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Verify the user's JWT
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Admin client for vault operations
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const body = await req.json()

  // Handle key deletion
  if (body.action === 'delete') {
    const { error } = await supabaseAdmin.rpc('delete_openai_vault_secret', {
      p_user_id: user.id,
    })
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Handle key save
  const { apiKey } = body
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('sk-')) {
    return new Response(JSON.stringify({ error: 'Invalid API key format' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { error } = await supabaseAdmin.rpc('upsert_openai_vault_secret', {
    p_user_id: user.id,
    p_secret: apiKey,
  })
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
```

- [ ] **Step 2: Deploy the Edge Function**

Use `mcp__plugin_supabase_supabase__deploy_edge_function` with:
- `project_id`: `aogorchudxilnkhtfvqq`
- `name`: `save-openai-key`
- `entrypoint_path`: `supabase/functions/save-openai-key/index.ts`

Expected: successful deployment response.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/save-openai-key/index.ts
git commit -m "feat: add save-openai-key edge function"
```

---

## Task 5: ai-mark-response Edge Function

**Files:**
- Create: `supabase/functions/ai-mark-response/index.ts`

- [ ] **Step 1: Create the Edge Function**

Create `supabase/functions/ai-mark-response/index.ts`:

```typescript
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
      'You are a teacher\'s assistant marking a student\'s answer.',
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
```

- [ ] **Step 2: Deploy the Edge Function**

Use `mcp__plugin_supabase_supabase__deploy_edge_function` with:
- `project_id`: `aogorchudxilnkhtfvqq`
- `name`: `ai-mark-response`
- `entrypoint_path`: `supabase/functions/ai-mark-response/index.ts`

Expected: successful deployment response.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/ai-mark-response/index.ts
git commit -m "feat: add ai-mark-response edge function"
```

---

## Task 6: Client-Side AI Hooks

**Files:**
- Create: `src/hooks/useAISettings.ts`
- Create: `src/hooks/useAIMarking.ts`

- [ ] **Step 1: Create `src/hooks/useAISettings.ts`**

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Returns whether the current user has an API key saved
export const useOpenAIKeyStatus = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['openai-key-status', user?.id],
    queryFn: async () => {
      if (!user) return { hasKey: false };
      const { data } = await supabase
        .from('users')
        .select('openai_vault_id')
        .eq('id', user.id)
        .single();
      return { hasKey: !!data?.openai_vault_id };
    },
    enabled: !!user,
  });
};

// Saves a new or updated OpenAI API key to Vault
export const useSaveOpenAIKey = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (apiKey: string) => {
      const { error } = await supabase.functions.invoke('save-openai-key', {
        body: { apiKey },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openai-key-status', user?.id] });
      toast({ title: 'API key saved', description: 'Your OpenAI key is encrypted and stored securely.' });
    },
    onError: () => {
      toast({ title: 'Failed to save key', description: 'Check the key format and try again.', variant: 'destructive' });
    },
  });
};

// Removes the OpenAI API key from Vault
export const useRemoveOpenAIKey = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('save-openai-key', {
        body: { action: 'delete' },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openai-key-status', user?.id] });
      toast({ title: 'API key removed' });
    },
    onError: () => {
      toast({ title: 'Failed to remove key', variant: 'destructive' });
    },
  });
};
```

- [ ] **Step 2: Create `src/hooks/useAIMarking.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Calls the ai-mark-response Edge Function for teacher-triggered marking
export const useAIMarkResponses = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      questionResultIds,
      taskId,
    }: {
      questionResultIds: string[];
      taskId: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-mark-response', {
        body: { question_result_ids: questionResultIds, task_id: taskId },
      });
      if (error) throw error;
      return data as { success?: boolean; skipped?: boolean; reason?: string; marked?: { id: string; score: number; feedback: string }[] };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assessment-results', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['question-results', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['student-responses', variables.taskId] });
      if (data?.skipped) {
        toast({
          title: 'No API key set',
          description: 'Add your OpenAI key in Settings to use AI marking.',
        });
      } else {
        toast({
          title: 'AI marking complete',
          description: `Marked ${data?.marked?.length ?? 0} response${data?.marked?.length === 1 ? '' : 's'}.`,
        });
      }
    },
    onError: () => {
      toast({
        title: 'AI marking failed',
        description: 'Check your API key in Settings and try again.',
        variant: 'destructive',
      });
    },
  });
};
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd c:/Users/joshu/CodingProjects/the-teacher-tool && npx tsc --noEmit 2>&1 | head -30
```
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useAISettings.ts src/hooks/useAIMarking.ts
git commit -m "feat: add useAISettings and useAIMarking hooks"
```

---

## Task 7: Settings Page — AI Settings Card

**Files:**
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Add imports at the top of Settings.tsx**

Add to the existing import block:

```typescript
import { Eye, EyeOff, Bot } from 'lucide-react';
import { useOpenAIKeyStatus, useSaveOpenAIKey, useRemoveOpenAIKey } from '@/hooks/useAISettings';
```

- [ ] **Step 2: Add state and hooks inside the Settings component**

After the existing `const queryClient = useQueryClient();` line, add:

```typescript
const { data: keyStatus } = useOpenAIKeyStatus();
const saveKeyMutation = useSaveOpenAIKey();
const removeKeyMutation = useRemoveOpenAIKey();
const [apiKeyInput, setApiKeyInput] = useState('');
const [showKey, setShowKey] = useState(false);

const handleSaveKey = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!apiKeyInput.trim()) return;
  await saveKeyMutation.mutateAsync(apiKeyInput.trim());
  setApiKeyInput('');
};
```

- [ ] **Step 3: Add the AI Settings card to the JSX**

Inside the `<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">` (after the School Information card), add:

```tsx
{/* AI Settings */}
<Card className="bg-card/50 backdrop-blur-sm border-border/50">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Bot className="w-5 h-5" />
      AI Marking
    </CardTitle>
    <CardDescription>
      Add your OpenAI API key to enable AI-powered marking of student text responses.
      Your key is encrypted and never stored in plain text.
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Status:</span>
      {keyStatus?.hasKey ? (
        <span className="text-sm text-green-600 font-medium">Key saved</span>
      ) : (
        <span className="text-sm text-muted-foreground">No key set</span>
      )}
    </div>

    <form onSubmit={handleSaveKey} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="openai-key">OpenAI API Key</Label>
        <div className="relative">
          <Input
            id="openai-key"
            type={showKey ? 'text' : 'password'}
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="sk-..."
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Uses <strong>gpt-4o-mini</strong> — fractions of a cent per response.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={saveKeyMutation.isPending || !apiKeyInput.trim()}
        >
          {saveKeyMutation.isPending ? 'Saving...' : keyStatus?.hasKey ? 'Update Key' : 'Save Key'}
        </Button>
        {keyStatus?.hasKey && (
          <Button
            type="button"
            variant="outline"
            onClick={() => removeKeyMutation.mutate()}
            disabled={removeKeyMutation.isPending}
          >
            {removeKeyMutation.isPending ? 'Removing...' : 'Remove Key'}
          </Button>
        )}
      </div>
    </form>
  </CardContent>
</Card>
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd c:/Users/joshu/CodingProjects/the-teacher-tool && npx tsc --noEmit 2>&1 | head -30
```
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: add AI Settings card to Settings page"
```

---

## Task 8: Create Exit Ticket — Model Answer Field

**Files:**
- Modify: `src/pages/CreateExitTicket.tsx`

- [ ] **Step 1: Add `modelAnswer` to the QuestionDraft interface**

Find the `QuestionDraft` interface (around line 47) and add:

```typescript
interface QuestionDraft {
  id: string;
  text: string;
  type: QuestionType;
  maxScore: number;
  options: QuestionOptionDraft[];
  markingCriteria?: MarkingCriteria;
  modelAnswer?: string;
}
```

- [ ] **Step 2: Add the model answer textarea to the question editor JSX**

Find where `markingCriteria` UI is rendered for short/extended answer questions. This will be inside a condition like `{q.type !== 'multiple_choice' && (...)`. After the existing marking criteria section (keyword inputs), add:

```tsx
<div className="space-y-2 mt-3">
  <Label className="text-sm font-medium">Model Answer (for AI marking)</Label>
  <Textarea
    value={q.modelAnswer || ''}
    onChange={(e) => updateQuestion(q.id, { modelAnswer: e.target.value })}
    placeholder="Write what a full-marks answer looks like. The AI uses this as its marking guide."
    rows={3}
    className="text-sm resize-none"
  />
  <p className="text-xs text-muted-foreground">Optional — AI will still mark without it, just less accurately.</p>
</div>
```

- [ ] **Step 3: Persist `model_answer` to the database on save**

Find the section in the save handler where questions are inserted/upserted into the `questions` table. It will look like:
```typescript
await supabase.from('questions').upsert({ ... })
```

Add `model_answer: q.modelAnswer || null` to the upsert object alongside the other fields.

- [ ] **Step 4: Load `model_answer` when editing an existing exit ticket**

Find where existing questions are loaded from the database and mapped to `QuestionDraft` objects. Add:
```typescript
modelAnswer: q.model_answer ?? undefined,
```
to the mapping so the field is pre-filled when editing.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd c:/Users/joshu/CodingProjects/the-teacher-tool && npx tsc --noEmit 2>&1 | head -30
```
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/CreateExitTicket.tsx
git commit -m "feat: add model answer field to exit ticket question editor"
```

---

## Task 9: Auto AI Marking on Submission

**Files:**
- Modify: `src/hooks/useSubmitExitTicket.ts`

- [ ] **Step 1: Change question_results insert to return IDs**

Find the insert block:
```typescript
const { error: qrError } = await supabase
  .from('question_results')
  .insert(questionResultInserts);
if (qrError) throw qrError;
```

Replace with:
```typescript
const { data: insertedQRs, error: qrError } = await supabase
  .from('question_results')
  .insert(questionResultInserts)
  .select('id, question_id');
if (qrError) throw qrError;
```

- [ ] **Step 2: Return inserted IDs and task ID from mutationFn**

Change the return statement at the end of `mutationFn` from:
```typescript
return { taskId, studentId };
```
to:
```typescript
const textAnswerQRIds = (insertedQRs ?? [])
  .filter((qr) => {
    const answer = answers.find((a) => a.questionId === qr.question_id);
    return answer && answer.questionType !== 'multiple_choice';
  })
  .map((qr) => qr.id);

return { taskId, studentId, textAnswerQRIds };
```

- [ ] **Step 3: Call AI marking in onSuccess**

In the `onSuccess` callback, after the existing `queryClient.invalidateQueries` calls, add:

```typescript
// Trigger AI marking for text answers (fire-and-forget — failure is non-blocking)
if (data.textAnswerQRIds.length > 0) {
  supabase.functions.invoke('ai-mark-response', {
    body: { question_result_ids: data.textAnswerQRIds, task_id: data.taskId },
  }).then(({ error }) => {
    if (error) console.error('AI marking failed silently:', error);
  });
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd c:/Users/joshu/CodingProjects/the-teacher-tool && npx tsc --noEmit 2>&1 | head -30
```
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useSubmitExitTicket.ts
git commit -m "feat: auto-trigger AI marking after exit ticket submission"
```

---

## Task 10: Assessment Detail — AI Feedback + Manual Marking

**Files:**
- Modify: `src/pages/AssessmentDetail.tsx`

- [ ] **Step 1: Add imports**

Add to the existing imports at the top of the file (alongside `Pencil, Plus, Trash2, X`):

```typescript
import { Bot, RefreshCw } from 'lucide-react';
import { useAIMarkResponses } from '@/hooks/useAIMarking';
import { useOpenAIKeyStatus } from '@/hooks/useAISettings';
```

- [ ] **Step 2: Add hooks inside AssessmentDetail component**

After the existing line `const { updateQuestionResult } = useQuestionResultMutations();` (or near the other hook calls at the top), add:

```typescript
const aiMarkMutation = useAIMarkResponses();
const { data: keyStatus } = useOpenAIKeyStatus();
```

- [ ] **Step 3: Add `ai_feedback` to the questionResults query**

The existing `questionResults` query (around line 155) selects these fields:
```
id, question_id, student_id, raw_score, percent_score, response_data
```

Add `ai_feedback` to the `.select()` call:

```typescript
const { data: questionResults = [], refetch: refetchQuestionResults } = useQuery({
  queryKey: ['assessment-question-results', assessmentId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('question_results')
      .select(`
        id,
        question_id,
        student_id,
        raw_score,
        percent_score,
        response_data,
        ai_feedback,
        students!inner (
          first_name,
          last_name
        )
      `)
      .in('question_id', questions.map((q: any) => q.id));
    if (error) throw error;
    return (data || []).map((r: any) => ({
      ...r,
      first_name: r.students?.first_name || 'Unknown',
      last_name: r.students?.last_name || 'Student',
    }));
  },
  enabled: !!assessmentId && !!assessment?.is_exit_ticket && questions.length > 0,
});
```

- [ ] **Step 4: Add "AI Mark All" button next to the "Edit Marks" button**

The Responses tab card header (around line 969) currently has:
```tsx
<CardHeader className="flex flex-row items-center justify-between">
  <CardTitle>Student Responses</CardTitle>
  {!editingResponses ? (
    <Button variant="outline" size="sm" onClick={startEditingResponses}>
      <Pencil className="w-4 h-4 mr-2" />
      Edit Marks
    </Button>
  ) : ( ... )}
</CardHeader>
```

Replace the `{!editingResponses ? ...}` block with:

```tsx
{!editingResponses ? (
  <div className="flex items-center gap-2">
    {keyStatus?.hasKey && (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const textQRIds = (questionResults as any[])
            .filter((qr) => {
              const q = questions.find((q: any) => q.id === qr.question_id);
              return q && q.question_type !== 'multiple_choice';
            })
            .map((qr: any) => qr.id);
          if (textQRIds.length > 0) {
            aiMarkMutation.mutate({ questionResultIds: textQRIds, taskId: assessmentId! });
          }
        }}
        disabled={aiMarkMutation.isPending}
      >
        {aiMarkMutation.isPending ? (
          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Marking…</>
        ) : (
          <><Bot className="w-4 h-4 mr-2" />AI Mark All</>
        )}
      </Button>
    )}
    <Button variant="outline" size="sm" onClick={startEditingResponses}>
      <Pencil className="w-4 h-4 mr-2" />
      Edit Marks
    </Button>
  </div>
) : (
  <div className="flex items-center gap-2">
    <Button variant="ghost" size="sm" onClick={cancelEditingResponses} disabled={isSavingResponses}>
      <X className="w-4 h-4 mr-2" />
      Cancel
    </Button>
    <Button size="sm" onClick={saveResponses} disabled={isSavingResponses}>
      {isSavingResponses ? 'Saving…' : 'Save Changes'}
    </Button>
  </div>
)}
```

- [ ] **Step 5: Show AI feedback and Re-mark button inside each cell**

The inner cell render (around line 1028) currently has this structure inside `<div className="space-y-1">`:
```tsx
<div className="text-muted-foreground whitespace-pre-wrap max-w-xs">
  {answerDisplay}
</div>
{!editingResponses ? (
  <Badge variant="secondary" className="text-xs">
    {qr?.raw_score != null ? `${qr.raw_score}/${q.max_score}` : '-'}
  </Badge>
) : ( ... input ... )}
```

Replace the `{!editingResponses ? ... }` block with:

```tsx
{(qr as any)?.ai_feedback && !isMC && (
  <p className="text-xs text-muted-foreground italic">
    AI: {(qr as any).ai_feedback}
  </p>
)}
{!editingResponses ? (
  <div className="flex items-center gap-1">
    <Badge variant="secondary" className="text-xs">
      {qr?.raw_score != null ? `${qr.raw_score}/${q.max_score}` : '-'}
    </Badge>
    {keyStatus?.hasKey && !isMC && qr && (
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5"
        title="Re-mark with AI"
        onClick={() => aiMarkMutation.mutate({ questionResultIds: [(qr as any).id], taskId: assessmentId! })}
        disabled={aiMarkMutation.isPending}
      >
        <Bot className="w-3 h-3" />
      </Button>
    )}
  </div>
) : (
  <div className="flex items-center gap-2">
    <Input
      type="number"
      min={0}
      className="w-20 h-7 text-xs"
      value={responseEditValues[(qr as any)?.id] ?? (qr?.raw_score != null ? String(qr.raw_score) : '')}
      onChange={(e) => qr && handleResponseScoreChange((qr as any).id, e.target.value)}
      disabled={!qr}
    />
    <span className="text-xs text-muted-foreground">/ {q.max_score}</span>
  </div>
)}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd c:/Users/joshu/CodingProjects/the-teacher-tool && npx tsc --noEmit 2>&1 | head -30
```
Expected: no new errors.

- [ ] **Step 7: Start dev server and manually verify the Responses tab**

```bash
npm run dev
```

Open an exit ticket's Assessment Detail page. Confirm:
- "AI Mark All" button appears when key is set
- AI feedback shows in italic beneath text answers after marking
- Re-mark bot icon appears on each text-answer cell

- [ ] **Step 8: Commit**

```bash
git add src/pages/AssessmentDetail.tsx
git commit -m "feat: add AI feedback display and AI Mark All to Responses tab"
```

---

## Task 11: Final Build Check

- [ ] **Step 1: Run a clean production build**

```bash
cd c:/Users/joshu/CodingProjects/the-teacher-tool && npm run build 2>&1 | tail -20
```
Expected: `✓ built in X.Xs` with no errors.

- [ ] **Step 2: Manual smoke test checklist**

1. Go to **Settings** → verify AI Settings card appears with "No key set" status
2. Enter a valid OpenAI key (`sk-...`) → click Save Key → verify "Key saved" status
3. Open an exit ticket in **Create Exit Ticket** → add a short answer question → verify "Model Answer" textarea appears
4. As a student, submit the exit ticket with a text answer → check AssessmentDetail Responses tab → AI feedback should appear within ~5 seconds
5. In the Responses tab, click **AI Mark All** → verify loading spinner, then scores update
6. Click the **Re-mark** button on a single response → verify it re-runs for just that row
7. Go back to Settings → click **Remove Key** → verify status returns to "No key set"
8. Submit another exit ticket → confirm keyword marking still applies (no AI call)

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: AI marking with OpenAI gpt-4o-mini and Supabase Vault key storage"
```
