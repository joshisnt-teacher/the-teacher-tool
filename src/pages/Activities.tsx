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
  DialogTitle,
} from '@/components/ui/dialog';
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
import { ArrowLeft, Plus, Ticket, Trash2, Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useExitTickets } from '@/hooks/useExitTickets';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Activities = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const {
    data: exitTickets,
    isLoading,
    isError,
    error,
    refetch,
  } = useExitTickets(currentUser?.school_id || undefined);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default' as const;
      case 'closed':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTicketToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ticketToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', ticketToDelete);
      if (error) throw error;
      toast({ title: 'Exit ticket deleted' });
      refetch();
    } catch (err: unknown) {
      toast({ title: 'Failed to delete', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setTicketToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
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
              <h1 className="text-xl font-bold">Exit Tickets</h1>
              <p className="text-sm text-muted-foreground">Create and manage exit tickets for your classes</p>
            </div>
          </div>
          <Button onClick={() => navigate('/activities/create/exit-ticket')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Exit Ticket
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Exit Ticket Library
              </CardTitle>
              <CardDescription>View and manage exit tickets created for your school</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {isError && (
              <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                <p className="text-sm text-destructive font-medium">Failed to load exit tickets.</p>
                <p className="text-xs text-destructive/80 mt-1">
                  {error instanceof Error ? error.message : 'An unexpected error occurred.'}
                </p>
              </div>
            )}

            {!isError && (
              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse rounded-lg border p-4 bg-muted/50 h-24" />
                    ))}
                  </div>
                ) : exitTickets && exitTickets.length > 0 ? (
                  <div className="space-y-3">
                    {exitTickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        className="border-border/80 cursor-pointer hover:border-primary hover:shadow-md transition-all"
                        onClick={() => navigate(`/activities/create/exit-ticket?taskId=${ticket.id}`)}
                      >
                        <CardContent className="py-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <Badge variant={getStatusVariant(ticket.status)} className="capitalize">
                                  {ticket.status}
                                </Badge>
                                <Badge variant="outline">{ticket.class_name}</Badge>
                                <Badge variant="outline">
                                  {ticket.question_count} question{ticket.question_count === 1 ? '' : 's'}
                                </Badge>
                                <Badge variant="secondary" className="font-mono">
                                  {window.location.origin}/{ticket.class_code}
                                </Badge>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold">{ticket.name}</h3>
                                {ticket.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {ticket.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                                <span className="ml-2">• {ticket.class_subject || 'No subject'}</span>
                              </div>
                            </div>
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/activities/create/exit-ticket?taskId=${ticket.id}`)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => handleDeleteClick(e, ticket.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No exit tickets yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Create your first exit ticket to get started.
                    </p>
                    <Button onClick={() => navigate('/activities/create/exit-ticket')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Exit Ticket
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exit Ticket</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this exit ticket?</AlertDialogDescription>
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
