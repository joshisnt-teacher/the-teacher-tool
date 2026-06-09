# Claude Global AI Key Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace per-user OpenAI API keys in Pulse with a single platform-level Anthropic (Claude) key gated against per-teacher monthly AI quotas in the central `edufied-auth` database.

**Architecture:** Each AI edge function resolves the calling teacher's `central_teacher_id` from `teacher_profiles`, calls the `check_and_record_ai_action` RPC on the central DB (atomic quota check + insert in one round-trip), then calls the Anthropic API using the `ANTHROPIC_API_KEY` edge function secret. The frontend removes the OpenAI key UI and adds a read-only AI Usage card showing `used / cap` for the teacher's plan.

**Tech Stack:** Supabase Edge Functions (Deno), `@anthropic-ai/sdk` via esm.sh, React + TanStack Query, `centralSupabase` client from `src/integrations/supabase/centralClient.ts`

---

## Prerequisites (already done)

- [x] Central DB RPC `check_and_record_ai_action` applied to production
- [x] `ANTHROPIC_API_KEY` secret deployed to Pulse edge functions (project ref `aogorchudxilnkhtfvqq`)
- [x] `CENTRAL_SUPABASE_URL` and `CENTRAL_SUPABASE_SERVICE_ROLE_KEY` already deployed as secrets

---

## File Map

| File | Change |
|---|---|
| `supabase/functions/generate-exit-ticket/index.ts` | Replace OpenAI with Anthropic + quota check |
| `supabase/functions/ai-mark-response/index.ts` | Replace OpenAI with Anthropic + quota check |
| `supabase/functions/ai-class-actions/index.ts` | Replace OpenAI with Anthropic + quota check |
| `src/hooks/useAIUsage.ts` | Create — reads monthly usage from central DB |
| `src/hooks/useAISettings.ts` | Delete |
| `src/hooks/useAIGenerateExitTicket.ts` | Update `onError` to handle `quota_exceeded` |
| `src/pages/CreateExitTicket.tsx` | Remove `openAIStatus` guard (3 locations) |
| `src/pages/Settings.tsx` | Replace OpenAI key card with AI Usage card |

---

### Task 1: Update `generate-exit-ticket` edge function

**Files:**
- Modify: `supabase/functions/generate-exit-ticket/index.ts`

This function makes two Claude calls (Pass 1: generate questions, Pass 2: map curriculum). Quota is checked and recorded **once** before Pass 1 — both passes count as a single action.

- [ ] **Step 1: Replace OpenAI import with Anthropic**

In `supabase/functions/generate-exit-ticket/index.ts`, change line 2:

```typescript
// REMOVE:
import OpenAI from 'https://esm.sh/openai@4'

// ADD:
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk'
```

- [ ] **Step 2: Add `centralAdmin` client**

Immediately after the `supabaseAdmin` client creation (after line 47, before the `let body` line), add:

```typescript
const centralAdmin = createClient(
  Deno.env.get('CENTRAL_SUPABASE_URL')!,
  Deno.env.get('CENTRAL_SUPABASE_SERVICE_ROLE_KEY')!,
)
```

- [ ] **Step 3: Replace vault key lookup with teacher_profiles + quota check**

Remove lines 109–132 (the entire `userData` + vault section):

```typescript
// REMOVE this entire block:
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
```

Replace with:

```typescript
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
```

- [ ] **Step 4: Replace OpenAI instantiation with Anthropic**

Find `const openai = new OpenAI({ apiKey })` (line 189) and replace:

```typescript
// REMOVE:
const openai = new OpenAI({ apiKey })

// ADD:
const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
```

- [ ] **Step 5: Replace Pass 1 OpenAI call with Anthropic**

Find the Pass 1 `try` block (lines 287–299):

```typescript
// REMOVE:
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
```

Replace with:

```typescript
let rawPass1: string
try {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: 'Respond with valid JSON only. No markdown, no code blocks.',
    messages: [{ role: 'user', content: pass1Lines.join('\n') }],
  })
  rawPass1 = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
} catch (e: any) {
  return new Response(
    JSON.stringify({ error: 'ai_error', message: e?.message || 'AI request failed' }),
    { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
```

