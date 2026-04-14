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
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Save, Loader2, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useClasses } from '@/hooks/useClasses';
import { useContentItems } from '@/hooks/useContentItems';
import { useBloomsTaxonomy } from '@/hooks/useCreateAssessment';
import type { MarkingCriteria } from '@/lib/autoMarkTextAnswer';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

type QuestionType = 'multiple_choice' | 'short_answer' | 'extended_answer';

interface QuestionOptionDraft {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionDraft {
  id: string;
  text: string;
  type: QuestionType;
  maxScore: number;
  options: QuestionOptionDraft[];
  markingCriteria?: MarkingCriteria;
  modelAnswer?: string;
}

const defaultQuestion = (): QuestionDraft => ({
  id: generateId(),
  text: '',
  type: 'multiple_choice',
  maxScore: 1,
  options: [
    { id: generateId(), text: '', isCorrect: false },
    { id: generateId(), text: '', isCorrect: false },
  ],
});

const CreateExitTicket = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const { data: classes = [], isLoading: isLoadingClasses } = useClasses();
  const { data: contentItems = [] } = useContentItems({});
  const bloomsLevels = useBloomsTaxonomy();

  const [searchParams] = useSearchParams();
  const editTaskId = searchParams.get('taskId');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState<string>('');
  const [taskType, setTaskType] = useState<string>('Formative');
  const [bloomsTaxonomy, setBloomsTaxonomy] = useState<string>('');
  const [keySkill, setKeySkill] = useState<string>('');
  const [contentItemId, setContentItemId] = useState<string>('');
  const [status, setStatus] = useState<'draft' | 'active' | 'closed'>('draft');
  const [questions, setQuestions] = useState<QuestionDraft[]>([defaultQuestion()]);

