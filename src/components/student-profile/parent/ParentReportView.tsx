import React, { useMemo } from 'react';
import { format, isAfter, isToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
  ClipboardList,
  CalendarClock,
  MessageSquare,
  Users,
  Sun,
  CalendarDays,
} from 'lucide-react';
import { useStudentSummary } from '@/hooks/useStudentSummary';
import { useRecentTeacherNotes } from '@/hooks/useStudentNotes';
import { useStudentAssessmentResults } from '@/hooks/useStudentAssessmentResults';
import { AssessmentProgress } from '@/components/student-profile/AssessmentProgress';
import { AssessmentBreakdown } from '@/components/student-profile/AssessmentBreakdown';
import { CurriculumContentItems } from '@/components/student-profile/CurriculumContentItems';
import { GeneralCapabilities } from '@/components/student-profile/GeneralCapabilities';
import type { Student } from '@/hooks/useStudents';
import type { Class } from '@/hooks/useClasses';
import { Skeleton } from '@/components/ui/skeleton';

interface ParentReportViewProps {
  studentId: string;
  classId: string;
  student: Student;
  classInfo: Class;
}

const getTrendDetails = (trend: 'improving' | 'steady' | 'declining') => {
  switch (trend) {
    case 'improving':
      return {
        label: 'On the rise',
        icon: <TrendingUp className="w-4 h-4" />,
        tone: 'text-green-700 bg-green-50 border border-green-200',
      };
    case 'declining':
      return {
        label: 'Needs attention',
        icon: <TrendingDown className="w-4 h-4" />,
        tone: 'text-orange-700 bg-orange-50 border border-orange-200',
      };
    default:
      return {
        label: 'Holding steady',
        icon: <Minus className="w-4 h-4" />,
        tone: 'text-blue-700 bg-blue-50 border border-blue-200',
      };
  }
};

const getFeedbackSummary = (notes: ReturnType<typeof useRecentTeacherNotes>['data']) => {
  if (!notes || notes.length === 0) {
    return {
      summary: 'No recent notes from teachers yet.',
      tone: 'text-muted-foreground',
      accent: 'border border-dashed border-muted',
    };
  }

  const positive = notes.filter((note) => note.rating > 0).length;
  const negative = notes.filter((note) => note.rating < 0).length;
  const latest = notes[0];

  if (positive > negative) {
    return {
      summary: `Recent feedback is positive. Latest note: “${latest.note}”`,
      tone: 'text-green-700',
      accent: 'border border-green-200 bg-green-50',
    };
  }

  if (negative > positive) {
    return {
      summary: `Teachers are flagging a few focus areas. Latest note: “${latest.note}”`,
      tone: 'text-orange-700',
      accent: 'border border-orange-200 bg-orange-50',
    };
  }

  return {
    summary: `Mixed feedback recently. Latest note: “${latest.note}”`,
    tone: 'text-blue-700',
    accent: 'border border-blue-200 bg-blue-50',
  };
};

