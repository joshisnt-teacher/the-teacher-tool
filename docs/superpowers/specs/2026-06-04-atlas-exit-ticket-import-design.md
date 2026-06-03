# Atlas → Pulse Exit Ticket Import — Design Spec

**Date:** 2026-06-04
**Status:** Approved
**Approach:** File upload (manual bridge until Atlas ↔ Pulse are linked via edge functions)

---

## Overview

Teachers can build exit tickets in Atlas (tagged to a class and lesson), export them as a JSON file, and import them into Pulse via a file upload dialog. Pulse creates the template in the Exit Ticket library and optionally deploys it as a draft run into the matching class.

This is a temporary manual bridge. When Atlas and Pulse are linked via API keys and edge functions, Atlas will call a Pulse edge function directly and this file upload flow can be retired.

---

## JSON Schema (Atlas export format)

Atlas must produce a `.json` file matching this structure:

```json
{
  "source": "atlas",
  "version": "1.0",
  "exit_ticket": {
    "name": "string — required",
    "description": "string — optional",
    "class_code": "string — 6-char code from edufied.com.au central class",
    "deploy_to_class": true,
    "status": "draft",
    "is_homework": false,
    "due_date": null,
    "questions": [
      {
        "number": 1,
        "question": "string — required",
        "question_type": "multiple_choice | short_answer | extended_answer",
        "max_score": 1,
        "blooms_taxonomy": "string — optional",
        "content_item": "string — curriculum code, optional",
        "options": [
          { "option_text": "string", "is_correct": true, "order_index": 1 }
        ],
        "marking_criteria": {
          "expected_keywords": ["string"],
          "match_type": "any | all",
          "case_sensitive": false
        },
        "model_answer": "string — optional"
      }
    ]
  }
}
```

**Field notes:**
- `class_code` — the shared 6-char identifier that originates from edufied.com.au. Used to look up the Pulse class. If not found, import proceeds as template-only.
- `options` — only required for `multiple_choice` questions
- `marking_criteria` and `model_answer` — only relevant for `short_answer` / `extended_answer`
- `deploy_to_class` — if `true` and class is found, Pulse creates both a template and a deployed draft run. If `false` or class not found, template only.
- `status` — should always be `"draft"` from Atlas; teacher activates manually in Pulse.

---

## Pulse UI

### Entry point
A new **"Import from Atlas"** button is added to the Exit Tickets library page (`src/pages/ExitTickets.tsx`), placed next to the existing "Create Exit Ticket" button.

### Import dialog — two states

**State 1: File pick**
- Drag-and-drop zone or "Browse files" button
- Accepts `.json` files only
- Label: "Export an exit ticket from Atlas, then upload it here"

**State 2: Preview & confirm** (shown after a valid file is parsed)
- Ticket name and description
- Question count and total marks
- Class it will deploy into (name shown, looked up by `class_code`) OR a warning badge: "Class not found — will be saved as template only"
- "Import" confirm button

**After import:**
- Dialog closes
- Toast: "Exit ticket imported" or "Exit ticket imported and deployed to [Class Name]"
- New template appears at the top of the Exit Ticket library

---

## Import Logic

Executed inside `useImportExitTicket.ts`:

1. **Parse & validate** the uploaded file
2. **Look up class** — query Pulse `classes` by `class_code`, scoped to the logged-in teacher. Store result (may be null).
3. **Insert template** — `exit_ticket_templates` with `teacher_id` and `school_id` from the logged-in user
4. **Insert questions** — one `template_questions` row per question, in `number` order
5. **Insert options** — `template_question_options` rows for each `multiple_choice` question
6. **Deploy (conditional)** — if `deploy_to_class: true` AND class was found:
   - Insert `tasks` row: `is_exit_ticket: true`, `status: 'draft'`, `class_id`, `exit_ticket_template_id`
   - Insert each question into `questions` directly from the in-memory JSON data (do not re-read from `template_questions`)
   - Insert options into `question_options` for each `multiple_choice` question
   - This mirrors the outcome of `useDeployTemplate` but reads from memory rather than the database for efficiency

Steps 3–6 are wrapped in a try/catch. On failure, the template row is deleted to avoid orphaned data.

---

## New Files

| File | Purpose |
|---|---|
| `src/components/exit-tickets/ImportExitTicketDialog.tsx` | Dialog component (file pick + preview states) |
| `src/hooks/useImportExitTicket.ts` | Import mutation hook (parse, validate, insert) |

### Modified Files

| File | Change |
|---|---|
| `src/pages/ExitTickets.tsx` | Add "Import from Atlas" button, wire up dialog |

No database migrations required — all inserts go into existing tables.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Non-JSON file | "Please upload a .json file" — preview not shown |
| Valid JSON but wrong `source` | "This file doesn't look like an Atlas export" |
| Missing required fields | "File is missing required fields: [name / questions]" |
| Empty questions array | Validation error before confirm |
| Class not found by `class_code` | Warning in preview — import proceeds as template-only |
| Supabase insert failure | Toast error; template row cleaned up on failure |

---

## Future Migration Path

When Atlas and Pulse are linked:
- Create a Pulse edge function `import-exit-ticket` that accepts the same JSON schema via POST
- Atlas calls it with an API key in the `Authorization` header
- The same insert logic from `useImportExitTicket.ts` moves into the edge function
- File upload UI can be removed or kept as a manual fallback
