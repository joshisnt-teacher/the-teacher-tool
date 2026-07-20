import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useStudentSession } from "@/hooks/useStudentSession";
import { useLessonTemplateContent } from "@/hooks/useLessonTemplateContent";
import { useClassSessionRealtime } from "@/hooks/useClassSessionRealtime";
import { SlideViewer } from "@/components/lesson/SlideViewer";

const StudentLesson = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session: studentSession, loading: sessionLoading } = useStudentSession();

  const [liveIndex, setLiveIndex] = useState<number | null>(null);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const followingLiveRef = useRef(true);

  useEffect(() => {
    if (!sessionLoading && !studentSession) {
      window.location.href = "https://student.edufied.com.au";
    }
  }, [sessionLoading, studentSession]);

  const { data: classSession, isLoading: sessionQueryLoading } = useQuery({
    queryKey: ["class-session", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_sessions")
        .select("id, class_id, lesson_template_id, current_slide_index, ended_at, classes(class_name)")
        .eq("id", sessionId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: content, isLoading: contentLoading } = useLessonTemplateContent(
    classSession?.lesson_template_id ?? null
  );
  const slides = content?.slides ?? [];

  // Catch up to the session's current slide once it loads (fixes joining mid-lesson)
  useEffect(() => {
    if (classSession && liveIndex === null) {
      const index = classSession.current_slide_index ?? 0;
      setLiveIndex(index);
      setViewIndex(index);
    }
  }, [classSession, liveIndex]);

  const realtime = useClassSessionRealtime(sessionId ?? "");
  useEffect(() => {
    return realtime.onSlideChange((index) => {
      setLiveIndex(index);
      if (followingLiveRef.current) {
        setViewIndex(index);
      }
    });
  }, [realtime]);

  const goBack = () => {
    if (viewIndex === null || viewIndex <= 0) return;
    followingLiveRef.current = false;
    setViewIndex(viewIndex - 1);
  };

  const goForward = () => {
    if (viewIndex === null || liveIndex === null || viewIndex >= liveIndex) return;
    const next = viewIndex + 1;
    followingLiveRef.current = next >= liveIndex;
    setViewIndex(next);
  };

  const jumpToLive = () => {
    followingLiveRef.current = true;
    if (liveIndex !== null) setViewIndex(liveIndex);
  };

  const currentSlide = viewIndex !== null ? slides[viewIndex] : undefined;
  const isLive = viewIndex === liveIndex;

  if (sessionLoading || sessionQueryLoading || contentLoading || !studentSession) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        Loading lesson…
      </div>
    );
  }

  if (!classSession || classSession.ended_at) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-lg font-medium">This lesson isn't active anymore.</p>
        <Button onClick={() => navigate("/student/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <span className="text-sm text-muted-foreground truncate">
          {(classSession as unknown as { classes?: { class_name?: string } }).classes?.class_name}
        </span>
        {!isLive && (
          <Button size="sm" variant="secondary" onClick={jumpToLive}>
            <Radio className="w-3.5 h-3.5 mr-1.5" />
            Jump to live
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 p-4 overflow-y-auto">
        {currentSlide ? (
          <SlideViewer slide={currentSlide} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Waiting for the teacher to start…
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t">
        <Button variant="outline" size="sm" onClick={goBack} disabled={viewIndex === null || viewIndex === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Prev
        </Button>
        <span className="text-sm text-muted-foreground">
          {viewIndex !== null ? viewIndex + 1 : "-"} / {slides.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={goForward}
          disabled={viewIndex === null || liveIndex === null || viewIndex >= liveIndex}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default StudentLesson;