- [ ] **Step 6: Fix the parse_error message (line ~305)**

```typescript
// CHANGE:
JSON.stringify({ error: 'parse_error', message: 'OpenAI returned invalid JSON.' }),

// TO:
JSON.stringify({ error: 'parse_error', message: 'AI returned invalid JSON.' }),
```

- [ ] **Step 7: Fix the generation_failed message (line ~410)**

```typescript
// CHANGE:
JSON.stringify({ error: 'generation_failed', message: 'OpenAI did not return any valid questions.' }),

// TO:
JSON.stringify({ error: 'generation_failed', message: 'AI did not return any valid questions.' }),
```

- [ ] **Step 8: Replace Pass 2 OpenAI call with Anthropic**

Find the Pass 2 `try` block inside the `if (contentItems.length > 0)` block (lines 447–455):

```typescript
// REMOVE:
const pass2Completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: pass2Lines.join('\n') }],
  response_format: { type: 'json_object' },
})

const pass2Raw = pass2Completion.choices[0].message.content ?? '{}'
```

Replace with:

```typescript
const pass2Msg = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 1024,
  system: 'Respond with valid JSON only. No markdown, no code blocks.',
  messages: [{ role: 'user', content: pass2Lines.join('\n') }],
})
const pass2Raw = pass2Msg.content[0].type === 'text' ? pass2Msg.content[0].text : '{}'
```

- [ ] **Step 9: Commit**

```bash
cd C:\Users\joshu\CodingProjects\Edufied\the-teacher-tool
git add supabase/functions/generate-exit-ticket/index.ts
git commit -m "feat(pulse): migrate generate-exit-ticket from OpenAI to Claude + quota check"
```

---

### Task 2: Update `ai-mark-response` edge function

**Files:**
- Modify: `supabase/functions/ai-mark-response/index.ts`

This function marks per-question written answers in a loop. `marking_harshness` is still read from `users` — only `openai_vault_id` is removed from that query. Quota is checked once before the marking loop.

- [ ] **Step 1: Replace OpenAI import with Anthropic**

Line 2:

```typescript
// REMOVE:
import OpenAI from 'https://esm.sh/openai@4'

// ADD:
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk'
```

- [ ] **Step 2: Add `centralAdmin` client**

Immediately after `supabaseAdmin` creation (after line 27):

```typescript
const centralAdmin = createClient(
  Deno.env.get('CENTRAL_SUPABASE_URL')!,
  Deno.env.get('CENTRAL_SUPABASE_SERVICE_ROLE_KEY')!,
)
```

- [ ] **Step 3: Replace vault lookup with teacher_profiles + quota check**

Remove lines 65–88 (the `userData` + vault block):

```typescript
// REMOVE:
const { data: userData } = await supabaseAdmin
  .from('users')
  .select('openai_vault_id, marking_harshness')
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
```

Replace with:

```typescript
// Keep marking_harshness for prompt calibration (remove only openai_vault_id from select)
const { data: userData } = await supabaseAdmin
  .from('users')
  .select('marking_harshness')
  .eq('id', cls.teacher_id)
  .single()

// Look up central_teacher_id
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

// Quota check — counts the whole batch as one action
const { data: quota } = await centralAdmin.rpc('check_and_record_ai_action', {
  p_teacher_id: profile.central_teacher_id,
  p_app_slug: 'pulse',
  p_action_type: 'mark_response',
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
```

- [ ] **Step 4: Replace OpenAI instantiation**

Find `const openai = new OpenAI({ apiKey })` (line 90):

```typescript
// REMOVE:
const openai = new OpenAI({ apiKey })

// ADD:
const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
```

- [ ] **Step 5: Replace the per-question OpenAI call with Anthropic**

Find the `try` block inside the `for (const qrId of question_result_ids)` loop (lines 179–185):

```typescript
// REMOVE:
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: promptLines.join('\n') }],
  response_format: { type: 'json_object' },
})
const parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
```

Replace with:

