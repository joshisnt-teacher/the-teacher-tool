import React from 'react';
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
} from 'lucide-react';
import { useClasses } from '@/hooks/useClasses';
import { ClassSessions } from '@/components/class-dashboard/ClassSessions';
import { useClassExitTicketRuns } from '@/hooks/useClassExitTicketRuns';
import { format, formatDistanceToNow } from 'date-fns';

const ANALYTICS_URL =
  import.meta.env.VITE_ANALYTICS_URL || 'https://analytics.edufied.com.au';

const ClassDashboard = () => {
  const { classId } = useParams<{ classId: string }>();
  const { data: classes = [], isLoading } = useClasses();
  const navigate = useNavigate();
  const currentClass = classes.find((c) => c.id === classId);
  const { data: exitTicketRuns = [] } = useClassExitTicketRuns(classId);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
            <Link
              to="/dashboard"
              className="hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate">
              {currentClass.class_name}
            </span>
          </nav>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {currentClass.class_name}
              </h1>
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
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Want deeper insights?
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
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
              className="border-blue-300 dark:border-blue-700"
            >
              Open in Analytics →
            </Button>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="sessions">
          <TabsList className="mb-6">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="exit-tickets">
              Exit Tickets
              {exitTicketRuns.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {exitTicketRuns.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sessions">
            <ClassSessions classId={classId!} />
          </TabsContent>

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
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {run.is_completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{run.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(run.created_at), {
                              addSuffix: true,
                            })}{' '}
                            · {run.result_count} response
                            {run.result_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={run.is_completed ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {run.is_completed ? 'Completed' : run.status}
                      </Badge>
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
