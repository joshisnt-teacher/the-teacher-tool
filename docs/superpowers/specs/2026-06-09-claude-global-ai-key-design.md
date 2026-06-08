# Claude Global AI Key — Design Spec
**Date:** 2026-06-09  
**Scope:** Pulse (`the-teacher-tool`) + central DB (`edufied.com.au`)  
**Status:** Approved, ready for implementation

---

## Problem

Pulse's AI features (exit ticket generation, AI marking, class analysis) require each teacher to supply and manage their own OpenAI API key. This is broken in production (key expired/revoked) and blocks the quota-gating system needed for Phase 2 billing.

## Solution

Replace per-user OpenAI keys with a single platform-level Anthropic (Claude) API key stored as an edge function secret. All AI calls go through this key. Usage is tracked per teacher in the central DB and gated against their subscription plan.

---

## Architecture

```
Teacher clicks "Generate" / "AI Mark" / "Class Analysis"
        │
        ▼
Pulse Edge Function
  1. Resolve class → teacher_id (local)
  2. Look up teacher_profiles.central_teacher_id
  3. Call check_and_record_ai_action() on central DB
        │
        ├── quota exceeded → 429 (stop)
        │
        └── allowed → record action, continue
  4. Call Claude API (ANTHROPIC_API_KEY secret)
  5. Return result to client
```

**Model:** `claude-haiku-4-5-20251001` — fast, cost-effective, comparable to gpt-4o-mini

---

## Part 1 — Central DB Migration (edufied.com.au)

**File:** `supabase/migrations/20260609000000_check_and_record_ai_action.sql`

New RPC `check_and_record_ai_action(p_teacher_id, p_app_slug, p_action_type)`:
- Reads teacher's plan from `subscriptions` (defaults `'free'` if no active subscription)
- Reads caps from `platform_config` (`free_ai_actions_per_month`, `pro_ai_actions_per_month`)
- Counts `ai_actions` for this teacher since start of current calendar month
- If `used >= cap`: returns `{ allowed: false, used, cap, plan }` — does NOT insert
- If under cap: inserts into `ai_actions`, returns `{ allowed: true, used: used+1, cap, plan }`
- `SECURITY DEFINER`, granted to `service_role` only

**Status: SQL already applied to production.**

---

## Part 2 — Pulse Edge Functions

### New secret
`ANTHROPIC_API_KEY` — set on the Pulse project (`aogorchudxilnkhtfvqq`).  
**Status: Already deployed.**

### Functions modified
`generate-exit-ticket`, `ai-mark-response`, `ai-class-actions`

### Shared changes (all three functions)

**Remove:**
- `import OpenAI from 'https://esm.sh/openai@4'`
- `users.openai_vault_id` lookup
- `get_decrypted_openai_key` RPC call
- `new OpenAI({ apiKey })` instantiation

**Add:**
```typescript
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk'

// Central DB client (secrets already deployed)
const centralAdmin = createClient(
  Deno.env.get('CENTRAL_SUPABASE_URL')!,
  Deno.env.get('CENTRAL_SUPABASE_SERVICE_ROLE_KEY')!,
)

// Look up central_teacher_id
const { data: profile } = await supabaseAdmin
  .from('teacher_profiles')
  .select('central_teacher_id')
  .eq('id', cls.teacher_id)
  .single()

if (!profile?.central_teacher_id) {
  return 403 // teacher hasn't SSO'd yet — no central identity
}

// Quota check
const { data: quota } = await centralAdmin.rpc('check_and_record_ai_action', {
  p_teacher_id: profile.central_teacher_id,
  p_app_slug: 'pulse',
  p_action_type: '<action_type>',
})

if (!quota?.allowed) {
  return new Response(
    JSON.stringify({
      error: 'quota_exceeded',
      message: `AI limit reached (${quota.used}/${quota.cap} actions this month). Upgrade to Pro for more.`,
      used: quota.used,
      cap: quota.cap,
      plan: quota.plan,
    }),
    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
```

