# AI Marking with OpenAI — Design Spec

**Date:** 2026-04-14  
**Feature:** OpenAI-powered marking for exit ticket text responses  
**Model:** `gpt-4o-mini` (cheap, fast, capable for short student answers)

---

## Overview

Teachers can save their OpenAI API key in Settings. When a student submits an exit ticket, text answers are automatically marked by the AI. Teachers can also trigger AI marking manually from the Responses tab. Each AI mark includes a score and 1–2 sentence feedback.

The existing keyword-based marking system remains in place as the fallback when no API key is configured.

---

## Data Layer

### Migration: `20260415000001_add_ai_marking_fields.sql`

```sql
-- Reference to Supabase Vault secret (not the key itself)
ALTER TABLE users ADD COLUMN IF NOT EXISTS openai_vault_id UUID DEFAULT NULL;

-- Teacher-written model answer for AI to mark against
ALTER TABLE questions ADD COLUMN IF NOT EXISTS model_answer TEXT DEFAULT NULL;

-- AI-generated feedback stored per question result
ALTER TABLE question_results ADD COLUMN IF NOT EXISTS ai_feedback TEXT DEFAULT NULL;
```

### How the API key is stored

- The raw API key is **never stored in any database table**
- It is encrypted at rest using **Supabase Vault** (`vault.create_secret()`)
- The `users.openai_vault_id` column holds only the UUID reference to the Vault secret
- Even a full database dump would not expose the key

---

## Edge Functions

### `save-openai-key`

**Purpose:** Store or update a teacher's OpenAI API key in Supabase Vault.

**Called from:** Settings page, when the teacher clicks "Save Key"

**Flow:**
1. Receive API key via authenticated POST (user JWT required)
2. If `users.openai_vault_id` is already set → call `vault.update_secret()`
3. If not set → call `vault.create_secret()`, get back a UUID
4. Write the UUID to `users.openai_vault_id`
5. Return `{ success: true }`

**Security:** Uses Supabase service role key server-side. Raw key is never logged or returned.

---

### `ai-mark-response`

**Purpose:** Mark one or more text question results using OpenAI.

**Called from:**
- `useSubmitExitTicket.ts` — automatically after student submission (for text answers only)
- Responses tab — manually via "AI Mark All" or individual "Re-mark" buttons

**Input:**
```ts
{
  question_result_ids: string[];  // one or more question_result IDs to mark
  task_id: string;                // used to look up the teacher's vault secret
}
```

**Flow:**
1. Look up the task → class → teacher user ID
2. Fetch `users.openai_vault_id` for that teacher
3. Decrypt the API key from `vault.decrypted_secrets`
4. If no key exists → return `{ skipped: true }` (keyword marking already applied)
5. For each `question_result_id`:
   - Fetch question text, model answer, student response, max score
   - Call OpenAI `gpt-4o-mini` with a structured prompt (see below)
   - Parse score and feedback from response
   - Update `question_results` row: `raw_score`, `percent_score`, `ai_feedback`
6. After all updates, recalculate and update the parent `results` row totals

**OpenAI Prompt Structure:**
```
You are a teacher's assistant marking a student's answer.

Question: {question_text}
Model Answer: {model_answer}
Max Score: {max_score}
Student Answer: {student_answer}

Return JSON only:
{
  "score": <integer 0 to max_score>,
  "feedback": "<1-2 sentences explaining the score>"
}
```

**Fallback:** If model answer is not set, omit it from the prompt. AI marks based on question text alone.

---

## UI Changes

### Settings Page — New "AI Settings" Card

- Password-style input for OpenAI API key (masked by default, show/hide toggle)
- "Save Key" button → calls `save-openai-key` Edge Function
- Status badge: "Key saved" (green) or "No key set" (muted)
- Helper text: "Your key is encrypted and never stored in plain text."
- "Remove Key" option to clear the vault secret

---

### Create Exit Ticket Page — Model Answer Field

- For `short_answer` and `extended_answer` question types only
- New "Model Answer" textarea below the existing marking criteria section
- Label: "Model Answer (used for AI marking)"
- Optional — if left blank, AI still marks but less accurately
- Saved to `questions.model_answer`

---

### Assessment Detail — Responses Tab

**Per-answer row:**
- If `ai_feedback` is set, show it as a small italic note beneath the student's response
- "Re-mark" icon button per row — calls `ai-mark-response` for that single `question_result_id`

**Tab header:**
- "AI Mark All" button — calls `ai-mark-response` for all text answer rows in the tab
- Only visible when teacher has an API key configured
- Shows a loading spinner while in progress

**Score editing:**
- Existing manual score editing remains — teacher can always override AI scores

---

## Marking Fallback Logic

| Scenario | Marking method |
|---|---|
| API key set + model answer set | AI marking (most accurate) |
| API key set + no model answer | AI marking (question text only) |
| No API key + keywords set | Keyword matching |
| No API key + no keywords | Full marks awarded by default |

---

## Key Files

| File | Change |
|---|---|
| `supabase/migrations/20260415000001_add_ai_marking_fields.sql` | New migration |
| `supabase/functions/save-openai-key/index.ts` | New Edge Function |
| `supabase/functions/ai-mark-response/index.ts` | New Edge Function |
| `src/pages/Settings.tsx` | Add AI Settings card |
| `src/pages/CreateExitTicket.tsx` | Add model answer textarea |
| `src/pages/AssessmentDetail.tsx` | AI feedback display + AI Mark All button |
| `src/hooks/useSubmitExitTicket.ts` | Call `ai-mark-response` after submission |
| `src/integrations/supabase/types.ts` | Add new columns to types |
