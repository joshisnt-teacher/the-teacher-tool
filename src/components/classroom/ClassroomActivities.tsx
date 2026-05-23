import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, AlertCircle, Loader2, Play, RotateCcw, Library, ExternalLink, Eye, EyeOff, Trash2, MoreHorizontal } from "lucide-react";
import { useClassResources } from "@/hooks/useClassResources";
import { useExitTicketsByClass } from "@/hooks/useExitTicketsByClass";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

import { useCreateClassSession } from "@/hooks/useClassSessions";
import { useClearRun } from "@/hooks/useClearRun";
import { useDeleteRun } from "@/hooks/useDeleteRun";
import { useUnassignResource, useUpdateClassResourceStatus } from "@/hooks/useClassResources";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClassroomActivitiesProps {
  classId: string;
  currentSession?: { id: string; ended_at: string | null; started_at?: string | null } | null;
}

export function ClassroomActivities({ classId, currentSession }: ClassroomActivitiesProps) {
  const { data: allExitTickets = [], isLoading: ticketsLoading } = useExitTicketsByClass(classId);
  const { data: classResources = [] } = useClassResources(classId);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [rerunDialogOpen, setRerunDialogOpen] = useState(false);
  const [rerunTicketId, setRerunTicketId] = useState<string | null>(null);
  const [startLessonDialogOpen, setStartLessonDialogOpen] = useState(false);
  const [startLessonTicketId, setStartLessonTicketId] = useState<string | null>(null);
  const createSessionMutation = useCreateClassSession();
  const clearRun = useClearRun();
  const deleteRun = useDeleteRun();
  const hasPromptedRef = useRef(false);
  const [clearResultsDialogOpen, setClearResultsDialogOpen] = useState(false);
  const [clearResultsTicketId, setClearResultsTicketId] = useState<string | null>(null);
  const [deleteRunTicket, setDeleteRunTicket] = useState<{ id: string; templateId: string | null } | null>(null);
  const unassignResource = useUnassignResource();
  const updateResourceStatus = useUpdateClassResourceStatus();
  const [unassignResourceId, setUnassignResourceId] = useState<string | null>(null);
  const [homeworkDialogOpen, setHomeworkDialogOpen] = useState(false);
  const [homeworkTicketId, setHomeworkTicketId] = useState<string | null>(null);
  const [homeworkDueDate, setHomeworkDueDate] = useState('');

  const isLessonActive = !!currentSession && !currentSession.ended_at;

  // Filter tickets: show draft tickets, current session tickets, homework tickets, and recent closed tickets
  const exitTickets = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const draftsAndCurrent = allExitTickets.filter((ticket) => {
      // Homework tickets stay visible until due date passes
      if (ticket.is_homework && ticket.status === 'active') {
        return !ticket.due_date || ticket.due_date >= today;
      }
      if (!ticket.class_session_id) return true; // Draft tickets
      if (currentSession && ticket.class_session_id === currentSession.id) return true; // Linked to current session
      return false;
    });
    // Also show the most recent 3 closed tickets that aren't already shown
    const closedTickets = allExitTickets
      .filter((ticket) =>
        ticket.status === 'closed' &&
        !draftsAndCurrent.some((t) => t.id === ticket.id)
      )
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3);
    return [...draftsAndCurrent, ...closedTickets];
  }, [allExitTickets, currentSession]);

  // Handle URL param activation from Activities page
  useEffect(() => {
    const activateTicketId = searchParams.get("activateTicket");
    if (!activateTicketId) {
      hasPromptedRef.current = false;
      return;
    }

    // Wait until tickets have finished loading before searching — prevents
    // "not found" false positive when the list is still empty on first render.
    if (ticketsLoading) return;

    // If no lesson is active, prompt the user to start one instead of showing
    // an error toast.
    if (!isLessonActive) {
      if (createSessionMutation.isPending) return;
      if (hasPromptedRef.current) return;

      hasPromptedRef.current = true;
      setStartLessonTicketId(activateTicketId);
      setStartLessonDialogOpen(true);
      return;
    }

    // Lesson is active — safe to clear params and proceed
    hasPromptedRef.current = false;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("activateTicket");
    setSearchParams(nextParams, { replace: true });

    const ticket = allExitTickets.find((t) => t.id === activateTicketId);
    if (!ticket) {
      toast({ title: "Exit ticket not found", variant: "destructive" });
      return;
    }
    if (ticket.class_id !== classId) {
      toast({ title: "Exit ticket does not belong to this class", variant: "destructive" });
      return;
    }

    // If already linked to current session and active, nothing to do
    if (ticket.class_session_id === currentSession?.id && ticket.status === "active") {
      toast({ title: "Already active", description: "This exit ticket is already active for this lesson." });
      return;
    }

    const needsRerun = ticket.is_completed || (ticket.class_session_id && ticket.class_session_id !== currentSession?.id);

    if (needsRerun) {
      setRerunTicketId(ticket.id);
      setRerunDialogOpen(true);
      return;
    }

    // Otherwise, activate directly
    activateTicket(ticket.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, allExitTickets, ticketsLoading, classId, currentSession, isLessonActive]);



  const activateTicket = async (ticketId: string) => {
    if (!currentSession) return;
    setTogglingId(ticketId);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "active",
          class_session_id: currentSession.id,
          is_completed: false,
        })
        .eq("id", ticketId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["exit-tickets-by-class", classId] });
      queryClient.invalidateQueries({ queryKey: ["exit-tickets"] });
      toast({
        title: "Exit ticket activated",
        description: "Students can now access it via the class code.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const doRerunTicket = async (ticketId: string) => {
    if (!currentSession) return;
    setTogglingId(ticketId);

    try {
      // Delete all question_results for all questions in this task
      const { data: questions } = await supabase
        .from("questions")
        .select("id")
        .eq("task_id", ticketId);

      if (questions && questions.length > 0) {
        const questionIds = questions.map((q) => q.id);
        const { error: delQrError } = await supabase
          .from("question_results")
          .delete()
          .in("question_id", questionIds);
        if (delQrError) throw delQrError;
      }

      const { error: delResultError } = await supabase
        .from("results")
        .delete()
        .eq("task_id", ticketId);
      if (delResultError) throw delResultError;

      // Activate
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "active",
          class_session_id: currentSession.id,
          is_completed: false,
        })
        .eq("id", ticketId);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["exit-tickets-by-class", classId] });
      queryClient.invalidateQueries({ queryKey: ["exit-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["results"] });
      queryClient.invalidateQueries({ queryKey: ["question-results"] });
      toast({
        title: "Exit ticket rerun",
        description: "Previous submissions have been cleared and the ticket is now active.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleRerunConfirm = async () => {
    if (!rerunTicketId) return;
    setRerunDialogOpen(false);
    await doRerunTicket(rerunTicketId);
    setRerunTicketId(null);
  };

  const handleConfirmStartLesson = async () => {
    if (!startLessonTicketId) return;
    setStartLessonDialogOpen(false);
    try {
      await createSessionMutation.mutateAsync({
        class_id: classId,
        started_at: new Date().toISOString(),
      });
      // useEffect will re-run once currentSession updates and continue the flow
    } catch {
      hasPromptedRef.current = false;
      setStartLessonTicketId(null);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("activateTicket");
      setSearchParams(nextParams, { replace: true });
      toast({
        title: "Error",
        description: "Failed to start lesson. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearResults = async () => {
    if (!clearResultsTicketId) return;
    const ticket = allExitTickets.find((t) => t.id === clearResultsTicketId);
    if (!ticket) return;
    setClearResultsDialogOpen(false);
    try {
      await clearRun.mutateAsync({
        taskId: clearResultsTicketId,
        classId: classId,
        templateId: ticket.exit_ticket_template_id,
      });
      queryClient.invalidateQueries({ queryKey: ["exit-tickets-by-class", classId] });
      toast({ title: "Results cleared", description: "The exit ticket has been reset to draft." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setClearResultsTicketId(null);
    }
  };

  const handleHomeworkConfirm = async () => {
    if (!homeworkTicketId || !homeworkDueDate) return;
    setHomeworkDialogOpen(false);
    setTogglingId(homeworkTicketId);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'active', is_homework: true, due_date: homeworkDueDate } as Record<string, unknown>)
        .eq('id', homeworkTicketId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['exit-tickets-by-class', classId] });
      queryClient.invalidateQueries({ queryKey: ['active-exit-tickets', classId] });
      toast({ title: 'Set as homework', description: `Students can access it via the class code until ${new Date(homeworkDueDate + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || 'Unknown error';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setTogglingId(null);
      setHomeworkTicketId(null);
      setHomeworkDueDate('');
    }
  };

  const handleCancelHomework = async (ticketId: string) => {
    setTogglingId(ticketId);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'draft', is_homework: false, due_date: null } as Record<string, unknown>)
        .eq('id', ticketId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['exit-tickets-by-class', classId] });
      queryClient.invalidateQueries({ queryKey: ['active-exit-tickets', classId] });
      toast({ title: 'Homework cancelled', description: 'Moved back to draft.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || 'Unknown error';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleCancelStartLesson = () => {
    setStartLessonDialogOpen(false);
    setStartLessonTicketId(null);
    hasPromptedRef.current = false;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("activateTicket");
    setSearchParams(nextParams, { replace: true });
  };

  const handleToggleStatus = async (ticketId: string, currentStatus: string, isCompleted: boolean, ticketSessionId: string | null) => {
    // Activating a draft or completed ticket
    if (currentStatus !== "active") {
      if (!isLessonActive) {
        toast({
          title: "Class not running",
          description: "A class needs to be running in order to activate an exit ticket. Start a lesson first.",
          variant: "destructive",
        });
        return;
      }

      // If already linked to current session and active, nothing to do (handled above)
      // If completed or linked to a different session, show rerun dialog
      if (isCompleted || (ticketSessionId && ticketSessionId !== currentSession?.id)) {
        setRerunTicketId(ticketId);
        setRerunDialogOpen(true);
        return;
      }

      await activateTicket(ticketId);
      return;
    }

    // Deactivating an active ticket
    setTogglingId(ticketId);
    try {
      // Set due_date to the lesson date unless this is a homework ticket (keep its original due_date)
      const isHomework = allExitTickets.find((t) => t.id === ticketId)?.is_homework ?? false;
      const sessionDate = !isHomework && currentSession?.started_at
        ? new Date(currentSession.started_at).toISOString().split('T')[0]
        : null;
      const { error } = await supabase
        .from("tasks")
        .update({ status: "closed", is_completed: true, ...(sessionDate ? { due_date: sessionDate } : {}) } as Record<string, unknown>)
        .eq("id", ticketId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["exit-tickets-by-class", classId] });
      queryClient.invalidateQueries({ queryKey: ["exit-tickets"] });
      toast({
        title: "Exit ticket deactivated",
        description: "Students can no longer access it.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const getStatusPill = (ticket: { status: string; is_homework: boolean; is_completed: boolean }) => {
    if (ticket.is_homework && ticket.status === "active") {
      return { label: "Homework", className: "bg-blue-100 text-blue-800 border-blue-200" };
    }
    if (ticket.status === "active") {
      return { label: "Live", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" };
    }
    if (ticket.status === "closed" || ticket.is_completed) {
      return { label: "Closed", className: "bg-amber-500/15 text-amber-400 border-amber-500/20" };
    }
    return { label: "Draft", className: "bg-muted text-muted-foreground border-border" };
  };

  if (ticketsLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Exit Tickets
          </CardTitle>
          <CardDescription>Loading exit tickets...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Exit Tickets
              </CardTitle>
              <CardDescription>
                {exitTickets.length > 0
                  ? `${exitTickets.length} exit ticket${exitTickets.length === 1 ? "" : "s"} for this class`
                  : "No exit tickets for this class yet"}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/exit-tickets")}
            >
              Manage All
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {exitTickets.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
              <p className="font-medium mb-1">No exit tickets in this class yet</p>
              <p className="text-muted-foreground mb-4 text-sm">
                Create an exit ticket in your library, then deploy it here.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  onClick={() => navigate("/exit-tickets")}
                >
                  Go to Exit Ticket Library
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/exit-tickets/create")}
                >
                  Create New Exit Ticket
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {exitTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`p-4 border rounded-lg hover:bg-muted/30 transition-colors ${
                    ticket.is_completed ? 'bg-muted/40 border-muted' : 'bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className={`font-semibold truncate ${ticket.is_completed || ticket.status === 'closed' ? 'text-muted-foreground' : ''}`}>
                          {ticket.name}
                        </h3>
                        {(() => {
                          const pill = getStatusPill(ticket);
                          return (
                            <Badge variant="outline" className={`text-xs font-medium ${pill.className}`}>
                              {pill.label}
                            </Badge>
                          );
                        })()}
                        <Badge variant="outline" className="text-xs">
                          {ticket.question_count} Q
                        </Badge>
                      </div>
                      {ticket.status === 'draft' && !ticket.is_homework && (
                        <p className="text-xs text-muted-foreground">Visible to you only • Not yet active for students</p>
                      )}
                      {ticket.status === 'active' && !ticket.is_homework && (
                        <p className="text-xs text-muted-foreground">Students can access via class code</p>
                      )}
                      {(ticket.status === 'closed' || ticket.is_completed) && !ticket.is_homework && (
                        <p className="text-xs text-muted-foreground">Results saved • View in Assessment Detail</p>
                      )}
                      {ticket.is_homework && ticket.due_date && (
                        <p className="text-xs text-blue-700 font-medium mb-0.5">
                          Due {new Date(ticket.due_date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                      {ticket.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {ticket.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Primary action */}
                      <Button
                        variant={ticket.status === "active" ? "secondary" : "default"}
                        size="sm"
                        className="h-8 px-3 text-xs"
                        disabled={togglingId === ticket.id}
                        onClick={() =>
                          handleToggleStatus(
                            ticket.id,
                            ticket.status,
                            ticket.is_completed,
                            ticket.class_session_id
                          )
                        }
                      >
                        {togglingId === ticket.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : ticket.status === "active" ? (
                          "Close"
                        ) : ticket.is_completed || ticket.status === "closed" ? (
                          <><RotateCcw className="w-3 h-3 mr-1" />Reactivate</>
                        ) : (
                          <><Play className="w-3 h-3 mr-1" />Activate</>
                        )}
                      </Button>

                      {/* Overflow menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {ticket.exit_ticket_template_id && (
                            <DropdownMenuItem
                              onClick={() =>
                                navigate(
                                  `/exit-tickets/create?templateId=${ticket.exit_ticket_template_id}`
                                )
                              }
                            >
                              Edit template
                            </DropdownMenuItem>
                          )}
                          {ticket.status === "draft" && !ticket.is_completed && (
                            <DropdownMenuItem
                              onClick={() => {
                                setHomeworkTicketId(ticket.id);
                                setHomeworkDueDate("");
                                setHomeworkDialogOpen(true);
                              }}
                            >
                              Set as homework
                            </DropdownMenuItem>
                          )}
                          {ticket.is_homework && ticket.status === "active" && (
                            <DropdownMenuItem
                              onClick={() => handleCancelHomework(ticket.id)}
                            >
                              Cancel homework
                            </DropdownMenuItem>
                          )}
                          {(ticket.is_completed || ticket.status === "closed") && (
                            <DropdownMenuItem
                              onClick={() => {
                                setClearResultsTicketId(ticket.id);
                                setClearResultsDialogOpen(true);
                              }}
                            >
                              Reset to draft
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() =>
                              setDeleteRunTicket({
                                id: ticket.id,
                                templateId: ticket.exit_ticket_template_id,
                              })
                            }
                          >
                            Delete from class
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={startLessonDialogOpen} onOpenChange={setStartLessonDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              A lesson needs to be running in order to activate this exit ticket. Do you want to start a lesson now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelStartLesson}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStartLesson}
              disabled={createSessionMutation.isPending}
            >
              {createSessionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                "Start Lesson"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rerunDialogOpen} onOpenChange={setRerunDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset & Activate?</AlertDialogTitle>
            <AlertDialogDescription>
              This exit ticket has already been used. All previous student submissions will be deleted so you can run it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRerunTicketId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRerunConfirm}
              disabled={togglingId !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {togglingId !== null ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Working...
                </>
              ) : (
                "Reset & Activate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearResultsDialogOpen} onOpenChange={setClearResultsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes all student responses and resets the exit ticket to draft. The questions stay intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClearResultsTicketId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearResults} disabled={clearRun.isPending}>
              {clearRun.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting...</>
              ) : (
                "Reset to Draft"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteRunTicket} onOpenChange={(open) => { if (!open) setDeleteRunTicket(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete from Class?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes this exit ticket from the class, including all student responses. The template in your Exit Ticket Library is not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRun.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteRun.isPending}
              onClick={async () => {
                if (!deleteRunTicket) return;
                try {
                  await deleteRun.mutateAsync({ taskId: deleteRunTicket.id, classId, templateId: deleteRunTicket.templateId });
                  toast({ title: "Deleted", description: "Exit ticket removed from this class." });
                } catch {
                  toast({ title: "Error", description: "Could not delete the exit ticket.", variant: "destructive" });
                } finally {
                  setDeleteRunTicket(null);
                }
              }}
            >
              {deleteRun.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</> : "Delete from Class"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={homeworkDialogOpen} onOpenChange={setHomeworkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set as Homework</AlertDialogTitle>
            <AlertDialogDescription>
              Students can access this exit ticket via the class code until the due date passes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2 space-y-1">
            <Label htmlFor="homework-due-date">Due Date</Label>
            <Input
              id="homework-due-date"
              type="date"
              value={homeworkDueDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setHomeworkDueDate(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setHomeworkTicketId(null); setHomeworkDueDate(''); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleHomeworkConfirm} disabled={!homeworkDueDate}>
              Set as Homework
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assigned Resources */}
      {classResources.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Library className="w-5 h-5" />
                  Resources
                </CardTitle>
                <CardDescription>
                  {classResources.length} resource{classResources.length === 1 ? "" : "s"} assigned to this class
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/resources")}>
                Manage All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {classResources.map((cr) => {
                const isOnDashboard = cr.status === 'active';
                return (
                  <div key={cr.id} className="p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold truncate">{cr.resource.title}</h3>
                          <Badge variant="secondary" className="text-xs">{cr.resource.category}</Badge>
                          {isOnDashboard && (
                            <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                              On student dashboard
                            </Badge>
                          )}
                        </div>
                        {cr.resource.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{cr.resource.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant={isOnDashboard ? "secondary" : "outline"}
                          size="sm"
                          className="h-8 px-3 text-xs"
                          disabled={updateResourceStatus.isPending}
                          onClick={async () => {
                            try {
                              await updateResourceStatus.mutateAsync({
                                id: cr.id,
                                classId,
                                status: isOnDashboard ? 'created' : 'active',
                              });
                            } catch (err: unknown) {
                              const msg = err instanceof Error ? err.message : 'Unknown error';
                              toast({ title: 'Failed to update resource', description: msg, variant: 'destructive' });
                            }
                          }}
                        >
                          {isOnDashboard
                            ? <><EyeOff className="w-3.5 h-3.5 mr-1.5" />Hide</>
                            : <><Eye className="w-3.5 h-3.5 mr-1.5" />Show students</>
                          }
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => window.open(cr.resource.url, "_blank", "noopener,noreferrer")}
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Open
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={unassignResource.isPending}
                          onClick={() => setUnassignResourceId(cr.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!unassignResourceId} onOpenChange={(open) => { if (!open) setUnassignResourceId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from class?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the resource from this class. The resource itself stays in your library and can be reassigned anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unassignResource.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={unassignResource.isPending}
              onClick={async () => {
                if (!unassignResourceId) return;
                try {
                  await unassignResource.mutateAsync({ id: unassignResourceId, classId });
                  toast({ title: "Removed", description: "Resource removed from this class." });
                } catch {
                  toast({ title: "Error", description: "Could not remove the resource.", variant: "destructive" });
                } finally {
                  setUnassignResourceId(null);
                }
              }}
            >
              {unassignResource.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Removing...</> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
