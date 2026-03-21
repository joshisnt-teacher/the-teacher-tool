// Database configuration helper
// This centralizes database configuration and makes it easy to switch between environments

export const getDatabaseConfig = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://aogorchudxilnkhtfvqq.supabase.co";
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ29yY2h1ZHhpbG5raHRmdnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTMzMTcsImV4cCI6MjA3Mjk4OTMxN30.0vp_AEwqrpyG7iVwziDPnFiSw_fqDhmaJQLA7GFmwn4";
  
  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    isLocal: supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')
  };
};

// For Node.js scripts (utility scripts)
export const getNodeDatabaseConfig = () => {
  const supabaseUrl = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
  
  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    isLocal: supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')
  };
};
