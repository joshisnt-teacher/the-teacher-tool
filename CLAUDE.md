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
