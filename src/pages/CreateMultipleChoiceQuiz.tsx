import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const generateJoinCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  answers: Answer[];
}

const defaultTimerSeconds = 20;
const defaultAttemptsPerQuestion = 1;

const CreateMultipleChoiceQuiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: currentUser, isLoading: isLoadingCurrentUser } = useCurrentUser();
  const [searchParams] = useSearchParams();
  const activityIdParam = searchParams.get('activityId');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(Boolean(activityIdParam));
  const [activityId, setActivityId] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(defaultTimerSeconds);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [attemptsPerQuestion, setAttemptsPerQuestion] = useState<number>(defaultAttemptsPerQuestion);

  const isEditing = Boolean(activityIdParam);
  const isFormDisabled = isSaving || isDeleting || isLoadingQuiz;

  useEffect(() => {
    if (activityIdParam) {
      setActivityId(activityIdParam);
    }
  }, [activityIdParam]);

  useEffect(() => {
    const loadQuiz = async (existingActivityId: string) => {
      setIsLoadingQuiz(true);

      try {
        const { data, error } = await supabase
          .from('activities')
          .select(`
            id,
            title,
            description,
            activity_quizzes (
              id,
              timer_seconds,
              randomize_questions,
              show_leaderboard,
              attempts_per_question,
              quiz_questions (
                id,
                question_text,
                order_index,
                quiz_answers (
                  id,
                  answer_text,
                  is_correct,
                  order_index
                )
              )
            )
          `)
          .eq('id', existingActivityId)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          toast({
            title: 'Quiz not found',
            description: 'The requested quiz could not be found or you may not have access to it.',
            variant: 'destructive',
          });
          return;
        }

        setActivityId(data.id);
        setTitle(data.title ?? '');
        setDescription(data.description ?? '');

        const quizRecord = Array.isArray(data.activity_quizzes)
          ? data.activity_quizzes[0]
          : data.activity_quizzes;

        if (quizRecord) {
          setQuizId(quizRecord.id);
          setTimerSeconds(quizRecord.timer_seconds ?? defaultTimerSeconds);
          setRandomizeQuestions(quizRecord.randomize_questions ?? false);
          setShowLeaderboard(quizRecord.show_leaderboard ?? true);
          setAttemptsPerQuestion(quizRecord.attempts_per_question ?? defaultAttemptsPerQuestion);

          const mappedQuestions: Question[] = (quizRecord.quiz_questions || [])
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((question) => ({
              id: question.id ?? generateId(),
              text: question.question_text ?? '',
              answers: (question.quiz_answers || [])
                .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                .map((answer) => ({
                  id: answer.id ?? generateId(),
                  text: answer.answer_text ?? '',
                  isCorrect: !!answer.is_correct,
                })),
            }));

          setQuestions(mappedQuestions);
        }
      } catch (loadError: any) {
        console.error('Error loading quiz:', loadError);
        toast({
          title: 'Failed to load quiz',
          description: loadError?.message || 'An unexpected error occurred while loading the quiz.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingQuiz(false);
      }
    };

    if (activityIdParam && currentUser?.school_id) {
      loadQuiz(activityIdParam);
    } else if (!activityIdParam) {
      setIsLoadingQuiz(false);
    }
  }, [activityIdParam, currentUser?.school_id, toast]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: generateId(),
      text: '',
      answers: [
        { id: generateId(), text: '', isCorrect: false },
        { id: generateId(), text: '', isCorrect: false },
      ],
    };
    setQuestions((prev) => [...prev, newQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const updateQuestionText = (questionId: string, text: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, text } : q
    ));
  };

  const addAnswer = (questionId: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: [
                ...q.answers,
                {
                  id: generateId(),
                  text: '',
                  isCorrect: false,
                },
              ],
            }
          : q
      )
    );
  };

  const removeAnswer = (questionId: string, answerId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            answers: q.answers.filter(a => a.id !== answerId) 
          }
        : q
    ));
  };

  const updateAnswerText = (questionId: string, answerId: string, text: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            answers: q.answers.map(a => 
              a.id === answerId ? { ...a, text } : a
            ) 
          }
        : q
    ));
  };

  const setCorrectAnswer = (questionId: string, answerId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            answers: q.answers.map(a => 
              ({ ...a, isCorrect: a.id === answerId })
            ) 
          }
        : q
    ));
  };

  const validateQuiz = (): string | null => {
    if (!title.trim()) {
      return 'Please enter a quiz title';
    }

    if (!Number.isFinite(timerSeconds) || timerSeconds <= 0) {
      return 'Timer seconds must be greater than 0';
    }

    if (!Number.isFinite(attemptsPerQuestion) || attemptsPerQuestion < 1) {
      return 'Attempts per question must be at least 1';
    }

    if (questions.length === 0) {
      return 'Please add at least one question';
    }
    for (const question of questions) {
      if (!question.text.trim()) {
        return 'All questions must have text';
      }
      if (question.answers.length < 2) {
        return 'Each question must have at least 2 answers';
      }
      for (const answer of question.answers) {
        if (!answer.text.trim()) {
          return 'All answers must have text';
        }
      }
      const hasCorrectAnswer = question.answers.some((a) => a.isCorrect);
      if (!hasCorrectAnswer) {
        return 'Each question must have one correct answer';
      }
    }
    return null;
  };

  const handleSave = async () => {
    if (isSaving) return;

    const error = validateQuiz();
    if (error) {
      toast({
        title: 'Validation Error',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    if (isLoadingCurrentUser) {
      toast({
        title: 'Please wait',
        description: 'We are still loading your profile information.',
        variant: 'destructive',
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: 'Unable to save quiz',
        description: 'User information is unavailable. Please sign in again.',
        variant: 'destructive',
      });
      return;
    }

    if (!currentUser.school_id) {
      toast({
        title: 'Missing school information',
        description: 'You must be associated with a school to create activities.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    let resolvedActivityId = activityId;
    let resolvedQuizId = quizId;
    let createdActivityId: string | null = null;

    try {
      if (!resolvedActivityId) {
        // Generate join code for new activity
        let joinCode = generateJoinCode();
        let codeExists = true;
        let attempts = 0;
        
        // Ensure unique join code (check if it exists, regenerate if needed)
        while (codeExists && attempts < 10) {
          const { data: existing } = await supabase
            .from('activities')
            .select('id')
            .eq('join_code', joinCode)
            .maybeSingle();
          
          if (!existing) {
            codeExists = false;
          } else {
            joinCode = generateJoinCode();
            attempts++;
          }
        }

        const { data: activity, error: activityError } = await supabase
          .from('activities')
          .insert({
            school_id: currentUser.school_id,
            created_by: currentUser.id,
            class_id: null,
            title: title.trim(),
            description: description.trim() || null,
            type: 'QUIZ',
            status: 'draft',
            join_code: joinCode,
          })
          .select()
          .single();

        if (activityError) throw activityError;
        if (!activity) throw new Error('Failed to create activity');

        resolvedActivityId = activity.id;
        createdActivityId = activity.id;
        setActivityId(activity.id);
      } else {
        const { error: updateActivityError } = await supabase
          .from('activities')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', resolvedActivityId);

        if (updateActivityError) throw updateActivityError;
      }

      if (!resolvedQuizId) {
        const { data: quiz, error: quizError } = await supabase
          .from('activity_quizzes')
          .insert({
            activity_id: resolvedActivityId!,
            timer_seconds: timerSeconds,
            randomize_questions: randomizeQuestions,
            show_leaderboard: showLeaderboard,
            attempts_per_question: attemptsPerQuestion,
          })
          .select()
          .single();

        if (quizError) throw quizError;
        if (!quiz) throw new Error('Failed to create quiz metadata');

        resolvedQuizId = quiz.id;
        setQuizId(quiz.id);
      } else {
        const { error: updateQuizError } = await supabase
          .from('activity_quizzes')
          .update({
            timer_seconds: timerSeconds,
            randomize_questions: randomizeQuestions,
            show_leaderboard: showLeaderboard,
            attempts_per_question: attemptsPerQuestion,
          })
          .eq('id', resolvedQuizId);

        if (updateQuizError) throw updateQuizError;
      }

      if (!resolvedQuizId) {
        throw new Error('Quiz metadata could not be resolved.');
      }

      const { error: deleteQuestionsError } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', resolvedQuizId);

      if (deleteQuestionsError) throw deleteQuestionsError;

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];

        const { data: insertedQuestion, error: questionError } = await supabase
          .from('quiz_questions')
          .insert({
            quiz_id: resolvedQuizId,
            question_text: question.text.trim(),
            order_index: i + 1,
          })
          .select()
          .single();

        if (questionError) throw questionError;
        if (!insertedQuestion) throw new Error('Failed to save a quiz question');

        const answerInserts = question.answers.map((answer, answerIndex) => ({
          question_id: insertedQuestion.id,
          answer_text: answer.text.trim(),
          is_correct: answer.isCorrect,
          order_index: answerIndex + 1,
        }));

        const { error: answersError } = await supabase.from('quiz_answers').insert(answerInserts);

        if (answersError) throw answersError;
      }

      toast({
        title: 'Quiz Saved',
        description: 'Your quiz has been saved successfully.',
      });

      navigate('/activities');
    } catch (saveError: any) {
      console.error('Error saving quiz:', saveError);

      if (createdActivityId) {
        try {
          await supabase.from('activities').delete().eq('id', createdActivityId);
        } catch (cleanupError) {
          console.error('Failed to clean up created activity after error:', cleanupError);
        }
      }

      toast({
        title: 'Failed to Save Quiz',
        description: saveError?.message || 'An unexpected error occurred while saving the quiz.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    if (!activityId) {
      toast({
        title: 'Quiz Discarded',
        description: 'Your quiz draft has been discarded.',
      });
      navigate('/activities');
      return;
    }

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      toast({
        title: 'Quiz Deleted',
        description: 'The quiz has been deleted.',
      });

      navigate('/activities');
    } catch (error: any) {
      console.error('Error deleting quiz:', error);
      toast({
        title: 'Failed to Delete Quiz',
        description: error?.message || 'An unexpected error occurred while deleting the quiz.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/activities')}
              disabled={isSaving || isDeleting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Activities
            </Button>
            <div>
              <h1 className="text-xl font-bold">{isEditing ? 'Edit Multiple Choice Quiz' : 'Create Multiple Choice Quiz'}</h1>
              <p className="text-sm text-muted-foreground">
                {isEditing ? 'Update your quiz content, settings, and questions' : 'Build your quiz with questions and answers'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isEditing ? 'destructive' : 'outline'}
              onClick={() => setShowDeleteDialog(true)}
              disabled={isSaving || isDeleting || isLoadingQuiz}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Deleting...' : isEditing ? 'Delete' : 'Discard'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || isDeleting || isLoadingCurrentUser || isLoadingQuiz}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? (isEditing ? 'Updating...' : 'Saving...') : isEditing ? 'Update Quiz' : 'Save Quiz'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Quiz Details */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Quiz Details</CardTitle>
              <CardDescription>
                Set the title and description for your quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter quiz title"
                  disabled={isFormDisabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter quiz description (optional)"
                  rows={3}
                  disabled={isFormDisabled}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Quiz Settings</CardTitle>
              <CardDescription>Configure how the quiz runs during activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timer-seconds">Timer (seconds)</Label>
                  <Input
                    id="timer-seconds"
                    type="number"
                    min={1}
                    value={timerSeconds}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      setTimerSeconds(Number.isNaN(parsed) ? defaultTimerSeconds : Math.max(1, parsed));
                    }}
                    disabled={isFormDisabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    How long students have to answer each question.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attempts-per-question">Attempts per question</Label>
                  <Input
                    id="attempts-per-question"
                    type="number"
                    min={1}
                    value={attemptsPerQuestion}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      setAttemptsPerQuestion(Number.isNaN(parsed) ? defaultAttemptsPerQuestion : Math.max(1, parsed));
                    }}
                    disabled={isFormDisabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of attempts a student gets for each question.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 px-4 py-3">
                  <div>
                    <Label className="font-medium">Randomize questions</Label>
                    <p className="text-xs text-muted-foreground">
                      Shuffle the order of questions for each run.
                    </p>
                  </div>
                  <Switch
                    checked={randomizeQuestions}
                    onCheckedChange={setRandomizeQuestions}
                    disabled={isFormDisabled}
                    aria-label="Randomize questions"
                  />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 px-4 py-3">
                  <div>
                    <Label className="font-medium">Show leaderboard</Label>
                    <p className="text-xs text-muted-foreground">
                      Display rankings between questions to motivate students.
                    </p>
                  </div>
                  <Switch
                    checked={showLeaderboard}
                    onCheckedChange={setShowLeaderboard}
                    disabled={isFormDisabled}
                    aria-label="Show leaderboard"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="space-y-4">
            {isLoadingQuiz && isEditing && (
              <div className="rounded-md border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                Loading quiz content...
              </div>
            )}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Questions ({questions.length})</h2>
              <Button onClick={addQuestion} disabled={isFormDisabled}>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    No questions yet. Click "Add Question" to get started.
                  </p>
                  <Button onClick={addQuestion} disabled={isFormDisabled}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Question
                  </Button>
                </CardContent>
              </Card>
            ) : (
              questions.map((question, questionIndex) => (
                <Card key={question.id} className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          Question {questionIndex + 1}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <Textarea
                            value={question.text}
                            onChange={(e) => updateQuestionText(question.id, e.target.value)}
                            placeholder="Enter your question here..."
                            rows={2}
                            className="resize-none"
                            disabled={isFormDisabled}
                          />
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                        className="ml-4"
                        disabled={isFormDisabled}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Answers</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addAnswer(question.id)}
                          disabled={isFormDisabled || question.answers.length >= 6}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Answer
                        </Button>
                      </div>
                      
                      {question.answers.map((answer, answerIndex) => (
                        <div key={answer.id} className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={answer.isCorrect}
                              onChange={() => setCorrectAnswer(question.id, answer.id)}
                              className="w-4 h-4"
                              disabled={isFormDisabled}
                            />
                            <Input
                              value={answer.text}
                              onChange={(e) => updateAnswerText(question.id, answer.id, e.target.value)}
                              placeholder={`Answer ${answerIndex + 1}`}
                              className={answer.isCorrect ? 'border-green-500' : ''}
                              disabled={isFormDisabled}
                            />
                            {answer.isCorrect && (
                              <span className="text-xs text-green-600 font-medium">Correct</span>
                            )}
                          </div>
                          {question.answers.length > 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAnswer(question.id, answer.id)}
                              disabled={isFormDisabled}
                            >
                              <X className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      {question.answers.length < 2 && (
                        <p className="text-xs text-muted-foreground">
                          At least 2 answers are required
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quiz</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this quiz? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={async () => {
                setShowDeleteDialog(false);
                await handleDelete();
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateMultipleChoiceQuiz;

