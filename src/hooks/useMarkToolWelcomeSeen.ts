import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function markToolWelcomeSeen(appSlug: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error("Not authenticated");

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mark-tool-welcome-seen`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ app_slug: appSlug }),
    }
  );

  const result = await res.json();
  if (!res.ok || result.error) {
    throw new Error(result.error || "Failed to mark welcome seen");
  }
  return result;
}

export function useMarkToolWelcomeSeen() {
  return useMutation({
    mutationFn: markToolWelcomeSeen,
  });
}