const UpcomingAssessments: React.FC<{
  upcoming: {
    id: string;
    name: string;
    dueDate: string;
    type: string;
  }[];
}> = ({ upcoming }) => {
  if (upcoming.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5" />
            Upcoming Check-ins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-sm text-muted-foreground bg-muted/20">
            Teachers will add upcoming assessments here so you can plan ahead together.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5" />
          Coming Up Next
        </CardTitle>
        <p className="text-sm text-muted-foreground">These are the next checkpoints to know about.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcoming.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3 text-sm"
          >
            <div className="min-w-0">
              <div className="font-medium truncate">{item.name}</div>
              <div className="text-muted-foreground text-xs flex items-center gap-1">
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                  {item.type || 'Assessment'}
                </Badge>
                <span>•</span>
                <span>{format(new Date(item.dueDate), 'EEE, d MMM')}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              Add to calendar
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const ParentFocusAreas: React.FC<{
  strengths: string[];
  focusAreas: string[];
}> = ({ strengths, focusAreas }) => (
  <div className="grid gap-4 lg:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-green-600" />
          Celebrating Wins
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {strengths.length === 0 ? (
          <div className="rounded-lg border border-dashed border-green-200 p-4 text-sm text-muted-foreground">
            Teachers will highlight strengths here once more assessments are completed.
          </div>
        ) : (
          strengths.map((strength, index) => (
            <div
              key={index}
              className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
            >
              {strength}
            </div>
          ))
        )}
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-orange-600" />
          Focus Together
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {focusAreas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-orange-200 p-4 text-sm text-muted-foreground">
            Teachers will note focus areas here when extra support is needed.
          </div>
        ) : (
          focusAreas.map((area, index) => (
            <div
              key={index}
              className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700"
            >
              {area}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  </div>
);

const ParentNotesSummary: React.FC<{
  notes: ReturnType<typeof useRecentTeacherNotes>['data'];
}> = ({ notes }) => {
  if (!notes || notes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Teacher Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-sm text-muted-foreground bg-muted/20">
            Teachers will share weekly highlights and discussion points here.
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestNotes = notes.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Teacher Feedback
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Most recent messages from the classroom team.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {latestNotes.map((note) => (
          <div key={note.id} className="rounded-lg border border-border/60 bg-background p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{note.week}</Badge>
                <span>{format(new Date(note.created_at), 'd MMM')}</span>
              </div>
              <Badge variant="secondary" className="capitalize">
                {note.category}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-foreground">{note.note}</p>
            {note.session_title && (
              <p className="mt-1 text-xs text-muted-foreground">Session: {note.session_title}</p>
            )}
          </div>
        ))}
        {notes.length > latestNotes.length && (
          <Button variant="link" className="px-0 text-sm">
            View all notes
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export const ParentReportView: React.FC<ParentReportViewProps> = ({
  studentId,
  classId,
  student,
  classInfo,
}) => {
  const { data: summary, isLoading: summaryLoading } = useStudentSummary(studentId, classId);
  const { data: notes, isLoading: notesLoading } = useRecentTeacherNotes(studentId, classId, 6);
  const { data: assessmentResults, isLoading: resultsLoading } = useStudentAssessmentResults(studentId, classId);

  const upcomingAssessments = useMemo(() => {
    if (!assessmentResults) return [];
    const now = new Date();
    return assessmentResults
      .filter((result) => {
        if (!result.task || !result.task.due_date) return false;
        const dueDate = new Date(result.task.due_date);
        return (isAfter(dueDate, now) || isToday(dueDate)) && (result.percent_score === null || result.percent_score === undefined);
      })
      .sort((a, b) => new Date(a.task.due_date!).getTime() - new Date(b.task.due_date!).getTime())
      .slice(0, 3)
      .map((result) => ({
        id: result.id,
        name: result.task.name,
        dueDate: result.task.due_date!,
        type: result.task.assessment_format || result.task.task_type || 'Assessment',
      }));
  }, [assessmentResults]);

  const trendDetails = summary ? getTrendDetails(summary.trend) : null;
  const feedbackSummary = getFeedbackSummary(notes);

  const isLoading = summaryLoading || notesLoading || resultsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border border-white shadow-sm">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                {student.first_name[0]}
                {student.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div>
                <h1 className="text-3xl font-bold leading-tight">
                  {student.first_name} {student.last_name}
                </h1>
                <p className="text-muted-foreground">
                  {classInfo.class_name} • {classInfo.subject} • Year {classInfo.year_level}
                </p>
              </div>
              {summary && (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-primary shadow-sm">
                    <Sun className="w-4 h-4" />
                    <span>Overall {summary.currentGrade}</span>
                    <span className="font-semibold">{summary.currentPercentage}%</span>
                  </div>
                  {trendDetails && (
                    <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${trendDetails.tone}`}>
                      {trendDetails.icon}
                      {trendDetails.label}
                    </div>
                  )}
                  {summary.lastAssessmentDate && (
                    <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/40 px-3 py-1 text-xs text-muted-foreground">
                      <CalendarDays className="w-4 h-4" />
                      Last checked {format(new Date(summary.lastAssessmentDate), 'd MMM')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className={`max-w-md rounded-2xl px-4 py-3 text-sm ${feedbackSummary.accent}`}>
            <p className={`leading-relaxed ${feedbackSummary.tone}`}>{feedbackSummary.summary}</p>
          </div>
        </div>
      </section>

      {summary && (
        <section>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Overall Grade</CardTitle>
              </CardHeader>
              <CardContent className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold">{summary.currentGrade}</span>
                <Badge variant="secondary" className="text-base px-3">
                  {summary.currentPercentage}%
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-lg font-semibold">
                  {trendDetails?.icon}
                  <span>{trendDetails?.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on recent assessment history.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Assessments Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{summary.totalAssessments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average score {summary.averageScore}%.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{summary.engagement}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      <ParentFocusAreas
        strengths={summary?.strengths ?? []}
        focusAreas={summary?.focusAreas ?? []}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ParentNotesSummary notes={notes} />
        <UpcomingAssessments upcoming={upcomingAssessments} />
      </div>

      <Accordion type="multiple" defaultValue={['progress']}>
        <AccordionItem value="progress">
          <AccordionTrigger className="text-lg font-semibold">Detailed Progress Insights</AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-6 lg:grid-cols-2">
              <AssessmentProgress studentId={studentId} classId={classId} variant="compact" />
              <AssessmentBreakdown studentId={studentId} classId={classId} variant="compact" />
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="curriculum">
          <AccordionTrigger className="text-lg font-semibold">Advanced Learning Insights</AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-6 lg:grid-cols-2">
              <CurriculumContentItems studentId={studentId} classId={classId} variant="compact" />
              <GeneralCapabilities studentId={studentId} classId={classId} variant="compact" />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};