**API call pattern:**
```typescript
// Before (OpenAI)
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: prompt }],
  response_format: { type: 'json_object' },
})
const text = completion.choices[0].message.content ?? '{}'

// After (Anthropic)
const msg = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 4096,
  system: 'Respond with valid JSON only. No markdown, no code blocks.',
  messages: [{ role: 'user', content: prompt }],
})
const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
```

**Error handling:** catch block returns `{ error: 'ai_error', message }` at 502 (renamed from `openai_error`).

### ai-mark-response note
This function also reads `marking_harshness` from the local `users` table. That query stays — just remove `openai_vault_id` from the select columns. `marking_harshness` is unaffected by this change.

### Per-function action_type values

| Function | `p_action_type` |
|---|---|
| `generate-exit-ticket` | `generate_exit_ticket` |
| `ai-mark-response` | `mark_response` |
| `ai-class-actions` | uses existing `action_type` from request body (`class_analysis` / `student_feedback` / `struggling_students`) |

### generate-exit-ticket note
Makes two Claude calls (Pass 1: generate questions, Pass 2: map curriculum descriptors). Quota is checked and recorded **once** before Pass 1 — both passes count as a single action.

---

## Part 3 — Remove Per-User Key System

### Retired
- `supabase/functions/save-openai-key/` — leave deployed, remove all client references
- `src/hooks/useAISettings.ts` — entire file deleted

### Modified
**`src/pages/CreateExitTicket.tsx`:**
- Remove `useOpenAIKeyStatus` import and usage
- Remove `openAIStatus?.hasKey` guard on the Generate button
- Update `onError` in `useAIGenerateExitTicket` to handle `quota_exceeded` distinctly:
  - If `error` contains `quota_exceeded`: toast "AI limit reached — upgrade to Pro for more actions"
  - Otherwise: generic "Generation failed" toast

### Database
`openai_vault_id` column remains on `users` table — no migration. Unused but harmless.

---

## Part 4 — Settings UI

### New hook: `src/hooks/useAIUsage.ts`
- Reads `central_teacher_id` from local `teacher_profiles`
- Queries central DB via `centralClient`:
  - Count of `ai_actions` WHERE `teacher_id = central_teacher_id AND created_at >= date_trunc('month', now())`
  - Plan from `subscriptions` (latest active/trialing row, default `'free'`)
  - Caps from `platform_config`
- Returns `{ used: number, cap: number, plan: string, isLoading: boolean }`

### Settings.tsx changes
**Remove:** `useOpenAIKeyStatus`, `useSaveOpenAIKey`, `useRemoveOpenAIKey` imports; `apiKeyInput`, `showKey` state; `handleSaveKey`; entire OpenAI key card JSX.

**Replace with** an "AI Usage" card:
- Header: "AI Usage" + Bot icon
- Progress bar: `used / cap` with label "X / Y actions used this month"
- Subtext: plan name + reset date (first of next month)
- If `plan === 'free'`: upgrade nudge linking to edufied.com.au subscription page
- Pro/School: no upgrade nudge

---

## Deployment Checklist

- [x] Central DB RPC applied (`check_and_record_ai_action`)
- [x] `ANTHROPIC_API_KEY` secret set on Pulse edge functions
- [ ] Deploy updated `generate-exit-ticket`
- [ ] Deploy updated `ai-mark-response`
- [ ] Deploy updated `ai-class-actions`
- [ ] Deploy Pulse frontend (Settings + CreateExitTicket changes)

---

## Files Changed

| File | Change |
|---|---|
| `edufied.com.au/supabase/migrations/20260609000000_check_and_record_ai_action.sql` | New — already applied |
| `supabase/functions/generate-exit-ticket/index.ts` | Replace OpenAI with Claude + quota check |
| `supabase/functions/ai-mark-response/index.ts` | Replace OpenAI with Claude + quota check |
| `supabase/functions/ai-class-actions/index.ts` | Replace OpenAI with Claude + quota check |
| `src/hooks/useAISettings.ts` | Deleted |
| `src/hooks/useAIUsage.ts` | New |
| `src/hooks/useAIGenerateExitTicket.ts` | Update error handling for quota_exceeded |
| `src/pages/CreateExitTicket.tsx` | Remove OpenAI key guard |
| `src/pages/Settings.tsx` | Remove key UI, add AI Usage card |
