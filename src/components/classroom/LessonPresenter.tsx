import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SlideViewer } from "@/components/lesson/SlideViewer";
import { LessonResourcesList } from "@/components/lesson/LessonResourcesList";
import { useLessonTemplateContent } from "@/hooks/useLessonTemplateContent";
import { useUpdateCurrentSlide } from "@/hooks/useClassSessions";
import { useClassSessionRealtime } from "@/hooks/useClassSessionRealtime";

interface Props {
  session: {
    id: string;
    class_id: string;
    lesson_template_id: string;
    current_slide_index: number | null;
  };
}

export function LessonPresenter({ session }: Props) {
  const { data, isLoading } = useLessonTemplateContent(session.lesson_template_id);
  const updateSlide = useUpdateCurrentSlide();
  const realtime = useClassSessionRealtime(session.id);

  const slides = data?.slides ?? [];
  const resources = data?.resources ?? [];
  const currentIndex = Math.min(session.current_slide_index ?? 0, Math.max(slides.length - 1, 0));
  const currentSlide = slides[currentIndex];

  const goToSlide = (index: number) => {
    if (index < 0 || index >= slides.length) return;
    updateSlide.mutate({ sessionId: session.id, slideIndex: index, classId: session.class_id });
    realtime.sendSlideChange(index);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Loading lesson…</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {slides.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5" />
              Slides
            </CardTitle>
            <CardDescription>
              {currentIndex + 1} of {slides.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-1.5 flex-wrap">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`w-7 h-7 text-xs rounded border flex items-center justify-center transition-colors ${
                    i === currentIndex
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {currentSlide && <SlideViewer slide={currentSlide} />}

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => goToSlide(currentIndex - 1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex === slides.length - 1}
                onClick={() => goToSlide(currentIndex + 1)}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {resources.length > 0 && <LessonResourcesList resources={resources} />}
    </div>
  );
}
