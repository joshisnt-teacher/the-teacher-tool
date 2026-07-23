import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLessonTemplateContent } from "@/hooks/useLessonTemplateContent";
import { useUpdateCurrentSlide } from "@/hooks/useClassSessions";
import { useClassSessionRealtime } from "@/hooks/useClassSessionRealtime";
import { SlideViewer } from "@/components/lesson/SlideViewer";
import { AtlasDeckEmbed } from "@/components/lesson/AtlasDeckEmbed";

export default function ClassroomPresenter() {
  const { sessionId } = useParams<{ classId: string; sessionId: string }>();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["presenter-session", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_sessions")
        .select("id, class_id, lesson_template_id, current_slide_index, ended_at")
        .eq("id", sessionId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: content, isLoading: contentLoading } = useLessonTemplateContent(
    session?.lesson_template_id ?? null
  );
  const slides = content?.slides ?? [];

  const [slideIndex, setSlideIndex] = useState<number | null>(null);

  useEffect(() => {
    if (session && slideIndex === null) {
      setSlideIndex(session.current_slide_index ?? 0);
    }
  }, [session, slideIndex]);

  const realtime = useClassSessionRealtime(sessionId ?? "");
  useEffect(() => {
    return realtime.onSlideChange((index) => setSlideIndex(index));
  }, [realtime]);

  const updateSlide = useUpdateCurrentSlide();

  const goToSlide = useCallback(
    (index: number) => {
      if (!session || index < 0 || index >= slides.length) return;
      setSlideIndex(index);
      updateSlide.mutate({ sessionId: session.id, slideIndex: index, classId: session.class_id });
      realtime.sendSlideChange(index);
    },
    [session, slides.length, updateSlide, realtime]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (slideIndex === null) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goToSlide(slideIndex + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToSlide(slideIndex - 1);
      } else if (e.key === "Escape") {
        window.close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slideIndex, goToSlide]);

  if (sessionLoading || contentLoading || slideIndex === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading presentation…
      </div>
    );
  }

  if (!session || session.ended_at) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 text-center px-4 bg-background">
        <p className="text-lg font-medium">This lesson isn't active anymore.</p>
        <Button onClick={() => window.close()}>Close Window</Button>
      </div>
    );
  }

  const currentSlide = slides[slideIndex];

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <span className="text-sm text-muted-foreground truncate">{content?.title}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => window.close()}
          title="Close presentation"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 min-h-0 p-8 flex items-center justify-center overflow-y-auto">
        {currentSlide ? (
          <div className="w-full max-w-6xl">
            {content?.atlasLessonId ? (
              <AtlasDeckEmbed atlasLessonId={content.atlasLessonId} slideIndex={slideIndex} />
            ) : (
              <SlideViewer slide={currentSlide} />
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">No slides in this lesson.</p>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t">
        <Button variant="outline" onClick={() => goToSlide(slideIndex - 1)} disabled={slideIndex === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Prev
        </Button>
        <span className="text-sm text-muted-foreground">
          {slideIndex + 1} / {slides.length}
        </span>
        <Button
          variant="outline"
          onClick={() => goToSlide(slideIndex + 1)}
          disabled={slideIndex >= slides.length - 1}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
