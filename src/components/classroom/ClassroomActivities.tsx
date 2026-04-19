import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Ticket, AlertCircle, ExternalLink, Pencil, Loader2, Play, RotateCcw, Library } from "lucide-react";
import { useClassResources } from "@/hooks/useClassResources";
import { useExitTicketsByClass } from "@/hooks/useExitTicketsByClass";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useClassroomTheme } from "@/contexts/ClassroomThemeContext";
import { useCreateClassSession } from "@/hooks/useClassSessions";
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

interface ClassroomActivitiesProps {
  classId: string;
  classCode?: string | null;
  currentSession?: { id: string; ended_at: string | null; started_at?: string | null } | null;
}

export function ClassroomActivities({ classId, classCode, currentSession }: ClassroomActivitiesProps) {
  const { data: allExitTickets = [], isLoading: ticketsLoading } = useExitTicketsByClass(classId);
  const { data: classResources = [] } = useClassResources(classId);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentTheme } = useClassroomTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const [copiedCode, setCopiedCode] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [codeWindow, setCodeWindow] = useState<Window | null>(null);
  const [rerunDialogOpen, setRerunDialogOpen] = useState(false);
  const [rerunTicketId, setRerunTicketId] = useState<string | null>(null);
  const [startLessonDialogOpen, setStartLessonDialogOpen] = useState(false);
  const [startLessonTicketId, setStartLessonTicketId] = useState<string | null>(null);
  const createSessionMutation = useCreateClassSession();
  const hasPromptedRef = useRef(false);

  const isLessonActive = !!currentSession && !currentSession.ended_at;

  const studentUrl = classCode
    ? `${window.location.origin}/${classCode}`
    : null;

  // Filter tickets: show draft tickets for this class, plus any tickets linked to the current session
  const exitTickets = React.useMemo(() => {
    return allExitTickets.filter((ticket) => {
      if (!ticket.class_session_id) return true; // Draft tickets
      if (currentSession && ticket.class_session_id === currentSession.id) return true; // Linked to current session
      return false;
    });
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

  const handleCopyCode = () => {
    if (!studentUrl) return;
    navigator.clipboard.writeText(studentUrl).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast({ title: "Link copied!", description: studentUrl });
    });
  };

  const handleOpenCodeWindow = () => {
    if (!classCode || !studentUrl) return;

    if (codeWindow && !codeWindow.closed) {
      codeWindow.focus();
      return;
    }

    const width = 600;
    const height = 420;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const newWindow = window.open(
      "",
      "class-code-display",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes`
    );

    if (newWindow) {
      setCodeWindow(newWindow);
      newWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Class Code</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: ${currentTheme.gradient};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      overflow: hidden;
    }
    .container {
      text-align: center;
      background: ${currentTheme.containerBg};
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 48px 64px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      border: 1px solid rgba(255,255,255,0.2);
      max-width: 90vw;
    }
    .label {
      font-size: 1.2rem;
      color: rgba(255,255,255,0.85);
      font-weight: 500;
      margin-bottom: 16px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .code {
      font-size: clamp(4rem, 18vw, 7rem);
      font-weight: 800;
      color: white;
      letter-spacing: 0.15em;
      text-shadow: 0 2px 12px rgba(0,0,0,0.2);
      line-height: 1;
      margin-bottom: 24px;
    }
    .divider {
      width: 60px;
      height: 3px;
      background: rgba(255,255,255,0.4);
      border-radius: 2px;
      margin: 0 auto 20px;
    }
    .url-label {
      font-size: 0.9rem;
      color: rgba(255,255,255,0.6);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .url {
      font-size: clamp(0.85rem, 2.5vw, 1.1rem);
      color: rgba(255,255,255,0.9);
      font-weight: 500;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="label">Class Code</div>
    <div class="code">${classCode}</div>
    <div class="divider"></div>
    <div class="url-label">Students go to</div>
    <div class="url">${studentUrl}</div>
  </div>
</body>
</html>`);
      newWindow.document.close();
    }
  };

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
      // Set due_date to the lesson date (session start) so the assessment is dated correctly
      const sessionDate = currentSession?.started_at
        ? new Date(currentSession.started_at).toISOString().split('T')[0]
        : null;
      const { error } = await supabase
        .from("tasks")
        .update({ status: "closed", is_completed: true, ...(sessionDate ? { due_date: sessionDate } : {}) })
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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "default" as const;
      case "closed": return "secondary" as const;
      default: return "outline" as const;
    }
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

          {/* Class code bar */}
          {classCode && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/60">
              <span className="text-sm text-muted-foreground">Class code:</span>
              <span className="font-mono font-bold text-base tracking-widest">{classCode}</span>
              <div className="flex items-center gap-1 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                  className="h-7 px-2 text-xs gap-1"
                >
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedCode ? "Copied" : "Copy link"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenCodeWindow}
                  className="h-7 px-2 text-xs gap-1"
                  title="Open class code in popup window"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Display
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {exitTickets.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-muted-foreground mb-4">
                No exit tickets linked to this class yet.
              </p>
              <Button
                size="sm"
                onClick={() => navigate("/exit-tickets/create")}
              >
                Create Exit Ticket
              </Button>
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
                        <h3 className={`font-semibold truncate ${ticket.is_completed ? 'text-muted-foreground' : ''}`}>
                          {ticket.name}
                        </h3>
                        <Badge variant={getStatusVariant(ticket.status)} className="capitalize text-xs">
                          {ticket.status}
                        </Badge>
                        {ticket.is_completed && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs gap-1">
                            <Check className="w-3 h-3" />
                            Completed
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {ticket.question_count} Q
                        </Badge>
                      </div>
                      {ticket.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {ticket.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs gap-1"
                        onClick={() =>
                          navigate(`/exit-tickets/create?taskId=${ticket.id}`)
                        }
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        variant={ticket.status === "active" ? "secondary" : "default"}
                        size="sm"
                        className="h-8 px-3 text-xs gap-1"
                        disabled={togglingId === ticket.id}
                        onClick={() => handleToggleStatus(ticket.id, ticket.status, ticket.is_completed, ticket.class_session_id)}
                      >
                        {togglingId === ticket.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : ticket.status === "active" ? (
                          "Deactivate"
                        ) : ticket.is_completed ? (
                          <>
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Rerun
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
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
            <AlertDialogTitle>Rerun Exit Ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This exit ticket has already been used in a previous lesson. Do you want to delete all previous student submissions to run it again?
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
                "Delete & Rerun"
              )}
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
              {classResources.map((cr) => (
                <div key={cr.id} className="p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold truncate">{cr.resource.title}</h3>
                        <Badge variant="secondary" className="text-xs">{cr.resource.category}</Badge>
                      </div>
                      {cr.resource.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{cr.resource.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0"
                      onClick={() => window.open(cr.resource.url, "_blank", "noopener,noreferrer")}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Launch
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
