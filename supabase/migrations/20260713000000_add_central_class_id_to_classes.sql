-- Enables syncing classes created on the central Edufied hub down into Pulse,
-- mirroring the pattern already used by Atlas's teacher-sso function.
ALTER TABLE classes ADD COLUMN IF NOT EXISTS central_class_id uuid;
ALTER TABLE classes ADD CONSTRAINT classes_central_class_id_key UNIQUE (central_class_id);
