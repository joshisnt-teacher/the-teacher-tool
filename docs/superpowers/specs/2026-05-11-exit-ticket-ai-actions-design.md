# Exit Ticket AI Actions + Marking Harshness — Design Spec

**Date:** 2026-05-11  
**Status:** Approved

---

## Overview

Two related features that extend the AI capabilities of exit tickets:

1. **Marking Harshness slider** — teacher-configurable setting (1–5) in Settings > AI Marking that controls how strictly the AI marks student responses. Stored in `users.marking_harshness`, read by the `ai-mark-response` edge function.

2. **Actions tab** — a new tab on the AssessmentDetail page (exit tickets only) with three on-demand AI actions: class analysis, per-student feedback generation, and flagging struggling students. Results are saved to the database and viewable on return.

---

## Database

### Migration 1 — `marking_harshness` column

```sql
ALTER TABLE users
  ADD COLUMN marking_harshness integer NOT NULL DEFAULT 3
  CHECK (marking_harshness BETWEEN 1 AND 5);
```

- Default 3 (Standard) so existing teachers are unaffected.
- No RLS change needed — already protected by existing `users` policies.

### Migration 2 — `ai_action_results` table

```sql
CREATE TABLE ai_action_results (
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

-- Required for upsert conflict target
CREATE UNIQUE INDEX ai_action_results_task_action_uidx
  ON ai_action_results (task_id, action_type);
```

Re-running an action upserts on `(task_id, action_type)` — always exactly one saved result per action per assessment.

---

## Feature 1 — Marking Harshness

### Settings page (`src/pages/Settings.tsx`)

- Inside the existing "AI Marking" card, below the API key form, add a **Marking Harshness** row.
- UI: shadcn/ui `Slider` component, min=1 max=5 step=1.
- Level names displayed under the slider:
  - 1 = Very Lenient, 2 = Lenient, 3 = Standard, 4 = Strict, 5 = Very Strict
- Flanking labels: `Lenient` on the left, `Strict` on the right.
- Auto-saves to `users.marking_harshness` on change, debounced 600 ms. Toast on success.
- Initial value loaded from `users.marking_harshness` (falls back to 3).

### `ai-mark-response` edge function

- After resolving the teacher, additionally fetch `marking_harshness` from the `users` row (default 3 if null).
- Replace the hardcoded "Be fair and generous" prompt line with a level-specific instruction:

| Level | Instruction injected into prompt |
|-------|----------------------------------|
| 1 | "Be very generous. If the student shows any understanding of the core concept, award full marks. Give benefit of the doubt at every step." |
| 2 | "Be lenient and encouraging. Lean towards the higher mark whenever the answer demonstrates partial understanding." |
| 3 | "Be fair. If the student understood the main point and answered the question, lean towards the higher mark." |
| 4 | "Apply strict standards. Only award full marks for answers that clearly address all required concepts. Partial credit for partial answers." |
| 5 | "Apply rigorous standards. Full marks require a complete and precise answer covering all key concepts. Award marks strictly proportionally to demonstrated knowledge." |

- This harshness level also applies to the `ai-class-actions` edge function when generating student feedback.

---

## Feature 2 — Actions Tab

### New file: `src/components/assessment/ActionsTab.tsx`

Rendered inside AssessmentDetail only when `assessment.is_exit_ticket === true`.

**Layout:** Three vertically stacked action cards. Each card contains:
- Icon + title + one-line description
- Primary "Run" button. Shows "Re-run" + last-run timestamp if a saved result exists.
- Loading spinner while the edge function runs.
- Collapsible output area that expands when results are loaded.

#### Card 1 — Class Analysis (`BrainCircuit` icon)
*"Analyse class-wide strengths and gaps"*

Output sections:
- **Summary** — 2–3 sentence overview
- **Class Strengths** — bulleted list
- **Areas to Reteach** — bulleted list
- **Common Misconceptions** — bulleted list

#### Card 2 — Student Feedback (`MessageSquare` icon)
*"Generate a written comment for each student"*

Output:
- List of student rows: name + 2–3 sentence written comment
- "Copy" icon button per student row
- "Download as CSV" button at the bottom (columns: First Name, Last Name, Feedback)