  const [isLoading, setIsLoading] = useState(!!editTaskId);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!editTaskId) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .select('id, name, description, class_id, task_type, blooms_taxonomy, key_skill, content_item_id, status')
          .eq('id', editTaskId)
          .maybeSingle();

        if (taskError) throw taskError;
        if (!task) {
          toast({ title: 'Exit ticket not found', variant: 'destructive' });
          return;
        }

        setTitle(task.name || '');
        setDescription(task.description || '');
        setClassId(task.class_id || '');
        setTaskType(task.task_type || 'Formative');
        setBloomsTaxonomy(task.blooms_taxonomy || '');
        setKeySkill(task.key_skill || '');
        setContentItemId(task.content_item_id || '');
        setStatus((task.status as string) || 'draft');

        const { data: qs, error: qError } = await supabase
          .from('questions')
          .select('id, question, question_type, max_score, number, marking_criteria, model_answer')
          .eq('task_id', editTaskId)
          .order('number', { ascending: true });

        if (qError) throw qError;

        const loadedQuestions: QuestionDraft[] = [];
        for (const q of qs || []) {
          const draft: QuestionDraft = {
            id: q.id,
            text: q.question || '',
            type: (q.question_type as QuestionType) || 'multiple_choice',
            maxScore: Number(q.max_score || 0),
            options: [],
            markingCriteria: (q.marking_criteria as MarkingCriteria) || undefined,
            modelAnswer: q.model_answer ?? undefined,
          };

          if (draft.type === 'multiple_choice') {
            const { data: opts } = await supabase
              .from('question_options')
              .select('id, option_text, is_correct, order_index')
              .eq('question_id', q.id)
              .order('order_index', { ascending: true });

            draft.options =
              (opts || []).map((o) => ({
                id: o.id,
                text: o.option_text,
                isCorrect: o.is_correct,
              })) || [];
          }

          loadedQuestions.push(draft);
        }

        setQuestions(loadedQuestions.length > 0 ? loadedQuestions : [defaultQuestion()]);
      } catch (e: unknown) {
        console.error(e);
        toast({ title: 'Failed to load exit ticket', description: e instanceof Error ? e.message : (e as { message?: string })?.message || 'Unknown error', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [editTaskId, toast]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, defaultQuestion()]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, updater: (q: QuestionDraft) => QuestionDraft) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = updater({ ...copy[index] });
      return copy;
    });
  };

  const addOption = (qIndex: number) => {
    updateQuestion(qIndex, (q) => ({
      ...q,
      options: [...q.options, { id: generateId(), text: '', isCorrect: false }],
    }));
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    updateQuestion(qIndex, (q) => ({
      ...q,
      options: q.options.filter((_, i) => i !== oIndex),
    }));
  };

  const updateOptionText = (qIndex: number, oIndex: number, text: string) => {
    updateQuestion(qIndex, (q) => ({
      ...q,
      options: q.options.map((o, i) => (i === oIndex ? { ...o, text } : o)),
    }));
  };

  const setCorrectOption = (qIndex: number, optionId: string) => {
    updateQuestion(qIndex, (q) => ({
      ...q,
      options: q.options.map((o) => ({ ...o, isCorrect: o.id === optionId })),
    }));
  };

  const validate = (): string | null => {
    if (!title.trim()) return 'Please enter a title.';
    if (!classId) return 'Please select a class.';
    if (questions.length === 0) return 'Please add at least one question.';

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Question ${i + 1} is missing text.`;
      if (q.type === 'multiple_choice') {
        if (q.options.length < 2) return `Question ${i + 1} needs at least 2 options.`;
        if (q.options.some((o) => !o.text.trim())) return `Question ${i + 1} has empty options.`;
        if (!q.options.some((o) => o.isCorrect)) return `Question ${i + 1} needs a correct answer selected.`;
      }
      if ((q.maxScore || 0) < 0) return `Question ${i + 1} max score cannot be negative.`;
    }

    return null;
  };

  const handleSave = async () => {
    if (isSaving || isPublishing) return;
    const error = validate();
    if (error) {
      toast({ title: 'Validation Error', description: error, variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const totalMaxScore = questions.reduce((sum, q) => sum + (q.maxScore || 0), 0);

      const taskPayload = {
        name: title.trim(),
        description: description.trim() || null,
        class_id: classId,
        task_type: taskType || 'Formative',
        assessment_format: null,
        blooms_taxonomy: bloomsTaxonomy || null,
        key_skill: keySkill || null,
        content_item_id: contentItemId || null,
        is_exit_ticket: true,
        status,
        max_score: totalMaxScore,
      };

      let taskId = editTaskId;
      if (!taskId) {
        const { data: inserted, error: insertErr } = await supabase
          .from('tasks')
          .insert(taskPayload)
          .select('id')
          .single();
        if (insertErr) throw insertErr;
        taskId = inserted.id;
      } else {
        const { error: updateErr } = await supabase.from('tasks').update(taskPayload).eq('id', taskId);
        if (updateErr) throw updateErr;
      }

      // Delete old questions (cascades to question_options)
      const { error: delQErr } = await supabase.from('questions').delete().eq('task_id', taskId);
      if (delQErr) throw delQErr;

      // Insert questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const { data: qRow, error: qErr } = await supabase
          .from('questions')
          .insert({
            task_id: taskId,
            number: i + 1,
            question: q.text.trim(),
            max_score: q.maxScore,
            question_type: q.type,
            blooms_taxonomy: bloomsTaxonomy || null,
            content_item: contentItemId || null,
            general_capabilities: null,
            marking_criteria: q.type !== 'multiple_choice' ? (q.markingCriteria || null) : null,
            model_answer: q.type !== 'multiple_choice' ? (q.modelAnswer || null) : null,
          })
          .select('id')
          .single();

        if (qErr) throw qErr;

        if (q.type === 'multiple_choice' && qRow) {
          const optionInserts = q.options.map((o, idx) => ({
            question_id: qRow.id,
            option_text: o.text.trim(),
            is_correct: o.isCorrect,
            order_index: idx + 1,
          }));
          const { error: optErr } = await supabase.from('question_options').insert(optionInserts);
          if (optErr) throw optErr;
        }
      }

      toast({ title: 'Exit ticket saved' });
      navigate('/activities');
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : (e as { message?: string })?.message || 'Unknown error';
      toast({ title: 'Failed to save', description: msg, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!editTaskId || isPublishing) return;
    setIsPublishing(true);
    try {
      const next = status === 'active' ? 'draft' : 'active';
      const { error } = await supabase.from('tasks').update({ status: next }).eq('id', editTaskId);
      if (error) throw error;
      setStatus(next);
      toast({
        title: next === 'active' ? 'Exit ticket activated' : 'Exit ticket deactivated',
        description: next === 'active' ? 'Students can now access it.' : 'Students can no longer access it.',
      });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : (e as { message?: string })?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!editTaskId) {
      navigate('/activities');
      return;
    }
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', editTaskId);
      if (error) throw error;
      toast({ title: 'Exit ticket deleted' });
      navigate('/activities');
    } catch (e: unknown) {
      toast({ title: 'Failed to delete', description: e instanceof Error ? e.message : (e as { message?: string })?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const isBusy = isSaving || isPublishing || isDeleting || isLoading || isLoadingUser || isLoadingClasses;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <header className="bg-card border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/activities')} disabled={isBusy}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Exit Tickets
            </Button>
            <div>
              <h1 className="text-xl font-bold">
                {editTaskId ? 'Edit Exit Ticket' : 'Create Exit Ticket'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Build questions for your students to answer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editTaskId && (
              <Button
                variant={status === 'active' ? 'secondary' : 'default'}
                onClick={handleToggleStatus}
                disabled={isBusy}
              >
                {isPublishing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : status === 'active' ? (
                  'Deactivate'
                ) : (
                  'Activate'
                )}
              </Button>
            )}
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={isBusy}>
              <Trash2 className="w-4 h-4 mr-2" />
              {editTaskId ? 'Delete' : 'Discard'}
            </Button>
            <Button onClick={handleSave} disabled={isBusy}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Exit Ticket Details</CardTitle>
              <CardDescription>Set the title, class, and tags</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Fractions Check-in"
                    disabled={isBusy}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Class *</Label>
                  <Select value={classId} onValueChange={setClassId} disabled={isBusy}>
                    <SelectTrigger id="class">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.class_name} ({c.subject}) {c.class_code ? `- ${c.class_code}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                  disabled={isBusy}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taskType">Task Type</Label>
                  <Select value={taskType} onValueChange={setTaskType} disabled={isBusy}>
                    <SelectTrigger id="taskType">
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Diagnostic', 'Formative', 'Summative'].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blooms">Bloom&apos;s Taxonomy</Label>
                  <Select value={bloomsTaxonomy} onValueChange={setBloomsTaxonomy} disabled={isBusy}>
                    <SelectTrigger id="blooms">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloomsLevels.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contentItem">Content Descriptor</Label>
                  <Select value={contentItemId} onValueChange={setContentItemId} disabled={isBusy}>
                    <SelectTrigger id="contentItem">
                      <SelectValue placeholder="Select content descriptor" />
                    </SelectTrigger>
                    <SelectContent>
                      {contentItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.code} - {item.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keySkill">Key Skill</Label>
                  <Input
                    id="keySkill"
                    value={keySkill}
                    onChange={(e) => setKeySkill(e.target.value)}
                    placeholder="e.g. Problem solving"
                    disabled={isBusy}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Questions ({questions.length})</h2>
              <div className="text-sm text-muted-foreground">
                Total marks: {questions.reduce((sum, q) => sum + (q.maxScore || 0), 0)}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={addQuestion} disabled={isBusy}>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.map((q, qIndex) => {
              const isText = q.type !== 'multiple_choice';
              const criteria = q.markingCriteria || {
                expected_keywords: [''],
                match_type: 'any',
                case_sensitive: false,
              };

              return (
                <Card key={q.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Question {qIndex + 1}</span>
                        </div>
                        <Textarea
                          value={q.text}
                          onChange={(e) =>
                            updateQuestion(qIndex, (prev) => ({ ...prev, text: e.target.value }))
                          }
                          placeholder="Enter question text"
                          rows={2}
                          disabled={isBusy}
                        />
                        <div className="grid gap-4 md:grid-cols-3">
                          <Select
                            value={q.type}
                            onValueChange={(v: QuestionType) =>
                              updateQuestion(qIndex, (prev) => ({
                                ...prev,
                                type: v,
                                options:
                                  v === 'multiple_choice'
                                    ? [
                                        { id: generateId(), text: '', isCorrect: false },
                                        { id: generateId(), text: '', isCorrect: false },
                                      ]
                                    : [],
                                markingCriteria:
                                  v !== 'multiple_choice'
                                    ? { expected_keywords: [''], match_type: 'any', case_sensitive: false }
                                    : undefined,
                              }))
                            }
                            disabled={isBusy}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="short_answer">Short Answer</SelectItem>
                              <SelectItem value="extended_answer">Extended Answer</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min={0}
                            value={q.maxScore}
                            onChange={(e) =>
                              updateQuestion(qIndex, (prev) => ({
                                ...prev,
                                maxScore: Number(e.target.value) || 0,
                              }))
                            }
                            placeholder="Max score"
                            disabled={isBusy}
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(qIndex)}
                        disabled={isBusy || questions.length === 1}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  {q.type === 'multiple_choice' && (
                    <CardContent className="space-y-3">
                      <Label>Options</Label>
                      {q.options.map((opt, oIndex) => (
                        <div key={opt.id} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={opt.isCorrect}
                            onChange={() => setCorrectOption(qIndex, opt.id)}
                            className="w-4 h-4"
                            disabled={isBusy}
                          />
                          <Input
                            value={opt.text}
                            onChange={(e) => updateOptionText(qIndex, oIndex, e.target.value)}
                            placeholder={`Option ${oIndex + 1}`}
                            disabled={isBusy}
                            className={opt.isCorrect ? 'border-green-500' : ''}
                          />
                          {opt.isCorrect && (
                            <span className="text-xs text-green-600 font-medium whitespace-nowrap">
                              Correct
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(qIndex, oIndex)}
                            disabled={isBusy || q.options.length <= 2}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addOption(qIndex)} disabled={isBusy}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Option
                      </Button>
                    </CardContent>
                  )}
                  {isText && (
                    <CardContent className="space-y-4 border-t bg-muted/20">
                      <div className="flex items-center gap-2">
                        <Label>Marking Criteria</Label>
                        <span className="text-xs text-muted-foreground">(optional — auto-marks text answers)</span>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Expected keywords / phrases</Label>
                        {(criteria.expected_keywords || ['']).map((keyword, kIndex) => (
                          <div key={kIndex} className="flex items-center gap-2">
                            <Input
                              value={keyword}
                              onChange={(e) => {
                                const next = [...(criteria.expected_keywords || [''])];
                                next[kIndex] = e.target.value;
                                updateQuestion(qIndex, (prev) => ({
                                  ...prev,
                                  markingCriteria: { ...criteria, expected_keywords: next },
                                }));
                              }}
                              placeholder="e.g. photosynthesis"
                              disabled={isBusy}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => {
                                const next = [...(criteria.expected_keywords || [''])];
                                next.splice(kIndex, 1);
                                updateQuestion(qIndex, (prev) => ({
                                  ...prev,
                                  markingCriteria: { ...criteria, expected_keywords: next.length ? next : [''] },
                                }));
                              }}
                              disabled={isBusy}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateQuestion(qIndex, (prev) => ({
                              ...prev,
                              markingCriteria: {
                                ...criteria,
                                expected_keywords: [...(criteria.expected_keywords || []), ''],
                              },
                            }));
                          }}
                          disabled={isBusy}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Keyword
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-sm">Match type</Label>
                          <Select
                            value={criteria.match_type || 'any'}
                            onValueChange={(v: 'all' | 'any') =>
                              updateQuestion(qIndex, (prev) => ({
                                ...prev,
                                markingCriteria: { ...criteria, match_type: v },
                              }))
                            }
                            disabled={isBusy}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Match any keyword (partial marks)</SelectItem>
                              <SelectItem value="all">Match all keywords (full marks only)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <input
                            type="checkbox"
                            id={`case-${q.id}`}
                            checked={criteria.case_sensitive || false}
                            onChange={(e) =>
                              updateQuestion(qIndex, (prev) => ({
                                ...prev,
                                markingCriteria: { ...criteria, case_sensitive: e.target.checked },
                              }))
                            }
                            disabled={isBusy}
                            className="w-4 h-4"
                          />
                          <Label htmlFor={`case-${q.id}`} className="text-sm cursor-pointer">
                            Case sensitive matching
                          </Label>
                        </div>

                        <div className="space-y-2 mt-3">
                          <Label className="text-sm font-medium">Model Answer (for AI marking)</Label>
                          <Textarea
                            value={q.modelAnswer || ''}
                            onChange={(e) =>
                              updateQuestion(qIndex, (prev) => ({ ...prev, modelAnswer: e.target.value }))
                            }
                            placeholder="Write what a full-marks answer looks like. The AI uses this as its marking guide."
                            rows={3}
                            className="text-sm resize-none"
                            disabled={isBusy}
                          />
                          <p className="text-xs text-muted-foreground">
                            Optional — AI will still mark without it, just less accurately.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Exit Ticket</DialogTitle>
            <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateExitTicket;
