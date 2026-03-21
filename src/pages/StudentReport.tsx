import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { OverallSummary } from '@/components/student-profile/OverallSummary';
import { AssessmentProgress } from '@/components/student-profile/AssessmentProgress';
import { AssessmentBreakdown } from '@/components/student-profile/AssessmentBreakdown';
import { CurriculumContentItems } from '@/components/student-profile/CurriculumContentItems';
import { GeneralCapabilities } from '@/components/student-profile/GeneralCapabilities';
import { RecentTeacherNotes } from '@/components/student-profile/RecentTeacherNotes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ParentReportView } from '@/components/student-profile/parent/ParentReportView';

const StudentReport = () => {
  const { studentId, classId } = useParams<{ studentId: string; classId: string }>();
  const navigate = useNavigate();
  const { data: students = [], isLoading: studentsLoading } = useStudents(classId!);
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const [viewMode, setViewMode] = useState<'parent' | 'teacher' | 'student'>('parent');
  
  const currentStudent = students.find(s => s.id === studentId);
  const currentClass = classes.find(c => c.id === classId);

  if (studentsLoading || classesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading student report...</p>
        </div>
      </div>
    );
  }

  if (!currentStudent || !currentClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Student not found</h1>
          <p className="text-muted-foreground mb-4">The student you're looking for doesn't exist.</p>
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
      <div className="container mx-auto px-4 py-8">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'parent' | 'teacher' | 'student')} className="space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate(`/class/${classId}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Class
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{currentStudent.first_name} {currentStudent.last_name}</h1>
                <p className="text-muted-foreground">
                  {currentClass.class_name} • {currentClass.subject} • {currentClass.year_level}
                </p>
              </div>
            </div>
            <TabsList>
              <TabsTrigger value="parent">Parent view</TabsTrigger>
              <TabsTrigger value="teacher">Teacher view</TabsTrigger>
              <TabsTrigger value="student">Student view</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="parent">
            <ParentReportView
              studentId={studentId!}
              classId={classId!}
              student={currentStudent}
              classInfo={currentClass}
            />
          </TabsContent>
          <TabsContent value="teacher">
            <div className="space-y-6">
              <OverallSummary studentId={studentId!} classId={classId!} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AssessmentProgress studentId={studentId!} classId={classId!} />
                <AssessmentBreakdown studentId={studentId!} classId={classId!} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CurriculumContentItems studentId={studentId!} classId={classId!} />
                <GeneralCapabilities studentId={studentId!} classId={classId!} />
              </div>
              <RecentTeacherNotes studentId={studentId!} classId={classId!} />
            </div>
          </TabsContent>
          <TabsContent value="student">
            <div className="rounded-2xl border bg-background/70 p-8 text-center text-muted-foreground">
              The student-friendly view is coming soon. Let us know what would help you review progress together.
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentReport;
