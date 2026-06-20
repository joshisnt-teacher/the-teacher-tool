import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AtlasSlide {
  order: number;
  title: string;
  layout: "default" | "split" | "image_full" | "title_only";
  content_blocks: unknown[];
  background_image_url?: string;
  background_colour?: string;
}

export interface AtlasLessonRef {
  id: string;
  class_id: string;
  teacher_id: string;
  atlas_lesson_id: string;
  title: string;
  description: string | null;
  learning_intentions: string[];
  success_criteria: string[];
  slides: AtlasSlide[];
  created_at: string;
  updated_at: string;
}

export function useAtlasLessonRefs(classId: string) {
  return useQuery({
    queryKey: ["atlas-lesson-refs", classId],
    queryFn: async (): Promise<AtlasLessonRef[]> => {
      const { data, error } = await supabase
        .from("atlas_lesson_references" as any)
        .select("*")
        .eq("class_id", classId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as AtlasLessonRef[];
    },
    enabled: !!classId,
  });
}

export function useAtlasLessonRef(lessonId: string | null) {
  return useQuery({
    queryKey: ["atlas-lesson-ref", lessonId],
    queryFn: async (): Promise<AtlasLessonRef | null> => {
      if (!lessonId) return null;
      const { data, error } = await supabase
        .from("atlas_lesson_references" as any)
        .select("*")
        .eq("id", lessonId)
        .maybeSingle();

      if (error) throw error;
      return data as AtlasLessonRef | null;
    },
    enabled: !!lessonId,
  });
}
