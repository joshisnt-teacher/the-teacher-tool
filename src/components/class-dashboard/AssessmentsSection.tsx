import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, CheckCircle, Clock, Loader2, Trash2, Share, Ticket, EyeOff, BarChart3, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isPast } from 'date-fns';
import { useAssessments, type Assessment } from '@/hooks/useAssessments';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
// Timeline moved to page level; no imports needed here

interface AssessmentsSectionProps {
  classId: string;
}

export const AssessmentsSection: React.FC<AssessmentsSectionProps> = ({ classId }) => {
  const navigate = useNavigate();
  const { data: assessments = [], isLoading, error } = useAssessments(classId);
  const { deleteTask } = useTaskMutations();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hidingId, setHidingId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter assessments by due date, handling null due_date values
  const previousAssessments = assessments.filter(a => 
    a.due_date && isPast(new Date(a.due_date))
  );
  const upcomingAssessments = assessments.filter(a => 
    !a.due_date || !isPast(new Date(a.due_date))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading assessments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-destructive">Error loading assessments</p>
      </div>
    );
  }

  const getTypeColor = (type: string | null) => {
    switch (type) {
      case 'Diagnostic': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Formative': return 'bg-green-100 text-green-800 border-green-200';
      case 'Summative': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDelete = async (assessmentId: string) => {
    setDeletingId(assessmentId);
    try {
      await deleteTask.mutateAsync(assessmentId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleHideFromAssessments = async (assessmentId: string, hide: boolean) => {
    setHidingId(assessmentId);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ hidden_from_assessments: hide } as Record<string, unknown>)
        .eq('id', assessmentId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['assessments', classId] });
      toast({
        title: hide ? 'Hidden from assessments' : 'Shown in assessments',
        description: hide
          ? 'The exit ticket is still accessible from the Classroom and Exit Tickets pages.'
          : 'The exit ticket now appears in the assessments list again.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'Unknown error';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setHidingId(null);
    }
  };



  const AssessmentCard = ({ assessment }: { assessment: Assessment }) => (
    <div className="p-1.5 rounded-lg border bg-background/50">
      <div
        className="cursor-pointer hover:bg-background/70 transition-colors p-1.5 rounded-lg"
        onClick={() => navigate(`/assessment/${assessment.id}`)}
      >
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-tight">{assessment.name}</h4>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              {assessment.due_date ? (
                <>Due {format(new Date(assessment.due_date), 'MMM d, yyyy')}</>
              ) : (
                'No due date set'
              )}
            </div>
          </div>
          {assessment.status === 'completed' ? (
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
          ) : (
            <Clock className="w-4 h-4 text-orange-600 flex-shrink-0 ml-2" />
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {assessment.is_exit_ticket ? (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs gap-1">
              <Ticket className="w-2.5 h-2.5" />Exit Ticket
            </Badge>
          ) : (
            <Badge className={`${getTypeColor(assessment.task_type)} text-xs`}>
              {assessment.task_type || 'Assessment'}
            </Badge>
          )}
          {assessment.weight_percent && (
            <span className="text-xs text-muted-foreground">
              {assessment.weight_percent}% weight
            </span>
          )}
          {assessment.max_score && (
            <span className="text-xs text-muted-foreground">
              Max: {assessment.max_score} points
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-1 gap-1">
        {assessment.is_exit_ticket ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/assessment/${assessment.id}`)}
              className="text-muted-foreground hover:text-foreground h-5 px-1.5 text-xs gap-1"
            >
              <BarChart3 className="w-3 h-3" />
              View Results
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={hidingId === assessment.id}
                  className="text-muted-foreground hover:text-foreground h-5 px-1.5 text-xs gap-1"
                >
                  {hidingId === assessment.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <EyeOff className="w-3 h-3" />
                  )}
                  Hide
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hide from assessments?</AlertDialogTitle>
                  <AlertDialogDescription>
                    "{assessment.name}" will be hidden from this assessments list, but you can still access it from the Classroom page and the Exit Tickets page. The results are kept.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleHideFromAssessments(assessment.id, true)}>
                    Hide
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={deletingId === assessment.id}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-5 px-1.5"
              >
                {deletingId === assessment.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{assessment.name}"? This action cannot be undone and will remove all associated questions and results.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(assessment.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground px-1">
        Exit tickets are managed from the Classroom page.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Previous Assessments
            <Badge variant="outline">{previousAssessments.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0.5 overflow-y-auto max-h-[40vh]">
          {previousAssessments.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No completed assessments yet</p>
            </div>
          ) : (
            previousAssessments.map(assessment => (
              <AssessmentCard key={assessment.id} assessment={assessment} />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Upcoming Assessments
            <div className="flex items-center gap-2">
              <Badge variant="outline">{upcomingAssessments.length}</Badge>
              {assessments.length > 0 && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const assessmentUrls = assessments.map(assessment => 
                      `${assessment.name}: ${window.location.origin}/student-assessment/${assessment.id}`
                    ).join('\n');
                    navigator.clipboard.writeText(assessmentUrls);
                    toast({
                      title: "Assessment links copied!",
                      description: `${assessments.length} assessment links copied to clipboard.`,
                    });
                  }}
                >
                  <Share className="w-3 h-3 mr-2" />
                  Share Assessment URLs
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0.5 overflow-y-auto max-h-[40vh]">
          {upcomingAssessments.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">No upcoming assessments</p>
            </div>
          ) : (
            upcomingAssessments.map(assessment => (
              <AssessmentCard key={assessment.id} assessment={assessment} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};