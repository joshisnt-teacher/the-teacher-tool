# Lesson Runner — Pulse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Pulse from an exit-ticket + resource distributor into a full live-lesson platform. Teachers import structured lessons from Atlas (or build them manually) containing slides, embedded interactions, and metadata. When a teacher "runs" a lesson, students see slides synced in real-time with a persistent "lower thirds" panel for questions, polls, links, and exit tickets. All responses are tracked per-student and published as an end-of-lesson report.

**Architecture:** Extends the existing `class_sessions` model with an optional `lesson_template_id`. When a session has a lesson, the Classroom switches into "presenter mode" with slide navigation and interaction publishing. Students receive slide changes via Supabase Realtime broadcast (first use of Realtime in Pulse). The student UI is a new full-screen layout: slides in the main viewport, lower-thirds drawer for active interactions. Responses feed into a new `lesson_responses` table, aggregated into a `lesson_reports` view at session end.

**Tech Stack:** React 18 + TypeScript + Vite, Supabase (PostgreSQL + Realtime broadcast), TanStack Query, shadcn/ui, Tailwind CSS, lucide-react, date-fns.

**Note:** No test runner is configured. Each task ends with `npm run build` to catch TypeScript errors, then a commit.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Data Model Changes](#2-data-model-changes)
3. [Atlas Import Contract](#3-atlas-import-contract)
4. [Phase 1: Foundation (DB + Types + Hooks)](#phase-1-foundation)
5. [Phase 2: Teacher Presenter Mode](#phase-2-teacher-presenter-mode)
6. [Phase 3: Student Lesson Viewer](#phase-3-student-lesson-viewer)
7. [Phase 4: Real-Time Sync](#phase-4-real-time-sync)
8. [Phase 5: End-of-Lesson Reporting](#phase-5-end-of-lesson-reporting)
9. [Phase 6: Atlas Integration](#phase-6-atlas-integration)
10. [Appendix: UI Mock Descriptions](#appendix-ui-mock-descriptions)

---

## 1. Executive Summary

### What Changes

| Area | Current State | New State |
|------|---------------|-----------|
| **Lesson content** | None. Lessons are just `class_sessions` with a title. | Structured lessons with slides, content blocks, and embedded interactions. |
| **Teacher during class** | Toggles exit tickets and resources on/off. | Navigates slides, publishes interactions to lower-thirds, sees live response counts. |
| **Student during class** | Sees dashboard list of active tickets + links. | Full-screen slide viewer + lower-thirds panel for live questions/polls/links. |
| **Real-time sync** | None. Students must refresh to see new items. | Supabase Realtime broadcast keeps all student screens in sync with teacher. |
| **In-lesson questions** | Only via separate exit tickets. | Inline interactions (poll, quiz, short-answer, draw, link) published ad-hoc or pre-placed on slides. |
| **Reports** | Per-exit-ticket results at `/assessment/:id`. | End-of-lesson report aggregating all interactions, participation, and notes. |
| **Content source** | Teachers build exit tickets manually in Pulse. | Teachers import from Atlas (lesson planning platform) or build manually. |

### Key Design Decisions

1. **Slide content format:** JSONB array of typed content blocks (`heading`, `paragraph`, `image`, `bulleted_list`, `video_embed`, `iframe`). This gives us layout flexibility without building a full rich-text editor. Images are uploaded to Supabase Storage and referenced by URL.
2. **Interaction placement:** Interactions can be **slide-bound** (pre-placed on a specific slide, e.g. a reflection question at the end of slide 3) or **ad-hoc** (teacher publishes spontaneously from a palette during the lesson). Slide-bound interactions auto-publish when the teacher reaches that slide. Ad-hoc ones are manually triggered.
3. **Real-time transport:** Supabase Realtime `broadcast` channels. Channel name: `classroom:{class_session_id}`. Events: `slide_change`, `interaction_publish`, `interaction_close`, `lesson_end`. This is lightweight, requires no new infrastructure, and fits our existing Supabase setup.
4. **Student identity during lesson:** Students already join via class code and have a `student_id` in localStorage (`useStudentSession`). The lesson viewer reads this and subscribes to the broadcast channel. No new auth needed.
5. **Backwards compatibility:** `class_sessions` gets two new nullable columns: `lesson_template_id` and `mode` (`'freeform' | 'structured'`). When `mode` is null or `'freeform'`, the existing Classroom behaviour is unchanged. Teachers opt-in to structured lessons per-session.

---

## 2. Data Model Changes

### Migration: `20260531000000_lesson_runner.sql`

#### 2.1 Extend `class_sessions`

```sql
ALTER TABLE class_sessions
  ADD COLUMN lesson_template_id UUID REFERENCES lesson_templates(id) ON DELETE SET NULL,
  ADD COLUMN mode TEXT CHECK (mode IN ('freeform', 'structured')) DEFAULT 'freeform',
  ADD COLUMN current_slide_index INTEGER DEFAULT 0;

-- Index for fast lookup of structured sessions
CREATE INDEX idx_class_sessions_lesson_template ON class_sessions(lesson_template_id);
```

#### 2.2 `lesson_templates`

Reusable lesson definitions. Imported from Atlas or created manually.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `title` | text | |
| `description` | text | |
| `success_criteria` | JSONB | Array of strings |
| `learning_intentions` | JSONB | Array of strings |
| `teacher_id` | UUID | FK → `users` |
| `school_id` | UUID | FK → `schools` |
| `source` | text | `'atlas'` \| `'manual'` |
| `atlas_lesson_id` | text | External ID for sync |
| `metadata` | JSONB | Extra Atlas fields (subject, year, duration, etc.) |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

#### 2.3 `lesson_template_slides`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `lesson_template_id` | UUID | FK → `lesson_templates` (cascade delete) |
| `order` | integer | 0-based display order |
| `title` | text | Slide heading |
| `content_blocks` | JSONB | Array of content block objects |
| `layout` | text | `'default'` \| `'split'` \| `'image_full'` \| `'title_only'` |
| `background_colour` | text | Optional hex colour |
| `background_image_url` | text | Optional |
| `created_at` | timestamptz | Auto |

**Content block schema (TypeScript):**

```ts
type ContentBlock =
  | { type: 'heading'; text: string; level: 1 | 2 | 3 }
  | { type: 'paragraph'; text: string; align?: 'left' | 'center' | 'right' }
  | { type: 'bulleted_list'; items: string[] }
  | { type: 'numbered_list'; items: string[] }
  | { type: 'image'; url: string; alt?: string; caption?: string }
  | { type: 'video_embed'; url: string; provider: 'youtube' | 'vimeo' }
  | { type: 'iframe'; src: string; title?: string; aspect_ratio?: '16:9' | '4:3' | '1:1' }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'divider' };
```

#### 2.4 `lesson_template_interactions`

Pre-defined interactions attached to a lesson template. Can be bound to a slide or floating.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `lesson_template_id` | UUID | FK → `lesson_templates` (cascade delete) |
| `slide_id` | UUID | FK → `lesson_template_slides` (nullable = ad-hoc/floating) |
| `type` | text | `'poll'` \| `'quiz'` \| `'short_answer'` \| `'draw'` \| `'link'` \| `'exit_ticket_ref'` |
| `config` | JSONB | Type-specific configuration (see below) |
| `order` | integer | Display order within slide or palette |
| `trigger` | text | `'manual'` \| `'on_slide_enter'` \| `'on_slide_exit'` |
| `created_at` | timestamptz | Auto |

**Config schemas:**

```ts
type InteractionConfig =
  | { type: 'poll'; question: string; options: string[]; allow_multiple: boolean }
  | { type: 'quiz'; question: string; options: string[]; correct_option_index: number; explanation?: string }
  | { type: 'short_answer'; question: string; max_chars?: number; marking_criteria?: string }
  | { type: 'draw'; prompt: string; background_image_url?: string }
  | { type: 'link'; title: string; url: string; open_in_new_tab: boolean }
  | { type: 'exit_ticket_ref'; task_id: string }; // references existing tasks table
```

#### 2.5 `lesson_instance_interactions`

A published interaction during a running lesson. Created when the teacher publishes (or auto-publishes on slide enter).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `class_session_id` | UUID | FK → `class_sessions` (cascade delete) |
| `template_interaction_id` | UUID | FK → `lesson_template_interactions` |
| `status` | text | `'draft'` \| `'active'` \| `'closed'` |
| `published_at` | timestamptz | |
| `closed_at` | timestamptz | |
| `published_by` | UUID | FK → `users` |
| `response_count` | integer | Cached count, updated via trigger |
| `created_at` | timestamptz | Auto |

#### 2.6 `lesson_responses`

Student responses to published interactions.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `lesson_instance_interaction_id` | UUID | FK → `lesson_instance_interactions` (cascade delete) |
| `student_id` | UUID | FK → `students` |
| `class_session_id` | UUID | FK → `class_sessions` |
| `response_data` | JSONB | Type-specific payload |
| `raw_score` | integer | For quiz/short-answer types |
| `percent_score` | integer | 0-100 |
| `submitted_at` | timestamptz | |
| `created_at` | timestamptz | Auto |

**Response data schemas:**

```ts
type LessonResponseData =
  | { type: 'poll'; selected_indices: number[] }
  | { type: 'quiz'; selected_index: number }
  | { type: 'short_answer'; text: string }
  | { type: 'draw'; image_data_url: string }
  | { type: 'link'; clicked_at: string }
  | { type: 'exit_ticket_ref'; result_id: string }; // points to results table
```

#### 2.7 `lesson_reports` (materialized view or table)

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `class_session_id` | UUID | FK → `class_sessions` (unique) |
| `summary` | JSONB | Aggregated stats (participation %, avg score, slide time, etc.) |
| `student_breakdown` | JSONB | Array of per-student participation records |
| `interaction_breakdown` | JSONB | Array of per-interaction response summaries |
| `generated_at` | timestamptz | |

For MVP, this can be a view computed on-demand. Later, materialize for performance.

#### 2.8 RLS Policies

```sql
-- Teachers can CRUD their own lesson templates
CREATE POLICY "Teachers own lesson templates" ON lesson_templates
  FOR ALL USING (teacher_id = auth.uid());

-- Students can read slides of lessons assigned to their enrolled classes
CREATE POLICY "Students can read lesson slides" ON lesson_template_slides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_sessions cs
      JOIN enrolments e ON e.class_id = cs.class_id
      JOIN students s ON s.id = e.student_id
      WHERE cs.lesson_template_id = lesson_template_slides.lesson_template_id
      AND s.central_id = auth.uid() -- or use student session metadata
    )
  );

-- Simplified for anon student sessions:
-- lesson_template_slides, lesson_template_interactions are readable by anon
-- (student identity is query-param based, not JWT)
CREATE POLICY "Anon students can read lesson content" ON lesson_template_slides FOR SELECT TO anon USING (true);
CREATE POLICY "Anon students can read interactions" ON lesson_template_interactions FOR SELECT TO anon USING (true);
CREATE POLICY "Anon students can read instance interactions" ON lesson_instance_interactions FOR SELECT TO anon USING (true);
CREATE POLICY "Anon students can create responses" ON lesson_responses FOR INSERT TO anon USING (true);
CREATE POLICY "Anon students can read own responses" ON lesson_responses FOR SELECT TO anon USING (true);
```

---

## 3. Atlas Import Contract

Atlas (not yet built) will expose a REST API or webhook. Pulse consumes it via a Supabase Edge Function.

### Import Payload (what Atlas sends)

```ts
interface AtlasLessonPayload {
  atlas_lesson_id: string;
  title: string;
  description?: string;
  learning_intentions: string[];
  success_criteria: string[];
  subject: string;
  year_level: string;
  estimated_minutes: number;
  slides: AtlasSlide[];
  resources: AtlasResource[];
}

interface AtlasSlide {
  order: number;
  title: string;
  layout: 'default' | 'split' | 'image_full' | 'title_only';
  content_blocks: ContentBlock[];
  background_image_url?: string;
  background_colour?: string;
}

interface AtlasResource {
  title: string;
  url: string;
  resource_type: 'pdf' | 'link' | 'video';
}
```

### Edge Function: `atlas-import`

**File:** `supabase/functions/atlas-import/index.ts`

- Receives `POST` with `AtlasLessonPayload` + `teacher_id` + `school_id`.
- Validates payload with Zod.
- Inserts into `lesson_templates`, `lesson_template_slides`, `lesson_template_interactions` (resources become `link` interactions or rows in `resources` table).
- Returns `{ lesson_template_id: string }`.
- For MVP, accept a JSON file upload on the client as a manual import fallback.

---

## Phase 1: Foundation (DB + Types + Hooks)

### Task 1.1: Database Migration

**Files:**
- Create: `supabase/migrations/20260531000000_lesson_runner.sql`

- [ ] **Step 1: Write the migration**

Combine all DDL from Section 2 above into a single migration file. Include:
- `ALTER TABLE class_sessions` (add columns)
- Create `lesson_templates`, `lesson_template_slides`, `lesson_template_interactions`, `lesson_instance_interactions`, `lesson_responses`
- Indexes and RLS policies
- A trigger on `lesson_responses` that increments `lesson_instance_interactions.response_count`

- [ ] **Step 2: Run migration locally**

```bash
cd C:\Users\joshu\CodingProjects\Edufied\the-teacher-tool
npx supabase migration up
```

Expected: Migration applies with no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260531000000_lesson_runner.sql
git commit -m "feat(db): add lesson runner tables and RLS policies"
```

---

### Task 1.2: Regenerate Supabase Types

**Files:**
- Modify: `src/integrations/supabase/types.ts`

- [ ] **Step 1: Regenerate types**

```bash
npx supabase gen types typescript --local --schema public > src/integrations/supabase/types.ts
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: Build completes with no new errors (may need to fix any breaking type changes in existing code if column types shifted).

- [ ] **Step 3: Commit**

```bash
git add src/integrations/supabase/types.ts
git commit -m "chore(types): regenerate supabase types for lesson runner"
```

---

### Task 1.3: Create Data Hooks

**Files:**
- Create: `src/hooks/useLessonTemplates.tsx`
- Create: `src/hooks/useLessonSlides.tsx`
- Create: `src/hooks/useLessonInstanceInteractions.tsx`
- Create: `src/hooks/useLessonResponses.tsx`

- [ ] **Step 1: Create `useLessonTemplates.tsx`**

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useLessonTemplates(teacherId?: string) {
  return useQuery({
    queryKey: ['lesson-templates', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_templates')
        .select('*')
        .eq('teacher_id', teacherId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!teacherId,
  });
}

export function useImportLessonFromAtlas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      atlasPayload: unknown;
      teacher_id: string;
      school_id: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('atlas-import', {
        body: payload,
      });
      if (error) throw error;
      return data as { lesson_template_id: string };
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-templates', vars.teacher_id] });
    },
  });
}
```

- [ ] **Step 2: Create `useLessonSlides.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useLessonSlides(lessonTemplateId?: string) {
  return useQuery({
    queryKey: ['lesson-slides', lessonTemplateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_template_slides')
        .select('*')
        .eq('lesson_template_id', lessonTemplateId!)
        .order('order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!lessonTemplateId,
  });
}
```

- [ ] **Step 3: Create `useLessonInstanceInteractions.tsx`**

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useLessonInstanceInteractions(classSessionId?: string) {
  return useQuery({
    queryKey: ['lesson-instance-interactions', classSessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_instance_interactions')
        .select('*, template:lesson_template_interactions(*)')
        .eq('class_session_id', classSessionId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!classSessionId,
  });
}

export function usePublishInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      class_session_id,
      template_interaction_id,
    }: {
      class_session_id: string;
      template_interaction_id: string;
    }) => {
      const { data, error } = await supabase
        .from('lesson_instance_interactions')
        .insert({
          class_session_id,
          template_interaction_id,
          status: 'active',
          published_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['lesson-instance-interactions', vars.class_session_id],
      });
    },
  });
}

export function useCloseInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      class_session_id,
    }: {
      id: string;
      class_session_id: string;
    }) => {
      const { error } = await supabase
        .from('lesson_instance_interactions')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['lesson-instance-interactions', vars.class_session_id],
      });
    },
  });
}
```

- [ ] **Step 4: Create `useLessonResponses.tsx`**

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useLessonResponses(interactionId?: string) {
  return useQuery({
    queryKey: ['lesson-responses', interactionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_responses')
        .select('*, student:students(id, first_name, last_name)')
        .eq('lesson_instance_interaction_id', interactionId!)
        .order('submitted_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!interactionId,
  });
}

export function useSubmitLessonResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      lesson_instance_interaction_id: string;
      student_id: string;
      class_session_id: string;
      response_data: unknown;
      raw_score?: number;
      percent_score?: number;
    }) => {
      const { data, error } = await supabase
        .from('lesson_responses')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['lesson-responses', vars.lesson_instance_interaction_id],
      });
    },
  });
}
```

- [ ] **Step 5: Verify build passes**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useLessonTemplates.tsx src/hooks/useLessonSlides.tsx src/hooks/useLessonInstanceInteractions.tsx src/hooks/useLessonResponses.tsx
git commit -m "feat(hooks): add lesson runner data hooks"
```

---

## Phase 2: Teacher Presenter Mode

### Task 2.1: Extend `useClassSessions` for Lesson Mode

**Files:**
- Modify: `src/hooks/useClassSessions.tsx`

- [ ] **Step 1: Add `startStructuredLesson` mutation**

```tsx
export function useStartStructuredLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      class_id,
      lesson_template_id,
      title,
    }: {
      class_id: string;
      lesson_template_id: string;
      title?: string;
    }) => {
      const { data, error } = await supabase
        .from('class_sessions')
        .insert({
          class_id,
          lesson_template_id,
          mode: 'structured',
          title: title ?? 'Structured Lesson',
          started_at: new Date().toISOString(),
          current_slide_index: 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['class-sessions', vars.class_id] });
      queryClient.invalidateQueries({ queryKey: ['current-class-session', vars.class_id] });
    },
  });
}
```

- [ ] **Step 2: Add `updateCurrentSlide` mutation**

```tsx
export function useUpdateCurrentSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      session_id,
      slide_index,
    }: {
      session_id: string;
      slide_index: number;
    }) => {
      const { error } = await supabase
        .from('class_sessions')
        .update({ current_slide_index: slide_index })
        .eq('id', session_id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['current-class-session'] });
    },
  });
}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useClassSessions.tsx
git commit -m "feat(hooks): extend class sessions for structured lesson mode"
```

---

### Task 2.2: Create Slide Viewer Component

**Files:**
- Create: `src/components/lesson/SlideViewer.tsx`
- Create: `src/components/lesson/ContentBlockRenderer.tsx`

- [ ] **Step 1: Create `ContentBlockRenderer.tsx`**

Renders a single content block based on its type. This is a pure presentational component.

```tsx
import React from 'react';
import { ContentBlock } from '@/types/lesson';

interface Props {
  block: ContentBlock;
}

export const ContentBlockRenderer: React.FC<Props> = ({ block }) => {
  switch (block.type) {
    case 'heading':
      const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;
      return <Tag className="font-bold text-foreground">{block.text}</Tag>;
    case 'paragraph':
      return (
        <p
          className="text-foreground leading-relaxed"
          style={{ textAlign: block.align ?? 'left' }}
        >
          {block.text}
        </p>
      );
    case 'bulleted_list':
      return (
        <ul className="list-disc pl-5 space-y-1">
          {block.items.map((item, i) => (
            <li key={i} className="text-foreground">{item}</li>
          ))}
        </ul>
      );
    case 'numbered_list':
      return (
        <ol className="list-decimal pl-5 space-y-1">
          {block.items.map((item, i) => (
            <li key={i} className="text-foreground">{item}</li>
          ))}
        </ol>
      );
    case 'image':
      return (
        <figure className="my-4">
          <img src={block.url} alt={block.alt ?? ''} className="rounded-lg max-h-[60vh] object-contain" />
          {block.caption && <figcaption className="text-sm text-muted-foreground mt-2 text-center">{block.caption}</figcaption>}
        </figure>
      );
    case 'video_embed':
      const embedUrl = block.provider === 'youtube'
        ? `https://www.youtube.com/embed/${extractYouTubeId(block.url)}`
        : block.url;
      return (
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
          <iframe src={embedUrl} title={block.url} className="w-full h-full" allowFullScreen />
        </div>
      );
    case 'iframe':
      return (
        <div
          className="w-full rounded-lg overflow-hidden border"
          style={{ aspectRatio: block.aspect_ratio?.replace(':', '/') ?? '16/9' }}
        >
          <iframe src={block.src} title={block.title ?? ''} className="w-full h-full" />
        </div>
      );
    case 'quote':
      return (
        <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
          <p>{block.text}</p>
          {block.attribution && <cite className="text-sm not-italic mt-1 block">— {block.attribution}</cite>}
        </blockquote>
      );
    case 'divider':
      return <hr className="my-6 border-border" />;
    default:
      return null;
  }
};

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return match?.[1] ?? '';
}
```

- [ ] **Step 2: Create `SlideViewer.tsx`**

```tsx
import React from 'react';
import { LessonTemplateSlide } from '@/integrations/supabase/types';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import { cn } from '@/lib/utils';

interface Props {
  slide: LessonTemplateSlide;
  className?: string;
}

export const SlideViewer: React.FC<Props> = ({ slide, className }) => {
  const contentBlocks = (slide.content_blocks as unknown[]) ?? [];

  return (
    <div
      className={cn(
        'w-full h-full flex flex-col p-8 overflow-y-auto',
        className
      )}
      style={slide.background_colour ? { backgroundColor: slide.background_colour } : undefined}
    >
      {slide.background_image_url && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
          style={{ backgroundImage: `url(${slide.background_image_url})` }}
        />
      )}
      <div className="relative z-10 max-w-4xl mx-auto w-full space-y-6">
        {contentBlocks.map((block, i) => (
          <ContentBlockRenderer key={i} block={block as any} />
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Create shared types file**

**Create:** `src/types/lesson.ts`

```ts
export type ContentBlock =
  | { type: 'heading'; text: string; level: 1 | 2 | 3 }
  | { type: 'paragraph'; text: string; align?: 'left' | 'center' | 'right' }
  | { type: 'bulleted_list'; items: string[] }
  | { type: 'numbered_list'; items: string[] }
  | { type: 'image'; url: string; alt?: string; caption?: string }
  | { type: 'video_embed'; url: string; provider: 'youtube' | 'vimeo' }
  | { type: 'iframe'; src: string; title?: string; aspect_ratio?: '16:9' | '4:3' | '1:1' }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'divider' };

export type InteractionType = 'poll' | 'quiz' | 'short_answer' | 'draw' | 'link' | 'exit_ticket_ref';

export type InteractionConfig =
  | { type: 'poll'; question: string; options: string[]; allow_multiple: boolean }
  | { type: 'quiz'; question: string; options: string[]; correct_option_index: number; explanation?: string }
  | { type: 'short_answer'; question: string; max_chars?: number; marking_criteria?: string }
  | { type: 'draw'; prompt: string; background_image_url?: string }
  | { type: 'link'; title: string; url: string; open_in_new_tab: boolean }
  | { type: 'exit_ticket_ref'; task_id: string };

export type LessonResponseData =
  | { type: 'poll'; selected_indices: number[] }
  | { type: 'quiz'; selected_index: number }
  | { type: 'short_answer'; text: string }
  | { type: 'draw'; image_data_url: string }
  | { type: 'link'; clicked_at: string }
  | { type: 'exit_ticket_ref'; result_id: string };
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/lesson/SlideViewer.tsx src/components/lesson/ContentBlockRenderer.tsx src/types/lesson.ts
git commit -m "feat(lesson): add slide viewer and content block renderer"
```

---

### Task 2.3: Create Teacher Lesson Presenter Overlay

**Files:**
- Create: `src/components/classroom/LessonPresenter.tsx`
- Modify: `src/pages/Classroom.tsx`

- [ ] **Step 1: Create `LessonPresenter.tsx`**

This is the teacher's slide control panel. It renders inside the Classroom page when `session.mode === 'structured'`.

```tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Play, Square, BarChart3 } from 'lucide-react';
import { SlideViewer } from '@/components/lesson/SlideViewer';
import { useLessonSlides } from '@/hooks/useLessonSlides';
import { useUpdateCurrentSlide } from '@/hooks/useClassSessions';
import { useLessonInstanceInteractions, usePublishInteraction, useCloseInteraction } from '@/hooks/useLessonInstanceInteractions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClassSessionRealtime } from '@/hooks/useClassSessionRealtime';

interface Props {
  session: {
    id: string;
    lesson_template_id: string;
    current_slide_index: number;
  };
}

export const LessonPresenter: React.FC<Props> = ({ session }) => {
  const { data: slides = [] } = useLessonSlides(session.lesson_template_id);
  const updateSlide = useUpdateCurrentSlide();
  const { data: interactions = [] } = useLessonInstanceInteractions(session.id);
  const publish = usePublishInteraction();
  const close = useCloseInteraction();
  const broadcast = useClassSessionRealtime(session.id);

  const currentSlide = slides[session.current_slide_index];
  const isFirst = session.current_slide_index === 0;
  const isLast = session.current_slide_index >= slides.length - 1;

  const goToSlide = (index: number) => {
    if (index < 0 || index >= slides.length) return;
    updateSlide.mutate({ session_id: session.id, slide_index: index });
    broadcast.sendSlideChange(index);
  };

  const handlePublish = (templateInteractionId: string) => {
    publish.mutate(
      { class_session_id: session.id, template_interaction_id: templateInteractionId },
      {
        onSuccess: (instance) => {
          broadcast.sendInteractionPublish(instance.id, templateInteractionId);
        },
      }
    );
  };

  const handleClose = (interactionId: string) => {
    close.mutate({ id: interactionId, class_session_id: session.id }, {
      onSuccess: () => {
        broadcast.sendInteractionClose(interactionId);
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Slide viewport */}
      <div className="flex-1 min-h-0 bg-background rounded-lg border overflow-hidden relative">
        {currentSlide ? (
          <SlideViewer slide={currentSlide} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No slides in this lesson.
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => goToSlide(session.current_slide_index - 1)} disabled={isFirst}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </Button>
          <span className="text-sm text-muted-foreground min-w-[80px] text-center">
            {session.current_slide_index + 1} / {slides.length}
          </span>
          <Button variant="outline" size="sm" onClick={() => goToSlide(session.current_slide_index + 1)} disabled={isLast}>
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Slide-bound interactions */}
          {currentSlide?.interactions?.map((ti: any) => {
            const active = interactions.find(
              (i) => i.template_interaction_id === ti.id && i.status === 'active'
            );
            return (
              <Button
                key={ti.id}
                size="sm"
                variant={active ? 'default' : 'outline'}
                onClick={() => (active ? handleClose(active.id) : handlePublish(ti.id))}
              >
                {active ? (
                  <><Square className="w-3 h-3 mr-1" /> Stop {ti.type}</>
                ) : (
                  <><Play className="w-3 h-3 mr-1" /> {ti.type}</>
                )}
                {active && active.response_count > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">{active.response_count}</Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Active interactions sidebar / drawer (optional compact view) */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {interactions
          .filter((i) => i.status === 'active')
          .map((i) => (
            <Card key={i.id} className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium flex items-center justify-between">
                  {i.template?.type}
                  <Badge variant="outline" className="text-xs">{i.response_count} responses</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground truncate">
                  {(i.template?.config as any)?.question ?? (i.template?.config as any)?.title ?? 'Interaction'}
                </p>
                <div className="flex gap-1 mt-2">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleClose(i.id)}>
                    <Square className="w-3 h-3 mr-1" /> Close
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs">
                    <BarChart3 className="w-3 h-3 mr-1" /> Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Modify `Classroom.tsx` to conditionally render `LessonPresenter`**

In the main Classroom layout, when `currentSession.mode === 'structured'`, replace the main content area with `LessonPresenter`. Keep the student grid in a collapsible side panel or tab.

```tsx
// Inside Classroom.tsx, in the main content area:
{currentSession?.mode === 'structured' && currentSession.lesson_template_id ? (
  <LessonPresenter session={currentSession} />
) : (
  <StudentGrid classId={classId} sessionId={currentSession?.id} />
)}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/classroom/LessonPresenter.tsx src/pages/Classroom.tsx
git commit -m "feat(classroom): add structured lesson presenter mode for teachers"
```

---

## Phase 3: Student Lesson Viewer

### Task 3.1: Create Student Lesson Page

**Files:**
- Create: `src/pages/StudentLesson.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `StudentLesson.tsx`**

Student full-screen lesson viewer. Slides occupy ~75% of the viewport. Lower-thirds drawer (~25%) shows active interactions.

```tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SlideViewer } from '@/components/lesson/SlideViewer';
import { useStudentSession } from '@/hooks/useStudentSession';
import { useClassSessionRealtime } from '@/hooks/useClassSessionRealtime';
import { useLessonInstanceInteractions } from '@/hooks/useLessonInstanceInteractions';
import { InteractionPanel } from '@/components/lesson/InteractionPanel';
import { cn } from '@/lib/utils';

const StudentLesson = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { session: studentSession } = useStudentSession();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(true);

  const { data: classSession } = useQuery({
    queryKey: ['class-session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_sessions')
        .select('*, lesson_template:lesson_templates(*)')
        .eq('id', sessionId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: slides = [] } = useQuery({
    queryKey: ['lesson-slides', classSession?.lesson_template_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_template_slides')
        .select('*')
        .eq('lesson_template_id', classSession!.lesson_template_id)
        .order('order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!classSession?.lesson_template_id,
  });

  const { data: interactions = [] } = useLessonInstanceInteractions(sessionId);
  const activeInteractions = interactions.filter((i) => i.status === 'active');

  // Subscribe to real-time broadcast
  const realtime = useClassSessionRealtime(sessionId!);
  useEffect(() => {
    if (!realtime) return;
    const unsubSlide = realtime.onSlideChange((index: number) => setCurrentSlideIndex(index));
    const unsubInteraction = realtime.onInteractionPublish(() => {
      // Toast or subtle animation to draw attention
    });
    const unsubClose = realtime.onInteractionClose((id: string) => {
      // Remove from panel
    });
    return () => {
      unsubSlide();
      unsubInteraction();
      unsubClose();
    };
  }, [realtime]);

  const currentSlide = slides[currentSlideIndex];

  if (!classSession) {
    return <div className="flex items-center justify-center h-screen">Loading lesson…</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Main slide area */}
      <div className={cn('flex-1 min-h-0 transition-all', drawerOpen ? 'h-[70vh]' : 'h-[95vh]')}>
        {currentSlide ? (
          <SlideViewer slide={currentSlide} className="h-full" />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Waiting for teacher to start…
          </div>
        )}
      </div>

      {/* Lower thirds drawer */}
      <div
        className={cn(
          'border-t bg-card transition-all duration-300 overflow-hidden flex flex-col',
          drawerOpen ? 'h-[30vh]' : 'h-[5vh]'
        )}
      >
        {/* Drawer handle */}
        <button
          className="w-full py-2 flex items-center justify-center text-xs text-muted-foreground hover:bg-muted transition-colors"
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          {drawerOpen ? '▼ Hide' : '▲ Show'} Activity
          {activeInteractions.length > 0 && (
            <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
              {activeInteractions.length}
            </span>
          )}
        </button>

        {/* Interaction content */}
        {drawerOpen && (
          <div className="flex-1 overflow-y-auto p-4">
            {activeInteractions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No active questions or activities. Wait for your teacher to share something.
              </p>
            ) : (
              <div className="space-y-4 max-w-2xl mx-auto">
                {activeInteractions.map((interaction) => (
                  <InteractionPanel
                    key={interaction.id}
                    interaction={interaction}
                    studentId={studentSession?.student_id}
                    classSessionId={sessionId!}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentLesson;
```

- [ ] **Step 2: Create `InteractionPanel.tsx`**

Renders the appropriate input UI for each interaction type.

```tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useSubmitLessonResponse } from '@/hooks/useLessonResponses';
import { toast } from 'sonner';

interface Props {
  interaction: any; // lesson_instance_interactions with template
  studentId?: string;
  classSessionId: string;
}

export const InteractionPanel: React.FC<Props> = ({ interaction, studentId, classSessionId }) => {
  const submit = useSubmitLessonResponse();
  const config = interaction.template?.config as any;
  const type = interaction.template?.type as string;

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!studentId) {
      toast.error('Not logged in');
      return;
    }
    let responseData: any;
    let rawScore: number | undefined;
    let percentScore: number | undefined;

    switch (type) {
      case 'poll':
        if (selectedIndices.length === 0) return;
        responseData = { type: 'poll', selected_indices: selectedIndices };
        break;
      case 'quiz':
        if (selectedIndex === null) return;
        responseData = { type: 'quiz', selected_index: selectedIndex };
        rawScore = selectedIndex === config.correct_option_index ? 1 : 0;
        percentScore = rawScore * 100;
        break;
      case 'short_answer':
        if (!textAnswer.trim()) return;
        responseData = { type: 'short_answer', text: textAnswer.trim() };
        break;
      case 'link':
        responseData = { type: 'link', clicked_at: new Date().toISOString() };
        break;
      default:
        return;
    }

    submit.mutate(
      {
        lesson_instance_interaction_id: interaction.id,
        student_id: studentId,
        class_session_id: classSessionId,
        response_data: responseData,
        raw_score: rawScore,
        percent_score: percentScore,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast.success('Submitted!');
        },
      }
    );
  };

  if (submitted) {
    return (
      <Card className="bg-emerald-500/5 border-emerald-500/20">
        <CardContent className="p-4 text-sm text-emerald-700">
          ✅ Response submitted. Wait for the next activity.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {config?.question ?? config?.title ?? config?.prompt ?? 'Activity'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {type === 'poll' && (
          <div className="space-y-2">
            {config.options.map((opt: string, i: number) => (
              <div key={i} className="flex items-center space-x-2">
                <Checkbox
                  id={`poll-${interaction.id}-${i}`}
                  checked={selectedIndices.includes(i)}
                  onCheckedChange={(checked) => {
                    setSelectedIndices((prev) =>
                      checked ? [...prev, i] : prev.filter((x) => x !== i)
                    );
                  }}
                />
                <Label htmlFor={`poll-${interaction.id}-${i}`} className="text-sm">{opt}</Label>
              </div>
            ))}
          </div>
        )}

        {type === 'quiz' && (
          <RadioGroup value={selectedIndex?.toString() ?? ''} onValueChange={(v) => setSelectedIndex(Number(v))}>
            {config.options.map((opt: string, i: number) => (
              <div key={i} className="flex items-center space-x-2">
                <RadioGroupItem value={i.toString()} id={`quiz-${interaction.id}-${i}`} />
                <Label htmlFor={`quiz-${interaction.id}-${i}`} className="text-sm">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {type === 'short_answer' && (
          <Textarea
            placeholder="Type your answer…"
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            maxLength={config.max_chars}
            rows={3}
          />
        )}

        {type === 'link' && (
          <a
            href={config.url}
            target={config.open_in_new_tab ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="text-primary underline"
            onClick={handleSubmit}
          >
            {config.title}
          </a>
        )}

        {type !== 'link' && (
          <Button size="sm" onClick={handleSubmit} disabled={submit.isPending}>
            {submit.isPending ? 'Submitting…' : 'Submit'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
```

- [ ] **Step 3: Add route in `App.tsx`**

```tsx
// In the student/public routes section:
<Route path="/lesson/:sessionId" element={<StudentLesson />} />
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/StudentLesson.tsx src/components/lesson/InteractionPanel.tsx src/App.tsx
git commit -m "feat(student): add full-screen lesson viewer with lower-thirds interaction panel"
```

---

## Phase 4: Real-Time Sync

### Task 4.1: Create Realtime Hook

**Files:**
- Create: `src/hooks/useClassSessionRealtime.tsx`

- [ ] **Step 1: Create the hook**

```tsx
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useClassSessionRealtime(classSessionId: string) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!classSessionId) return;
    const channel = supabase.channel(`classroom:${classSessionId}`, {
      config: { broadcast: { ack: true } },
    });
    channel.subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [classSessionId]);

  const sendSlideChange = useCallback(
    (slideIndex: number) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'slide_change',
        payload: { slide_index: slideIndex },
      });
    },
    []
  );

  const sendInteractionPublish = useCallback(
    (instanceId: string, templateId: string) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'interaction_publish',
        payload: { instance_id: instanceId, template_interaction_id: templateId },
      });
    },
    []
  );

  const sendInteractionClose = useCallback(
    (instanceId: string) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'interaction_close',
        payload: { instance_id: instanceId },
      });
    },
    []
  );

  const sendLessonEnd = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'lesson_end',
      payload: {},
    });
  }, []);

  const onSlideChange = useCallback((handler: (index: number) => void) => {
    const fn = (payload: { payload: { slide_index: number } }) => {
      handler(payload.payload.slide_index);
    };
    channelRef.current?.on('broadcast', { event: 'slide_change' }, fn as any);
    return () => {
      channelRef.current?.off('broadcast', { event: 'slide_change' }, fn as any);
    };
  }, []);

  const onInteractionPublish = useCallback((handler: (payload: { instance_id: string; template_interaction_id: string }) => void) => {
    const fn = (payload: { payload: { instance_id: string; template_interaction_id: string } }) => {
      handler(payload.payload);
    };
    channelRef.current?.on('broadcast', { event: 'interaction_publish' }, fn as any);
    return () => {
      channelRef.current?.off('broadcast', { event: 'interaction_publish' }, fn as any);
    };
  }, []);

  const onInteractionClose = useCallback((handler: (instanceId: string) => void) => {
    const fn = (payload: { payload: { instance_id: string } }) => {
      handler(payload.payload.instance_id);
    };
    channelRef.current?.on('broadcast', { event: 'interaction_close' }, fn as any);
    return () => {
      channelRef.current?.off('broadcast', { event: 'interaction_close' }, fn as any);
    };
  }, []);

  const onLessonEnd = useCallback((handler: () => void) => {
    const fn = () => handler();
    channelRef.current?.on('broadcast', { event: 'lesson_end' }, fn as any);
    return () => {
      channelRef.current?.off('broadcast', { event: 'lesson_end' }, fn as any);
    };
  }, []);

  return {
    sendSlideChange,
    sendInteractionPublish,
    sendInteractionClose,
    sendLessonEnd,
    onSlideChange,
    onInteractionPublish,
    onInteractionClose,
    onLessonEnd,
  };
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useClassSessionRealtime.tsx
git commit -m "feat(realtime): add Supabase broadcast hook for classroom sync"
```

---

### Task 4.2: Enable Realtime in Supabase

**Files:**
- Modify: `supabase/config.toml` (if needed)
- Or use Supabase Dashboard to enable Realtime on `class_sessions`

- [ ] **Step 1: Enable realtime for `class_sessions` via migration**

```sql
-- In a new migration or appended to the lesson_runner migration:
alter publication supabase_realtime add table class_sessions;
```

Note: Broadcast channels do not require table-level realtime, but if we later want to use `postgres_changes` on `lesson_instance_interactions`, we'd need it. For now, broadcast-only is sufficient and lighter.

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/
git commit -m "chore(db): enable supabase realtime for class_sessions"
```

---

## Phase 5: End-of-Lesson Reporting

### Task 5.1: Create Lesson Report Page

**Files:**
- Create: `src/pages/LessonReport.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `LessonReport.tsx`**

```tsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, BarChart3, MessageSquare } from 'lucide-react';
import { useStudents } from '@/hooks/useStudents';

const LessonReport = () => {
  const { sessionId } = useParams<{ sessionId: string }>();

  const { data: session } = useQuery({
    queryKey: ['class-session-report', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_sessions')
        .select('*, lesson_template:lesson_templates(title)')
        .eq('id', sessionId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: students = [] } = useStudents(session?.class_id);

  const { data: interactions = [] } = useQuery({
    queryKey: ['lesson-instance-interactions', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_instance_interactions')
        .select('*, template:lesson_template_interactions(type, config)')
        .eq('class_session_id', sessionId!)
        .order('published_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!sessionId,
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['lesson-responses-all', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_responses')
        .select('*, student:students(first_name, last_name)')
        .eq('class_session_id', sessionId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!sessionId,
  });

  const totalStudents = students.length;
  const respondingStudents = new Set(responses.map((r) => r.student_id)).size;
  const participationRate = totalStudents > 0 ? Math.round((respondingStudents / totalStudents) * 100) : 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/class/${session?.class_id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Lesson Report</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lesson</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{session?.lesson_template?.title ?? 'Untitled'}</p>
            <p className="text-sm text-muted-foreground">{session?.title}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Participation</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold">{participationRate}%</span>
            <span className="text-sm text-muted-foreground">({respondingStudents}/{totalStudents})</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Interactions</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold">{interactions.length}</span>
            <span className="text-sm text-muted-foreground">published</span>
          </CardContent>
        </Card>
      </div>

      {/* Per-interaction breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Interaction Results</h2>
        {interactions.map((interaction) => {
          const interactionResponses = responses.filter(
            (r) => r.lesson_instance_interaction_id === interaction.id
          );
          const config = interaction.template?.config as any;

          return (
            <Card key={interaction.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {config?.question ?? config?.title ?? 'Interaction'}
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    ({interaction.template?.type})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {interaction.template?.type === 'poll' && (
                  <div className="space-y-2">
                    {config.options.map((opt: string, i: number) => {
                      const count = interactionResponses.filter((r) =>
                        (r.response_data as any)?.selected_indices?.includes(i)
                      ).length;
                      const pct = interactionResponses.length > 0 ? Math.round((count / interactionResponses.length) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-sm w-32 truncate">{opt}</span>
                          <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-12 text-right">{count} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {interaction.template?.type === 'quiz' && (
                  <div className="space-y-2">
                    {config.options.map((opt: string, i: number) => {
                      const count = interactionResponses.filter(
                        (r) => (r.response_data as any)?.selected_index === i
                      ).length;
                      const isCorrect = i === config.correct_option_index;
                      return (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className={isCorrect ? 'text-emerald-600 font-medium' : ''}>{opt}</span>
                          <span className="text-muted-foreground">— {count} responses</span>
                          {isCorrect && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 rounded">Correct</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {interaction.template?.type === 'short_answer' && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {interactionResponses.map((r) => (
                      <div key={r.id} className="p-2 bg-muted/50 rounded text-sm">
                        <span className="font-medium">
                          {(r.student as any)?.first_name} {(r.student as any)?.last_name}:
                        </span>{' '}
                        {(r.response_data as any)?.text}
                      </div>
                    ))}
                  </div>
                )}

                {interactionResponses.length === 0 && (
                  <p className="text-sm text-muted-foreground">No responses.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default LessonReport;
```

- [ ] **Step 2: Add route in `App.tsx` (teacher-only)**

```tsx
<Route path="/lesson-report/:sessionId" element={<ProtectedRoute><LessonReport /></ProtectedRoute>} />
```

- [ ] **Step 3: Add "View Report" button to SessionDetails**

In `src/pages/SessionDetails.tsx`, if the session has a `lesson_template_id`, show a link to `/lesson-report/:sessionId`.

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/LessonReport.tsx src/pages/SessionDetails.tsx src/App.tsx
git commit -m "feat(report): add end-of-lesson report page with participation and interaction breakdown"
```

---

## Phase 6: Atlas Integration

### Task 6.1: Create Atlas Import Edge Function

**Files:**
- Create: `supabase/functions/atlas-import/index.ts`

- [ ] **Step 1: Create the edge function**

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3';

const AtlasSlideSchema = z.object({
  order: z.number().int().min(0),
  title: z.string().min(1),
  layout: z.enum(['default', 'split', 'image_full', 'title_only']).default('default'),
  content_blocks: z.array(z.any()),
  background_image_url: z.string().optional(),
  background_colour: z.string().optional(),
});

const AtlasPayloadSchema = z.object({
  atlas_lesson_id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  learning_intentions: z.array(z.string()).default([]),
  success_criteria: z.array(z.string()).default([]),
  subject: z.string().optional(),
  year_level: z.string().optional(),
  estimated_minutes: z.number().optional(),
  slides: z.array(AtlasSlideSchema).min(1),
  resources: z.array(z.object({ title: z.string(), url: z.string(), resource_type: z.string() })).default([]),
});

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const body = await req.json().catch(() => null);
  if (!body) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const parsed = AtlasPayloadSchema.safeParse(body.atlasPayload);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.format() }), { status: 400 });
  }

  const payload = parsed.data;
  const { teacher_id, school_id } = body;

  // Insert lesson template
  const { data: template, error: templateError } = await supabase
    .from('lesson_templates')
    .insert({
      title: payload.title,
      description: payload.description,
      success_criteria: payload.success_criteria,
      learning_intentions: payload.learning_intentions,
      teacher_id,
      school_id,
      source: 'atlas',
      atlas_lesson_id: payload.atlas_lesson_id,
      metadata: {
        subject: payload.subject,
        year_level: payload.year_level,
        estimated_minutes: payload.estimated_minutes,
      },
    })
    .select()
    .single();

  if (templateError || !template) {
    return new Response(JSON.stringify({ error: templateError?.message }), { status: 500 });
  }

  // Insert slides
  const slides = payload.slides.map((s) => ({
    lesson_template_id: template.id,
    order: s.order,
    title: s.title,
    content_blocks: s.content_blocks,
    layout: s.layout,
    background_image_url: s.background_image_url,
    background_colour: s.background_colour,
  }));

  const { error: slidesError } = await supabase.from('lesson_template_slides').insert(slides);
  if (slidesError) {
    return new Response(JSON.stringify({ error: slidesError.message }), { status: 500 });
  }

  // Insert resources as link-type interactions
  if (payload.resources.length > 0) {
    const resourceInteractions = payload.resources.map((r, i) => ({
      lesson_template_id: template.id,
      type: 'link',
      config: { type: 'link', title: r.title, url: r.url, open_in_new_tab: true },
      order: i,
      trigger: 'manual',
    }));
    await supabase.from('lesson_template_interactions').insert(resourceInteractions);
  }

  return new Response(JSON.stringify({ lesson_template_id: template.id }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

- [ ] **Step 2: Deploy edge function**

```bash
npx supabase functions deploy atlas-import
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/atlas-import/
git commit -m "feat(atlas): add atlas-import edge function for lesson ingestion"
```

---

### Task 6.2: Create Lesson Template Library Page

**Files:**
- Create: `src/pages/LessonLibrary.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Sidebar.tsx` (or wherever nav items are)

- [ ] **Step 1: Create `LessonLibrary.tsx`**

Simple page listing imported lesson templates with "Import from Atlas" and "Start Lesson" buttons.

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLessonTemplates, useImportLessonFromAtlas } from '@/hooks/useLessonTemplates';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Upload, Play } from 'lucide-react';
import { toast } from 'sonner';

export const LessonLibrary = () => {
  const { user } = useAuth();
  const { data: templates = [] } = useLessonTemplates(user?.id);
  const importMutation = useImportLessonFromAtlas();
  const navigate = useNavigate();
  const [jsonInput, setJsonInput] = useState('');

  const handleManualImport = () => {
    try {
      const payload = JSON.parse(jsonInput);
      importMutation.mutate(
        { atlasPayload: payload, teacher_id: user!.id, school_id: user!.school_id },
        {
          onSuccess: () => {
            toast.success('Lesson imported');
            setJsonInput('');
          },
          onError: (err) => toast.error(err.message),
        }
      );
    } catch {
      toast.error('Invalid JSON');
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lesson Library</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-1" /> Import Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Import from Atlas (Manual JSON)</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label>Paste Atlas JSON</Label>
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={8}
                placeholder='{"title": "...", "slides": [...]}'
              />
              <Button onClick={handleManualImport} disabled={importMutation.isPending}>
                {importMutation.isPending ? 'Importing…' : 'Import'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/lesson-preview/${t.id}`)}>
                  <BookOpen className="w-3 h-3 mr-1" /> Preview
                </Button>
                <Button size="sm" className="flex-1" onClick={() => navigate(`/classroom?lesson=${t.id}`)}>
                  <Play className="w-3 h-3 mr-1" /> Start
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Add route and nav item**

```tsx
// App.tsx
<Route path="/lessons" element={<ProtectedRoute><LessonLibrary /></ProtectedRoute>} />
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/LessonLibrary.tsx src/App.tsx
git commit -m "feat(lessons): add lesson library page with atlas import"
```

---

## Appendix: UI Mock Descriptions

### Teacher: Classroom with Structured Lesson

```
┌─────────────────────────────────────────────────────────────────────┐
│  Classroom · 10A History · Structured Lesson                        │
├──────────┬──────────────────────────────────────────────────────────┤
│          │  SLIDE VIEWER (teacher sees same slide as students)      │
│ Student  │  ┌────────────────────────────────────────────────────┐  │
│ Grid     │  │  Slide 3: The Causes of World War I                │  │
│ (collap- │  │                                                      │  │
│ sible)   │  │  • Militarism                                        │  │
│          │  │  • Alliances                                         │  │
│ [John]   │  │  • Imperialism                                       │  │
│ [Sarah]  │  │  • Nationalism                                       │  │
│ [Mike]   │  │                                                      │  │
│          │  └────────────────────────────────────────────────────┘  │
├──────────┼──────────────────────────────────────────────────────────┤
│ Controls │  [← Prev]  3 / 12  [Next →]    [▶ Poll] [▶ Quiz] [■ Stop]│
├──────────┴──────────────────────────────────────────────────────────┤
│ Active Interactions (compact cards)                                 │
│ ┌─────────┐ ┌─────────┐                                            │
│ │ Poll    │ │ Quiz    │                                            │
│ │ 8 resp  │ │ 12 resp │                                            │
│ │ [Close] │ │ [Close] │                                            │
│ └─────────┘ └─────────┘                                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Student: Lesson Viewer

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                          SLIDE AREA                                 │
│                    (75% of viewport)                                │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  The Causes of World War I                                  │   │
│   │                                                             │   │
│   │  • Militarism                                               │   │
│   │  • Alliances                                                │   │
│   │  • Imperialism                                              │   │
│   │  • Nationalism                                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ ▼ Hide Activity                                            [1]      │  ← drawer handle
├─────────────────────────────────────────────────────────────────────┤
│                    LOWER THIRDS (25%)                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Quick Poll: Which cause do you think was most important?   │    │
│  │  ○ Militarism                                               │    │
│  │  ○ Alliances                                                │    │
│  │  ○ Imperialism                                              │    │
│  │  ○ Nationalism                                              │    │
│  │                                    [Submit]                 │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Student: Lower Thirds (multiple active)

When multiple interactions are active, they stack vertically inside the drawer with the most recently published at the top. Each can be independently submitted.

---

## Open Questions / Future Work

1. **Drawing interactions:** Requires a canvas component (e.g. `react-sketch-canvas` or custom `<canvas>`). Image upload to Supabase Storage.
2. **AI marking for short answers:** Reuse existing `ai-mark-response` edge function. Trigger after lesson end or in real-time.
3. **Slide templates / builder UI:** MVP relies on Atlas import + JSON. A WYSIWYG slide builder is a large follow-up project.
4. **PDF export of lesson reports:** Reuse `printPdf.ts` utility from exit ticket results.
5. **Analytics beyond participation:** Time-on-slide, drop-off points, heatmaps of student attention (derived from response timing).
6. **Homework mode:** Structured lessons could be assigned as homework (student progresses at own pace, no real-time sync).
7. **Screen sharing / projector mode:** Teacher may want a dedicated "presenter view" on a second screen / projector without the student grid.
