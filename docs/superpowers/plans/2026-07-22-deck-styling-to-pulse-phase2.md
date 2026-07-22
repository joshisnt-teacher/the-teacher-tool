# Deck Styling → Pulse, Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Pulse somewhere to store the styled-deck data Atlas now sends (Phase 1) — extend `lesson_templates`/`lesson_template_slides` with nullable columns and update `atlas-import` to write them — with zero visible behavior change in the app.

**Architecture:** One additive schema migration, one matching update to the `atlas-import` edge function that writes the new columns from the already-arriving payload fields, and a hand-edit of the generated `types.ts` to match. Nothing that reads lessons (`useLessonTemplateContent`, `SlideViewer`, `Classroom.tsx`, `ClassroomPresenter.tsx`) is touched — that's Phase 3.

**Tech Stack:** Postgres (Supabase migrations), Deno edge function (`atlas-import`), TypeScript.

## Global Constraints

- This phase must be a no-visible-op in the running app — Pulse's rendering path is untouched.
- No backfill migration for existing rows: an Atlas-sourced lesson's next "Send to Pulse" / "Re-sync to Pulse" already re-imports the whole lesson (template + slides), which is what populates the new columns — see the Phase 2 design spec's self-healing note.
- `src/integrations/supabase/types.ts` is out of sync with the live schema already (missing the `resources` column added in `20260720120000_add_resources_to_lesson_templates.sql`) — this plan only adds the four new fields it introduces and does not attempt to fix that pre-existing drift.
- No automated test coverage exists for Supabase migrations or edge functions in this repo, and this session has no live Supabase access — every verification step in this plan is manual, to be run by a human (or a future session) with Supabase access.

---

## Task 1: Migration, `atlas-import`, and generated types

**Files:**
- Create: `supabase/migrations/20260722000000_add_atlas_deck_style_columns.sql`
- Modify: `supabase/functions/atlas-import/index.ts`
- Modify: `src/integrations/supabase/types.ts`

**Interfaces:**
- Produces: `lesson_templates.template_id` (text, nullable), `lesson_templates.palette_id` (text, nullable), `lesson_template_slides.slide_type` (text, nullable), `lesson_template_slides.slide_props` (jsonb, nullable).
- Consumes: `AtlasLessonPayload.deck_template_id?: string`, `.deck_palette_id?: string`, `.deck_slides?: { id, type, props }[]` — already sent by Atlas's `pulse-send-lesson.ts` (Phase 1, shipped).

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260722000000_add_atlas_deck_style_columns.sql`:

```sql
-- Phase 2 of the Atlas deck-styling project: give Pulse somewhere to store
-- the template/palette/per-slide-type props Atlas now sends (Phase 1), so
-- a future phase can render Atlas-sourced lessons using Atlas's own
-- template styling instead of the generic content_blocks renderer.
-- Nullable, no default: manually-created lessons (source = 'manual') never
-- populate these, same as the existing atlas_lesson_id column.
ALTER TABLE lesson_templates
  ADD COLUMN IF NOT EXISTS template_id text,
  ADD COLUMN IF NOT EXISTS palette_id text;

ALTER TABLE lesson_template_slides
  ADD COLUMN IF NOT EXISTS slide_type text,
  ADD COLUMN IF NOT EXISTS slide_props jsonb;
```

- [ ] **Step 2: Add the new payload fields and validation to `atlas-import`**

In `supabase/functions/atlas-import/index.ts`, find:

```ts
interface SlidePayload {
  order: number
  title: string
  layout: 'default' | 'split' | 'image_full' | 'title_only'
  content_blocks: unknown[]
  background_image_url?: string
  background_colour?: string
}
```

Replace with:

```ts
interface SlidePayload {
  order: number
  title: string
  layout: 'default' | 'split' | 'image_full' | 'title_only'
  content_blocks: unknown[]
  background_image_url?: string
  background_colour?: string
}

