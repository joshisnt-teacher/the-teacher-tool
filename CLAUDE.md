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

Copy `env.example` to `.env` and set all four vars — the app will throw a clear error at startup if any are missing:
- `VITE_SUPABASE_URL` — Teacher Tool Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Teacher Tool Supabase anon key
- `VITE_CENTRAL_SUPABASE_URL` — edufied-auth central DB URL (student SSO)
- `VITE_CENTRAL_SUPABASE_ANON_KEY` — edufied-auth central DB anon key (this is actually a service role key)

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

## Edufied System Architecture

Pulse (this app) is one of several apps in the **Edufied ecosystem**. All apps share a single central auth database (`edufied-auth`) hosted at `https://kjjazhqkvefkesqfzcok.supabase.co`. Each app also has its own local Supabase project for app-specific data.

```
edufied.com.au (hub)
    │
    ├── edufied-auth DB (central Supabase project)
    │       teachers, students, classes, sso_tokens
    │
    ├── pulse.edufied.com.au  ←── this app
    │       local DB: classes, assessments, results, etc.
    │
    └── (future apps...)
```

### Teacher SSO Flow (working as of 2026-04-27)

1. Teacher clicks "Sign in with edufied" on Pulse's login page (`/login`)
2. Pulse redirects to `https://edufied.com.au/auth/sso?app=pulse&redirect_uri=https://pulse.edufied.com.au/auth/teacher/sso`
3. The hub authenticates the teacher, then inserts a row into `sso_tokens` on the central DB:
   - `teacher_id` = teacher's UUID from the central `teachers` table
   - `app_slug` = `'pulse'`
   - `token` = random 64-char hex
   - `used` = false, `expires_at` = now + 5 minutes
4. Hub redirects to `https://pulse.edufied.com.au/auth/teacher/sso?token=<64-hex>`
5. `TeacherSSO.tsx` POSTs the token to the `teacher-sso` Supabase edge function
6. Edge function (`supabase/functions/teacher-sso/index.ts`):
   - Validates token against central DB (unused, not expired, has teacher_id)
   - Marks token `used = true` immediately (replay prevention)
   - Looks up teacher email from central `teachers` table
   - Finds or creates a local shadow auth account in Pulse's Supabase Auth
   - Upserts a `teacher_profiles` row linking local `auth.users.id` → central `teacher_id`
   - Calls `local.auth.admin.generateLink({ type: 'magiclink', email })` — returns `properties.hashed_token`
   - Returns `{ token_hash: hashed_token }`
7. Client calls `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })` — establishes a real session
8. Navigates to `/dashboard`

**Key gotchas learned:**
- `generateLink` returns `properties.hashed_token`, NOT `properties.token_hash`
- The edge function must be deployed with `--no-verify-jwt` (teachers have no session when they call it)
- Required edge function secrets: `CENTRAL_SUPABASE_URL`, `CENTRAL_SUPABASE_SERVICE_ROLE_KEY`

### Student Sign-In Flow

Students sign in via `ClassJoin.tsx` (route `/join`) using a username + PIN:
1. Username + PIN verified against central `students` table (bcrypt PIN hash)
2. Local student found via `students.central_id` (bridges to central UUID)
3. Student session stored in localStorage via `useStudentSession` hook (student_id, central_id, first_name, last_name, year_level)
4. Redirected to `/student/dashboard` — their personalised dashboard showing exit tickets and homework across all enrolled classes

A separate `StudentSSO` page (`/auth/sso`) handles SSO from the student hub (`student.edufied.com.au`) for future use.

**Note:** Class codes have been removed. Students no longer join via `/:classCode`. All student access is through authenticated login.

### Central DB Tables (edufied-auth)

| Table | Purpose |
|---|---|
| `teachers` | Teacher accounts (id, email, first_name, last_name) |
| `students` | Student accounts (id, username, pin [bcrypt], central_id) |
| `sso_tokens` | Short-lived SSO tokens (teacher_id OR student_id, app_slug, token, used, expires_at) |
| `classes` | Classes linked to teacher accounts |
| `student_classes` | Student ↔ class enrolments |

### Local DB Bridge Tables (Pulse)

| Table | Purpose |
|---|---|
| `teacher_profiles` | Links local `auth.users.id` → central `teacher_id`; created on first SSO login |
| `students.central_id` | Nullable UUID linking each local student row to the central DB |

---

## Recent Changes

### Exit Ticket UX Simplification + Homework Flow (2026-05-03)

**What was changed:**

