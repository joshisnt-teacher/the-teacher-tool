import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { BookOpen, Play, Loader2, Layers, ArrowLeft } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useClasses } from '@/hooks/useClasses';
import { useToast } from '@/hooks/use-toast';

// ── Types ────────────────────────────────────────────────────────────────────

interface LessonTemplateMetadata {
  subject?: string;
  year_level?: string;
  estimated_minutes?: number;
}

interface LessonTemplate {
  id: string;
  title: string;
  description: string | null;
  source: string;
  atlas_lesson_id: string | null;
  teacher_id: string;
  metadata: LessonTemplateMetadata | null;
  updated_at: string;
  created_at: string;
  // Supabase returns nested count as an array of objects
  lesson_template_slides: { count: number }[];
}

// ── Main page ────────────────────────────────────────────────────────────────

const Lessons = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const { data: classes = [] } = useClasses();

  const teacherId = currentUser?.id;

  // State for the "Start Lesson" dialog
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // ── Query: fetch lesson templates with slide count ──────────────────────────
  const {
    data: templates = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['lesson-templates', teacherId],
    queryFn: async (): Promise<LessonTemplate[]> => {
      if (!teacherId) return [];

      const { data, error } = await supabase
        .from('lesson_templates')
        .select('*, lesson_template_slides(count)')
        .eq('source', 'atlas')
        .eq('teacher_id', teacherId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as LessonTemplate[];
    },
    enabled: !!teacherId,
  });

  // ── Mutation: start or update a class session ───────────────────────────────
  const startSession = useMutation({
    mutationFn: async ({
      templateId,
      classId,
    }: {
      templateId: string;
      classId: string;
    }) => {
      // Check for an existing active session for this class
      const { data: activeSession, error: checkError } = await supabase
        .from('class_sessions')
        .select('id')
        .eq('class_id', classId)
        .is('ended_at', null)
        .maybeSingle();

      if (checkError) throw checkError;

      if (activeSession) {
        // Update the existing session with this lesson template
        const { error: updateError } = await supabase
          .from('class_sessions')
          .update({
            lesson_template_id: templateId,
            mode: 'structured',
            current_slide_index: 0,
          })
          .eq('id', activeSession.id);

        if (updateError) throw updateError;
      } else {
        // Insert a new session
        const { error: insertError } = await supabase
          .from('class_sessions')
          .insert({
            class_id: classId,
            lesson_template_id: templateId,
            mode: 'structured',
            current_slide_index: 0,
            is_active: true,
          });

        if (insertError) throw insertError;
      }

      return classId;
    },
    onSuccess: (classId) => {
      setStartDialogOpen(false);
      setSelectedTemplateId(null);
      setSelectedClassId('');
      navigate(`/classroom/${classId}`);
    },
    onError: (err: unknown) => {
      toast({
        title: 'Failed to start lesson',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleStartClick = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setSelectedClassId('');
    setStartDialogOpen(true);
  };

  const handleConfirmStart = () => {
    if (!selectedTemplateId || !selectedClassId) return;
    startSession.mutate({ templateId: selectedTemplateId, classId: selectedClassId });
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const getSlideCount = (template: LessonTemplate): number => {
    // Supabase returns count as [{ count: number }]
    const entry = template.lesson_template_slides?.[0];
    return entry?.count ?? 0;
  };

  const nonDemoClasses = classes.filter((c) => !c.is_demo);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <header className="bg-card border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Lessons</h1>
              <p className="text-sm text-muted-foreground">
                Atlas lesson templates imported into Pulse
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Lesson Library
            </CardTitle>
            <CardDescription>
              Lessons imported from Atlas. Pick one and choose a class to start a structured session.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Error state */}
            {isError && (
              <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                <p className="text-sm text-destructive font-medium">Failed to load lessons.</p>
                <p className="text-xs text-destructive/80 mt-1">
                  {error instanceof Error ? error.message : 'Unknown error'}
                </p>
              </div>
            )}

            {!isError && (
              <div className="space-y-4">
                {/* Loading state */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : templates.length > 0 ? (
                  /* Card grid */
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => {
                      const slideCount = getSlideCount(template);
                      const meta = template.metadata;

                      return (
                        <Card
                          key={template.id}
                          className="flex flex-col border-border/80 hover:shadow-md transition-shadow"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base leading-snug">
                                {template.title}
                              </CardTitle>
                              <Badge variant="secondary" className="shrink-0 flex items-center gap-1 text-xs">
                                <Layers className="w-3 h-3" />
                                {slideCount} {slideCount === 1 ? 'slide' : 'slides'}
                              </Badge>
                            </div>

                            {template.description && (
                              <CardDescription className="line-clamp-2 mt-1">
                                {template.description}
                              </CardDescription>
                            )}
                          </CardHeader>

                          <CardContent className="flex flex-col gap-3 flex-1">
                            {/* Metadata badges */}
                            {meta && (
                              <div className="flex flex-wrap gap-1.5">
                                {meta.subject && (
                                  <Badge variant="outline" className="text-xs">
                                    {meta.subject}
                                  </Badge>
                                )}
                                {meta.year_level && (
                                  <Badge variant="outline" className="text-xs">
                                    Yr {meta.year_level}
                                  </Badge>
                                )}
                                {meta.estimated_minutes && (
                                  <Badge variant="outline" className="text-xs">
                                    ~{meta.estimated_minutes} min
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Date */}
                            <p className="text-xs text-muted-foreground mt-auto">
                              Updated{' '}
                              {formatDistanceToNow(new Date(template.updated_at), {
                                addSuffix: true,
                              })}
                            </p>

                            {/* Action */}
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => handleStartClick(template.id)}
                            >
                              <Play className="w-3.5 h-3.5 mr-1.5" />
                              Start Lesson
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  /* Empty state */
                  <div className="text-center py-16">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No lessons imported yet</h3>
                    <p className="text-muted-foreground mb-2">
                      Send a lesson from Atlas to get started.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Open Atlas at{' '}
                      <span className="font-medium">atlas.edufied.com.au</span>
                      {' '}and use the "Send to Pulse" action on any lesson.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Start Lesson dialog — class selector */}
      <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Lesson</DialogTitle>
            <DialogDescription>
              Choose a class to start this lesson in. An active classroom session will be created
              (or updated) for that class.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1 max-h-52 overflow-y-auto border rounded-md p-2">
            {nonDemoClasses.length === 0 && (
              <p className="text-sm text-muted-foreground px-2 py-1">No classes found.</p>
            )}
            {nonDemoClasses.map((c) => (
              <label
                key={c.id}
                className={`flex items-center gap-3 cursor-pointer rounded-md px-3 py-2 select-none transition-colors ${
                  selectedClassId === c.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted/60'
                }`}
              >
                <input
                  type="radio"
                  name="class-select"
                  value={c.id}
                  checked={selectedClassId === c.id}
                  onChange={() => setSelectedClassId(c.id)}
                  className="accent-primary"
                />
                <span className="text-sm font-medium">{c.class_name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{c.subject}</span>
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStartDialogOpen(false)}
              disabled={startSession.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmStart}
              disabled={!selectedClassId || startSession.isPending}
            >
              {startSession.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Lesson
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Lessons;
