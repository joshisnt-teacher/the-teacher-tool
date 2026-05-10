# Pulse Data Model — Assessments & Exit Tickets

> **Date:** 2026-04-30  
> **Scope:** How assessments and exit tickets are stored, created, and displayed.  
> **Key Insight:** Assessments and exit tickets are the **same entity**. Both live in the `tasks` table. The only difference is `is_exit_ticket = true/false`.

---

## 1. Database Schema

### `tasks` — One row per assessment / exit ticket

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `name` | text | Title |
| `class_id` | UUID | FK → `classes` |
| `task_type` | text | `'Diagnostic'` \| `'Formative'` \| `'Summative'` |
| `assessment_format` | text | `'confidence_check'`, `'Kahoot'`, `'single_mark'`, `'traditional'` |
| `description` | text | Optional description |
| `due_date` | date | Due date |
| `weight_percent` | number | Weight toward final grade |
| `max_score` | number | Maximum possible score |
| `content_item_id` | UUID | FK → `content_item` (curriculum linkage) |
| `blooms_taxonomy` | text | Bloom's level |
| `key_skill` | text | Key skill tag |
| `is_legacy` | boolean | Legacy flag |
| `is_exit_ticket` | boolean | `false` = assessment, `true` = exit ticket |
| `status` | text | `'draft'` \| `'active'` \| `'closed'` (exit tickets use this) |
| `is_completed` | boolean | Whether the ticket has been run & closed |
| `class_session_id` | UUID | FK → `class_sessions` (links to active lesson) |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### `questions` — One row per question

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `task_id` | UUID | FK → `tasks` |
| `number` | integer | Display order |
| `question` | text | Question text |
| `question_type` | text | `'multiple_choice'` \| `'short_answer'` \| `'extended_answer'` |
| `max_score` | number | Points for this question |
| `content_item` | text | Content descriptor code (e.g. `ACHGK040`) |
| `blooms_taxonomy` | text | Bloom's level |
| `general_capabilities` | text[] | Capability tags |
| `marking_criteria` | JSONB | Keyword-based auto-marking rules |
| `model_answer` | text | For AI marking |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### `question_options` — MCQ options

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `question_id` | UUID | FK → `questions` |
| `option_text` | text | Display text |
| `is_correct` | boolean | Whether this is the correct answer |
| `order_index` | integer | Display order |

### `question_results` — Per-question student answers

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `question_id` | UUID | FK → `questions` |
| `student_id` | UUID | FK → `students` |
| `raw_score` | number | Points earned |
| `percent_score` | number | Percentage earned |
| `response_data` | JSONB | `{selected_option_id}` or `{text}` |
| `ai_feedback` | text | AI-generated feedback |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### `results` — Task-level aggregate scores

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `task_id` | UUID | FK → `tasks` |
| `student_id` | UUID | FK → `students` |
| `raw_score` | number | Total points |
| `percent_score` | number | Total percentage |
| `normalised_percent` | number | Normalised percentage |
| `feedback` | text | Teacher feedback |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### `student_responses` — Confidence-check responses only

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `task_id` | UUID | FK → `tasks` |
| `student_id` | UUID | FK → `students` |
| `response_value` | integer | 1–10 confidence rating |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

---

## 2. Assessment Creation Flow

### Entry Points
- **Dashboard quick action:** "Create Assessment" dropdown → `/create-assessment/:classId`
- **Class Dashboard button:** `/create-assessment/:classId`

### Wizard Steps (`src/pages/CreateAssessment.tsx`)

| Step | Component | Purpose |
|------|-----------|---------|
| 1 | `AssessmentTypeSelector` | Choose Diagnostic / Formative / Summative |
| 2 | `AssessmentDetailsForm` | Name, due date, weight, content descriptor |
| 3 | `AssessmentFormatSelector` | Currently only `confidence_check` |
| 4 | `ConfidenceCheckConfig` | Question text for confidence check |

