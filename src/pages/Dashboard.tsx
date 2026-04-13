import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/hooks/useAuth';
import { useClasses } from '@/hooks/useClasses';
import { useStudentCounts, useTotalStudentCount } from '@/hooks/useStudents';
import { useUpcomingAssessmentsCount, useAverageClassScore } from '@/hooks/useDashboardStats';
import { BookOpen, Users, TrendingUp, Calendar, Settings, LogOut, Plus, Edit, FileText, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const Dashboard = () => {
  const { data: currentUser, isLoading } = useCurrentUser();
  const { signOut } = useAuth();
  const { data: classes = [], isLoading: isLoadingClasses } = useClasses();
  const { data: studentCounts = {}, isLoading: isLoadingStudentCounts } = useStudentCounts();
  const { data: totalStudentCount = 0, isLoading: isLoadingTotalCount } = useTotalStudentCount();
  const { data: upcomingCount = 0 } = useUpcomingAssessmentsCount();
  const { data: avgScore } = useAverageClassScore();
  const navigate = useNavigate();

  const nonDemoClasses = classes.filter(c => !c.is_demo);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentUser?.school?.logo_url ? (
              <img 
                src={currentUser.school.logo_url} 
                alt={currentUser.school.name} 
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{currentUser?.school?.name}</h1>
              <p className="text-sm text-muted-foreground">Teacher Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{nonDemoClasses.length}</div>
              <p className="text-xs text-muted-foreground">
                {isLoadingClasses ? 'Loading...' : 'Active classes'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
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

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
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

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
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

        {/* Recent Classes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Recent Classes</CardTitle>
              <CardDescription>Your most active classes this week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingClasses ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading classes...</p>
                </div>
              ) : classes.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">No classes created yet</p>
                  <Link to="/create-class">
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Class
                    </Button>
                  </Link>
                </div>
              ) : (
                classes.slice(0, 3).map((classItem) => {
                  const studentCount = studentCounts[classItem.id] || 0;
                  
                  return (
                    <div key={classItem.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{classItem.class_name}</p>
                          {classItem.is_demo && (
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              Demo
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {classItem.subject} • {classItem.year_level} • {classItem.term}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(classItem.start_date), 'MMM d')} - {format(new Date(classItem.end_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">
                          {isLoadingStudentCounts ? 'Loading...' : `${studentCount} student${studentCount !== 1 ? 's' : ''}`}
                        </div>
                        <div className="flex gap-2">
          <Link to={`/class/${classItem.id}`}>
            <Button size="sm" variant="outline">
              <BookOpen className="w-3 h-3 mr-2" />
              View Class
            </Button>
          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/create-class">
                <Button className="w-full justify-start h-12" variant="default">
                  <Plus className="w-4 h-4 mr-3" />
                  Create New Class
                </Button>
              </Link>
              <Link to="/curriculum-browser">
                <Button className="w-full justify-start h-12" variant="outline">
                  <BookOpen className="w-4 h-4 mr-3" />
                  Browse Curriculum
                </Button>
              </Link>
              
              {/* Create Assessment Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    className="w-full justify-start h-12" 
                    variant="outline"
                    disabled={classes.length === 0}
                  >
                    <FileText className="w-4 h-4 mr-3" />
                    Create Assessment
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Select a class</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {classes.length === 0 ? (
                    <DropdownMenuItem disabled>
                      No classes available
                    </DropdownMenuItem>
                  ) : (
                    classes.map((classItem) => (
                      <DropdownMenuItem
                        key={classItem.id}
                        onClick={() => navigate(`/create-assessment/${classItem.id}`)}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{classItem.class_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {classItem.subject} • {classItem.year_level}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button className="w-full justify-start h-12" variant="outline">
                <Users className="w-4 h-4 mr-3" />
                Student Progress Report
              </Button>
              <Button className="w-full justify-start h-12" variant="outline">
                <Calendar className="w-4 h-4 mr-3" />
                Schedule Assessment
              </Button>
              <Button className="w-full justify-start h-12" variant="outline">
                <TrendingUp className="w-4 h-4 mr-3" />
                Analytics Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;