- **Terminology standardised** across all exit ticket UIs to reduce confusion:
  - "Clear Results" → **"Reset to Draft"**
  - "Deactivate" → **"Close"**
  - "Rerun" → **"Reactivate"**
  - "Remove Run" → **"Delete from Class"**
  - Assessment Detail page shows **"Exit Ticket"** badge (instead of generic task type) and **"Back to Classroom"** breadcrumb
- **Removed "Hide from Assessments" footgun** — the eye-off button in `AssessmentsSection` was confusing (hid from one view but not another, with no way to unhide). Replaced with a simple **"View Results"** link for exit tickets.
- **Visibility hints added** in Classroom — each ticket now shows a status hint:
  - Draft: "Visible to you only • Not yet active for students"
  - Active: "Students can access via class code"
  - Closed: "Results saved • View in Assessment Detail"
- **Recent closed tickets shown in Classroom** — the 3 most recently closed tickets remain visible (faded) so teachers can quickly check results or reactivate.
- **Better empty state** in Classroom — "No exit tickets in this class yet" with "Go to Exit Ticket Library" (primary) and "Create New Exit Ticket" (secondary).
- **AI context dropdown clarified** in `CreateExitTicket.tsx` — label changed to "Curriculum Context for AI", placed in a tinted callout box, with explicit helper text: "This helps the AI generate relevant questions. It does **not** assign this exit ticket to any class."

**Homework flow improvements:**

- **Student Dashboard** (`src/pages/StudentDashboard.tsx`) now has two separate sections:
  - **"Exit Tickets"** — live classroom tickets only (`is_homework=false`)
  - **"Homework"** — homework tickets with due dates, sorted by due date ascending, with blue styling and due date badges
- **Homework tickets remain visible in Classroom** until the due date passes — they no longer disappear when a lesson ends.
- **Teacher Class Dashboard** (`src/pages/ClassDashboard.tsx`) now has a **"Homework"** section in the left column (below Assessments) showing active homework with due dates and "View Results" links.
- **Homework auto-activates** when assigned — setting homework sets `status='active'`, `is_homework=true`, and `due_date`. No separate activation step needed.
- **`TakeExitTicket.tsx`** updated to allow access to homework tickets that are active with a valid due date.

**Class codes removed from student flow:**

- **`ClassJoin.tsx`** — completely rewritten from a class-code-based join page to a simple **student sign-in page** (username + PIN). On success, stores session and redirects to `/student/dashboard`.
- **`StudentLanding.tsx`** — simplified from a class code input to a "Student Portal" landing with a "Sign In" button.
- **`ClassroomActivities.tsx`** — removed all class code UI (copy link, display popup, class code bar). The `classCode` prop was removed entirely.
- **`App.tsx`** — removed the `/:classCode` route and the regex that treated code paths as student pages. `/join` now renders the sign-in form.
- **`TakeExitTicket.tsx`** — "Back to Class" button now goes to `/student/dashboard`. Error message changed from "join via class code" to "sign in from the student dashboard".

**Key files:**
- `src/pages/AssessmentDetail.tsx` — conditional exit ticket badge/title
- `src/components/class-dashboard/AssessmentsSection.tsx` — removed hide button, added View Results link
- `src/components/classroom/ClassroomActivities.tsx` — renamed buttons, visibility hints, homework filtering, removed class code
- `src/pages/ExitTickets.tsx` — renamed actions, "Open in Classroom" links
- `src/pages/CreateExitTicket.tsx` — clarified AI context dropdown
- `src/pages/StudentDashboard.tsx` — split Exit Tickets / Homework sections
- `src/pages/ClassJoin.tsx` — rewritten as student sign-in
- `src/pages/StudentLanding.tsx` — simplified landing page
- `src/pages/TakeExitTicket.tsx` — homework access, dashboard redirect
- `src/pages/ClassDashboard.tsx` — added HomeworkSection
- `src/components/class-dashboard/HomeworkSection.tsx` — new component for teacher homework view
- `src/App.tsx` — routing updates, removed class code paths

---

### Exit Ticket Templates + Runs (2026-05-02)

**What was built:**

- **Templates vs Runs separation** — Exit tickets are now split into two concepts. A **template** is the reusable definition (title + questions, not tied to any class). A **run** is a deployment of a template into a specific class, stored as a `tasks` row. Deleting an assessment or clearing responses no longer touches the underlying template.
- **Database changes** (migration: `20260430000000_exit_ticket_templates.sql`):
  - New `exit_ticket_templates` table — stores template title, description, `teacher_id`, `school_id`
  - New `template_questions` table — stores questions per template (mirrors `questions` schema)
  - New `template_question_options` table — stores MCQ options per template question
  - `exit_ticket_template_id` nullable FK added to `tasks` — links a run back to its source template; ON DELETE SET NULL so deleting the template leaves runs intact
  - All three new tables have RLS: teachers manage only their own rows via `auth.uid()`