### Hook: `useCreateAssessment.tsx`

```ts
export interface CreateAssessmentData {
  name: string;
  class_id: string;
  task_type: 'Diagnostic' | 'Formative' | 'Summative';
  description?: string;
  assessment_format: 'confidence_check';
  blooms_taxonomy?: string;
  key_skill?: string;
  content_item_id?: string;
  question_text?: string;
  due_date?: string;
  weight_percent?: number;
  max_score?: number;
  is_legacy: false;
}
```

**What it does:**
1. Inserts a row into `tasks`
2. For confidence checks, students later submit `student_responses` records

---

## 3. Assessment Display Flow

### Class Dashboard (`src/pages/ClassDashboard.tsx`)
- Component: `AssessmentsSection`
- Shows: previous + upcoming assessments, status indicators

### Assessment Detail (`src/pages/AssessmentDetail.tsx`)
- Route: `/assessment/:assessmentId`
- Tabs:
  - **Results** — editable results table
  - **Responses** — (if exit ticket)
  - **Question Heatmap** — student × question grid
  - **Questions** — add/edit/delete questions
  - **Insights** — hardest/easiest, Bloom's radar, content links

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| `QuestionsTab` | `src/components/assessment/QuestionsTab.tsx` | Lists questions with add/edit/delete |
| `QuestionCard` | `src/components/assessment/QuestionCard.tsx` | Individual question with curriculum mapping |
| `QuestionHeatmap` | `src/components/assessment/QuestionHeatmap.tsx` | Student × question performance grid |
| `AssessmentInsights` | `src/components/assessment/AssessmentInsights.tsx` | Analytics: hardest/easiest, Bloom's radar, content links |
| `ImportAssessmentDialog` | `src/components/assessment/ImportAssessmentDialog.tsx` | CSV/Excel import wizard |

---

## 4. Exit Ticket Creation Flow

### Entry Points
- **Dashboard quick action:** "Create Exit Ticket" → `/exit-tickets/create`
- **Exit Tickets page:** "Create" button → `/exit-tickets/create`

### Builder (`src/pages/CreateExitTicket.tsx`)
- Route: `/exit-tickets/create` (or embedded in Sheet)
- Supports create and edit (`taskId` query param)
- Fields: title, class, description, task type, status
- Question builder with 3 types:
  - **Multiple Choice** — options + correct answer
  - **Short Answer** — keyword-based marking criteria
  - **Extended Answer** — model answer for AI marking

### AI Generation
- Hook: `useAIGenerateExitTicket.ts`
- Calls Edge Function: `generate-exit-ticket`
- Input: content prompt, question count, question types, class_id
- Output: `AIGeneratedExitTicket` with questions, options, marking criteria

### Auto-Marking Rules
- File: `src/lib/autoMarkTextAnswer.ts`

```ts
export interface MarkingCriteria {
  expected_keywords?: string[];
  match_type?: 'all' | 'any';
  case_sensitive?: boolean;
}
```

---

## 5. Exit Ticket Storage Flow

On save (`CreateExitTicket.tsx`):
1. Insert/update `tasks` with `is_exit_ticket: true`, `max_score: sum(question.maxScore)`
2. Delete old questions (cascade deletes options)
3. Insert new `questions` records
4. For MCQ, insert `question_options`

---

## 6. Exit Ticket Display Flow

### Teacher Views

**Exit Ticket Library (`src/pages/ExitTickets.tsx`)**
- Route: `/exit-tickets`
- Lists all exit tickets for school, filterable by class
- Shows: status badges, question count, class code
- Actions: Launch (activate), Edit, Delete, Rerun

**Classroom View (`src/components/classroom/ClassroomActivities.tsx`)**
- Shows exit tickets for current class
- Activate/deactivate toggle (requires active lesson)
- Class code display with copy/link popup
- Rerun dialog clears previous submissions

### Student Views

