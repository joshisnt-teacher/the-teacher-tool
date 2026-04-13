import React, { useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useQuestions } from '@/hooks/useQuestions';
import { useQuestionOptionsForTask } from '@/hooks/useQuestionOptions';
import { useSubmitExitTicket } from '@/hooks/useSubmitExitTicket';
import { toast } from '@/hooks/use-toast';

const TakeExitTicket = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('studentId');
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Record<string, { selectedOptionId?: string; text?: string }>>({});

  const { data: task, isLoading: isLoadingTask } = useQuery({
    queryKey: ['public-exit-ticket', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, name, description, class_id')
        .eq('id', taskId)
        .eq('is_exit_ticket', true)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });

  const { data: questions = [], isLoading: isLoadingQuestions } = useQuestions(taskId);
  const { data: optionsMap = {}, isLoading: isLoadingOptions } = useQuestionOptionsForTask(taskId);

  const { data: existingResult, isLoading: isLoadingResult } = useQuery({
    queryKey: ['exit-ticket-result', taskId, studentId],
    queryFn: async () => {
      if (!studentId || !taskId) return null;
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('task_id', taskId)
        .eq('student_id', studentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!studentId && !!taskId,
  });

  const submitMutation = useSubmitExitTicket();

  const isLoading = isLoadingTask || isLoadingQuestions || isLoadingOptions || isLoadingResult;

  const handleOptionChange = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { selectedOptionId: optionId } }));
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { text } }));
  };

  const handleSubmit = async () => {
    if (!taskId || !studentId) return;

    // Validate all questions answered
    for (const q of questions) {
      const ans = answers[q.id];
      if (q.question_type === 'multiple_choice' && !ans?.selectedOptionId) {
        toast({ title: 'Please answer all questions', variant: 'destructive' });
        return;
      }
      if ((q.question_type === 'short_answer' || q.question_type === 'extended_answer') && !ans?.text?.trim()) {
        toast({ title: 'Please answer all questions', variant: 'destructive' });
        return;
      }
    }

    const payloadAnswers = questions.map((q) => ({
      questionId: q.id,
      maxScore: q.max_score,
      questionType: q.question_type || 'short_answer',
      selectedOptionId: answers[q.id]?.selectedOptionId || null,
      textAnswer: answers[q.id]?.text || null,
    }));

    submitMutation.mutate(
      {
        taskId,
        studentId,
        answers: payloadAnswers,
        optionsMap: Object.fromEntries(
          Object.entries(optionsMap).map(([qid, opts]) => [
            qid,
            opts.map((o) => ({ id: o.id, is_correct: o.is_correct })),
          ])
        ),
      },
      {
        onSuccess: () => {
          // stay on page, show success via existingResult refetch on next render
        },
      }
    );
  };

  if (!studentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Missing Student ID</h2>
            <p className="text-muted-foreground">Please join via your class code first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading exit ticket...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Exit Ticket Not Available</h2>
            <p className="text-muted-foreground">This exit ticket is not currently active.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (existingResult || submitMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Submitted!</h2>
            <p className="text-muted-foreground mb-4">
              Your exit ticket has been submitted successfully.
            </p>
            <Button variant="outline" onClick={() => navigate(`/${searchParams.get('classCode') || ''}`)}>
              Back to Class
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">{task.name}</h1>
          {task.description && <p className="text-muted-foreground">{task.description}</p>}
        </div>

        {questions.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>This exit ticket has no questions yet.</AlertDescription>
          </Alert>
        ) : (
          <>
            {questions.map((q, idx) => {
              const options = optionsMap[q.id] || [];
              return (
                <Card key={q.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Question {idx + 1}
                      {q.max_score !== null && q.max_score !== undefined && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({q.max_score} point{q.max_score === 1 ? '' : 's'})
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-base">{q.question}</p>

                    {q.question_type === 'multiple_choice' && (
                      <div className="space-y-2">
                        {options.map((opt) => (
                          <label
                            key={opt.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              answers[q.id]?.selectedOptionId === opt.id
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              checked={answers[q.id]?.selectedOptionId === opt.id}
                              onChange={() => handleOptionChange(q.id, opt.id)}
                              className="w-4 h-4"
                            />
                            <span>{opt.option_text}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.question_type === 'short_answer' && (
                      <Input
                        placeholder="Type your answer..."
                        value={answers[q.id]?.text || ''}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                      />
                    )}

                    {q.question_type === 'extended_answer' && (
                      <Textarea
                        placeholder="Type your answer..."
                        rows={5}
                        value={answers[q.id]?.text || ''}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Exit Ticket'
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default TakeExitTicket;