Feedback tone is influenced by the teacher's `marking_harshness` setting.

#### Card 3 — Flag Struggling Students (`AlertTriangle` icon)
*"Identify students who may need extra support"*

Output:
- List of at-risk students: name, score percentage, one-sentence AI reason
  (e.g. "Responses show surface recall only — no evidence of conceptual understanding.")
- Students not flagged are omitted from the list.

### New hook: `src/hooks/useClassActions.ts`

```ts
useClassActions(taskId: string)
// Returns:
{
  results: Record<ActionType, { output_json, created_at } | null>,
  runAction: (type: ActionType) => Promise<void>,
  isRunning: Record<ActionType, boolean>,
}
```

- On mount, fetches saved `ai_action_results` rows for this `task_id`.
- `runAction` calls the `ai-class-actions` edge function, then invalidates the query to reload saved results.

### AssessmentDetail tab registration (`src/pages/AssessmentDetail.tsx`)

Add to the `TabsList`:
```tsx
{assessment.is_exit_ticket && <TabsTrigger value="actions">Actions</TabsTrigger>}
```

Add `TabsContent`:
```tsx
{assessment.is_exit_ticket && (
  <TabsContent value="actions">
    <ActionsTab taskId={assessmentId} />
  </TabsContent>
)}
```

---

## Feature 3 — New Edge Function: `ai-class-actions`

**File:** `supabase/functions/ai-class-actions/index.ts`

**Request body:** `{ task_id: string, action_type: 'class_analysis' | 'student_feedback' | 'struggling_students' }`

**Steps:**

1. Validate `task_id` and `action_type`.
2. Resolve `task → class → teacher` to get `teacher_id`.
3. Fetch teacher's `openai_vault_id` and `marking_harshness` from `users`.
4. Decrypt OpenAI key from Vault (same pattern as `ai-mark-response`).
5. Fetch all `questions` for the task (id, question_text, max_score, question_type).
6. Fetch all `question_results` with `response_data`, joined to student names.
7. Filter to text-based questions only (exclude MCQ).
8. Branch on `action_type`:

   **`class_analysis`**  
   Single GPT call. Aggregate all student text responses per question into one prompt. Request structured JSON:  
   `{ summary: string, strengths: string[], gaps: string[], reteach_topics: string[] }`

   **`student_feedback`**  
   One GPT call per student. Each prompt includes the student's answers to all questions and the harshness-level instruction. Request:  
   `{ feedback: string }` (2–3 sentences, Australian English, written to the student)  
   Collect into: `{ students: [{ student_id, first_name, last_name, feedback }] }`

   **`struggling_students`**  
   One GPT call per student. Each prompt includes scores + answers + harshness context. Ask AI to assess whether the student demonstrates concerning gaps. Request:  
   `{ flag: boolean, reason: string }`  
   Collect flagged students into: `{ at_risk: [{ student_id, first_name, last_name, score_percent, reason }] }`

9. Upsert result to `ai_action_results` on `(task_id, action_type)` conflict (replace).
10. Return `{ success: true, action_type, data: <output_json> }`.

**JWT config** — add `ai-class-actions` to `supabase/config.toml` with `verify_jwt = false`, matching all other edge functions in this project. The teacher's auth token is validated client-side via the standard `apikey` header.

---

## File Summary

| File | Change |
|------|--------|
| `supabase/migrations/YYYYMMDD_marking_harshness.sql` | Add `marking_harshness` to `users` |
| `supabase/migrations/YYYYMMDD_ai_action_results.sql` | Create `ai_action_results` table |
| `supabase/functions/ai-mark-response/index.ts` | Read `marking_harshness`, dynamic prompt line |
| `supabase/functions/ai-class-actions/index.ts` | New edge function (all 3 action types) |
| `src/pages/Settings.tsx` | Add harshness slider to AI Settings card |
| `src/hooks/useClassActions.ts` | New hook for fetching + running actions |
| `src/components/assessment/ActionsTab.tsx` | New tab component (3 action cards) |
| `src/pages/AssessmentDetail.tsx` | Register Actions tab |
| `supabase/config.toml` | Add `ai-class-actions` with `verify_jwt = false` |
| `src/integrations/supabase/types.ts` | Regenerate after migrations |
