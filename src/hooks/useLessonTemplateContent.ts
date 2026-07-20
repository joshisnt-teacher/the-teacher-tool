import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ContentBlock, LessonResource, LessonSlide } from "@/types/lesson";

export interface LessonTemplateContent {
  slides: LessonSlide[];
  resources: LessonResource[];
}

export function useLessonTemplateContent(lessonTemplateId: string | null | undefined) {
  return useQuery({
    queryKey: ["lesson-template-content", lessonTemplateId],
    queryFn: async (): Promise<LessonTemplateContent> => {
      const [templateResult, slidesResult] = await Promise.all([
        // `resources` isn't in the generated types yet (added via raw migration
        // in Task 1) — cast this one query rather than regenerating types.
        (supabase.from("lesson_templates") as any)
          .select("resources")
          .eq("id", lessonTemplateId)
          .maybeSingle(),
        supabase
          .from("lesson_template_slides")
          .select("*")
          .eq("lesson_template_id", lessonTemplateId!)
          .order("order", { ascending: true }),
      ]);

      if (templateResult.error) throw templateResult.error;
      if (slidesResult.error) throw slidesResult.error;

      const slides: LessonSlide[] = (slidesResult.data ?? []).map((row) => ({
        id: row.id,
        order: row.order,
        title: row.title,
        layout: (row.layout as LessonSlide["layout"]) ?? "default",
        content_blocks: ((row.content_blocks as unknown) as ContentBlock[]) ?? [],
        background_image_url: row.background_image_url,
        background_colour: row.background_colour,
      }));

      const resources = ((templateResult.data?.resources as unknown) as LessonResource[]) ?? [];

      return { slides, resources };
    },
    enabled: !!lessonTemplateId,
  });
}