```typescript
const msg = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 512,
  system: 'Respond with valid JSON only. No markdown, no code blocks.',
  messages: [{ role: 'user', content: promptLines.join('\n') }],
})
const parsed = JSON.parse(msg.content[0].type === 'text' ? msg.content[0].text : '{}')
```

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/ai-mark-response/index.ts
git commit -m "feat(pulse): migrate ai-mark-response from OpenAI to Claude + quota check"
```

---

### Task 3: Update `ai-class-actions` edge function

**Files:**
- Modify: `supabase/functions/ai-class-actions/index.ts`

This function handles three action types: `class_analysis`, `student_feedback`, `struggling_students`. The `action_type` from the request body is used directly as `p_action_type` in the quota RPC (these strings are already appropriate action names). `marking_harshness` is still needed for `student_feedback` prompts.

- [ ] **Step 1: Replace OpenAI import with Anthropic**

Line 2:

```typescript
// REMOVE:
import OpenAI from 'https://esm.sh/openai@4'

// ADD:
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk'
```

- [ ] **Step 2: Add `centralAdmin` client**

Immediately after `supabaseAdmin` creation (after line 29):

```typescript
const centralAdmin = createClient(
  Deno.env.get('CENTRAL_SUPABASE_URL')!,
  Deno.env.get('CENTRAL_SUPABASE_SERVICE_ROLE_KEY')!,
)
```

- [ ] **Step 3: Replace vault lookup with teacher_profiles + quota check**

Remove lines 65–85 (the `userData` + vault block):

```typescript
// REMOVE:
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
```

Replace with:

```typescript
// Keep marking_harshness for student_feedback prompt calibration
const { data: userData } = await supabaseAdmin
  .from('users')
  .select('marking_harshness')
  .eq('id', cls.teacher_id)
  .single()

// Look up central_teacher_id
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

