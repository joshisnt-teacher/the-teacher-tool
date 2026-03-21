import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type ClassSession = Tables<"class_sessions">;
type ClassSessionInsert = TablesInsert<"class_sessions">;
type ClassSessionUpdate = TablesUpdate<"class_sessions">;

export function useClassSessions(classId: string) {
  return useQuery({
    queryKey: ["class-sessions", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_sessions")
        .select("*")
        .eq("class_id", classId)
        .order("started_at", { ascending: false });

      if (error) throw error;
      return data as ClassSession[];
    },
    enabled: !!classId,
  });
}

export function useCreateClassSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClassSessionInsert) => {
      const { data: result, error } = await supabase
        .from("class_sessions")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as ClassSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["class-sessions", data.class_id] });
      queryClient.invalidateQueries({ queryKey: ["current-class-session", data.class_id] });
    },
  });
}

export function useUpdateClassSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClassSessionUpdate }) => {
      const { data: result, error } = await supabase
        .from("class_sessions")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result as ClassSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["class-sessions", data.class_id] });
      queryClient.invalidateQueries({ queryKey: ["current-class-session", data.class_id] });
    },
  });
}

export function useCurrentClassSession(classId: string) {
  return useQuery({
    queryKey: ["current-class-session", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_sessions")
        .select("*")
        .eq("class_id", classId)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as ClassSession | null;
    },
    enabled: !!classId,
  });
}

export function useDeleteClassSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("class_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["class-sessions-list"] });
      queryClient.invalidateQueries({ queryKey: ["current-class-session"] });
    },
  });
}
