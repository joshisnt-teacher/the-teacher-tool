import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Clock, Users, Calendar, Trash2, Ticket, FileText } from 'lucide-react';
import { useClassSessionsList } from '@/hooks/useClassSessionsList';
import { useDeleteClassSession, useUpdateClassSession } from '@/hooks/useClassSessions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function SessionDetails() {
  const { classId, sessionId } = useParams<{ classId: string; sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: sessions = [], isLoading } = useClassSessionsList(classId || "");
  const deleteSessionMutation = useDeleteClassSession();
  const updateSessionMutation = useUpdateClassSession();

  const session = sessions.find(s => s.id === sessionId);

  // Teacher notes local state — syncs from DB, saves on blur
  const [teacherNotes, setTeacherNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const notesInitialised = useRef(false);

  useEffect(() => {
    if (session && !notesInitialised.current) {
      setTeacherNotes(session.teacher_notes ?? '');
      notesInitialised.current = true;
    }
  }, [session]);

  const handleNotesSave = async () => {
    if (!sessionId) return;
    setNotesSaving(true);
    try {
      await updateSessionMutation.mutateAsync({ id: sessionId, data: { teacher_notes: teacherNotes } });
    } catch {
      toast({ title: 'Failed to save notes', variant: 'destructive' });
    } finally {
      setNotesSaving(false);
    }
  };

  // Exit tickets run during this session
  const [sessionTickets, setSessionTickets] = useState<{ id: string; name: string; status: string | null; is_completed: boolean | null }[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    supabase
      .from('tasks')
      .select('id, name, status, is_completed')
      .eq('class_session_id', sessionId)
      .eq('is_exit_ticket', true)
      .then(({ data }) => setSessionTickets(data ?? []));
  }, [sessionId]);

  const formatDuration = (startedAt: string, endedAt: string) => {
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Academic':
        return 'bg-blue-100 text-blue-800';
      case 'Pastoral':
        return 'bg-green-100 text-green-800';
      case 'Other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating > 0) return 'text-green-600';
    if (rating < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const handleDeleteSession = async () => {
    if (!sessionId || !confirm('Are you sure you want to delete this session and all its notes?')) {
      return;
    }

    try {
      await deleteSessionMutation.mutateAsync(sessionId);
      toast({
        title: "Session Deleted",
        description: "The session and all associated notes have been deleted.",
      });
      navigate(`/class/${classId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Session not found</h1>
          <p className="text-muted-foreground mb-4">The session you're looking for doesn't exist.</p>
          <Link to={`/class/${classId}`}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Class
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to={`/class/${classId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Class
              </Button>
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {session.title || 'Untitled Lesson'}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(session.started_at, session.ended_at!)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {session.student_notes.length} notes
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(session.started_at), 'MMM d, yyyy • h:mm a')}
                </span>
              </div>
              {session.description && (
                <p className="text-muted-foreground mt-2 max-w-2xl">
                  {session.description}
                </p>
              )}
            </div>
            
            <Button
              variant="destructive"
              onClick={handleDeleteSession}
              disabled={deleteSessionMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteSessionMutation.isPending ? "Deleting..." : "Delete Session"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Post-lesson teacher notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Lesson Notes &amp; Action Items
              </CardTitle>
              <CardDescription>
                Your private notes from this lesson — action items, follow-ups, observations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="teacher-notes" className="sr-only">Lesson notes</Label>
                <Textarea
                  id="teacher-notes"
                  placeholder="e.g. Follow up with James on his extended response. Revisit cause &amp; effect next lesson."
                  value={teacherNotes}
                  onChange={(e) => setTeacherNotes(e.target.value)}
                  onBlur={handleNotesSave}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {notesSaving ? 'Saving…' : 'Saves automatically when you click away'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Exit tickets run during this session */}
          {sessionTickets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Exit Tickets ({sessionTickets.length})
                </CardTitle>
                <CardDescription>Exit tickets that were run during this lesson</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sessionTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <span className="font-medium text-sm">{ticket.name}</span>
                      <Badge variant={ticket.is_completed ? 'secondary' : 'default'} className="capitalize">
                        {ticket.is_completed ? 'Completed' : ticket.status ?? 'Active'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Session Notes ({session.student_notes.length})
              </CardTitle>
              <CardDescription>
                Notes taken during this lesson session
              </CardDescription>
            </CardHeader>
            <CardContent>
              {session.student_notes.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No notes taken</h3>
                  <p className="text-muted-foreground">
                    No notes were recorded during this lesson session.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...session.student_notes]
                    .sort((a, b) => (a.students?.last_name || '').localeCompare(b.students?.last_name || ''))
                    .map((note) => (
                    <Card key={note.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">
                              {note.students.first_name} {note.students.last_name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Student ID: {note.students.student_id}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant="outline" 
                              className={getCategoryColor(note.category)}
                            >
                              {note.category}
                            </Badge>
                            <div className="text-right">
                              <span className={`text-lg font-bold ${getRatingColor(note.rating)}`}>
                                {note.rating > 0 ? '+' : ''}{note.rating}
                              </span>
                              <p className="text-xs text-muted-foreground">Rating</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-muted/30 rounded-lg p-4 mb-4">
                          <p className="text-sm leading-relaxed">{note.note}</p>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Added {format(new Date(note.created_at), 'MMM d, yyyy • h:mm a')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
