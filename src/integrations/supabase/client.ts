import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Environment-based configuration
// For local development: use local Supabase instance
// For production: use production Supabase instance
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://aogorchudxilnkhtfvqq.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ29yY2h1ZHhpbG5raHRmdnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTMzMTcsImV4cCI6MjA3Mjk4OTMxN30.0vp_AEwqrpyG7iVwziDPnFiSw_fqDhmaJQLA7GFmwn4";

// Debug logging to help troubleshoot
console.log('🔧 Supabase Client Configuration:');
console.log('URL:', SUPABASE_URL);
console.log('Environment Variables:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '***SET***' : 'NOT SET'
});

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});