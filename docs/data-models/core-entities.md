# Pulse Data Model — Core Entities

> **Date:** 2026-04-30  
> **Scope:** Classes, students, teachers, schools, curriculum, class sessions, and notes.  
> **Purpose:** Reference doc for how the foundational data model works across Pulse.

---

## 1. Classes

### Table: `classes`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `class_name` | text | e.g. "10A History" |
| `subject` | text | e.g. "History" |
| `year_level` | text | e.g. "10" |
| `term` | text | e.g. "Term 1" |
| `start_date` | date | |
| `end_date` | date | |
| `teacher_id` | UUID | FK → `users` (auth user) |
| `school_id` | UUID | FK → `schools` |
| `curriculum_id` | UUID | FK → `curriculum` |
| `class_code` | text | Unique 6-character code for student join |
| `is_demo` | boolean | Excludes from dashboard stats |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### Class Creation Flow
- **Page:** `src/pages/CreateClass.tsx`
- **Route:** `/create-class`
- Teacher fills: name, subject, year level, term, dates, curriculum
- Generates a unique 6-char `class_code`
- Students join via `/:classCode` (public route)

### Key Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useClasses` | `src/hooks/useClasses.tsx` | Fetch all classes for the logged-in teacher |
| `useClassSessions` | `src/hooks/useClassSessions.tsx` | Create / update / fetch sessions for a class |
| `useCurrentClassSession` | `src/hooks/useClassSessions.tsx` | Get the currently active session |

---

## 2. Students

### Table: `students`

> **Note:** Multi-class support was added in migration `20260421000000_multi_class_students.sql`. Students are now global per-teacher, not tied to a single class.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `student_id` | text | School-provided ID (e.g. "12345") |
| `first_name` | text | |
| `last_name` | text | |
| `teacher_id` | UUID | FK → `users` (owns the student record) |
| `central_id` | UUID | For SSO / central identity integration |
| `year_level` | text | |
| `email` | text | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### Enrolments (Many-to-Many)

**Table:** `enrolments`

| Column | Type | Notes |
|--------|------|-------|
| `class_id` | UUID | FK → `classes` |
| `student_id` | UUID | FK → `students` |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

A student can be enrolled in multiple classes. The `enrolments` table is the source of truth for class rosters.

### Key Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useStudents` | `src/hooks/useStudents.tsx` | Fetch students (with optional class filter) |
| `useStudentSession` | `src/hooks/useStudentSession.tsx` | Student-side session data |

---

## 3. Teachers & Schools

### Table: `users` (teachers)

This table mirrors `auth.users` and stores teacher profile data.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Same as `auth.users` PK |
| `email` | text | |
| `name` | text | Display name |
| `role` | text | e.g. "teacher", "admin" |
| `school_id` | UUID | FK → `schools` |
| `openai_vault_id` | text | For AI marking API key storage |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### Table: `teacher_profiles` (SSO bridge)

Links local auth identity to a central SSO identity.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Same as `auth.users` PK |
| `central_teacher_id` | UUID | Central system ID |
| `email` | text | |
| `first_name` | text | |
| `last_name` | text | |

### Table: `schools`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `name` | text | School name |
| `code` | text | Unique school code |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### Key Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useAuth` | `src/hooks/useAuth.tsx` | Auth state, login, logout |
| `useSchools` | `src/hooks/useSchools.tsx` | Fetch schools list |

---

## 4. Curriculum

### Hierarchy

```
curriculum
  └── strand
        └── content_item
              └── class_content_item (links to class)
```

### Table: `curriculum`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `name` | text | e.g. "Australian Curriculum v9" |
| `subject` | text | e.g. "History" |
| `year_level` | text | e.g. "7" |
| `code` | text | Short code |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### Table: `strand`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `curriculum_id` | UUID | FK → `curriculum` |
| `name` | text | e.g. "Knowledge and Understanding" |
| `code` | text | |
| `description` | text | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### Table: `content_item`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `strand_id` | UUID | FK → `strand` |
| `code` | text | e.g. `ACHGK040` |
| `description` | text | Full descriptor text |
| `display_code` | text | Human-readable code |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### Table: `class_content_item`

Links classes to the content descriptors they cover.

| Column | Type | Notes |
|--------|------|-------|
| `class_id` | UUID | FK → `classes` |
| `content_item_id` | UUID | FK → `content_item` |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### Curriculum Linkage in Questions

Questions can link to content items via `questions.content_item` (stores the **code string**, e.g. `ACHGK040`). This is a denormalised reference for quick lookup without a join.

### Key Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useCurriculum` | `src/hooks/useCurriculum.tsx` | Fetch all curricula |
| `useStrands` | `src/hooks/useStrands.tsx` | Fetch strands for a curriculum |
| `useClassContentItems` | `src/hooks/useClassContentItems.tsx` | Fetch content items linked to a class |
| `useContentItems` | `src/hooks/useContentItems.tsx` | Browse all content items with tags |
| `useTags` | `src/hooks/useTags.tsx` | Fetch tags by category |

---

## 5. Class Sessions & Notes

### Table: `class_sessions`

