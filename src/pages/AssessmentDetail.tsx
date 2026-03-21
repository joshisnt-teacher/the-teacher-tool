import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, BarChart3, Download, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuestionsTab } from '@/components/assessment/QuestionsTab';
import { AssessmentInsights } from '@/components/assessment/AssessmentInsights';
import { QuestionHeatmap } from '@/components/assessment/QuestionHeatmap';
import { useStudentResponses } from '@/hooks/useStudentResponses';

interface Task {
  id: string;
  name: string;
  task_type: string;
  due_date: string;
  weight_percent: number;
  max_score: number;
  class_id: string;
  assessment_format: string;
}

interface StudentResult {
  student_id: string;
  raw_score: number;
  percent_score: number;
  normalised_percent: number;
  feedback: string;
  first_name: string;
  last_name: string;
}

const AssessmentDetail = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const { toast } = useToast();
  
  const { data: assessment, isLoading: assessmentLoading } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', assessmentId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Task | null;
    },
    enabled: !!assessmentId,
  });

  const { data: results = [], isLoading: resultsLoading, error: resultsError } = useQuery({
    queryKey: ['assessment-results', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('results')
        .select(`
          student_id,
          raw_score,
          percent_score,
          normalised_percent,
          feedback,
          students (
            first_name,
            last_name
          )
        `)
        .eq('task_id', assessmentId);
      
      if (error) {
        console.error('Error fetching results:', error);
        throw error;
      }
      
      if (!data) return [];
      
      return data.map((result: any) => {
        // Calculate correct percentage from raw score and max score
        // Ensure assessment is loaded and has valid max_score
        const calculatedPercent = assessment && assessment.max_score && assessment.max_score > 0 
          ? (result.raw_score / assessment.max_score) * 100 
          : 0;
        
        return {
          student_id: result.student_id,
          raw_score: result.raw_score,
          percent_score: calculatedPercent, // Use calculated percentage instead of stored
          normalised_percent: result.normalised_percent,
          feedback: result.feedback,
          first_name: result.students?.first_name || 'Unknown',
          last_name: result.students?.last_name || 'Student',
        };
      }) as StudentResult[];
    },
    enabled: !!assessmentId && !!assessment && assessment.assessment_format !== 'confidence_check',
  });

  const { data: studentResponses = [], isLoading: responsesLoading } = useStudentResponses(
    assessment?.assessment_format === 'confidence_check' ? assessmentId : undefined
  );

  const isLoading = assessmentLoading || resultsLoading || responsesLoading;
  const hasError = resultsError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96 mt-6" />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Error loading assessment data</h1>
          <p className="text-muted-foreground mb-4">There was a problem loading the assessment results.</p>
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Assessment not found</h1>
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Diagnostic': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Formative': return 'bg-green-100 text-green-800 border-green-200';
      case 'Summative': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGradeBand = (percentage: number) => {
    if (percentage >= 80) return { band: 'E', color: 'bg-green-100 text-green-800' };
    if (percentage >= 65) return { band: 'P', color: 'bg-blue-100 text-blue-800' };
    if (percentage >= 50) return { band: 'D', color: 'bg-orange-100 text-orange-800' };
    return { band: 'X', color: 'bg-red-100 text-red-800' };
  };

  const isConfidenceCheck = assessment?.assessment_format === 'confidence_check';
  
  // For confidence checks, calculate metrics from confidence ratings
  const completedResponses = studentResponses.filter(r => 
    r.confidence_rating !== null && 
    r.confidence_rating !== undefined && 
    !isNaN(r.confidence_rating)
  );
  const averageConfidence = completedResponses.length > 0 
    ? completedResponses.reduce((sum, r) => sum + r.confidence_rating, 0) / completedResponses.length 
    : 0;

  // For traditional assessments, calculate from results
  const completedResults = results.filter(r => 
    r.percent_score !== null && 
    r.percent_score !== undefined && 
    !isNaN(r.percent_score)
  );
  const averageScore = completedResults.length > 0 
    ? completedResults.reduce((sum, r) => sum + r.percent_score, 0) / completedResults.length 
    : 0;

  // Calculate median score for median band
  const getMedianScore = () => {
    if (isConfidenceCheck) {
      if (completedResponses.length === 0) return 0;
      
      const confidenceRatings = completedResponses
        .map(r => r.confidence_rating)
        .filter(rating => !isNaN(rating))
        .sort((a, b) => a - b);
      
      if (confidenceRatings.length === 0) return 0;
      
      const middle = Math.floor(confidenceRatings.length / 2);
      
      if (confidenceRatings.length % 2 === 0) {
        return (confidenceRatings[middle - 1] + confidenceRatings[middle]) / 2;
      } else {
        return confidenceRatings[middle];
      }
    } else {
      if (completedResults.length === 0) return 0;
      
      const scores = completedResults
        .map(r => r.percent_score)
        .filter(score => !isNaN(score))
        .sort((a, b) => a - b);
      
      if (scores.length === 0) return 0;
      
      const middle = Math.floor(scores.length / 2);
      
      if (scores.length % 2 === 0) {
        return (scores[middle - 1] + scores[middle]) / 2;
      } else {
        return scores[middle];
      }
    }
  };

  const medianScore = getMedianScore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to={`/class/${assessment.class_id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Class
              </Button>
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{assessment.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Badge className={getTypeColor(assessment.task_type)}>
                  {assessment.task_type}
                </Badge>
                {assessment.due_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Due {format(new Date(assessment.due_date), 'MMM d, yyyy')}
                  </span>
                )}
                <span>{assessment.weight_percent}% weight</span>
                <span>Max: {assessment.max_score} points</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  const studentUrl = `${window.location.origin}/student-assessment/${assessmentId}`;
                  navigator.clipboard.writeText(studentUrl);
                  toast({
                    title: "Link copied!",
                    description: "Student assessment link has been copied to clipboard.",
                  });
                }}
              >
                <Share className="w-4 h-4 mr-2" />
                Share with Students
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                // Create CSV content
                const csvContent = [
                  ['Student', 'Raw Score', 'Percentage', 'Band'].join(','),
                  ...results.map(result => {
                    const hasValidScore = result.percent_score !== null && result.percent_score !== undefined && !isNaN(result.percent_score);
                    const gradeBand = hasValidScore ? getGradeBand(result.percent_score) : { band: '-', color: 'bg-gray-100 text-gray-600' };
                    return [
                      `"${result.first_name} ${result.last_name}"`,
                      result.raw_score || '',
                      hasValidScore ? `${result.percent_score.toFixed(1)}%` : '',
                      gradeBand.band
                    ].join(',');
                  })
                ].join('\n');
                
                // Download CSV
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${assessment.name}_results.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Results
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">
                    {isConfidenceCheck 
                      ? `${averageConfidence.toFixed(1)}/10`
                      : `${averageScore.toFixed(1)}%`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isConfidenceCheck ? 'Average Confidence' : 'Class Average'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                {isConfidenceCheck ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {Math.round(medianScore)}
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{medianScore.toFixed(1)}/10</p>
                      <p className="text-sm text-muted-foreground">Median Confidence</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getGradeBand(medianScore).color}`}>
                      {getGradeBand(medianScore).band}
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{getGradeBand(medianScore).band}</p>
                      <p className="text-sm text-muted-foreground">Median Band</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assessment Content with Tabs */}
        <Tabs defaultValue="results" className="space-y-6">
          <TabsList>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="heatmap">Question Heatmap</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="results">
            {/* Results Table */}
            <Card>
              <CardHeader>
                <CardTitle>Student {isConfidenceCheck ? 'Responses' : 'Results'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Student</th>
                        {isConfidenceCheck ? (
                          <th className="text-left p-3">Confidence Rating</th>
                        ) : (
                          <>
                            <th className="text-left p-3">Raw Score</th>
                            <th className="text-left p-3">Percentage</th>
                            <th className="text-left p-3">Band</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {isConfidenceCheck ? (
                        studentResponses.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="p-6 text-center text-muted-foreground">
                              No responses available for this assessment
                            </td>
                          </tr>
                        ) : (
                          studentResponses.map((response) => {
                            const hasValidRating = response.confidence_rating !== null && 
                                                  response.confidence_rating !== undefined && 
                                                  !isNaN(response.confidence_rating);
                            return (
                              <tr key={response.student_id} className="border-b hover:bg-muted/50">
                                <td className="p-3">
                                  {response.first_name && response.last_name 
                                    ? `${response.first_name} ${response.last_name}`
                                    : 'Unknown Student'
                                  }
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-semibold">
                                      {hasValidRating ? response.confidence_rating : '-'}
                                    </span>
                                    <span className="text-sm text-muted-foreground">/10</span>
                                    {hasValidRating && (
                                      <div className="flex-1 bg-secondary h-2 rounded-full overflow-hidden ml-2">
                                        <div 
                                          className="h-full bg-primary transition-all duration-300"
                                          style={{ width: `${Math.min(Math.max((response.confidence_rating / 10) * 100, 0), 100)}%` }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )
                      ) : (
                        results.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-muted-foreground">
                              No results available for this assessment
                            </td>
                          </tr>
                        ) : (
                          results.map((result) => {
                            const hasValidScore = result.percent_score !== null && result.percent_score !== undefined && !isNaN(result.percent_score);
                            const gradeBand = hasValidScore ? getGradeBand(result.percent_score) : { band: '-', color: 'bg-gray-100 text-gray-600' };
                            return (
                              <tr key={result.student_id} className="border-b hover:bg-muted/50">
                                <td className="p-3">
                                  {result.first_name && result.last_name 
                                    ? `${result.first_name} ${result.last_name}`
                                    : 'Unknown Student'
                                  }
                                </td>
                                <td className="p-3">
                                  {result.raw_score !== null && result.raw_score !== undefined 
                                    ? `${result.raw_score}/${assessment.max_score || '?'}` 
                                    : '-'
                                  }
                                </td>
                                <td className="p-3">
                                  {hasValidScore ? `${result.percent_score.toFixed(1)}%` : '-'}
                                </td>
                                <td className="p-3">
                                  <Badge className={gradeBand.color}>
                                    {gradeBand.band}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heatmap">
            <QuestionHeatmap taskId={assessmentId!} />
          </TabsContent>

          <TabsContent value="questions">
            <QuestionsTab taskId={assessmentId!} classId={assessment.class_id} />
          </TabsContent>

          <TabsContent value="insights">
            <AssessmentInsights taskId={assessmentId!} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AssessmentDetail;