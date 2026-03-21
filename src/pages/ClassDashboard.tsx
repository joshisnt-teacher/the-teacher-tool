import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Calendar, BookOpen, Plus, Monitor } from 'lucide-react';
import { useClasses } from '@/hooks/useClasses';
import { format } from 'date-fns';
import { AssessmentsSection } from '@/components/class-dashboard/AssessmentsSection';
import { ProgressGraphsSection } from '@/components/class-dashboard/ProgressGraphsSection';
import { CustomDashboard } from '@/components/class-dashboard/CustomDashboard';
import { AdjustClassDataDialog } from '@/components/class-dashboard/AdjustClassDataDialog';
import { EnhancedTimelineSection } from '@/components/class-dashboard/EnhancedTimelineSection';
import { ImportAssessmentDialog } from '@/components/assessment/ImportAssessmentDialog';
import { KPIBar, FilterState } from '@/components/class-dashboard/KPIBar';
import { CohortGrowthAnalysis } from '@/components/class-dashboard/CohortGrowthAnalysis';
import { ClassSessions } from '@/components/class-dashboard/ClassSessions';
import { useEnhancedTimelineData } from '@/hooks/useEnhancedTimelineData';
import { useNavigate } from 'react-router-dom';

const ClassDashboard = () => {
  const { classId } = useParams<{ classId: string }>();
  const { data: classes = [], isLoading } = useClasses();
  const navigate = useNavigate();
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  // KPI Bar state
  const [filters, setFilters] = useState<FilterState>({
    assessmentRange: null,
    bandScheme: 'band' as const,
    significanceThreshold: 20
  });
  
  const currentClass = classes.find(c => c.id === classId);
  
  // Use class start/end dates, or fallback to current year if not available
  const startDate = currentClass?.start_date || new Date().getFullYear() + '-01-01';
  const endDate = currentClass?.end_date || new Date().getFullYear() + '-12-31';

  // Fetch timeline data to get available assessments for the filter
  const { data: timelineData = [] } = useEnhancedTimelineData(classId!, startDate, endDate);
  
  const availableAssessments = timelineData.map(item => ({
    id: item.taskId,
    name: item.assessmentName,
    date: item.date
  }));

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading class dashboard...</p>
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
          <p className="text-muted-foreground mb-4">The class you're looking for doesn't exist.</p>
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
          <div className="flex items-center gap-4 mb-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{currentClass.class_name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {currentClass.subject}
                </span>
                <span>Year {currentClass.year_level}</span>
                <span>{currentClass.term}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(currentClass.start_date), 'MMM d')} → {format(new Date(currentClass.end_date), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => navigate(`/classroom/${currentClass.id}`)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Monitor className="h-4 w-4 mr-2" />
                Classroom
              </Button>
              <Button 
                onClick={() => navigate(`/create-assessment/${currentClass.id}`)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Assessment
              </Button>
              <Button variant="secondary" onClick={() => setIsImportDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Import Assessment
              </Button>
              <Button variant="outline" onClick={() => setIsAdjustDialogOpen(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Adjust Class Data
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column - Assessments (1/3 width) */}
              <div className="lg:col-span-1">
                <AssessmentsSection classId={classId!} />
              </div>
              
              {/* Right column - Class Sessions (2/3 width) */}
              <div className="lg:col-span-2">
                <ClassSessions classId={classId!} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* KPI Bar - at the top */}
              <KPIBar 
                classId={classId!}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                availableAssessments={availableAssessments}
              />
              
              {/* Enhanced Timeline Analysis - below KPI bar */}
              <div className="w-full min-h-[50vh]">
                <EnhancedTimelineSection 
                  classId={classId!} 
                  startDate={currentClass.start_date} 
                  endDate={currentClass.end_date} 
                />
              </div>
              
              {/* Student Growth Analysis and other content */}
              <div className="space-y-6">
                <CohortGrowthAnalysis 
                  classId={classId!}
                  filters={filters}
                />
                
                {/* Additional Analytics - Coming Soon */}
                <div className="h-96 bg-muted/30 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Additional Analytics - Coming Soon</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom">
            <CustomDashboard classId={classId!} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      {currentClass && (
        <AdjustClassDataDialog
          isOpen={isAdjustDialogOpen}
          onClose={() => setIsAdjustDialogOpen(false)}
          classData={currentClass}
        />
      )}

      {classId && (
        <ImportAssessmentDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          classId={classId}
        />
      )}
    </div>
  );
};

export default ClassDashboard;