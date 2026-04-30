# Exit Ticket Templates + Runs — Design Spec

**Date:** 2026-04-30
**Status:** Approved

---

## Problem

Exit tickets are currently stored as a single `tasks` row that acts as both the reusable definition (title, questions) and the class activation (run with student responses). This means:

- Deleting an "assessment" from the class view wipes the entire exit ticket, including all questions
- The same exit ticket cannot be run in multiple classes without rebuilding it from scratch
- There is no way to clear student responses and run the ticket again without destroying the definition

---

## Solution: Templates + Runs

Split exit tickets into two distinct concepts:

- **Template** — the reusable definition. Has a title and questions. Not tied to any class.
- **Run** — a deployment of a template into a specific class. Stored as a `tasks` row. Collects student responses. Has a lifecycle (draft → active → closed).

When a template is deployed to a class, questions are **copied** into the run. Editing the template after deployment does not affect existing runs.

---

## Database Changes

### New Tables

#### `exit_ticket_templates`
```sql
CREATE TABLE exit_ticket_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `template_questions`
```sql
CREATE TABLE template_questions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id          UUID NOT NULL REFERENCES exit_ticket_templates(id) ON DELETE CASCADE,
  number               INTEGER NOT NULL,
  question             TEXT,
  question_type        TEXT,
  max_score            NUMERIC,
  blooms_taxonomy      TEXT,
  content_item         TEXT,
  general_capabilities TEXT[],
  marking_criteria     TEXT,
  model_answer         TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `template_question_options`
```sql
CREATE TABLE template_question_options (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_question_id UUID NOT NULL REFERENCES template_questions(id) ON DELETE CASCADE,
  option_text          TEXT NOT NULL,
  is_correct           BOOLEAN NOT NULL DEFAULT false,
  order_index          INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Modified Tables

#### `tasks` — add column
```sql
ALTER TABLE tasks
  ADD COLUMN exit_ticket_template_id UUID
    REFERENCES exit_ticket_templates(id) ON DELETE SET NULL;
```

Existing tasks (regular assessments) have `NULL` here and are completely unaffected.

### RLS Policies

All three new tables follow the same pattern:
- Teachers can SELECT/INSERT/UPDATE/DELETE their own rows (`teacher_id = auth.uid()` for templates; join to template for child tables)
- No public (anon) access — students interact with runs via existing `tasks` policies only

### Migration Notes

- User will delete all existing exit tickets via the UI before the migration runs
- No data migration needed — new column is nullable, new tables start empty
- Migration file: `20260430000000_exit_ticket_templates.sql`

---

## Deploy Flow

When a teacher deploys a template to a class:

1. Teacher clicks "Deploy to Class" on a template card, selects a class from a dropdown
2. App creates a `tasks` row:
   - `is_exit_ticket = true`
   - `class_id = selected class`
   - `exit_ticket_template_id = template.id`
   - `name = template.name`
   - `status = 'draft'`
3. App copies rows from `template_questions` → `questions` (with `task_id = new run id`)
4. App copies rows from `template_question_options` → `question_options` (with `question_id = copied question id`)
5. Run appears in the Classroom Activities panel for that class, ready to activate

---

## Clear Results Flow

When a teacher clears a run:

1. Delete all `results` rows where `task_id = run.id`
2. Delete all `question_results` rows where `question_id IN (SELECT id FROM questions WHERE task_id = run.id)`
3. Set `tasks.status = 'draft'` where `id = run.id`
4. Questions remain — the run is ready to activate again

---

## UI Changes

### Exit Tickets Page (`/exit-tickets`)

- Lists **templates** (from `exit_ticket_templates`), not tasks
- "Create Exit Ticket" creates a template with title + questions — no class picker
- Each template card:
  - **Deploy to Class** button → class picker modal → creates a run
  - **Edit** button → edits template title and questions (runs are unaffected)
  - **Delete** button → deletes the template; runs have `exit_ticket_template_id` set to NULL but are otherwise intact
  - Expandable **Runs** section showing each deployed class and run status, with two per-run actions:
    - **Clear Results** — deletes student responses only, resets status to draft, keeps questions intact (run stays deployed)
    - **Remove Run** — deletes the entire run (task + its copied questions + all responses); template is unaffected

### Create Exit Ticket Page (`CreateExitTicket.tsx`)

- Saves to `exit_ticket_templates` + `template_questions` instead of `tasks` + `questions`
- Class selector removed (templates are class-agnostic)
- Editing a template updates `exit_ticket_templates` and `template_questions` only

### Classroom Activities Panel (`ClassroomActivities.tsx`)

- No structural changes — still shows runs for the current class
- Activate / Deactivate toggle unchanged
- Adds a **Clear Results** button per run (shown only when at least one result exists)

### Class Assessments Section (`AssessmentsSection.tsx`)

- Filter out `is_exit_ticket = true` tasks — exit ticket runs are not regular assessments and should not be deletable from here

### Unchanged

- `TakeExitTicket.tsx` — loads by `task_id`, works for runs
- `AssessmentDetail.tsx` — loads by `task_id`, works for runs
- All analytics hooks — use `task_id`, untouched
- `useSubmitExitTicket` — uses `task_id`, untouched
- `useActiveExitTickets` — queries `tasks`, still works

---

## New Hooks

| Hook | Purpose |
|---|---|
| `useExitTicketTemplates(schoolId)` | List templates for a school |
| `useTemplateQuestions(templateId)` | Fetch questions + options for a template |
| `useDeployTemplate()` | Mutation: create run + copy questions |
| `useClearRun()` | Mutation: delete results, reset status to draft |
| `useDeleteRun()` | Mutation: delete the run task and its questions |
| `useRunsForTemplate(templateId)` | List all runs for a given template (for the Runs section) |

### Modified Hooks

| Hook | Change |
|---|---|
| `useExitTickets` | Replaced by `useExitTicketTemplates` |
| `useExitTicketsByClass` | Now returns runs (`tasks` where `is_exit_ticket=true AND class_id=X`) — query unchanged |

---

## Out of Scope

- Syncing template edits to existing runs (deliberate — runs are copies)
- Run history / comparing results across multiple runs of the same template
- Sharing templates between teachers