interface AtlasDeckSlidePayload {
  id: string
  type: string
  props: Record<string, unknown>
}
```

Find:

```ts
interface AtlasLessonPayload {
  central_teacher_id: string
  class_code: string
  atlas_lesson_id: string
  title: string
  description?: string
  learning_intentions: string[]
  success_criteria: string[]
  subject?: string
  year_level?: string
  estimated_minutes?: number
  slides: SlidePayload[]
  resources: AtlasResourceRef[]
  exit_ticket?: AtlasExitTicketPayload
}
```

Replace with:

```ts
interface AtlasLessonPayload {
  central_teacher_id: string
  class_code: string
  atlas_lesson_id: string
  title: string
  description?: string
  learning_intentions: string[]
  success_criteria: string[]
  subject?: string
  year_level?: string
  estimated_minutes?: number
  slides: SlidePayload[]
  deck_template_id?: string
  deck_palette_id?: string
  deck_slides?: AtlasDeckSlidePayload[]
  resources: AtlasResourceRef[]
  exit_ticket?: AtlasExitTicketPayload
}
```

Find:

```ts
  if (!Array.isArray(b.learning_intentions)) return false
  if (!Array.isArray(b.success_criteria)) return false
  if (!Array.isArray(b.slides)) return false
  return true
}
```

Replace with:

```ts
  if (!Array.isArray(b.learning_intentions)) return false
  if (!Array.isArray(b.success_criteria)) return false
  if (!Array.isArray(b.slides)) return false
  if (b.deck_template_id !== undefined && typeof b.deck_template_id !== 'string') return false
  if (b.deck_palette_id !== undefined && typeof b.deck_palette_id !== 'string') return false
  if (b.deck_slides !== undefined && !Array.isArray(b.deck_slides)) return false
  return true
}
```

- [ ] **Step 3: Write `template_id`/`palette_id` on both the update and insert paths**

Find:

```ts
    const { error: updateErr } = await supabase
      .from('lesson_templates')
      .update({
        title: payload.title,
        description: payload.description ?? null,
        learning_intentions: payload.learning_intentions,
        success_criteria: payload.success_criteria,
        source: 'atlas',
        class_id: cls.id,
        metadata: baseMetadata,
        resources: payload.resources,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lessonTemplateId)
```

Replace with:

```ts
    const { error: updateErr } = await supabase
      .from('lesson_templates')
      .update({
        title: payload.title,
        description: payload.description ?? null,
        learning_intentions: payload.learning_intentions,
        success_criteria: payload.success_criteria,
        source: 'atlas',
        class_id: cls.id,
        metadata: baseMetadata,
        resources: payload.resources,
        template_id: payload.deck_template_id ?? null,
        palette_id: payload.deck_palette_id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lessonTemplateId)
```

Find:

```ts
    const { data: newTemplate, error: insertErr } = await supabase
      .from('lesson_templates')
      .insert({
        title: payload.title,
        description: payload.description ?? null,
        learning_intentions: payload.learning_intentions,
        success_criteria: payload.success_criteria,
        teacher_id: teacher.id,
        source: 'atlas',
        atlas_lesson_id: payload.atlas_lesson_id,
        class_id: cls.id,
        metadata: baseMetadata,
        resources: payload.resources,
      })
      .select('id')
      .single()
```

Replace with:

```ts
    const { data: newTemplate, error: insertErr } = await supabase
      .from('lesson_templates')
      .insert({
        title: payload.title,
        description: payload.description ?? null,
        learning_intentions: payload.learning_intentions,
        success_criteria: payload.success_criteria,
        teacher_id: teacher.id,
        source: 'atlas',
        atlas_lesson_id: payload.atlas_lesson_id,
        class_id: cls.id,
        metadata: baseMetadata,
        resources: payload.resources,
        template_id: payload.deck_template_id ?? null,
        palette_id: payload.deck_palette_id ?? null,
      })
      .select('id')
      .single()
```

- [ ] **Step 4: Write `slide_type`/`slide_props` per slide, matched by index**

Find:

```ts
  // ── 6. Insert slides ─────────────────────────────────────────────────────
  if (payload.slides.length > 0) {
    const slideRows = payload.slides.map((slide) => ({
      lesson_template_id: lessonTemplateId,
      order: slide.order,
      title: slide.title ?? null,
      layout: slide.layout ?? 'default',
      content_blocks: slide.content_blocks ?? [],
      background_image_url: slide.background_image_url ?? null,
      background_colour: slide.background_colour ?? null,
    }))
```

Replace with:

```ts
  // ── 6. Insert slides ─────────────────────────────────────────────────────
  if (payload.slides.length > 0) {
    const slideRows = payload.slides.map((slide, i) => ({
      lesson_template_id: lessonTemplateId,
      order: slide.order,
      title: slide.title ?? null,
      layout: slide.layout ?? 'default',
      content_blocks: slide.content_blocks ?? [],
      background_image_url: slide.background_image_url ?? null,
      background_colour: slide.background_colour ?? null,
      // deck_slides[i] lines up with slides[i] by construction: Atlas
      // builds both arrays from the same source tree.slides in the same
      // .map() pass (see pulse-send-lesson.ts), so index-matching is safe.
      // Optional chaining means a payload with no deck_slides (no deck
      // attached, or an older Atlas build) degrades to null, no error.
      slide_type: payload.deck_slides?.[i]?.type ?? null,
      slide_props: payload.deck_slides?.[i]?.props ?? null,
    }))
```

- [ ] **Step 5: Hand-update the generated types for `lesson_template_slides`**

In `src/integrations/supabase/types.ts`, find:

```ts
      lesson_template_slides: {
        Row: {
          background_colour: string | null
          background_image_url: string | null
          content_blocks: Json
          created_at: string
          id: string
          layout: string
          lesson_template_id: string
          order: number
          title: string | null
        }
        Insert: {
          background_colour?: string | null
          background_image_url?: string | null
          content_blocks?: Json
          created_at?: string
          id?: string
          layout?: string
          lesson_template_id: string
          order: number
          title?: string | null
        }
        Update: {
          background_colour?: string | null
          background_image_url?: string | null
          content_blocks?: Json
          created_at?: string
          id?: string
          layout?: string
          lesson_template_id?: string
          order?: number
          title?: string | null
        }
```

Replace with:

```ts
      lesson_template_slides: {
        Row: {
          background_colour: string | null
          background_image_url: string | null
          content_blocks: Json
          created_at: string
          id: string
          layout: string
          lesson_template_id: string
          order: number
          slide_props: Json | null
          slide_type: string | null
          title: string | null
        }
        Insert: {
          background_colour?: string | null
          background_image_url?: string | null
          content_blocks?: Json
          created_at?: string
          id?: string
          layout?: string
          lesson_template_id: string
          order: number
          slide_props?: Json | null
          slide_type?: string | null
          title?: string | null
        }
        Update: {
          background_colour?: string | null
          background_image_url?: string | null
          content_blocks?: Json
          created_at?: string
          id?: string
          layout?: string
          lesson_template_id?: string
          order?: number
          slide_props?: Json | null
          slide_type?: string | null
          title?: string | null
        }
```

- [ ] **Step 6: Hand-update the generated types for `lesson_templates`**

In `src/integrations/supabase/types.ts`, find:

```ts
      lesson_templates: {
        Row: {
          atlas_lesson_id: string | null
          class_id: string | null
          created_at: string
          description: string | null
          id: string
          learning_intentions: Json
          metadata: Json
          school_id: string | null
          source: string
          success_criteria: Json
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          atlas_lesson_id?: string | null
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          learning_intentions?: Json
          metadata?: Json
          school_id?: string | null
          source?: string
          success_criteria?: Json
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          atlas_lesson_id?: string | null
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          learning_intentions?: Json
          metadata?: Json
          school_id?: string | null
          source?: string
          success_criteria?: Json
          teacher_id?: string
          title?: string
          updated_at?: string
        }
```

Replace with:

```ts
      lesson_templates: {
        Row: {
          atlas_lesson_id: string | null
          class_id: string | null
          created_at: string
          description: string | null
          id: string
          learning_intentions: Json
          metadata: Json
          palette_id: string | null
          school_id: string | null
          source: string
          success_criteria: Json
          teacher_id: string
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          atlas_lesson_id?: string | null
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          learning_intentions?: Json
          metadata?: Json
          palette_id?: string | null
          school_id?: string | null
          source?: string
          success_criteria?: Json
          teacher_id: string
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          atlas_lesson_id?: string | null
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          learning_intentions?: Json
          metadata?: Json
          palette_id?: string | null
          school_id?: string | null
          source?: string
          success_criteria?: Json
          teacher_id?: string
          template_id?: string | null
          title?: string
          updated_at?: string
        }
```

- [ ] **Step 7: Apply the migration and deploy the function**

This requires live Supabase access this session doesn't have — run these yourself (or in a future session connected to Supabase):

```bash
npm run db:push
```

Then deploy the updated `atlas-import` function via the Supabase CLI or dashboard (whichever this project normally uses — check `docs/` for the existing edge-function deploy process, e.g. `supabase functions deploy atlas-import`).

- [ ] **Step 8: Verify**

1. After the migration is applied, confirm (via the Supabase dashboard or `list_tables`) that `lesson_templates` has `template_id`/`palette_id` and `lesson_template_slides` has `slide_type`/`slide_props`, all nullable.
2. From Atlas, "Send to Pulse" (or "Re-sync to Pulse") a lesson with an attached deck. Confirm no error, same as before this change.
3. Query the resulting `lesson_templates` row and confirm `template_id`/`palette_id` are populated with the deck's actual template/palette ids.
4. Query the resulting `lesson_template_slides` rows and confirm each has `slide_type` matching its slide's type (e.g. `"title"`, `"content"`) and `slide_props` containing that slide's actual props (title text, bullets, etc.) — not `null`.
5. Open Pulse's Classroom page for that lesson and confirm it renders exactly as it did before this change (same slides, same layout) — this phase must not be visible in the app.
6. Send/sync a lesson with **no** deck attached and confirm it still imports cleanly with `template_id`/`palette_id`/`slide_type`/`slide_props` all `null`.

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/20260722000000_add_atlas_deck_style_columns.sql supabase/functions/atlas-import/index.ts src/integrations/supabase/types.ts
git commit -m "feat: store Atlas deck template/palette/slide-props on lesson_templates and lesson_template_slides"
```
