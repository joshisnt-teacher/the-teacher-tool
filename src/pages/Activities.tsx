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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Ticket, Trash2, Loader2, Play, RotateCcw, CheckCircle2, X, Filter } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useClasses } from '@/hooks/useClasses';
import { useExitTickets } from '@/hooks/useExitTickets';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CreateExitTicket from './CreateExitTicket';

const Activities = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const { data: classes = [] } = useClasses();
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

  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTaskId, setSheetTaskId] = useState<string | null>(null);

  const filteredTickets = selectedClassId !== 'all'
    ? exitTickets?.filter((t) => t.class_id === selectedClassId)
    : exitTickets;

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

  const handleActivate = (e: React.MouseEvent, ticket: { class_id: string; id: string }) => {
    e.stopPropagation();
    navigate(`/classroom/${ticket.class_id}?activateTicket=${ticket.id}`);
  };

  const openCreateSheet = () => {
    setSheetTaskId(null);
    setSheetOpen(true);
  };

  const openEditSheet = (taskId: string) => {
    setSheetTaskId(taskId);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setSheetTaskId(null);
    refetch();
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
          <Button onClick={openCreateSheet}>
            <Plus className="w-4 h-4 mr-2" />
            Create Exit Ticket
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Exit Ticket Library
              </CardTitle>
              <CardDescription>View and manage exit tickets created for your school</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                Refresh
              </Button>
            </div>
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
                ) : filteredTickets && filteredTickets.length > 0 ? (
                  <div className="space-y-3">
                    {filteredTickets.map((ticket) => {
                      const isCompleted = ticket.is_completed;
                      return (
                        <Card
                          key={ticket.id}
                          className={`border-border/80 cursor-pointer hover:border-primary hover:shadow-md transition-all ${
                            isCompleted ? 'bg-muted/40 border-muted' : ''
                          }`}
                          onClick={() => openEditSheet(ticket.id)}
                        >
                          <CardContent className="py-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <Badge variant={getStatusVariant(ticket.status)} className="capitalize">
                                    {ticket.status}
                                  </Badge>
                                  {isCompleted ? (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Completed
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="gap-1">
                                      <Play className="w-3 h-3" />
                                      Created
                                    </Badge>
                                  )}
                                  <Badge variant="outline">{ticket.class_name}</Badge>
                                  <Badge variant="outline">
                                    {ticket.question_count} question{ticket.question_count === 1 ? '' : 's'}
                                  </Badge>
                                  <Badge variant="secondary" className="font-mono">
                                    {window.location.origin}/{ticket.class_code}
                                  </Badge>
                                </div>
                                <div>
                                  <h3 className={`text-lg font-semibold ${isCompleted ? 'text-muted-foreground' : ''}`}>
                                    {ticket.name}
                                  </h3>
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
                                  variant={isCompleted ? 'outline' : 'default'}
                                  size="sm"
                                  onClick={(e) => handleActivate(e, ticket)}
                                >
                                  {isCompleted ? (
                                    <>
                                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                      Rerun
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-3.5 h-3.5 mr-1.5" />
                                      Launch
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditSheet(ticket.id)}
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
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      {selectedClassId !== 'all' ? 'No exit tickets for this class' : 'No exit tickets yet'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {selectedClassId !== 'all' ? 'Try clearing the filter or create a new exit ticket.' : 'Create your first exit ticket to get started.'}
                    </p>
                    <Button onClick={openCreateSheet}>
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-3xl p-0 overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>{sheetTaskId ? 'Edit Exit Ticket' : 'Create Exit Ticket'}</SheetTitle>
          </SheetHeader>
          <CreateExitTicket
            embedded
            taskId={sheetTaskId}
            onClose={closeSheet}
          />
        </SheetContent>
      </Sheet>

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