- **Deploy flow** — teacher clicks "Deploy" on a template card, selects a class; app creates a `tasks` row (`is_exit_ticket=true`, `status='draft'`) and copies questions + options from template tables into `questions` + `question_options`. Editing the template later does NOT affect existing runs.
- **Clear Results** — new `useClearRun` mutation deletes `results` + `question_results` for a run and resets `status='draft'`; questions stay intact and the run can be reused.
- **Remove Run** — `useDeleteRun` deletes the entire run (task + copied questions + all responses); template is unaffected.

**New hooks:**

| Hook | Purpose |
|---|---|
| `useExitTicketTemplates(schoolId)` | List templates for a school |
| `useTemplateQuestions(templateId)` | Fetch questions + options for a template |
| `useRunsForTemplate(templateId)` | List all runs (tasks) for a template |
| `useDeployTemplate()` | Create run + copy questions from template |
| `useClearRun()` | Delete results, reset run to draft |
| `useDeleteRun()` | Delete the run task and its questions |

**UI changes:**

- `src/pages/ExitTickets.tsx` — now lists templates (not tasks); each card has Deploy, Edit, Delete buttons plus a collapsible "Deployed runs" section with Clear/Remove per run
- `src/pages/CreateExitTicket.tsx` — saves to `exit_ticket_templates` / `template_questions` / `template_question_options`; prop changed from `taskId` to `templateId`; class picker removed (templates are class-agnostic); AI panel uses `aiContextClassId` for curriculum context only (not saved)
- `src/components/classroom/ClassroomActivities.tsx` — Edit button now navigates to `/exit-tickets/create?templateId=...` (only shown when `exit_ticket_template_id` is set); new "Clear" button appears on closed/completed runs
- `src/hooks/useExitTicketsByClass.ts` — `ExitTicketByClass` interface now includes `exit_ticket_template_id`
- `src/hooks/useAssessments.tsx` — exit ticket runs (`is_exit_ticket=true`) filtered out of the class assessments list

**Deleted:**
- `src/hooks/useExitTickets.ts` — replaced by `useExitTicketTemplates`

**Unchanged (still work without modification):**
- `TakeExitTicket.tsx`, `AssessmentDetail.tsx`, all analytics hooks, `useSubmitExitTicket`, `useActiveExitTickets` — all query by `task_id` and are unaffected

**Key files:**
- `supabase/migrations/20260430000000_exit_ticket_templates.sql` — schema changes
- `src/hooks/useExitTicketTemplates.ts` — template query hook
- `src/hooks/useRunsForTemplate.ts` — runs per template query hook
- `src/hooks/useDeployTemplate.ts` — deploy mutation
- `src/hooks/useClearRun.ts` — clear results mutation
- `src/hooks/useDeleteRun.ts` — remove run mutation
- `src/pages/CreateExitTicket.tsx` — template editor
- `src/pages/ExitTickets.tsx` — template library page

---

### Teacher SSO — End-to-End Working (2026-04-27)

**What was fixed and deployed:**

- **Teacher SSO flow is now fully working** — teachers can sign in via edufied.com.au and land on the Pulse dashboard with a real Supabase session.
- **Root cause of "Session expired" loop** — `generateLink` returns `properties.hashed_token`, not `properties.token_hash`. The edge function was checking the wrong field name, so the token_hash was always undefined and the function returned a 500.
- **Secondary issue** — edge function was deployed with `verify_jwt: true` (default), which rejected unauthenticated requests before the function code ran. Fixed with `--no-verify-jwt` flag on deploy.
- **Tertiary issue** — if a teacher previously did a direct email/password login, a Supabase auth account already existed. `createUser` would fail with duplicate email. Fixed by calling `listUsers` first and finding the existing account before attempting to create.
- **`teacher_profiles` upsert made non-fatal** — wrapped in try/catch so a missing table can't block the SSO login.
- **Netlify env var added** — `VITE_CENTRAL_HUB_URL` added to Netlify site environment variables.

**Key files:**
- `supabase/functions/teacher-sso/index.ts` — all fixes above (deployed with `--no-verify-jwt`)
- `src/pages/TeacherSSO.tsx` — handles SSO callback at `/auth/teacher/sso`
- `src/pages/Login.tsx` — "Sign in with edufied" primary button, collapsible fallback

**Deploy command (if re-deploying the edge function):**
```bash
npx supabase functions deploy teacher-sso --project-ref aogorchudxilnkhtfvqq --no-verify-jwt
```

---

### Central Student Authentication + PIN Hashing + Credential Hardening (2026-04-23)