Represents a single lesson / session.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `class_id` | UUID | FK → `classes` |
| `started_at` | timestamptz | When the lesson started |
| `ended_at` | timestamptz | When the lesson ended |
| `title` | text | Optional title |
| `description` | text | Optional description |
| `teacher_notes` | text | Post-lesson private notes |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### Table: `student_notes`

Teacher notes about individual students during a session.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `student_id` | UUID | FK → `students` |
| `class_session_id` | UUID | FK → `class_sessions` |
| `note` | text | Note content |
| `rating` | integer | -5 to +5 (sentiment/quick flag) |
| `category` | text | `'Academic'` \| `'Pastoral'` \| `'Other'` |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### Session Flow

```
Classroom.tsx
  → useClassSessions.tsx (create/update sessions)
  → useCurrentClassSession.tsx
    → StudentGrid.tsx + ClassroomActivities.tsx
      → useCreateStudentNote.tsx (notes during lesson)
      → handleSaveLesson() closes session + closes exit tickets
        → SessionDetails.tsx shows notes + exit tickets for session
```

### Key Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useClassSessions` | `src/hooks/useClassSessions.tsx` | CRUD for class sessions |
| `useClassSessionsList` | `src/hooks/useClassSessionsList.tsx` | List sessions for a class |
| `useStudentNotes` | `src/hooks/useStudentNotes.tsx` | Fetch notes for a student |
| `useCreateStudentNote` | `src/hooks/useStudentNotes.tsx` | Create a note |

---

## 6. Resources

### Table: `resources`

Shared teaching resources.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `title` | text | |
| `description` | text | |
| `url` | text | Link or file path |
| `resource_type` | text | e.g. "pdf", "link", "video" |
| `teacher_id` | UUID | FK → `users` |
| `school_id` | UUID | FK → `schools` |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### Table: `class_resources`

Links resources to classes.

| Column | Type | Notes |
|--------|------|-------|
| `class_id` | UUID | FK → `classes` |
| `resource_id` | UUID | FK → `resources` |
| `created_at` | timestamptz | Auto |

---

## 7. Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   schools   │◄────┤    users    │     │  curriculum │
│   (1)       │     │  (teachers) │     │    (1)      │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │             ┌─────┴─────┐             │
       │             │           │             │
       │        ┌────┴───┐  ┌────┴────┐        │
       │        │classes │  │students │        │
       │        │  (N)   │  │   (N)   │        │
       │        └───┬────┘  └────┬────┘        │
       │            │            │             │
       │            │      ┌─────┴─────┐       │
       │            │      │ enrolments│       │
       │            │      │  (N:M)    │       │
       │            │      └───────────┘       │
       │            │                          │
       │      ┌─────┴──────┐                   │
       │      │class_content│                  │
       │      │   _item    │                  │
       │      └────────────┘                  │
       │                                      │
       │                              ┌───────┴───────┐
       │                              │     strand    │
       │                              │      (N)      │
       │                              └───────┬───────┘
       │                                      │
       │                              ┌───────┴───────┐
       │                              │  content_item │
       │                              │      (N)      │
       │                              └───────────────┘
       │
       │      ┌─────────────┐     ┌─────────────────┐
       │      │   tasks     │     │  class_sessions   │
       └──────┤(assessments)│     │      (N)          │
              │   & exit     │     └────────┬────────┘
              │   tickets    │              │
              └──────┬───────┘      ┌───────┴───────┐
                     │              │ student_notes │
              ┌──────┴──────┐       │      (N)      │
              │  questions  │       └───────────────┘
              │     (N)     │
              └──────┬──────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────┴───┐ ┌─────┴──────┐ ┌──┴──────────┐
    │question│ │  question  │ │   results   │
    │options │ │  results   │ │    (N)      │
    │  (N)   │ │    (N)     │ └─────────────┘
    └────────┘ └────────────┘
```

---

## 8. Key File Paths

| Category | Path |
|----------|------|
| DB Types | `src/integrations/supabase/types.ts` |
| Class Create Page | `src/pages/CreateClass.tsx` |
| Classroom Page | `src/pages/Classroom.tsx` |
| Session Details Page | `src/pages/SessionDetails.tsx` |
| Class Dashboard | `src/pages/ClassDashboard.tsx` |
| Student Report | `src/pages/StudentReport.tsx` |
| Classes Hook | `src/hooks/useClasses.tsx` |
| Students Hook | `src/hooks/useStudents.tsx` |
| Class Sessions Hook | `src/hooks/useClassSessions.tsx` |
| Student Notes Hook | `src/hooks/useStudentNotes.tsx` |
| Curriculum Hook | `src/hooks/useCurriculum.tsx` |
| Strands Hook | `src/hooks/useStrands.tsx` |
| Class Content Items Hook | `src/hooks/useClassContentItems.tsx` |
| Content Items Hook | `src/hooks/useContentItems.tsx` |
| Tags Hook | `src/hooks/useTags.tsx` |
| Auth Hook | `src/hooks/useAuth.tsx` |
| Schools Hook | `src/hooks/useSchools.tsx` |
| Student Grid Component | `src/components/classroom/StudentGrid.tsx` |
| Classroom Activities | `src/components/classroom/ClassroomActivities.tsx` |
| Class Sessions Component | `src/components/class-dashboard/ClassSessions.tsx` |
| Multi-class Students Migration | `supabase/migrations/20260421000000_multi_class_students.sql` |