**Take Exit Ticket (`src/pages/TakeExitTicket.tsx`)**
- Route: `/exit-ticket/:taskId?studentId=...`
- Public route (no auth required)
- Fetches active ticket + questions + options
- Validates all questions answered before submit
- Shows success screen after submission

**Student Dashboard (`src/pages/StudentDashboard.tsx`)**
- Shows active exit tickets for enrolled classes
- Button to start each ticket

---

## 7. Exit Ticket Submission Flow

**Hook:** `src/hooks/useSubmitExitTicket.ts`

1. For each answer:
   - **MCQ:** checks `is_correct` on selected option → full marks or 0
   - **Text:** calls `autoMarkTextAnswer()` with `marking_criteria` → partial marks
2. Calculates total raw score and percentage
3. Inserts into `results` (task-level)
4. Inserts into `question_results` (per-question) with `response_data`
5. **Fire-and-forget AI marking:** calls `ai-mark-response` Edge Function for text answers

---

## 8. TypeScript Interfaces

### Assessment

```ts
// src/hooks/useAssessments.tsx
export interface Assessment {
  id: string;
  name: string;
  task_type: string | null;
  due_date: string | null;
  weight_percent: number | null;
  max_score: number | null;
  status: 'completed' | 'not_started';
  class_id: string;
  created_at: string;
  updated_at: string;
}
```

### Question

```ts
// src/hooks/useQuestions.tsx
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

### Question Result

```ts
// src/hooks/useQuestionResults.tsx
export interface QuestionResult {
  id: string;
  question_id: string;
  student_id: string;
  raw_score: number | null;
  percent_score: number | null;
  created_at: string;
  updated_at: string;
}
```

### Exit Ticket Summary

```ts
// src/hooks/useExitTickets.ts
export interface ExitTicketSummary {
  id: string;
  name: string;
  description: string | null;
  task_type: string | null;
  status: string;
  is_exit_ticket: boolean;
  is_completed: boolean;
  class_session_id: string | null;
  created_at: string;
  updated_at: string;
  class_id: string;
  class_name: string;
  class_code: string;
  class_subject: string | null;
  question_count: number;
}
```

### Active Exit Ticket

```ts
// src/hooks/useActiveExitTickets.ts
export interface ActiveExitTicket {
  id: string;
  name: string;
  description: string | null;
  task_type: string | null;
  created_at: string;
  class_id: string;
}
```

---

## 9. Key File Paths

| Category | Path |
|----------|------|
| Assessment Create Page | `src/pages/CreateAssessment.tsx` |
| Assessment Detail Page | `src/pages/AssessmentDetail.tsx` |
| Exit Ticket Create Page | `src/pages/CreateExitTicket.tsx` |
| Exit Ticket List Page | `src/pages/ExitTickets.tsx` |
| Take Exit Ticket Page | `src/pages/TakeExitTicket.tsx` |
| Student Dashboard | `src/pages/StudentDashboard.tsx` |
| Create Assessment Hook | `src/hooks/useCreateAssessment.tsx` |
| Fetch Assessments Hook | `src/hooks/useAssessments.tsx` |
| Fetch Questions Hook | `src/hooks/useQuestions.tsx` |
| Fetch Question Results Hook | `src/hooks/useQuestionResults.tsx` |
| Submit Exit Ticket Hook | `src/hooks/useSubmitExitTicket.ts` |
| AI Generate Exit Ticket Hook | `src/hooks/useAIGenerateExitTicket.ts` |
| AI Marking Hook | `src/hooks/useAIMarking.ts` |
| Auto-marking Logic | `src/lib/autoMarkTextAnswer.ts` |
| DB Types | `src/integrations/supabase/types.ts` |
| Exit Ticket Migration | `supabase/migrations/20260414000000_add_exit_ticket_support.sql` |
| Marking Criteria Migration | `supabase/migrations/20260415000000_add_marking_criteria.sql` |
| AI Marking Fields Migration | `supabase/migrations/20260415000001_add_ai_marking_fields.sql` |