// action_type from request body (class_analysis / student_feedback / struggling_students)
// is used directly as p_action_type for fine-grained quota tracking
const { data: quota } = await centralAdmin.rpc('check_and_record_ai_action', {
  p_teacher_id: profile.central_teacher_id,
  p_app_slug: 'pulse',
  p_action_type: action_type,
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
```

- [ ] **Step 4: Replace OpenAI instantiation**

Find `const openai = new OpenAI({ apiKey })` (line 87):

```typescript
// REMOVE:
const openai = new OpenAI({ apiKey })

// ADD:
const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
```

- [ ] **Step 5: Replace `class_analysis` OpenAI call**

Find inside `if (action_type === 'class_analysis')` (around line 188):

```typescript
// REMOVE:
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: prompt }],
  response_format: { type: 'json_object' },
})
outputJson = JSON.parse(completion.choices[0].message.content ?? '{}')
```

Replace with:

```typescript
const msg = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 1024,
  system: 'Respond with valid JSON only. No markdown, no code blocks.',
  messages: [{ role: 'user', content: prompt }],
})
outputJson = JSON.parse(msg.content[0].type === 'text' ? msg.content[0].text : '{}')
```

- [ ] **Step 6: Replace `student_feedback` OpenAI call**

Find inside the `for (const s of Object.values(studentResponses))` loop in the `student_feedback` branch (around lines 220–226):

```typescript
// REMOVE:
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: prompt }],
  response_format: { type: 'json_object' },
})
const parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
```

Replace with:

```typescript
const msg = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 512,
  system: 'Respond with valid JSON only. No markdown, no code blocks.',
  messages: [{ role: 'user', content: prompt }],
})
const parsed = JSON.parse(msg.content[0].type === 'text' ? msg.content[0].text : '{}')
```

- [ ] **Step 7: Replace `struggling_students` OpenAI call**

Find inside the `else` (struggling_students) branch, inside its `for` loop `try` block (around lines 277–283):

```typescript
// REMOVE:
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: prompt }],
  response_format: { type: 'json_object' },
})
const parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
```

Replace with:

```typescript
const msg = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 256,
  system: 'Respond with valid JSON only. No markdown, no code blocks.',
  messages: [{ role: 'user', content: prompt }],
})
const parsed = JSON.parse(msg.content[0].type === 'text' ? msg.content[0].text : '{}')
```

- [ ] **Step 8: Commit**

```bash
git add supabase/functions/ai-class-actions/index.ts
git commit -m "feat(pulse): migrate ai-class-actions from OpenAI to Claude + quota check"
```

---

### Task 4: Deploy the three edge functions

**Files:** None — deployment step only.

- [ ] **Step 1: Deploy `generate-exit-ticket`**

```bash
cd C:\Users\joshu\CodingProjects\Edufied\the-teacher-tool
npx supabase functions deploy generate-exit-ticket --project-ref aogorchudxilnkhtfvqq
```

Expected output contains: `Deployed Function generate-exit-ticket`

- [ ] **Step 2: Deploy `ai-mark-response`**

```bash
npx supabase functions deploy ai-mark-response --project-ref aogorchudxilnkhtfvqq
```

Expected output contains: `Deployed Function ai-mark-response`

- [ ] **Step 3: Deploy `ai-class-actions`**

```bash
npx supabase functions deploy ai-class-actions --project-ref aogorchudxilnkhtfvqq
```

Expected output contains: `Deployed Function ai-class-actions`

---

### Task 5: Create `useAIUsage.ts` hook

**Files:**
- Create: `src/hooks/useAIUsage.ts`

Reads `central_teacher_id` from local `teacher_profiles`, then queries the central DB for this month's action count, the teacher's subscription plan, and the platform caps. Three central DB queries run in parallel.

- [ ] **Step 1: Create the file**

Create `src/hooks/useAIUsage.ts` with this content:

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { centralSupabase } from '@/integrations/supabase/centralClient';
import { useAuth } from '@/hooks/useAuth';

export interface AIUsage {
  used: number;
  cap: number;
  plan: string;
}

export const useAIUsage = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-usage', user?.id],
    queryFn: async (): Promise<AIUsage> => {
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('teacher_profiles')
        .select('central_teacher_id')
        .eq('id', user.id)
        .single();

      if (!profile?.central_teacher_id) {
        // Teacher hasn't SSO'd yet — return free defaults
        return { used: 0, cap: 75, plan: 'free' };
      }

      const centralTeacherId = profile.central_teacher_id;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [usageResult, subResult, configResult] = await Promise.all([
        centralSupabase
          .from('ai_actions')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', centralTeacherId)
          .gte('created_at', startOfMonth),
        centralSupabase
          .from('subscriptions')
          .select('plan')
          .eq('teacher_id', centralTeacherId)
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: false })
          .limit(1),
        centralSupabase
          .from('platform_config')
          .select('free_ai_actions_per_month, pro_ai_actions_per_month')
          .single(),
      ]);

      const used = usageResult.count ?? 0;
      const plan = subResult.data?.[0]?.plan ?? 'free';
      const cfg = configResult.data;
      const cap = (plan === 'pro' || plan === 'school')
        ? (cfg?.pro_ai_actions_per_month ?? 1500)
        : (cfg?.free_ai_actions_per_month ?? 75);

      return { used, cap, plan };
    },
    enabled: !!user,
    staleTime: 30_000,
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAIUsage.ts
git commit -m "feat(pulse): add useAIUsage hook to read monthly AI quota from central DB"
```

---

### Task 6: Delete `useAISettings.ts`

**Files:**
- Delete: `src/hooks/useAISettings.ts`

- [ ] **Step 1: Delete the file via git**

```bash
cd C:\Users\joshu\CodingProjects\Edufied\the-teacher-tool
git rm src/hooks/useAISettings.ts
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(pulse): remove per-user OpenAI key hooks (useAISettings.ts)"
```

---

### Task 7: Update `useAIGenerateExitTicket.ts` error handling

**Files:**
- Modify: `src/hooks/useAIGenerateExitTicket.ts`

When `supabase.functions.invoke` receives a non-2xx response, the parsed JSON body is available on `error.context`. Check for `error: 'quota_exceeded'` and show a distinct upgrade-nudging toast.

- [ ] **Step 1: Replace the `onError` handler (lines 53–60)**

