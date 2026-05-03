import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ClipboardList, Link2, LogOut, BookOpen } from 'lucide-react';
import { useStudentSession } from '@/hooks/useStudentSession';
import { supabase } from '@/integrations/supabase/client';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { session, loading: sessionLoading, signOut } = useStudentSession();

  useEffect(() => {
    if (!sessionLoading && !session) {
      window.location.href = 'https://student.edufied.com.au';
    }
  }, [session, sessionLoading]);

  // Fetch the student's enrolled classes
  const { data: enrolments = [], isLoading: isLoadingEnrolments } = useQuery({
    queryKey: ['student-enrolments', session?.student_id],
    queryFn: async () => {
      if (!session?.student_id) return [];
      const { data, error } = await supabase
        .from('enrolments')
        .select('class_id, classes(id, class_name, subject, year_level)')
        .eq('student_id', session.student_id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!session?.student_id,
  });

  const classIds = enrolments.map((e: any) => e.class_id);

  // Fetch active (non-homework) exit tickets for those classes
  const { data: activeTickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ['student-active-exit-tickets', classIds],
    queryFn: async () => {
      if (classIds.length === 0) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('id, name, description, class_id, classes(class_name)')
        .eq('is_exit_ticket', true)
        .eq('status', 'active')
        .eq('is_homework', false)
        .in('class_id', classIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        class_id: t.class_id,
        class_name: t.classes?.class_name ?? '',
      }));
    },
    enabled: classIds.length > 0,
  });

  // Fetch homework exit tickets for those classes
  const { data: homeworkTickets = [], isLoading: isLoadingHomework } = useQuery({
    queryKey: ['student-homework-exit-tickets', classIds],
    queryFn: async () => {
      if (classIds.length === 0) return [];
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('tasks')
        .select('id, name, description, class_id, due_date, classes(class_name)')
        .eq('is_exit_ticket', true)
        .eq('is_homework', true)
        .eq('status', 'active')
        .in('class_id', classIds)
        .gte('due_date', today)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        class_id: t.class_id,
        class_name: t.classes?.class_name ?? '',
        due_date: t.due_date,
      }));
    },
    enabled: classIds.length > 0,
  });

  // Fetch active class resources (activity links) for those classes
  const { data: classResources = [], isLoading: isLoadingResources } = useQuery({
    queryKey: ['student-class-resources', classIds],
    queryFn: async () => {
      if (classIds.length === 0) return [];
      const { data, error } = await supabase
        .from('class_resources')
        .select(`
          id,
          class_id,
          status,
          resource:resources(id, title, url, description, category)
        `)
        .in('class_id', classIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        class_id: r.class_id,
        title: r.resource?.title ?? '',
        url: r.resource?.url ?? '',
        description: r.resource?.description ?? '',
        category: r.resource?.category ?? '',
      }));
    },
    enabled: classIds.length > 0,
  });

  const isLoading = sessionLoading || isLoadingEnrolments || isLoadingTickets || isLoadingHomework || isLoadingResources;

  const formatDueDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleStartExitTicket = (ticketId: string) => {
    if (!session) return;
    navigate(`/exit-ticket/${ticketId}?studentId=${session.student_id}`);
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to class, {session.first_name}</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Exit Tickets Section */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Exit Tickets
              </h2>
              {activeTickets.length > 0 ? (
                <div className="space-y-3">
                  {activeTickets.map((ticket) => (
                    <Card key={ticket.id} className="hover:border-primary transition-colors">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{ticket.name}</p>
                          {ticket.description && (
                            <p className="text-sm text-muted-foreground">{ticket.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{ticket.class_name}</p>
                        </div>
                        <Button onClick={() => handleStartExitTicket(ticket.id)}>
                          Start
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Stay tuned for the next activity
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Homework Section */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Homework
              </h2>
              {homeworkTickets.length > 0 ? (
                <div className="space-y-3">
                  {homeworkTickets.map((ticket) => (
                    <Card key={ticket.id} className="hover:border-blue-400 transition-colors border-blue-200 bg-blue-50/30">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{ticket.name}</p>
                          {ticket.description && (
                            <p className="text-sm text-muted-foreground">{ticket.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">{ticket.class_name}</p>
                            {ticket.due_date && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                Due {formatDueDate(ticket.due_date)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button onClick={() => handleStartExitTicket(ticket.id)}>
                          Start
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No homework right now
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Activity Links Section */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                Activity Links
              </h2>
              {classResources.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {classResources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <p className="font-medium">{resource.title}</p>
                          {resource.description && (
                            <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2 capitalize">{resource.category}</p>
                        </CardContent>
                      </Card>
                    </a>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No activities yet
                  </CardContent>
                </Card>
              )}
            </section>
          </>
        )}

        {/* Sign Out */}
        <div className="pt-4 text-center">
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
