import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  ArrowLeft, Plus, Ticket, Trash2, Loader2, ChevronDown, ChevronUp,
  Download, RefreshCw, X,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useClasses } from '@/hooks/useClasses';
import { useExitTicketTemplates, type ExitTicketTemplate } from '@/hooks/useExitTicketTemplates';
import { useRunsForTemplate, type TemplateRun } from '@/hooks/useRunsForTemplate';
import { useDeployTemplate } from '@/hooks/useDeployTemplate';
import { useClearRun } from '@/hooks/useClearRun';
import { useDeleteRun } from '@/hooks/useDeleteRun';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CreateExitTicket from './CreateExitTicket';

// ── Sub-component: runs list for a single template ──────────────────────────

interface TemplateRunsSectionProps {
  template: ExitTicketTemplate;
}

const TemplateRunsSection: React.FC<TemplateRunsSectionProps> = ({ template }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: runs = [], isLoading, refetch } = useRunsForTemplate(template.id);
  const clearRun = useClearRun();
  const deleteRun = useDeleteRun();

  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteRunDialogOpen, setDeleteRunDialogOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<TemplateRun | null>(null);

  const handleClear = async () => {
    if (!selectedRun) return;
    try {
      await clearRun.mutateAsync({
        taskId: selectedRun.id, classId: selectedRun.class_id, templateId: template.id,
      });
      toast({ title: 'Results cleared', description: 'The run has been reset to draft.' });
      refetch();
    } catch (e: unknown) {
      toast({ title: 'Failed to clear', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setClearDialogOpen(false);
      setSelectedRun(null);
    }
  };

  const handleDeleteRun = async () => {
    if (!selectedRun) return;
    try {
      await deleteRun.mutateAsync({
        taskId: selectedRun.id, classId: selectedRun.class_id, templateId: template.id,
      });
      toast({ title: 'Run removed' });
      refetch();
    } catch (e: unknown) {
      toast({ title: 'Failed to remove run', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setDeleteRunDialogOpen(false);
      setSelectedRun(null);
    }
  };

  const getStatusVariant = (status: string) => {
    if (status === 'active') return 'default' as const;
    if (status === 'closed') return 'secondary' as const;
    return 'outline' as const;
  };

  if (isLoading) return <div className="py-3 text-sm text-muted-foreground">Loading runs...</div>;

  if (runs.length === 0) {
    return (
      <div className="py-3 text-sm text-muted-foreground">
        Not deployed to any class yet. Use the Deploy button above.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 pt-1">
        {runs.map((run) => (
          <div key={run.id} className="flex items-center justify-between gap-2 p-2.5 rounded-md border bg-background/50 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant={getStatusVariant(run.status)} className="capitalize text-xs shrink-0">
                {run.status}
              </Badge>
              <span className="truncate font-medium">{run.class_name}</span>
              {run.class_code && (
                <span className="text-xs text-muted-foreground font-mono shrink-0">{run.class_code}</span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost" size="sm" className="h-7 px-2 text-xs"
                onClick={() => navigate(`/assessment/${run.id}`)}
              >
                Results
              </Button>
              <Button
                variant="ghost" size="sm" className="h-7 px-2 text-xs"
                onClick={() => navigate(`/classroom/${run.class_id}`)}
              >
                Open in Classroom →
              </Button>
              <Button
                variant="ghost" size="sm" className="h-7 px-2 text-xs"
                onClick={() => { setSelectedRun(run); setClearDialogOpen(true); }}
                disabled={clearRun.isPending || deleteRun.isPending}
              >
                <RefreshCw className="w-3 h-3 mr-1" />Reset to Draft
              </Button>
              <Button
                variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                onClick={() => { setSelectedRun(run); setDeleteRunDialogOpen(true); }}
                disabled={clearRun.isPending || deleteRun.isPending}
              >
                <Trash2 className="w-3 h-3 mr-1" />Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes all student responses and resets the exit ticket to draft. The questions stay intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedRun(null)} disabled={clearRun.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} disabled={clearRun.isPending}>
              {clearRun.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting...</> : 'Reset to Draft'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteRunDialogOpen} onOpenChange={setDeleteRunDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete from Class?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes this exit ticket and all student responses from {selectedRun?.class_name}. The template is not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedRun(null)} disabled={deleteRun.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRun} disabled={deleteRun.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRun.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</> : 'Delete from Class'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────

const ExitTickets = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const { data: classes = [] } = useClasses();
  const { data: templates = [], isLoading, isError, error, refetch } = useExitTicketTemplates(currentUser?.school_id || undefined);
  const deployTemplate = useDeployTemplate();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTemplateId, setSheetTemplateId] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [deployTemplateId, setDeployTemplateId] = useState<string | null>(null);
  const [deployClassIds, setDeployClassIds] = useState<string[]>([]);

  const [openRunsMap, setOpenRunsMap] = useState<Record<string, boolean>>({});

  const openCreateSheet = () => { setSheetTemplateId(null); setSheetOpen(true); };
  const openEditSheet = (templateId: string) => { setSheetTemplateId(templateId); setSheetOpen(true); };
  const closeSheet = () => { setSheetOpen(false); setSheetTemplateId(null); refetch(); };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('exit_ticket_templates').delete().eq('id', templateToDelete);
      if (error) throw error;
      toast({ title: 'Exit ticket deleted' });
      refetch();
    } catch (err: unknown) {
      toast({ title: 'Failed to delete', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleDeployClick = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    setDeployTemplateId(templateId);
    setDeployClassIds([]);
    setDeployDialogOpen(true);
  };

  const toggleDeployClass = (classId: string) => {
    setDeployClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleDeployConfirm = async () => {
    if (!deployTemplateId || deployClassIds.length === 0) return;
    const plural = deployClassIds.length > 1;
    try {
      for (const classId of deployClassIds) {
        await deployTemplate.mutateAsync({ templateId: deployTemplateId, classId });
      }
      toast({
        title: plural ? `Imported into ${deployClassIds.length} classes` : 'Imported!',
        description: 'Click "Open in Classroom" below to activate.',
      });
      setOpenRunsMap((prev) => ({ ...prev, [deployTemplateId]: true }));
    } catch (err: unknown) {
      toast({ title: 'Import failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setDeployDialogOpen(false);
      setDeployTemplateId(null);
      setDeployClassIds([]);
    }
  };

  const toggleRuns = (templateId: string) =>
    setOpenRunsMap((prev) => ({ ...prev, [templateId]: !prev[templateId] }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <header className="bg-card border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Exit Tickets</h1>
              <p className="text-sm text-muted-foreground">Create templates and deploy them to your classes</p>
            </div>
          </div>
          <Button onClick={openCreateSheet}><Plus className="w-4 h-4 mr-2" />Create Exit Ticket</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Ticket className="w-5 h-5" />Exit Ticket Library</CardTitle>
              <CardDescription>Templates you've built — deploy them to any class when you're ready</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>Refresh</Button>
          </CardHeader>
          <CardContent>
            {isError && (
              <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                <p className="text-sm text-destructive font-medium">Failed to load exit tickets.</p>
                <p className="text-xs text-destructive/80 mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
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
                ) : templates.length > 0 ? (
                  <div className="space-y-3">
                    {templates.map((template) => (
                      <Card key={template.id} className="border-border/80">
                        <CardContent className="py-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              <div className="space-y-1 flex-1 cursor-pointer" onClick={() => openEditSheet(template.id)}>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline">
                                    {template.question_count} question{template.question_count === 1 ? '' : 's'}
                                  </Badge>
                                </div>
                                <h3 className="text-lg font-semibold">{template.name}</h3>
                                {template.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                                )}
                                <div className="text-xs text-muted-foreground">
                                  Created {formatDistanceToNow(new Date(template.created_at), { addSuffix: true })}
                                </div>
                              </div>
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button size="sm" onClick={(e) => handleDeployClick(e, template.id)}>
                                  <Download className="w-3.5 h-3.5 mr-1.5" />Import into Class
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => openEditSheet(template.id)}>Edit</Button>
                                <Button variant="destructive" size="sm" onClick={(e) => handleDeleteClick(e, template.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <Collapsible open={openRunsMap[template.id] || false} onOpenChange={() => toggleRuns(template.id)}>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground h-7 px-2">
                                  <span>Deployed runs</span>
                                  {openRunsMap[template.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <TemplateRunsSection template={template} />
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No exit tickets yet</h3>
                    <p className="text-muted-foreground mb-6">Create your first exit ticket template to get started.</p>
                    <Button onClick={openCreateSheet}><Plus className="w-4 h-4 mr-2" />Create Exit Ticket</Button>
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
            <SheetTitle>{sheetTemplateId ? 'Edit Exit Ticket' : 'Create Exit Ticket'}</SheetTitle>
          </SheetHeader>
          <CreateExitTicket embedded templateId={sheetTemplateId} onClose={closeSheet} />
        </SheetContent>
      </Sheet>

      <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import into Class</DialogTitle>
            <DialogDescription>
              Select one or more classes. Each class gets its own independent copy — results are tracked separately per class.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 max-h-52 overflow-y-auto border rounded-md p-2">
            {classes.length === 0 && (
              <p className="text-sm text-muted-foreground px-2 py-1">No classes found.</p>
            )}
            {classes.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-3 cursor-pointer rounded-md px-2 py-2 hover:bg-muted/60 select-none"
              >
                <Checkbox
                  checked={deployClassIds.includes(c.id)}
                  onCheckedChange={() => toggleDeployClass(c.id)}
                  disabled={deployTemplate.isPending}
                />
                <span className="text-sm font-medium">{c.class_name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{c.subject}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeployDialogOpen(false)} disabled={deployTemplate.isPending}>Cancel</Button>
            <Button onClick={handleDeployConfirm} disabled={deployClassIds.length === 0 || deployTemplate.isPending}>
              {deployTemplate.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</>
                : deployClassIds.length > 1
                  ? `Import into ${deployClassIds.length} classes`
                  : 'Import into Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exit Ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the template and its questions. Any runs already deployed to classes will remain but lose their template link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm} disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExitTickets;