```typescript
// REMOVE:
onError: (error: unknown) => {
  const msg = error instanceof Error ? error.message : (error as { message?: string })?.message;
  toast({
    title: 'Generation failed',
    description: msg || 'Check your OpenAI API key in Settings and try again.',
    variant: 'destructive',
  });
},
```

Replace with:

```typescript
onError: (error: unknown) => {
  // FunctionsHttpError from supabase.functions.invoke has the parsed response body at .context
  const body = (error as any)?.context ?? (error as any);
  if (body?.error === 'quota_exceeded') {
    toast({
      title: 'AI limit reached',
      description: body?.message ?? 'Upgrade to Pro for more AI actions.',
      variant: 'destructive',
    });
  } else {
    const msg = error instanceof Error ? error.message : (error as { message?: string })?.message;
    toast({
      title: 'Generation failed',
      description: msg || 'Something went wrong. Please try again.',
      variant: 'destructive',
    });
  }
},
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAIGenerateExitTicket.ts
git commit -m "feat(pulse): surface quota_exceeded error in exit ticket generation"
```

---

### Task 8: Update `CreateExitTicket.tsx` — remove OpenAI guard

**Files:**
- Modify: `src/pages/CreateExitTicket.tsx`

Three removals: import, hook call, warning banner, and two guard conditions.

- [ ] **Step 1: Remove the `useOpenAIKeyStatus` import (line 27)**

```typescript
// REMOVE:
import { useOpenAIKeyStatus } from '@/hooks/useAISettings';
```

- [ ] **Step 2: Remove the hook call (line 80)**

```typescript
// REMOVE:
const { data: openAIStatus } = useOpenAIKeyStatus();
```

- [ ] **Step 3: Remove the `handleGenerate` early-return guard (line 301)**

```typescript
// REMOVE this line inside handleGenerate:
if (!openAIStatus?.hasKey) { toast({ title: 'No OpenAI key', description: 'Add your key in Settings.', variant: 'destructive' }); return; }
```

- [ ] **Step 4: Remove the "no key" warning banner (lines 391–395)**

```tsx
// REMOVE:
{!openAIStatus?.hasKey && (
  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
    No OpenAI API key found. Add your key in Settings to use AI generation.
  </div>
)}
```

- [ ] **Step 5: Remove `!openAIStatus?.hasKey` from Generate button disabled prop (line 457)**

```tsx
// CHANGE:
<Button onClick={handleGenerate} disabled={isBusy || !openAIStatus?.hasKey || !aiContextClassId || !aiPrompt.trim()}>

// TO:
<Button onClick={handleGenerate} disabled={isBusy || !aiContextClassId || !aiPrompt.trim()}>
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/CreateExitTicket.tsx
git commit -m "feat(pulse): remove OpenAI key guard from exit ticket AI panel"
```

---

### Task 9: Update `Settings.tsx` — replace OpenAI key card with AI Usage card

**Files:**
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Replace `useAISettings` import with `useAIUsage`**

Line 15:

```typescript
// REMOVE:
import { useOpenAIKeyStatus, useSaveOpenAIKey, useRemoveOpenAIKey } from '@/hooks/useAISettings';

// ADD:
import { useAIUsage } from '@/hooks/useAIUsage';
```

- [ ] **Step 2: Remove unused icon imports (`Eye`, `EyeOff`)**

```typescript
// CHANGE:
import {
  ArrowLeft, Upload, User, School, Plus, Bot,
  Eye, EyeOff, Lock, Palette, Sun, Moon, Monitor,
} from 'lucide-react';

// TO:
import {
  ArrowLeft, Upload, User, School, Plus, Bot,
  Lock, Palette, Sun, Moon, Monitor,
} from 'lucide-react';
```

- [ ] **Step 3: Replace hook calls (lines 42–44)**

```typescript
// REMOVE:
const { data: keyStatus } = useOpenAIKeyStatus();
const saveKeyMutation = useSaveOpenAIKey();
const removeKeyMutation = useRemoveOpenAIKey();

// ADD:
const aiUsage = useAIUsage();
```

- [ ] **Step 4: Remove AI key state (lines 57–58)**

