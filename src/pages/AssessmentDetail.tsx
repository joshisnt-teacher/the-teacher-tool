import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Calendar, BarChart3, Download, Share, Pencil, Plus, Trash2, X, Bot, RefreshCw } from 'lucide-react';
import { useAIMarkResponses } from '@/hooks/useAIMarking';
import { useOpenAIKeyStatus } from '@/hooks/useAISettings';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuestionsTab } from '@/components/assessment/QuestionsTab';
import { AssessmentInsights } from '@/components/assessment/AssessmentInsights';
import { QuestionHeatmap } from '@/components/assessment/QuestionHeatmap';
import { useQuestionOptionsForTask } from '@/hooks/useQuestionOptions';
import { useStudentResponses } from '@/hooks/useStudentResponses';
import { useStudents } from '@/hooks/useStudents';
import { useResultMutations } from '@/hooks/useResultMutations';
import { useQuestionResultMutations } from '@/hooks/useQuestionResults';

interface Task {
  id: string;
  name: string;
  task_type: string;
  due_date: string;
  weight_percent: number;
  max_score: number;
  class_id: string;
  assessment_format: string;
  is_exit_ticket: boolean | null;
}

interface StudentResult {
  student_id: string;
  raw_score: number;
  percent_score: number;
  normalised_percent: number;
  feedback: string;
  first_name: string;
  last_name: string;
}

