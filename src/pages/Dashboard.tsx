import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useClasses } from '@/hooks/useClasses';
import { useStudentCounts, useTotalStudentCount } from '@/hooks/useStudents';
import { useUpcomingAssessmentsCount, useAverageClassScore } from '@/hooks/useDashboardStats';
import { useTeacherTasks } from '@/hooks/useTeacherTasks';
import { getClassIconConfig } from '@/lib/classIcons';
import {
  Users,
  TrendingUp,
  Calendar,
  Plus,
  Monitor,
  ArrowRight,
  School,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns';

const Dashboard = () => {
  const { data: currentUser, isLoading } = useCurrentUser();
  const { data: classes = [], isLoading: isLoadingClasses } = useClasses();
  const { data: studentCounts = {}, isLoading: isLoadingStudentCounts } = useStudentCounts();
  const { data: totalStudentCount = 0, isLoading: isLoadingTotalCount } = useTotalStudentCount();
  const { data: upcomingCount = 0 } = useUpcomingAssessmentsCount();
  const { data: avgScore } = useAverageClassScore();
  const { data: upcomingTasks = [], isLoading: isLoadingTasks } = useTeacherTasks(5);

  const nonDemoClasses = classes.filter((c) => !c.is_demo);
  const demoClasses = classes.filter((c) => c.is_demo);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const formatDueDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const getDueDateVariant = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date) || isPast(date)) return 'destructive';
    if (isTomorrow(date)) return 'secondary';
    return 'outline';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {currentUser?.name || 'Teacher'}!
          </h2>
          <p className="text-muted-foreground text-lg">
            Here's your classroom overview for today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{nonDemoClasses.length}</div>
              <p className="text-xs text-muted-foreground">
                {isLoadingClasses ? 'Loading...' : 'Active classes'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingTotalCount ? '...' : totalStudentCount}
              </div>
              <p className="text-xs text-muted-foreground">Across all classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Class Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgScore !== null && avgScore !== undefined ? `${avgScore}%` : '—'}
              </div>
              <p className="text-xs text-muted-foreground">
                {avgScore !== null && avgScore !== undefined ? 'Mean across all results' : 'No results yet'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Assessments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingCount}</div>
              <p className="text-xs text-muted-foreground">Due from today</p>
            </CardContent>
          </Card>
        </div>

        {/* Classes Grid */}
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Your Classes</h3>
              <Link to="/create-class">
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Class
                </Button>
              </Link>
            </div>

            {isLoadingClasses ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="h-40 animate-pulse" />
                ))}
              </div>
            ) : nonDemoClasses.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <School className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h4 className="text-lg font-medium mb-2">No classes yet</h4>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Get started by creating your first class. You'll be able to manage assessments, run classroom activities, and track student progress.
                  </p>
                  <Link to="/create-class">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Class
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nonDemoClasses.map((classItem) => {
                  const studentCount = studentCounts[classItem.id] || 0;
                  const iconConfig = getClassIconConfig(classItem.subject);
                  const Icon = iconConfig.icon;

                  return (
                    <Link key={classItem.id} to={`/class/${classItem.id}`} className="block">
                      <Card className="group overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div
                              className={`shrink-0 w-12 h-12 rounded-xl ${iconConfig.bg} ${iconConfig.text} flex items-center justify-center`}
                            >
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">{classItem.class_name}</h4>
                              <p className="text-sm text-muted-foreground truncate">
                                {classItem.subject} • {classItem.year_level}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {classItem.term} • {format(new Date(classItem.start_date), 'MMM yyyy')} – {format(new Date(classItem.end_date), 'MMM yyyy')}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              {isLoadingStudentCounts ? (
                                <span className="inline-block w-16 h-4 bg-muted rounded animate-pulse" />
                              ) : (
                                <>
                                  <span className="font-medium text-foreground">{studentCount}</span> student
                                  {studentCount !== 1 ? 's' : ''}
                                </>
                              )}
                            </div>
                            <Link
                              to={`/classroom/${classItem.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button size="sm" variant="ghost" className="h-8 px-2">
                                <Monitor className="w-4 h-4 mr-1.5" />
                                Classroom
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Due Soon */}
          {(upcomingTasks.length > 0 || isLoadingTasks) && (
            <Card>
              <CardHeader>
                <CardTitle>Due Soon</CardTitle>
                <CardDescription>Upcoming assessments across your classes</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTasks ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {upcomingTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{task.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {task.class_name} • {task.class_subject}
                          </p>
                        </div>
                        {task.due_date && (
                          <Badge variant={getDueDateVariant(task.due_date)} className="shrink-0 text-[10px]">
                            {formatDueDate(task.due_date)}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Demo Classes */}
          {demoClasses.length > 0 && (
            <Card className="opacity-60 grayscale hover:opacity-80 hover:grayscale-0 transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Demo Classes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {demoClasses.map((classItem) => (
                  <Link
                    key={classItem.id}
                    to={`/class/${classItem.id}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground truncate">{classItem.class_name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
