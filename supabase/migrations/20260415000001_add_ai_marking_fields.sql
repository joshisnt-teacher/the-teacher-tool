-- ============================================================
-- AI Marking: new columns and Vault wrapper functions
-- ============================================================

-- 1. Vault secret reference on users (stores UUID, not the key)
ALTER TABLE users ADD COLUMN IF NOT EXISTS openai_vault_id UUID DEFAULT NULL;

-- 2. Model answer teachers write for AI to mark against
ALTER TABLE questions ADD COLUMN IF NOT EXISTS model_answer TEXT DEFAULT NULL;

-- 3. AI-generated feedback stored per question result
ALTER TABLE question_results ADD COLUMN IF NOT EXISTS ai_feedback TEXT DEFAULT NULL;

-- ============================================================
-- Vault wrapper functions (SECURITY DEFINER so Edge Functions
-- can access vault schema through service_role)
-- ============================================================

-- Create or update a user's OpenAI API key in Vault
CREATE OR REPLACE FUNCTION public.upsert_openai_vault_secret(p_user_id uuid, p_secret text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_vault_id uuid;
BEGIN
  SELECT openai_vault_id INTO v_vault_id FROM users WHERE id = p_user_id;
  IF v_vault_id IS NOT NULL THEN
    PERFORM vault.update_secret(v_vault_id, p_secret);
    RETURN v_vault_id;
  ELSE
    v_vault_id := vault.create_secret(p_secret, 'openai_key_' || p_user_id::text);
    UPDATE users SET openai_vault_id = v_vault_id WHERE id = p_user_id;
    RETURN v_vault_id;
  END IF;
END;
$$;

-- Delete a user's OpenAI API key from Vault
CREATE OR REPLACE FUNCTION public.delete_openai_vault_secret(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_vault_id uuid;
BEGIN
  SELECT openai_vault_id INTO v_vault_id FROM users WHERE id = p_user_id;
  IF v_vault_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = v_vault_id;
    UPDATE users SET openai_vault_id = NULL WHERE id = p_user_id;
  END IF;
END;
$$;

-- Retrieve a decrypted secret by vault UUID (service_role only)
CREATE OR REPLACE FUNCTION public.get_decrypted_openai_key(p_vault_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE id = p_vault_id;
  RETURN v_secret;
END;
$$;

-- Restrict vault functions to service_role only (not anon/authenticated browser clients)
REVOKE EXECUTE ON FUNCTION public.upsert_openai_vault_secret(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_openai_vault_secret(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_decrypted_openai_key(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_openai_vault_secret(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_openai_vault_secret(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_decrypted_openai_key(uuid) TO service_role;