const AssessmentDetail = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const { toast } = useToast();
  
  const { data: assessment, isLoading: assessmentLoading } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', assessmentId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Task | null;
    },
    enabled: !!assessmentId,
  });

  const { data: results = [], isLoading: resultsLoading, error: resultsError } = useQuery({
    queryKey: ['assessment-results', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('results')
        .select(`
          student_id,
          raw_score,
          percent_score,
          normalised_percent,
          feedback,
          students (
            first_name,
            last_name
          )
        `)
        .eq('task_id', assessmentId);
      
      if (error) {
        console.error('Error fetching results:', error);
        throw error;
      }
      
      if (!data) return [];
      
      return data.map((result: any) => {
        // Calculate correct percentage from raw score and max score
        // Ensure assessment is loaded and has valid max_score
        const calculatedPercent = assessment && assessment.max_score && assessment.max_score > 0 
          ? (result.raw_score / assessment.max_score) * 100 
          : 0;
        
        return {
          student_id: result.student_id,
          raw_score: result.raw_score,
          percent_score: calculatedPercent, // Use calculated percentage instead of stored
          normalised_percent: result.normalised_percent,
          feedback: result.feedback,
          first_name: result.students?.first_name || 'Unknown',
          last_name: result.students?.last_name || 'Student',
        };
      }) as StudentResult[];
    },
    enabled: !!assessmentId && !!assessment && assessment.assessment_format !== 'confidence_check',
  });

  const { data: studentResponses = [], isLoading: responsesLoading } = useStudentResponses(
    assessment?.assessment_format === 'confidence_check' ? assessmentId : undefined
  );

  const { data: classStudents = [], isLoading: classStudentsLoading } = useStudents(
    assessment?.class_id
  );

  const { createResult, updateResult, deleteResult } = useResultMutations();
  const { updateQuestionResult } = useQuestionResultMutations();
  const aiMarkMutation = useAIMarkResponses();
  const { data: keyStatus } = useOpenAIKeyStatus();

  // Exit-ticket per-question data
  const { data: questions = [] } = useQuery({
    queryKey: ['assessment-questions', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('id, number, question, question_type, max_score, marking_criteria')
        .eq('task_id', assessmentId)
        .order('number', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!assessmentId && !!assessment?.is_exit_ticket,
  });

  const { data: optionsMap = {} } = useQuestionOptionsForTask(assessmentId);

  const { data: questionResults = [], refetch: refetchQuestionResults } = useQuery({
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
          students!inner (
            first_name,
            last_name
          )
        `)
        .in('question_id', questions.map((q: any) => q.id));
      if (error) throw error;
      return (data || []).map((r: any) => ({
        ...r,
        first_name: r.students?.first_name || 'Unknown',
        last_name: r.students?.last_name || 'Student',
      }));
    },
    enabled: !!assessmentId && !!assessment?.is_exit_ticket && questions.length > 0,
  });

  const [isEditingResults, setIsEditingResults] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, { raw_score: string; percent_score: string }>>({});
  const [addedStudentIds, setAddedStudentIds] = useState<string[]>([]);
  const [deletedStudentIds, setDeletedStudentIds] = useState<Set<string>>(new Set());
  const [confirmDeleteStudentId, setConfirmDeleteStudentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = () => {
    const initial: Record<string, { raw_score: string; percent_score: string }> = {};
    results.forEach((r) => {
      initial[r.student_id] = {
        raw_score: r.raw_score != null ? String(r.raw_score) : '',
        percent_score: r.percent_score != null ? String(Math.round(r.percent_score)) : '',
      };
    });
    setEditValues(initial);
    setAddedStudentIds([]);
    setDeletedStudentIds(new Set());
    setIsEditingResults(true);
  };

  const cancelEditing = () => {
    setIsEditingResults(false);
    setEditValues({});
    setAddedStudentIds([]);
    setDeletedStudentIds(new Set());
  };

  const handleRawScoreChange = (studentId: string, value: string) => {
    setEditValues((prev) => {
      const next = { ...prev, [studentId]: { ...prev[studentId], raw_score: value } };
      const num = parseFloat(value);
      if (assessment?.max_score && assessment.max_score > 0 && !isNaN(num)) {
        next[studentId].percent_score = String(Math.round((num / assessment.max_score) * 100));
      }
      return next;
    });
  };

  const handlePercentChange = (studentId: string, value: string) => {
    setEditValues((prev) => {
      const next = { ...prev, [studentId]: { ...prev[studentId], percent_score: value } };
      const num = parseFloat(value);
      if (assessment?.max_score && assessment.max_score > 0 && !isNaN(num)) {
        next[studentId].raw_score = String(Math.round((num / 100) * assessment.max_score));
      }
      return next;
    });
  };

  const availableStudentsToAdd = useMemo(() => {
    const existingIds = new Set(results.map((r) => r.student_id));
    addedStudentIds.forEach((id) => existingIds.add(id));
    deletedStudentIds.forEach((id) => existingIds.delete(id));
    return classStudents.filter((s) => !existingIds.has(s.id));
  }, [classStudents, results, addedStudentIds, deletedStudentIds]);

  const handleAddStudent = (studentId: string) => {
    if (!studentId) return;
    setAddedStudentIds((prev) => [...prev, studentId]);
    setEditValues((prev) => ({
      ...prev,
      [studentId]: { raw_score: '', percent_score: '' },
    }));
  };

  const handleRemoveRow = (studentId: string) => {
    if (addedStudentIds.includes(studentId)) {
      setAddedStudentIds((prev) => prev.filter((id) => id !== studentId));
      setEditValues((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    } else {
      setDeletedStudentIds((prev) => new Set(prev).add(studentId));
    }
  };

  const handleRestoreRow = (studentId: string) => {
    setDeletedStudentIds((prev) => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!assessmentId) return;
    setIsSaving(true);

    try {
      // Delete removed results
      for (const studentId of deletedStudentIds) {
        await deleteResult.mutateAsync({ task_id: assessmentId, student_id: studentId });
      }

      // Create new results
      for (const studentId of addedStudentIds) {
        const vals = editValues[studentId];
        const raw = vals?.raw_score ? parseFloat(vals.raw_score) : 0;
        const pct = vals?.percent_score ? parseFloat(vals.percent_score) : 0;
        await createResult.mutateAsync({
          task_id: assessmentId,
          student_id: studentId,
          raw_score: raw,
          percent_score: pct,
          normalised_percent: null,
          feedback: null,
        });
      }

      // Update existing results
      for (const result of results) {
        if (deletedStudentIds.has(result.student_id) || addedStudentIds.includes(result.student_id)) continue;
        const vals = editValues[result.student_id];
        if (!vals) continue;
        const raw = vals.raw_score ? parseFloat(vals.raw_score) : 0;
        const pct = vals.percent_score ? parseFloat(vals.percent_score) : 0;
        if (raw !== result.raw_score || pct !== Math.round(result.percent_score)) {
          await updateResult.mutateAsync({
            task_id: assessmentId,
            student_id: result.student_id,
            raw_score: raw,
            percent_score: pct,
          });
        }
      }

      setIsEditingResults(false);
      setEditValues({});
      setAddedStudentIds([]);
      setDeletedStudentIds(new Set());
    } catch (err) {
      console.error('Save error:', err);
      toast({
        title: 'Error',
        description: 'Failed to save some changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = assessmentLoading || resultsLoading || responsesLoading || classStudentsLoading;
  const hasError = resultsError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96 mt-6" />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Error loading assessment data</h1>
          <p className="text-muted-foreground mb-4">There was a problem loading the assessment results.</p>
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Assessment not found</h1>
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Diagnostic': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Formative': return 'bg-green-100 text-green-800 border-green-200';
      case 'Summative': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGradeBand = (percentage: number) => {
    if (percentage >= 80) return { band: 'E', color: 'bg-green-100 text-green-800' };
    if (percentage >= 65) return { band: 'P', color: 'bg-blue-100 text-blue-800' };
    if (percentage >= 50) return { band: 'D', color: 'bg-orange-100 text-orange-800' };
    return { band: 'X', color: 'bg-red-100 text-red-800' };
  };

  const isConfidenceCheck = assessment?.assessment_format === 'confidence_check';
  
  // For confidence checks, calculate metrics from confidence ratings
  const completedResponses = studentResponses.filter(r => 
    r.confidence_rating !== null && 
    r.confidence_rating !== undefined && 
    !isNaN(r.confidence_rating)
  );
  const averageConfidence = completedResponses.length > 0 
    ? completedResponses.reduce((sum, r) => sum + r.confidence_rating, 0) / completedResponses.length 
    : 0;

  // For traditional assessments, calculate from results
  const completedResults = results.filter(r => 
    r.percent_score !== null && 
    r.percent_score !== undefined && 
    !isNaN(r.percent_score)
  );
  const averageScore = completedResults.length > 0 
    ? completedResults.reduce((sum, r) => sum + r.percent_score, 0) / completedResults.length 
    : 0;

  // Calculate median score for median band
  const getMedianScore = () => {
    if (isConfidenceCheck) {
      if (completedResponses.length === 0) return 0;
      
      const confidenceRatings = completedResponses
        .map(r => r.confidence_rating)
        .filter(rating => !isNaN(rating))
        .sort((a, b) => a - b);
      
      if (confidenceRatings.length === 0) return 0;
      
      const middle = Math.floor(confidenceRatings.length / 2);
      
      if (confidenceRatings.length % 2 === 0) {
        return (confidenceRatings[middle - 1] + confidenceRatings[middle]) / 2;
      } else {
        return confidenceRatings[middle];
      }
    } else {
      if (completedResults.length === 0) return 0;
      
      const scores = completedResults
        .map(r => r.percent_score)
        .filter(score => !isNaN(score))
        .sort((a, b) => a - b);
      
      if (scores.length === 0) return 0;
      
      const middle = Math.floor(scores.length / 2);
      
      if (scores.length % 2 === 0) {
        return (scores[middle - 1] + scores[middle]) / 2;
      } else {
        return scores[middle];
      }
    }
  };

  const medianScore = getMedianScore();

  // Exit ticket responses editing state
  const [editingResponses, setEditingResponses] = useState(false);
  const [responseEditValues, setResponseEditValues] = useState<Record<string, string>>({});
  const [isSavingResponses, setIsSavingResponses] = useState(false);

  const startEditingResponses = () => {
    const initial: Record<string, string> = {};
    questionResults.forEach((qr: any) => {
      initial[qr.id] = qr.raw_score != null ? String(qr.raw_score) : '';
    });
    setResponseEditValues(initial);
    setEditingResponses(true);
  };

  const cancelEditingResponses = () => {
    setEditingResponses(false);
    setResponseEditValues({});
  };

  const handleResponseScoreChange = (questionResultId: string, value: string) => {
    setResponseEditValues((prev) => ({ ...prev, [questionResultId]: value }));
  };

  const saveResponses = async () => {
    if (!assessmentId || !assessment) return;
    setIsSavingResponses(true);
    try {
      const changed = questionResults.filter((qr: any) => {
        const val = responseEditValues[qr.id];
        return val !== undefined && val !== String(qr.raw_score ?? '');
      }) as any[];

      for (const qr of changed) {
        const val = responseEditValues[qr.id];
        const raw = val === '' ? null : parseFloat(val);
        const q = questions.find((q: any) => q.id === qr.question_id);
        const max = q?.max_score || 0;
        const pct = raw !== null && max > 0 ? Number(((raw / max) * 100).toFixed(2)) : null;

        await updateQuestionResult.mutateAsync({
          id: qr.id,
          raw_score: raw,
          percent_score: pct,
        });
      }

      // Recalculate student totals for affected students
      const affectedStudentIds = [...new Set(changed.map((qr) => qr.student_id))];
      for (const studentId of affectedStudentIds) {
        const studentQrs = questionResults.filter((qr: any) => qr.student_id === studentId);
        const newTotal = studentQrs.reduce((sum: number, qr: any) => {
          const changedQr = changed.find((c) => c.id === qr.id);
          const score = changedQr
            ? (responseEditValues[qr.id] === '' ? 0 : parseFloat(responseEditValues[qr.id] || '0'))
            : (qr.raw_score || 0);
          return sum + score;
        }, 0);
        const maxScore = assessment.max_score || 0;
        const newPct = maxScore > 0 ? Number(((newTotal / maxScore) * 100).toFixed(2)) : null;

        await updateResult.mutateAsync({
          task_id: assessmentId,
          student_id: studentId,
          raw_score: newTotal,
          percent_score: newPct,
          normalised_percent: newPct,
        });
      }

      await refetchQuestionResults();
      setEditingResponses(false);
      setResponseEditValues({});
      toast({ title: 'Saved', description: 'Response marks updated.' });
    } catch (err) {
      console.error('Save responses error:', err);
      toast({ title: 'Error', description: 'Failed to save response marks.', variant: 'destructive' });
    } finally {
      setIsSavingResponses(false);
    }
  };

  const getOptionText = (questionId: string, optionId: string) => {
    // question_results don't store options; we need to fetch them if we want to display option text.
    // For now, we display the option_id or fetch options via a separate query if needed.
    // Since we already have questions loaded but not options, let's do a lightweight lookup.
    return optionId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to={`/class/${assessment.class_id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Class
              </Button>
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{assessment.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Badge className={getTypeColor(assessment.task_type)}>
                  {assessment.task_type}
                </Badge>
                {assessment.due_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Due {format(new Date(assessment.due_date), 'MMM d, yyyy')}
                  </span>
                )}
                <span>{assessment.weight_percent}% weight</span>
                <span>Max: {assessment.max_score} points</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  const studentUrl = `${window.location.origin}/student-assessment/${assessmentId}`;
                  navigator.clipboard.writeText(studentUrl);
                  toast({
                    title: "Link copied!",
                    description: "Student assessment link has been copied to clipboard.",
                  });
                }}
              >
                <Share className="w-4 h-4 mr-2" />
                Share with Students
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                // Create CSV content
                const csvContent = [
                  ['Student', 'Raw Score', 'Percentage', 'Band'].join(','),
                  ...results.map(result => {
                    const hasValidScore = result.percent_score !== null && result.percent_score !== undefined && !isNaN(result.percent_score);
                    const gradeBand = hasValidScore ? getGradeBand(result.percent_score) : { band: '-', color: 'bg-gray-100 text-gray-600' };
                    return [
                      `"${result.first_name} ${result.last_name}"`,
                      result.raw_score || '',
                      hasValidScore ? `${result.percent_score.toFixed(1)}%` : '',
                      gradeBand.band
                    ].join(',');
                  })
                ].join('\n');
                
                // Download CSV
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${assessment.name}_results.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Results
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">
                    {isConfidenceCheck 
                      ? `${averageConfidence.toFixed(1)}/10`
                      : `${averageScore.toFixed(1)}%`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isConfidenceCheck ? 'Average Confidence' : 'Class Average'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                {isConfidenceCheck ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {Math.round(medianScore)}
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{medianScore.toFixed(1)}/10</p>
                      <p className="text-sm text-muted-foreground">Median Confidence</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getGradeBand(medianScore).color}`}>
                      {getGradeBand(medianScore).band}
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{getGradeBand(medianScore).band}</p>
                      <p className="text-sm text-muted-foreground">Median Band</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assessment Content with Tabs */}
        <Tabs defaultValue="results" className="space-y-6">
          <TabsList>
            <TabsTrigger value="results">Results</TabsTrigger>
            {assessment.is_exit_ticket && <TabsTrigger value="responses">Responses</TabsTrigger>}
            <TabsTrigger value="heatmap">Question Heatmap</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="results">
            {/* Results Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Student {isConfidenceCheck ? 'Responses' : 'Results'}</CardTitle>
                {!isConfidenceCheck && !isEditingResults && (
                  <Button variant="outline" size="sm" onClick={startEditing}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Results
                  </Button>
                )}
                {!isConfidenceCheck && isEditingResults && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={cancelEditing} disabled={isSaving}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? 'Saving…' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Student</th>
                        {isConfidenceCheck ? (
                          <th className="text-left p-3">Confidence Rating</th>
                        ) : (
                          <>
                            <th className="text-left p-3">Raw Score</th>
                            <th className="text-left p-3">Percentage</th>
                            {!isEditingResults && <th className="text-left p-3">Band</th>}
                            {isEditingResults && <th className="text-right p-3">Actions</th>}
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {isConfidenceCheck ? (
                        studentResponses.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="p-6 text-center text-muted-foreground">
                              No responses available for this assessment
                            </td>
                          </tr>
                        ) : (
                          studentResponses.map((response) => {
                            const hasValidRating = response.confidence_rating !== null && 
                                                  response.confidence_rating !== undefined && 
                                                  !isNaN(response.confidence_rating);
                            return (
                              <tr key={response.student_id} className="border-b hover:bg-muted/50">
                                <td className="p-3">
                                  {response.first_name && response.last_name 
                                    ? `${response.first_name} ${response.last_name}`
                                    : 'Unknown Student'
                                  }
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-semibold">
                                      {hasValidRating ? response.confidence_rating : '-'}
                                    </span>
                                    <span className="text-sm text-muted-foreground">/10</span>
                                    {hasValidRating && (
                                      <div className="flex-1 bg-secondary h-2 rounded-full overflow-hidden ml-2">
                                        <div 
                                          className="h-full bg-primary transition-all duration-300"
                                          style={{ width: `${Math.min(Math.max((response.confidence_rating / 10) * 100, 0), 100)}%` }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )
                      ) : !isEditingResults ? (
                        results.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-muted-foreground">
                              No results available for this assessment
                            </td>
                          </tr>
                        ) : (
                          results.map((result) => {
                            const hasValidScore = result.percent_score !== null && result.percent_score !== undefined && !isNaN(result.percent_score);
                            const gradeBand = hasValidScore ? getGradeBand(result.percent_score) : { band: '-', color: 'bg-gray-100 text-gray-600' };
                            return (
                              <tr key={result.student_id} className="border-b hover:bg-muted/50">
                                <td className="p-3">
                                  {result.first_name && result.last_name 
                                    ? `${result.first_name} ${result.last_name}`
                                    : 'Unknown Student'
                                  }
                                </td>
                                <td className="p-3">
                                  {result.raw_score !== null && result.raw_score !== undefined 
                                    ? `${result.raw_score}/${assessment.max_score || '?'}` 
                                    : '-'
                                  }
                                </td>
                                <td className="p-3">
                                  {hasValidScore ? `${result.percent_score.toFixed(1)}%` : '-'}
                                </td>
                                <td className="p-3">
                                  <Badge className={gradeBand.color}>
                                    {gradeBand.band}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })
                        )
                      ) : (
                        <>
                          {/* Editing mode */}
                          {results
                            .filter((r) => !deletedStudentIds.has(r.student_id))
                            .map((result) => (
                              <tr key={result.student_id} className="border-b hover:bg-muted/50">
                                <td className="p-3">
                                  {result.first_name && result.last_name
                                    ? `${result.first_name} ${result.last_name}`
                                    : 'Unknown Student'}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min={0}
                                      className="w-24 h-8 text-sm"
                                      value={editValues[result.student_id]?.raw_score ?? ''}
                                      onChange={(e) => handleRawScoreChange(result.student_id, e.target.value)}
                                    />
                                    <span className="text-sm text-muted-foreground">/ {assessment.max_score || '?'}</span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    className="w-24 h-8 text-sm"
                                    value={editValues[result.student_id]?.percent_score ?? ''}
                                    onChange={(e) => handlePercentChange(result.student_id, e.target.value)}
                                  />
                                </td>
                                <td className="p-3 text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => setConfirmDeleteStudentId(result.student_id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}

                          {/* Added students */}
                          {addedStudentIds.map((studentId) => {
                            const student = classStudents.find((s) => s.id === studentId);
                            if (!student) return null;
                            return (
                              <tr key={studentId} className="border-b hover:bg-muted/50 bg-primary/5">
                                <td className="p-3">
                                  {`${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || student.student_id || 'Unnamed student'}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min={0}
                                      className="w-24 h-8 text-sm"
                                      value={editValues[studentId]?.raw_score ?? ''}
                                      onChange={(e) => handleRawScoreChange(studentId, e.target.value)}
                                    />
                                    <span className="text-sm text-muted-foreground">/ {assessment.max_score || '?'}</span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    className="w-24 h-8 text-sm"
                                    value={editValues[studentId]?.percent_score ?? ''}
                                    onChange={(e) => handlePercentChange(studentId, e.target.value)}
                                  />
                                </td>
                                <td className="p-3 text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => handleRemoveRow(studentId)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}

                          {results.filter((r) => !deletedStudentIds.has(r.student_id)).length === 0 && addedStudentIds.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-muted-foreground">
                                No results yet. Add a student below.
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                {isEditingResults && (
                  <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="w-full sm:w-72">
                      <Select onValueChange={handleAddStudent}>
                        <SelectTrigger>
                          <SelectValue placeholder="Add a student…" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStudentsToAdd.length === 0 ? (
                            <SelectItem value="none" disabled>
                              All students already have results
                            </SelectItem>
                          ) : (
                            availableStudentsToAdd.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {`${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.student_id || 'Unnamed student'}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delete confirmation dialog */}
            <AlertDialog open={!!confirmDeleteStudentId} onOpenChange={() => setConfirmDeleteStudentId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Result</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove this student's result? This will be deleted when you save changes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmDeleteStudentId(null)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (confirmDeleteStudentId) {
                        handleRemoveRow(confirmDeleteStudentId);
                      }
                      setConfirmDeleteStudentId(null);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {assessment.is_exit_ticket && (
            <TabsContent value="responses">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Student Responses</CardTitle>
                  {!editingResponses ? (
                    <div className="flex items-center gap-2">
                      {keyStatus?.hasKey && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const textQRIds = (questionResults as any[])
                              .filter((qr) => {
                                const q = questions.find((q: any) => q.id === qr.question_id);
                                return q && q.question_type !== 'multiple_choice';
                              })
                              .map((qr: any) => qr.id);
                            if (textQRIds.length > 0) {
                              aiMarkMutation.mutate({ questionResultIds: textQRIds, taskId: assessmentId! });
                            }
                          }}
                          disabled={aiMarkMutation.isPending}
                        >
                          {aiMarkMutation.isPending ? (
                            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Marking…</>
                          ) : (
                            <><Bot className="w-4 h-4 mr-2" />AI Mark All</>
                          )}
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={startEditingResponses}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Marks
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={cancelEditingResponses} disabled={isSavingResponses}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={saveResponses} disabled={isSavingResponses}>
                        {isSavingResponses ? 'Saving…' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {questionResults.length === 0 || questions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No responses yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 min-w-[160px]">Student</th>
                            {questions.map((q: any) => (
                              <th key={q.id} className="text-left p-3 min-w-[200px]">
                                Q{q.number}
                                <span className="block text-xs text-muted-foreground font-normal">
                                  ({q.max_score} pts)
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((result) => {
                            const studentQrs = questionResults.filter((qr: any) => qr.student_id === result.student_id);
                            return (
                              <tr key={result.student_id} className="border-b hover:bg-muted/50">
                                <td className="p-3 align-top">
                                  {result.first_name} {result.last_name}
                                </td>
                                {questions.map((q: any) => {
                                  const qr = studentQrs.find((r: any) => r.question_id === q.id);
                                  const isMC = q.question_type === 'multiple_choice';
                                  const responseData = qr?.response_data as any;
                                  let answerDisplay = '-';
                                  if (isMC && responseData?.selected_option_id) {
                                    const opt = optionsMap[q.id]?.find((o) => o.id === responseData.selected_option_id);
                                    answerDisplay = opt ? opt.option_text : 'Selected option';
                                  } else if (responseData?.text) {
                                    answerDisplay = responseData.text;
                                  }

                                  return (
                                    <td key={q.id} className="p-3 align-top">
                                      <div className="space-y-1">
                                        <div className="text-muted-foreground whitespace-pre-wrap max-w-xs">
                                          {answerDisplay}
                                        </div>
                                        {(qr as any)?.ai_feedback && !isMC && (
                                          <p className="text-xs text-muted-foreground italic">
                                            AI: {(qr as any).ai_feedback}
                                          </p>
                                        )}
                                        {!editingResponses ? (
                                          <div className="flex items-center gap-1">
                                            <Badge variant="secondary" className="text-xs">
                                              {qr?.raw_score != null ? `${qr.raw_score}/${q.max_score}` : '-'}
                                            </Badge>
                                            {keyStatus?.hasKey && !isMC && qr && (
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5"
                                                title="Re-mark with AI"
                                                onClick={() => aiMarkMutation.mutate({ questionResultIds: [(qr as any).id], taskId: assessmentId! })}
                                                disabled={aiMarkMutation.isPending}
                                              >
                                                <Bot className="w-3 h-3" />
                                              </Button>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2">
                                            <Input
                                              type="number"
                                              min={0}
                                              className="w-20 h-7 text-xs"
                                              value={responseEditValues[(qr as any)?.id] ?? (qr?.raw_score != null ? String(qr.raw_score) : '')}
                                              onChange={(e) => qr && handleResponseScoreChange((qr as any).id, e.target.value)}
                                              disabled={!qr}
                                            />
                                            <span className="text-xs text-muted-foreground">/ {q.max_score}</span>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="heatmap">
            <QuestionHeatmap taskId={assessmentId!} />
          </TabsContent>

          <TabsContent value="questions">
            <QuestionsTab taskId={assessmentId!} classId={assessment.class_id} />
          </TabsContent>

          <TabsContent value="insights">
            <AssessmentInsights taskId={assessmentId!} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AssessmentDetail;