```typescript
// REMOVE:
const [apiKeyInput, setApiKeyInput] = useState('');
const [showKey, setShowKey] = useState(false);
```

- [ ] **Step 5: Remove `handleSaveKey` function (lines 189–194)**

```typescript
// REMOVE:
const handleSaveKey = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!apiKeyInput.trim()) return;
  await saveKeyMutation.mutateAsync(apiKeyInput.trim());
  setApiKeyInput('');
};
```

- [ ] **Step 6: Replace the AI Settings card JSX**

Find the entire `{/* AI SETTINGS */}` section (lines 518–612 — from `<div id="ai"` to the closing `</div>` that wraps the Card). Replace the entire block with:

```tsx
{/* AI SETTINGS */}
<div id="ai" ref={aiRef} className="scroll-mt-16">
  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Bot className="w-5 h-5" />
        AI Settings
      </CardTitle>
      <CardDescription>
        Your monthly AI action usage and marking preferences.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {aiUsage.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading usage...</p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {aiUsage.data?.used ?? 0} / {aiUsage.data?.cap ?? 75} actions used this month
            </span>
            <span className="text-muted-foreground capitalize">
              {aiUsage.data?.plan ?? 'free'} plan
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{
                width: `${Math.min(100, ((aiUsage.data?.used ?? 0) / (aiUsage.data?.cap ?? 75)) * 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Resets on the 1st of each month.</p>
          {aiUsage.data?.plan === 'free' && (
            <div className="mt-3 rounded-md bg-muted/50 border p-3 space-y-1">
              <p className="text-sm font-medium">Upgrade to Pro for 1,500 actions/month</p>
              <p className="text-xs text-muted-foreground">
                Free plan includes 75 AI actions per month.
              </p>
              <a
                href="https://edufied.com.au/pricing"
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-2"
              >
                <Button variant="outline" size="sm">View Plans</Button>
              </a>
            </div>
          )}
        </div>
      )}

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
            onValueChange={handleHarshnessChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground px-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat(pulse): replace OpenAI key UI with AI Usage card in Settings"
```

---

### Task 10: Type-check and deploy frontend

- [ ] **Step 1: Run TypeScript check**

```bash
cd C:\Users\joshu\CodingProjects\Edufied\the-teacher-tool
npx tsc --noEmit
```

Expected: no errors. Common issues to look for:
- Any remaining reference to `openAIStatus` or `useOpenAIKeyStatus` (grep for them if tsc reports a missing import)
- Missing `AIUsage` type (should be exported from `useAIUsage.ts`)

- [ ] **Step 2: Push to trigger deploy**

```bash
git push
```

If Netlify/CI is set up for auto-deploy, this will trigger a production build. Otherwise deploy manually via the Netlify CLI or Supabase hosting.

---

## Self-Review

**Spec coverage check:**
- ✅ `generate-exit-ticket`: OpenAI → Claude, quota check before Pass 1 only (both passes = 1 action)
- ✅ `ai-mark-response`: OpenAI → Claude, `marking_harshness` query kept, quota check added
- ✅ `ai-class-actions`: OpenAI → Claude, `action_type` from request body used as `p_action_type`
- ✅ Edge function deployment tasks included
- ✅ `useAIUsage.ts` created with correct central DB queries
- ✅ `useAISettings.ts` deleted
- ✅ `useAIGenerateExitTicket.ts` `onError` handles `quota_exceeded` with distinct toast
- ✅ `CreateExitTicket.tsx` guard removed from `handleGenerate`, warning banner, and button
- ✅ `Settings.tsx` OpenAI card replaced with AI Usage card + Marking Harshness retained
- ✅ TypeScript build check included before deploy

**Type consistency:**
- `AIUsage` interface defined in Task 5, consumed as `aiUsage.data` in Task 9 (`.used`, `.cap`, `.plan` — consistent)
- `centralAdmin` created in each edge function with same pattern — consistent across Tasks 1–3
- `p_action_type` values: `generate_exit_ticket`, `mark_response`, and pass-through `action_type` — consistent with spec table

**No placeholders:** All code blocks are complete and ready to paste.
