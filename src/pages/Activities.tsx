import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ArrowLeft, Activity, Plus, ClipboardList, Trash2, Copy, Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useActivities } from '@/hooks/useActivities';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

const Activities = () => {
  const [isActivityTypeDialogOpen, setIsActivityTypeDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const {
    data: activities,
    isLoading: isLoadingActivities,
    isError: isActivitiesError,
    error: activitiesError,
    refetch: refetchActivities,
  } = useActivities(currentUser?.school_id || undefined);

  const activityTypes = [
    {
      type: 'multiple-choice-quiz',
      title: 'Multiple Choice Quiz',
      description: 'Create a quiz with multiple choice questions. Students select one correct answer from multiple options.',
      icon: Activity,
      available: true,
    },
    {
      type: 'survey',
      title: 'Form',
      description: 'Build a form to gather responses from students. Responses are non-graded and capture feedback or information.',
      icon: ClipboardList,
      available: true,
    },
  ];

  const handleActivityTypeSelect = (type: string) => {
    switch (type) {
      case 'multiple-choice-quiz':
        navigate('/activities/create/multiple-choice-quiz');
        break;
      case 'survey':
        navigate('/activities/create/survey');
        break;
      default:
        break;
    }
    setIsActivityTypeDialogOpen(false);
  };

  const formatTypeLabel = (type?: string | null) => {
    switch (type) {
      case 'QUIZ':
        return 'Quiz';
      case 'POLL':
        return 'Poll';
      case 'FLASHCARDS':
        return 'Flashcards';
      case 'EXIT_TICKET':
        return 'Exit Ticket';
      case 'BUZZER':
        return 'Buzzer';
      case 'FORM':
        return 'Form';
      default:
        return 'Activity';
    }
  };

  const getStatusVariant = (status?: string | null) => {
    switch (status) {
      case 'published':
        return 'default' as const;
      case 'archived':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const getEditPath = (activity: (typeof activities)[number]) => {
    switch (activity.type) {
      case 'QUIZ':
        return `/activities/create/multiple-choice-quiz?activityId=${activity.id}`;
      case 'FORM':
        return `/activities/create/survey?activityId=${activity.id}`;
      default:
        return null;
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, activityId: string) => {
    e.stopPropagation();
    setActivityToDelete(activityId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!activityToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityToDelete);

      if (error) throw error;

      toast({
        title: 'Activity deleted',
        description: 'The activity has been successfully deleted.',
      });

      refetchActivities();
    } catch (error: any) {
      console.error('Error deleting activity:', error);
      toast({
        title: 'Failed to delete activity',
        description: error?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    }
  };

  const handleCopyJoinCode = (e: React.MouseEvent, joinCode: string | null) => {
    e.stopPropagation();
    if (!joinCode) return;
    
    navigator.clipboard.writeText(joinCode);
    toast({
      title: 'Join code copied',
      description: `Join code "${joinCode}" copied to clipboard.`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Activities</h1>
              <p className="text-sm text-muted-foreground">Manage activities and link them to classes</p>
            </div>
          </div>
          <Button onClick={() => setIsActivityTypeDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Activity
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activity Library
                </CardTitle>
                <CardDescription>
                  View and manage the activities created for your school
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchActivities()} disabled={isLoadingActivities}>
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {isActivitiesError && (
                <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                  <p className="text-sm text-destructive font-medium">Failed to load activities.</p>
                  <p className="text-xs text-destructive/80 mt-1">
                    {activitiesError instanceof Error ? activitiesError.message : 'An unexpected error occurred.'}
                  </p>
                </div>
              )}

              {!isActivitiesError && (
                <div className="space-y-4">
                  {isLoadingActivities ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="animate-pulse rounded-lg border p-4 bg-muted/50 h-24" />
                      ))}
                    </div>
                  ) : activities && activities.length > 0 ? (
                    <div className="space-y-3">
                      {activities.map((activity) => {
                        const editPath = getEditPath(activity);
                        return (
                          <Card 
                            key={activity.id} 
                            className="border-border/80 cursor-pointer hover:border-primary hover:shadow-md transition-all"
                            onClick={() => editPath && navigate(editPath)}
                          >
                            <CardContent className="py-4">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <Badge variant="secondary">{formatTypeLabel(activity.type)}</Badge>
                                    <Badge variant={getStatusVariant(activity.status)} className="capitalize">
                                      {activity.status}
                                    </Badge>
                                    {activity.class && (
                                      <Badge variant="outline">
                                        {activity.class.class_name}
                                        {activity.class.subject ? ` (${activity.class.subject})` : ''}
                                      </Badge>
                                    )}
                                    {activity.quiz && (
                                      <Badge variant="outline">
                                        {activity.quiz.questionCount} question{activity.quiz.questionCount === 1 ? '' : 's'}
                                      </Badge>
                                    )}
                                    {activity.form && (
                                      <Badge variant="outline">
                                        {activity.form.questionCount} item{activity.form.questionCount === 1 ? '' : 's'}
                                      </Badge>
                                    )}
                                    {activity.join_code && (
                                      <div className="flex items-center gap-1.5">
                                        <Badge 
                                          variant="outline" 
                                          className="font-mono cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
                                          onClick={(e) => handleCopyJoinCode(e, activity.join_code)}
                                        >
                                          Join: {activity.join_code}
                                        </Badge>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={(e) => handleCopyJoinCode(e, activity.join_code)}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold">{activity.title}</h3>
                                    {activity.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {activity.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Created {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                    {activity.class && (
                                      <span className="ml-2">
                                        • Linked to {activity.class.class_name}
                                        {activity.class.subject ? ` (${activity.class.subject})` : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  {editPath && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => navigate(editPath)}
                                    >
                                      Edit
                                    </Button>
                                  )}
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={(e) => handleDeleteClick(e, activity.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No activities yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Create your first activity to get started. Activities will appear here once saved.
                      </p>
                      <Button onClick={() => setIsActivityTypeDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Activity
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Activity Type Selection Dialog */}
      <Dialog open={isActivityTypeDialogOpen} onOpenChange={setIsActivityTypeDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select Activity Type</DialogTitle>
            <DialogDescription>
              Choose the type of activity you want to create
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {activityTypes.map((activityType) => {
              const Icon = activityType.icon;
              return (
                <Card
                  key={activityType.type}
                  className={`cursor-pointer transition-all border-2 ${
                    !activityType.available
                      ? 'opacity-50 cursor-not-allowed border-muted'
                      : 'border-muted hover:border-primary/50 hover:shadow-md'
                  }`}
                  onClick={() => activityType.available && handleActivityTypeSelect(activityType.type)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-6 h-6 ${activityType.available ? 'text-primary' : 'text-muted-foreground'}`} />
                        <CardTitle className="text-lg flex items-center gap-2">
                          {activityType.title}
                        </CardTitle>
                      </div>
                      {!activityType.available && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {activityType.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this activity? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Activities;

