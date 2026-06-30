import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Monitor,
  BarChart2,
  BookOpen,
  Calendar,
  Ticket,
  CheckCircle2,
  Clock,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Play,
  Layers,
  Users,
  Trash2,
} from 'lucide-react';
import { useClasses } from '@/hooks/useClasses';
import { useClassExitTicketRuns } from '@/hooks/useClassExitTicketRuns';
import { useAtlasLessonRefs, AtlasLessonRef } from '@/hooks/useAtlasLessonRefs';
import { useClassSessionsList } from '@/hooks/useClassSessionsList';
import { useDeleteClassSession } from '@/hooks/useClassSessions';
import { useToast } from '@/hooks/use-toast';
import { useDemoTracking } from '@/hooks/useDemoTracking';
import { format, formatDistanceToNow } from 'date-fns';

const ANALYTICS_URL =
  import.meta.env.VITE_ANALYTICS_URL || 'https://analytics.edufied.com.au';

// ── Upcoming Lesson Card ──────────────────────────────────────────────────────

function UpcomingLessonCard({
  lesson,
  classId,
  isActive,
}: {
  lesson: AtlasLessonRef;
  classId: string;
  isActive: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold truncate">{lesson.title}</p>
              {isActive && (
                <Badge className="bg-green-100 text-green-800 text-xs shrink-0">
                  Active
                </Badge>
              )}
            </div>
            {lesson.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {lesson.description}
              </p>
            )}
            {showDetails && (
              <div className="mt-3 space-y-3">
                {lesson.learning_intentions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Learning Intentions
                    </p>
                    <ul className="space-y-1">
                      {lesson.learning_intentions.map((li, i) => (
                        <li key={i} className="text-xs text-foreground flex gap-1.5">
                          <span className="text-muted-foreground shrink-0">•</span>
                          {li}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {lesson.success_criteria.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Success Criteria
                    </p>
                    <ul className="space-y-1">
                      {lesson.success_criteria.map((sc, i) => (
                        <li key={i} className="text-xs text-foreground flex gap-1.5">
                          <span className="text-muted-foreground shrink-0">•</span>
                          {sc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {lesson.slides.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Slides ({lesson.slides.length})
                    </p>
                    <ol className="space-y-0.5">
                      {lesson.slides.map((slide, i) => (
                        <li key={i} className="text-xs text-muted-foreground">
                          {i + 1}. {slide.title || 'Untitled slide'}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showDetails ? (
                <><ChevronUp className="w-3 h-3" /> Hide details</>
              ) : (
                <><ChevronDown className="w-3 h-3" /> Show details</>
              )}
            </button>
          </div>
          <div className="shrink-0">
            {isActive ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/classroom/${classId}`)}
              >
                <Monitor className="w-3.5 h-3.5 mr-1.5" />
                Go to Classroom
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => navigate(`/classroom/${classId}?lessonId=${lesson.id}`)}
              >
                <Play className="w-3.5 h-3.5 mr-1.5" />
                Start Lesson
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const ClassDashboard = () => {
  const { classId } = useParams<{ classId: string }>();
  const { data: classes = [], isLoading } = useClasses();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackDemoAction } = useDemoTracking();
  const currentClass = classes.find((c) => c.id === classId);

  useEffect(() => {
    if (currentClass) {
      trackDemoAction('viewed_class_dashboard', { class_id: classId });
    }
  }, [currentClass?.id]);
  const { data: exitTicketRuns = [] } = useClassExitTicketRuns(classId);
  const { data: lessonRefs = [], isError: lessonRefsError } = useAtlasLessonRefs(classId!);
  const { data: sessions = [], isLoading: isLoadingSessions } = useClassSessionsList(classId!);
  const deleteSessionMutation = useDeleteClassSession();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading class...</p>
        </div>
      </div>
    );
  }

  if (!currentClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Class not found</h1>
          <p className="text-muted-foreground mb-4">
            The class you're looking for doesn't exist.
          </p>
          <Link to="/dashboard">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Determine which lesson refs are linked to sessions in this class
  const activeRefIds = new Set(
    sessions
      .filter((s) => !s.ended_at)
      .map((s) => (s as any).atlas_lesson_ref_id as string | null)
      .filter(Boolean) as string[]
  );

  const doneRefIds = new Set(
    sessions
      .filter((s) => !!s.ended_at)
      .map((s) => (s as any).atlas_lesson_ref_id as string | null)
      .filter(Boolean) as string[]
  );

  // Upcoming = not done (active refs still show as upcoming with Active badge)
  const upcomingRefs = lessonRefs.filter((r) => !doneRefIds.has(r.id));
  const completedSessions = sessions.filter((s) => !!s.ended_at);

  const formatDuration = (startedAt: string, endedAt: string) => {
    const diffMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this session and all its notes?')) return;
    try {
      await deleteSessionMutation.mutateAsync(sessionId);
      toast({ title: 'Session deleted' });
    } catch {
      toast({ title: 'Error', description: 'Could not delete session.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
            <Link to="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate">
              {currentClass.class_name}
            </span>
          </nav>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{currentClass.class_name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {currentClass.subject}
                </span>
                <span>Year {currentClass.year_level}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(currentClass.start_date), 'MMM d')} →{' '}
                  {format(new Date(currentClass.end_date), 'MMM d, yyyy')}
                </span>
              </div>
            </div>

            <Button
              onClick={() => navigate(`/classroom/${currentClass.id}`)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Monitor className="h-4 w-4 mr-2" />
              Classroom
            </Button>
          </div>
        </div>
      </header>

      {/* Analytics nudge */}
      <div className="container mx-auto px-4 pt-6">
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-rose-900 dark:text-rose-100">
                Want deeper insights?
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                View assessment trends, student growth, and KPIs in Analytics.
              </p>
            </div>
          </div>
          <a
            href={`${ANALYTICS_URL}/class/${classId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button
              variant="outline"
              size="sm"
              className="border-rose-300 dark:border-rose-700"
            >
              Open in Analytics →
            </Button>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="lessons">
          <TabsList className="mb-6">
            <TabsTrigger value="lessons">
              Lessons
              {upcomingRefs.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {upcomingRefs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="exit-tickets">
              Exit Tickets
              {exitTicketRuns.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {exitTicketRuns.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Lessons Tab ── */}
          <TabsContent value="lessons">
            <div className="space-y-8">
              {/* Upcoming */}
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Upcoming
                </h2>
                {lessonRefsError ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-destructive">
                      Could not load lessons. Check your connection and try refreshing.
                    </p>
                  </div>
                ) : upcomingRefs.length === 0 ? (
                  <div className="text-center py-6">
                    <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">No upcoming lessons for this class.</p>
                    <p className="text-xs text-muted-foreground">
                      Send a lesson from Atlas to see it here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingRefs.map((ref) => (
                      <UpcomingLessonCard
                        key={ref.id}
                        lesson={ref}
                        classId={classId!}
                        isActive={activeRefIds.has(ref.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Previous */}
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Previous
                </h2>
                {isLoadingSessions ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Loading sessions...</p>
                  </div>
                ) : completedSessions.length === 0 ? (
                  <div className="text-center py-10">
                    <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-1">No previous lessons yet.</p>
                    <p className="text-xs text-muted-foreground">
                      Start a lesson from the Classroom to record your first session.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedSessions.map((session) => (
                      <Card
                        key={session.id}
                        className="border-border/50 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate(`/class/${classId}/session/${session.id}`)}
                      >
                        <CardContent className="p-4 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate mb-1">
                              {session.title || 'Untitled Lesson'}
                            </p>
                            {session.description && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {session.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDuration(session.started_at, session.ended_at!)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {(session.student_notes ?? []).length} notes
                              </span>
                              <span>
                                {format(new Date(session.started_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Exit Tickets Tab ── */}
          <TabsContent value="exit-tickets">
            {exitTicketRuns.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-4">
                  No exit tickets run for this class yet.
                </p>
                <Link to="/exit-tickets">
                  <Button size="sm">
                    <Ticket className="h-4 w-4 mr-2" />
                    Go to Exit Tickets
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    {exitTicketRuns.length} exit ticket
                    {exitTicketRuns.length !== 1 ? 's' : ''} run
                  </p>
                  <Link to="/exit-tickets">
                    <Button variant="outline" size="sm">
                      <Ticket className="h-4 w-4 mr-2" />
                      Manage Exit Tickets
                    </Button>
                  </Link>
                </div>
                {exitTicketRuns.map((run) => (
                  <Card key={run.id} className="border-border/50">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {run.is_completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{run.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}{' '}
                            · {run.result_count} response{run.result_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={run.is_completed ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {run.is_completed ? 'Completed' : run.status}
                        </Badge>
                        <Link to={`/assessment/${run.id}`}>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                            Results
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ClassDashboard;
