import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type ClassSession = Tables<"class_sessions">;

export function useClassSessionsList(classId: string) {
  return useQuery({
    queryKey: ["class-sessions-list", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_sessions")
        .select(`
          *,
          student_notes(
            id,
            note,
            rating,
            category,
            created_at,
            students(
              id,
              first_name,
              last_name,
              student_id
            )
          )
        `)
        .eq("class_id", classId)
        .not("ended_at", "is", null)
        .order("started_at", { ascending: false });

      if (error) throw error;
      return data as (ClassSession & {
        student_notes: Array<{
          id: string;
          note: string;
          rating: number;
          category: string;
          created_at: string;
          students: {
            id: string;
            first_name: string;
            last_name: string;
            student_id: string;
          };
        }> | null;
      })[];
    },
    enabled: !!classId,
  });
}
