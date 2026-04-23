import { createClient } from '@supabase/supabase-js';

const CENTRAL_SUPABASE_URL = import.meta.env.VITE_CENTRAL_SUPABASE_URL;
const CENTRAL_SUPABASE_ANON_KEY = import.meta.env.VITE_CENTRAL_SUPABASE_ANON_KEY;

if (!CENTRAL_SUPABASE_URL || !CENTRAL_SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing required environment variables: VITE_CENTRAL_SUPABASE_URL and VITE_CENTRAL_SUPABASE_ANON_KEY must be set in your .env file.'
  );
}

export const centralSupabase = createClient(CENTRAL_SUPABASE_URL, CENTRAL_SUPABASE_ANON_KEY);