**What was built:**

- **Two-database student auth** — students in `ClassJoin.tsx` now log in with a username + PIN instead of picking their name from a list. Verification runs against a separate central Supabase DB (`edufied-auth`) that will eventually serve as SSO across all teacher tools.
- **`students.central_id`** (migration: `20260423000000_add_central_id_to_students.sql`) — nullable UUID column added to the local `students` table to bridge local records to the central DB. All 129 students have been manually populated.
- **Three-step verification flow** in `ClassJoin.tsx`:
  1. `verify(username, pin)` — queries central DB by username, uses `bcrypt.compare()` to check PIN against hash
  2. Local lookup — finds the local student row where `central_id` matches the central UUID
  3. Enrolment check — confirms the local student is enrolled in this class
  - All three must pass or the student sees an error. The `studentId` passed downstream (exit tickets, results, analytics) is always the **local UUID** — nothing else changed.
- **bcrypt PIN hashing** — `scripts/hash-pins.js` ran once to hash all 129 plain-text PINs in the central DB (salt rounds: 10). PINs are now irreversibly hashed. `useStudentVerification.ts` uses `bcrypt.compare()` accordingly.
- **Hardcoded credentials removed** — `src/integrations/supabase/client.ts`, `centralClient.ts`, and `src/config/database.ts` no longer have fallback keys baked in. All four env vars are required; missing vars throw a clear error at startup.
- **Netlify MCP configured** — `.mcp.json` created with `@netlify/mcp` server and token. Approved via `enabledMcpjsonServers` in `.claude/settings.local.json`. Both files are in `.gitignore`.

**Pending:**
- Confirm Netlify MCP connects (needs Claude Code restart)
- Add all four env vars to Netlify site settings → Environment variables
- Run `npm run db:push` if `central_id` migration hasn't been applied to remote yet

**Key files:**
- `supabase/migrations/20260423000000_add_central_id_to_students.sql` — adds `central_id` to students
- `src/integrations/supabase/centralClient.ts` — second Supabase client for edufied-auth
- `src/hooks/useStudentVerification.ts` — central DB username + bcrypt PIN verification
- `src/pages/ClassJoin.tsx` — three-step login flow replacing name picker
- `scripts/hash-pins.js` — one-off PIN hashing script (already run, keep for reference)

---

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
  - Edit button navigating to `/exit-tickets/create?taskId=...`
- **Student landing page** (`src/pages/StudentLanding.tsx`) — new public page at `/student-landing`. Simple "Student Portal" landing with a "Sign In" button that navigates to `/join`.
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
- `src/pages/StudentLanding.tsx` — student portal landing page (redirects to `/join`)
- `src/pages/TakeExitTicket.tsx` — question type normalisation fix
- `src/App.tsx` — routing updates

---

### Exit Tickets System — Activities Rework (2026-04-14)

**What was built:**
- **Replaced Activities with Exit Tickets** — the old Activities section (`activities`, `activity_quizzes`, `quiz_questions`, `quiz_answers`, `activity_forms`) was removed and replaced with Exit Tickets built directly on the `tasks` + `questions` tables. This means student submissions are automatically stored as assessment results and appear in dashboards/reports with zero extra work.
- **Database changes** (migration: `20260414000000_add_exit_ticket_support.sql`):
  - `class_code` added to `classes` (legacy — no longer used by student flow; students now sign in via `/join`)
  - `is_exit_ticket` and `status` (`draft` / `active` / `closed`) added to `tasks`
  - New `question_options` table for multiple-choice answer storage
  - `response_data` JSONB added to `question_results` for text-based answers
  - New RLS policies so anonymous students can view active exit tickets and submit results
- **Teacher UI**:
  - `Activities` renamed to `Exit Tickets` in the sidebar and page titles
  - `src/pages/Activities.tsx` — lists exit tickets with status, question count, and class code URL
  - `src/pages/CreateExitTicket.tsx` — creation/editing page supporting title, class, tags (Bloom's, content descriptor, key skill, task type), and dynamic questions (multiple choice, short answer, extended answer). Teachers can add/remove options, mark correct answers, and activate/deactivate tickets.
- **Student UI** (public, authenticated via username + PIN):
  - `src/pages/ClassJoin.tsx` — route `/join`. Students sign in with username + PIN (verified against central DB), then redirected to `/student/dashboard`.
  - `src/pages/StudentDashboard.tsx` — route `/student/dashboard`. Shows active exit tickets and homework across all enrolled classes.
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
- `src/pages/ClassJoin.tsx` — student sign-in page (username + PIN)
- `src/pages/StudentDashboard.tsx` — student dashboard with exit tickets and homework
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
