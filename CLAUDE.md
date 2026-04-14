# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (port 8080)
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm run preview      # Preview production build

# Database (Supabase)
npm run db:pull      # Pull schema/data from cloud to local
npm run db:push      # Push local changes to cloud
npm run db:generate-migration  # Create a new migration
npm run db:backup-local        # Backup local database
npm run supabase:start         # Start local Supabase instance
npm run supabase:reset         # Reset local database
```

No test runner is configured.

## Environment Setup

Copy `env.example` to `.env` and set:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key

For local development, `src/config/database.ts` auto-switches between local (`127.0.0.1:54321`) and production Supabase based on environment.

## Architecture

**Stack:** React 18 + TypeScript + Vite, Tailwind CSS + shadcn/ui, Supabase (PostgreSQL + Auth), TanStack React Query, React Router v6.

### App Structure

`src/App.tsx` is the root — it wraps the app in:
```
QueryClientProvider → AuthProvider → TooltipProvider → BrowserRouter → Routes
```

Layout is conditional: auth pages (`/`, `/login`), spinner pages, and student-facing pages (`/online`, `/student-*`) render without the sidebar. All other routes get the `AppSidebar` + top header layout via `ProtectedRoute`.

### Key Directories

- `src/pages/` — One file per route. Teacher-facing pages (Dashboard, Classroom, Activities, AssessmentDetail, etc.) and student-facing pages (Online, StudentAssessment, StudentReport).
- `src/components/` — Feature components grouped by domain (`assessment/`, `classroom/`, `class-dashboard/`, `student-profile/`) plus `ui/` for shadcn/ui primitives.
- `src/hooks/` — 37 custom hooks. All Supabase data fetching lives here (e.g., `useAssessments`, `useClasses`, `useStudents`, `useCurriculum`). Analytics hooks (`useProgressAnalytics`, `useComprehensiveAnalytics`, `useQuestionHeatmapData`) compose raw data into chart-ready formats.
- `src/integrations/supabase/` — Supabase client (`client.ts`) and generated TypeScript types (`types.ts`). Update `types.ts` after schema changes.
- `src/contexts/` — `ClassroomThemeContext.tsx` provides dynamic theme switching for the classroom view.

### Data Flow

All server state goes through TanStack React Query via custom hooks in `src/hooks/`. Components call hooks, hooks call Supabase. No global store — auth state lives in `AuthProvider` (via `useAuth()`), UI state is local.

### Routing Conventions

- Protected routes use `<ProtectedRoute>` wrapper
- Resource routes use URL params: `/class/:classId`, `/assessment/:assessmentId`
- Student-facing routes are public: `/online`, `/student-assessment/:assessmentId`, `/student-report/:studentId`

### Theming

`src/index.css` defines HSL CSS variables for the design system (light + dark modes). Tailwind config extends these via `hsl(var(--...))` references. The classroom view additionally uses `ClassroomThemeContext` for runtime theme switching.

### Database Sync

`db-sync.js` is a Node.js CLI for syncing between local and cloud Supabase. See `DATABASE-SYNC-GUIDE.md` for full workflow. Migrations live in `supabase/migrations/`.

---

## Recent Changes

### AI Marking Fixes + Improved Prompt (2026-04-14)

**What was fixed:**

- **AI marking returned "marked 0 responses"** — Root cause: `question_results` has two FK constraints to `questions` (`fk_question_results_question` and `question_results_question_id_fkey`), causing PostgREST to treat the embedded join as ambiguous and return `null`. The edge function skipped every result because `q = null`. Fixed by replacing the embedded join with a separate `questions` query.
- **Results tab showed 0/8 despite correct per-question scores** — Same FK ambiguity broke the recalculation query (`questions!inner(task_id)` returned empty). The edge function wrote `raw_score = 0` back to the `results` table after every AI marking run. Fixed by using a two-step query: fetch question IDs for the task first, then filter `question_results` by those IDs with `.in()`.
- **Existing zeroed results repaired** — A direct SQL UPDATE recalculated `raw_score` / `percent_score` for all exit ticket results from the actual `question_results` data.
- **Improved AI marking prompt** — The edge function now fetches `marking_criteria` and `blooms_taxonomy` in addition to `model_answer`. The prompt now includes: Bloom's level for calibration, model answer as primary reference, keywords with match rule (any/all), explicit partial-mark guidance per concept, and structured 2-3 sentence feedback (what was right, what was missing, one improvement tip). MCQ questions (`question_type = 'mcq'`) are now also excluded from AI marking (previously only `'multiple_choice'` was excluded).

**Key files:**
- `supabase/functions/ai-mark-response/index.ts` — all fixes above (deployed as v3)

---

### Exit Tickets — Classroom Integration + Student UX (2026-04-14)

**What was built:**

- **Classroom Activities panel** (`src/components/classroom/ClassroomActivities.tsx`) — completely rewritten to integrate exit tickets into the live lesson view:
  - Class code bar with copy-link button and "Display" popup (opens a full-screen window showing the class code and join URL, matching the timer/name-picker popup pattern)
  - Per-ticket Activate/Deactivate toggle with loading state
  - Edit button navigating to `/activities/create/exit-ticket?taskId=...`
- **Student landing page** (`src/pages/StudentLanding.tsx`) — new public page at `/join`. Large monospace class code input, auto-uppercases, navigates to `/:classCode` on submit.
- **TakeExitTicket question rendering** (`src/pages/TakeExitTicket.tsx`) — fixed question type normalisation. Now handles legacy `"MCQ"` (uppercase) alongside `"multiple_choice"`. Multiple choice only renders radio buttons when options exist; falls back to text input otherwise.
- **App routing** (`src/App.tsx`) — added `/join` route and `isStudentPage` check so StudentLanding renders without the sidebar.
- **Permission fixes** (applied via SQL/MCP):
  - `GRANT SELECT, INSERT, UPDATE, DELETE ON question_options TO authenticated`
  - `GRANT SELECT ON question_options TO anon`
  - `GRANT SELECT ON questions TO anon` + RLS policy for active exit tickets
  - `GRANT INSERT ON results TO anon`
  - `GRANT INSERT ON question_results TO anon`

**Key files:**
- `src/components/classroom/ClassroomActivities.tsx` — classroom exit ticket panel
- `src/pages/StudentLanding.tsx` — new `/join` landing page
- `src/pages/TakeExitTicket.tsx` — question type normalisation fix
- `src/App.tsx` — routing updates

---

### Exit Tickets System — Activities Rework (2026-04-14)

**What was built:**
- **Replaced Activities with Exit Tickets** — the old Activities section (`activities`, `activity_quizzes`, `quiz_questions`, `quiz_answers`, `activity_forms`) was removed and replaced with Exit Tickets built directly on the `tasks` + `questions` tables. This means student submissions are automatically stored as assessment results and appear in dashboards/reports with zero extra work.
- **Database changes** (migration: `20260414000000_add_exit_ticket_support.sql`):
  - `class_code` added to `classes` for friendly URLs (`myurl.com/X7K9P2`)
  - `is_exit_ticket` and `status` (`draft` / `active` / `closed`) added to `tasks`
  - New `question_options` table for multiple-choice answer storage
  - `response_data` JSONB added to `question_results` for text-based answers
  - New RLS policies so anonymous students can view active exit tickets and submit results
- **Teacher UI**:
  - `Activities` renamed to `Exit Tickets` in the sidebar and page titles
  - `src/pages/Activities.tsx` — lists exit tickets with status, question count, and class code URL
  - `src/pages/CreateExitTicket.tsx` — creation/editing page supporting title, class, tags (Bloom's, content descriptor, key skill, task type), and dynamic questions (multiple choice, short answer, extended answer). Teachers can add/remove options, mark correct answers, and activate/deactivate tickets.
- **Student UI** (public, no auth):
  - `src/pages/ClassJoin.tsx` — route `/:classCode`. Students enter a class code, see active exit tickets, and select their name from the class roster.
  - `src/pages/TakeExitTicket.tsx` — route `/exit-ticket/:taskId?studentId=...`. Renders questions, prevents double submission, auto-grades multiple choice, and stores text answers for manual grading.
- **Auto-grading**:
  - Multiple choice: scored automatically (full `max_score` if correct, else `0`)
  - Short / extended answer: score is `null` until the teacher grades it in Assessment Detail
  - Inserts go directly into `results` and `question_results`, so all existing analytics work immediately
- **Cleanup**: deleted `useActivities.ts`, `CreateMultipleChoiceQuiz.tsx`, `CreateSurveyActivity.tsx`, `Online.tsx`, `StudentAssessment.tsx`. Updated `App.tsx` routing and sidebar logic.
- **Pending**: student authentication (Supabase accounts or PINs) is noted as future work in `ClassJoin.tsx`.

**Key files:**
- `supabase/migrations/20260414000000_add_exit_ticket_support.sql` — schema changes
- `src/pages/CreateExitTicket.tsx` — teacher creation/editing UI
- `src/pages/ClassJoin.tsx` — student class code landing page
- `src/pages/TakeExitTicket.tsx` — student exit ticket submission UI
- `src/pages/Activities.tsx` — teacher exit ticket library
- `src/hooks/useExitTickets.ts`, `useExitTicketsByClass.ts`, `useActiveExitTickets.ts` — data fetching
- `src/hooks/useQuestionOptions.ts` — fetches MC options
- `src/hooks/useSubmitExitTicket.ts` — handles result + question_result inserts
- `src/App.tsx` — updated routes and layout logic

---

### Assessment Import Improvements + Result Editing + Question Editing Fixes (2026-04-13)

**What was built:**
- **Assessment Import Templates** — Added "Download Template" buttons in `ImportAssessmentDialog` for both Standard and Single Mark formats. Templates are pre-filled with the class roster and blank question columns.
- **Single Mark Import Format** — New import option that lets teachers create an assessment with just a single overall score/percentage per student (no individual questions required). Supports both CSV upload and manual entry directly in the dialog.
- **Robust CSV Parsing** — Replaced naive `.split(',')` parsing with `Papa.parse` in `csvAssessmentParser.ts` so commas inside quoted cells (e.g. question text) are handled correctly.
- **Result Editing on Assessment Detail** — Added an "Edit Results" button on the Results tab. Teachers can edit raw scores / percentages, add missing students from the class, and remove existing results. Auto-calculates percentage from raw score (and vice-versa) based on Total Marks.
- **Edit Question Dialog Fixes** — Fixed pre-fill so all fields populate when editing. Expanded Select options to include stored database values like `MCQ`, `Remembering`, `Fill in the Blanks`, etc.
- **Content Descriptor Dropdown** — When a class has linked curriculum descriptors, the Edit Question dialog now shows a dropdown of available descriptors (code + description) instead of a plain text input.
- **Duplicate Student Fix** — Deduplicated class student lists in `ImportAssessmentDialog` so each student only appears once in the Single Mark manual entry table.

**Key files:**
- `src/utils/csvAssessmentParser.ts` — added `parseSingleMarkCSV`, switched to Papa Parse for CSV reading
- `src/components/assessment/ImportAssessmentDialog.tsx` — templates, Single Mark format, manual entry table, deduplication
- `src/hooks/useAssessmentImport.tsx` — supports `single_mark` source format (skips question creation)
- `src/pages/AssessmentDetail.tsx` — inline result editing UI with add/remove/update
- `src/hooks/useResultMutations.tsx` — new hook for creating/updating/deleting task results
- `src/components/assessment/EditQuestionDialog.tsx` — fixed pre-fill, expanded Select options, added `classId` prop with content descriptor dropdown
- `src/components/assessment/QuestionsTab.tsx` — passes `classId` to `EditQuestionDialog`

---

## Recent Changes

### Demo Class Toggle + Live Dashboard Metrics (2026-04-13)

**What was built:**
- `is_demo` boolean column added to the `classes` table (migration: `20260413000000_add_is_demo_to_classes.sql`)
- Demo toggle added to **Adjust Class Data → Basic Settings** — when enabled, the class is excluded from all dashboard statistics
- Dashboard **Total Classes** and **Active Students** now exclude demo classes
- Dashboard **"Average Progress"** card replaced with **"Avg Class Score"** — live mean `percent_score` from the `results` table (shows `—` when no data)
- Dashboard **"Upcoming Assessments"** card now shows live count from `tasks.due_date >= today` (was hardcoded at 4)
- Demo classes show a **"Demo" badge** in the Recent Classes list

**Key files:**
- `supabase/migrations/20260413000000_add_is_demo_to_classes.sql` — adds `is_demo` column
- `src/hooks/useClasses.tsx` — `Class` interface now includes `is_demo: boolean`; exports `useUpdateClassDemo` mutation
- `src/hooks/useStudents.tsx` — `useTotalStudentCount` joins classes and filters out demo classes
- `src/hooks/useDashboardStats.tsx` — new file; exports `useUpcomingAssessmentsCount` and `useAverageClassScore`
- `src/components/class-dashboard/adjust-class/ClassBasicTab.tsx` — Demo Class toggle UI
- `src/pages/Dashboard.tsx` — consumes all the above; filters demo classes from stats; adds Demo badge
