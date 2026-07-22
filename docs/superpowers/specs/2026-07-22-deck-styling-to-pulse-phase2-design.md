# Deck styling → Pulse, Phase 2: Pulse data layer — design

## Problem

This is Phase 2 of a 3-phase project to make Atlas-sourced lessons in Pulse render with the same visual styling (template, palette, per-slide-type layout) that they have in Atlas:

- **Phase 1 (done, Atlas):** Atlas now sends `deck_template_id`, `deck_palette_id`, and the raw `deck_slides` (typed per-slide-type props, matching Atlas's own `Slide` schema) to Pulse's `atlas-import` edge function, alongside the existing flattened `slides` payload. This was additive — `atlas-import` ignores fields it doesn't recognize, so nothing changed on the Pulse side yet.
- **Phase 2 (this spec):** give Pulse somewhere to put that data — extend `lesson_templates` and `lesson_template_slides` with new columns, and update `atlas-import` to write them.
- **Phase 3 (later):** port Atlas's 4 template directories into Pulse and render Atlas-sourced lessons through them, reading the columns this phase adds.

Phase 2 only stores the data. It makes no visible change to the app — Pulse's slide viewer (`SlideViewer`/`ContentBlockRenderer`) keeps reading `content_blocks`/`layout` exactly as it does today, and `useLessonTemplateContent` isn't touched.

## Design

### 1. Schema migration

New migration `supabase/migrations/<timestamp>_add_atlas_deck_style_columns.sql`:

```sql
ALTER TABLE lesson_templates
  ADD COLUMN IF NOT EXISTS template_id text,
  ADD COLUMN IF NOT EXISTS palette_id text;

ALTER TABLE lesson_template_slides
  ADD COLUMN IF NOT EXISTS slide_type text,
  ADD COLUMN IF NOT EXISTS slide_props jsonb;
```

All four columns are nullable with no default, matching the existing `atlas_lesson_id text` column's pattern on `lesson_templates` — manually-created lessons (`source = 'manual'`) never populate them, and existing Atlas-sourced rows stay `NULL` until their next re-sync ("Re-sync to Pulse" in Atlas already re-imports the whole lesson, including slides, so this self-heals on next sync rather than needing a backfill).

### 2. `atlas-import` edge function

`supabase/functions/atlas-import/index.ts`:

- `AtlasLessonPayload` interface gains `deck_template_id?: string`, `deck_palette_id?: string`, `deck_slides?: { id: string; type: string; props: Record<string, unknown> }[]` (a loosely-typed shape here is fine — this function doesn't need Atlas's Zod schema, it's just passing JSON through to a jsonb column).
- On both the insert and update path for `lesson_templates`, add `template_id: payload.deck_template_id ?? null, palette_id: payload.deck_palette_id ?? null` to the row.
- When building `slideRows` for the `lesson_template_slides` insert, look up the matching entry in `payload.deck_slides` **by array index** (not by id) — `payload.slides[i]` and `payload.deck_slides[i]` are guaranteed to be the same length and order because Atlas builds both from the same source `tree.slides` array in the same `.map()` pass (confirmed in `pulse-send-lesson.ts`: `slides = convertSlideTree(parseResult.data)` and `deckSlides = parseResult.data.slides` both come from `parseResult.data.slides`, unmodified in order). Add `slide_type: payload.deck_slides?.[i]?.type ?? null, slide_props: payload.deck_slides?.[i]?.props ?? null` to each row. Using `?.` throughout means a payload without `deck_slides` (a lesson with no deck, or a client that hasn't updated) degrades to `null`/`null` exactly like today, no error.
- `isValidPayload` gains permissive optional checks: if present, `deck_template_id`/`deck_palette_id` must be strings and `deck_slides` must be an array — mirroring the existing checks for `slides`/`learning_intentions`/`success_criteria`. Absence of all three remains valid (a lesson with no deck attached).

### 3. Generated types

`src/integrations/supabase/types.ts` is hand-regenerated (no live DB access in this environment to run `supabase gen types`) by adding the four new fields to the `Row`/`Insert`/`Update` shapes for `lesson_templates` and `lesson_template_slides`, matching the exact style of the existing fields in that file (nullable fields as `field: type | null`, optional in `Insert`/`Update` as `field?: type | null`).

## Non-goals

- No changes to `useLessonTemplateContent.ts`, `SlideViewer.tsx`, `ContentBlockRenderer.tsx`, or any page that renders a lesson — Pulse's rendering path is entirely unchanged until Phase 3.
- No backfill migration for existing rows — see the self-healing note above.
- No changes to the `slides` (flattened) payload handling or the existing `content_blocks`/`layout`/`background_*` columns — both the old and new data live side by side.

## Testing

No automated test coverage exists for `atlas-import` (a Deno edge function with no test harness in this repo) or for Supabase migrations in this project — verification is manual, and requires live Supabase access this session doesn't have:

- Run `npm run db:push` to apply the migration, then confirm via `list_tables`/dashboard that both tables have the four new nullable columns.
- Deploy the updated `atlas-import` function (`supabase functions deploy atlas-import` or via the Supabase dashboard).
- From Atlas, "Send to Pulse" (or "Re-sync") a lesson with an attached deck. Confirm the `lesson_templates` row for that lesson now has `template_id`/`palette_id` populated, and every row in `lesson_template_slides` for it has `slide_type`/`slide_props` populated with data matching the deck's actual slides.
- Confirm Pulse's Classroom page for that lesson still renders exactly as it did before this change — this phase must be a no-visible-op in the app.
- Sync a lesson with no deck attached (or an old lesson that predates this change) and confirm nothing errors — the new columns should just be `null`.
