-- Migrate class_content_item from local content_item UUIDs to
-- stable source_id strings that match the central curriculum DB.
--
-- For existing WA-coded items (Digital Tech, HPE, HASS), source_id = code (e.g. WA7DIGDS1).
-- For future Arts-style items, source_id will be the UUID from the source JSON.
-- Both are stored as text and looked up against curriculum_content_item.source_id
-- in the central Edufied DB.
--
-- Already applied to the shared Paideia DB via the analytics repo (Supabase
-- dashboard → SQL Editor) on 2026-06-06. This file exists in Pulse purely
-- for migration-history parity — do not re-run it manually.

-- 1. Add new column
ALTER TABLE class_content_item ADD COLUMN content_item_source_id text;

-- 2. Backfill: resolve the old local UUID to its WA code, which equals source_id in central DB
UPDATE class_content_item cci
SET content_item_source_id = ci.code
FROM content_item ci
WHERE cci.content_item_id = ci.id;

-- 3. Remove rows where backfill failed (orphaned references to deleted content items)
DELETE FROM class_content_item WHERE content_item_source_id IS NULL;

-- 4. Lock the column
ALTER TABLE class_content_item ALTER COLUMN content_item_source_id SET NOT NULL;

-- 5. Drop the old UUID FK column
ALTER TABLE class_content_item DROP COLUMN content_item_id;

-- 6. Index + uniqueness (a class can't have the same content descriptor twice)
CREATE INDEX ON class_content_item(content_item_source_id);
ALTER TABLE class_content_item
  ADD CONSTRAINT class_content_item_class_source_id_unique
  UNIQUE (class_id, content_item_source_id);
