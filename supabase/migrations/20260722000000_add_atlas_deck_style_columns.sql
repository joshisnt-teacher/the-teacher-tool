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
