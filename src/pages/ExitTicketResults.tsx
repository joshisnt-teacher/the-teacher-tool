import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Users, BarChart3, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStudents } from '@/hooks/useStudents';
import { useQuestionOptionsForTask } from '@/hooks/useQuestionOptions';
import { ActionsTab } from '@/components/assessment/ActionsTab';
import { ExitTicketResponsesTable } from '@/components/assessment/ExitTicketResponsesTable';

const ExitTicketResults = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['task', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, name, class_id, is_exit_ticket, status')
        .eq('id', assessmentId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!assessmentId,
  });

  const { data: classInfo } = useQuery({
    queryKey: ['class-for-task', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('class_name')
        .eq('id', task!.class_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!task?.class_id,
  });

  const { data: students = [] } = useStudents(task?.class_id);

  const { data: questions = [] } = useQuery({
    queryKey: ['task-questions', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('id, number, question_type, max_score')
        .eq('task_id', assessmentId!)
        .order('number', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!assessmentId,
  });

  const questionIds = useMemo(() => questions.map((q) => q.id), [questions]);

  // Key matches what useAIMarkResponses invalidates — table auto-refreshes after marking
  const { data: questionResults = [] } = useQuery({
    queryKey: ['assessment-question-results', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_results')
        .select(`
          id,
          question_id,
          student_id,
          raw_score,
          percent_score,
          response_data,
          ai_feedback,
          students!inner (first_name, last_name)
        `)
        .in('question_id', questionIds);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        question_id: r.question_id,
        student_id: r.student_id,
        raw_score: r.raw_score ?? null,
        percent_score: r.percent_score ?? null,
        response_data: r.response_data,
        ai_feedback: r.ai_feedback ?? null,
      }));
    },
    enabled: !!assessmentId && questionIds.length > 0,
  });

  // Key matches what useAIMarkResponses invalidates — totals auto-refresh after marking
  const { data: overallResults = [] } = useQuery({
    queryKey: ['assessment-results', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('results')
        .select('student_id, percent_score')
        .eq('task_id', assessmentId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!assessmentId,
  });

  const { data: optionsMap = {} } = useQuestionOptionsForTask(assessmentId);

  // ── Summary card calculations ──────────────────────────────────────────────

  const submittedCount = useMemo(
    () => new Set(questionResults.map((qr) => qr.student_id)).size,
    [questionResults]
  );

  const classAverage = useMemo(() => {
    const valid = overallResults.filter((r) => r.percent_score != null);
    if (!valid.length) return null;
    return valid.reduce((sum, r) => sum + r.percent_score!, 0) / valid.length;
  }, [overallResults]);

  const hardestQuestion = useMemo(() => {
    if (!questions.length || !questionResults.length) return null;
    const avgs = questions
      .map((q) => {
        const qrs = questionResults.filter(
          (qr) => qr.question_id === q.id && qr.percent_score != null
        );
        if (!qrs.length) return null;
        const avg = qrs.reduce((s, qr) => s + qr.percent_score!, 0) / qrs.length;
        return { number: q.number, avg };
      })
      .filter((x): x is { number: number; avg: number } => x !== null);
    if (!avgs.length) return null;
    return avgs.reduce((min, x) => (x.avg < min.avg ? x : min));
  }, [questions, questionResults]);

  const statusVariant = (s?: string | null) => {
    if (s === 'active') return 'default' as const;
    if (s === 'closed') return 'secondary' as const;
    return 'outline' as const;
  };

  // ── Loading / error states ─────────────────────────────────────────────────

  if (taskLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">Exit ticket not found.</p>
        <Link to="/exit-tickets">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Exit Tickets
          </Button>
        </Link>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
            <Link to="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <Link to="/exit-tickets" className="hover:text-foreground transition-colors">
              Exit Tickets
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[240px]">
              {task.name}
            </span>
          </nav>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{task.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {classInfo?.class_name && <span>{classInfo.class_name}</span>}
                {task.status && (
                  <Badge variant={statusVariant(task.status)} className="capitalize text-xs">
                    {task.status}
                  </Badge>
                )}
              </div>
            </div>
            <Link to="/exit-tickets">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <Users className="w-8 h-8 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">
                  {submittedCount} / {students.length}
                </p>
                <p className="text-sm text-muted-foreground">Responses submitted</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">
                  {classAverage != null ? `${Math.round(classAverage)}%` : '—'}
                </p>
                <p className="text-sm text-muted-foreground">Class average</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <HelpCircle className="w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <p className="text-2xl font-bold">
                  {hardestQuestion
                    ? `Q${hardestQuestion.number} — ${Math.round(hardestQuestion.avg)}%`
                    : '—'}
                </p>
                <p className="text-sm text-muted-foreground">Hardest question</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="responses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="ai-actions">AI Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="responses">
            <ExitTicketResponsesTable
              taskId={task.id}
              questions={questions}
              questionResults={questionResults}
              students={students}
              overallResults={overallResults}
              optionsMap={optionsMap}
            />
          </TabsContent>

          <TabsContent value="ai-actions" className="space-y-4">
            <ActionsTab
              taskId={task.id}
              taskName={task.name}
              className={classInfo?.class_name ?? ''}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ExitTicketResults;
