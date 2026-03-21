import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Star, AlertCircle, Target, Users } from 'lucide-react';
import { useStudentSummary } from '@/hooks/useStudentSummary';

interface OverallSummaryProps {
  studentId: string;
  classId: string;
}

export const OverallSummary: React.FC<OverallSummaryProps> = ({ studentId, classId }) => {
  const { data: summary, isLoading } = useStudentSummary(studentId, classId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Overall Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Overall Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    switch (summary.trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getTrendColor = () => {
    switch (summary.trend) {
      case 'improving':
        return 'text-green-600';
      case 'declining':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Overall Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Grade and Progress */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-bold">{summary.currentGrade}</span>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {summary.currentPercentage}%
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {summary.trend.charAt(0).toUpperCase() + summary.trend.slice(1)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              {summary.totalAssessments} assessments
            </div>
            <div className="text-xs text-muted-foreground">
              Avg: {summary.averageScore}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{summary.currentPercentage}%</span>
          </div>
          <Progress value={summary.currentPercentage} className="h-2" />
        </div>

        {/* Strengths and Focus Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Strengths</span>
            </div>
            <div className="space-y-1">
              {summary.strengths.length > 0 ? (
                summary.strengths.map((strength, index) => (
                  <div key={index} className="text-sm text-green-700 bg-green-50 px-2 py-1 rounded">
                    {strength}
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No specific strengths identified yet</div>
              )}
            </div>
          </div>

          {/* Focus Areas */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">Focus Areas</span>
            </div>
            <div className="space-y-1">
              {summary.focusAreas.length > 0 ? (
                summary.focusAreas.map((area, index) => (
                  <div key={index} className="text-sm text-orange-700 bg-orange-50 px-2 py-1 rounded">
                    {area}
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No specific focus areas identified</div>
              )}
            </div>
          </div>
        </div>

        {/* Engagement */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Engagement</span>
          </div>
          <div className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded">
            {summary.engagement}
          </div>
        </div>

        {/* Last Assessment Date */}
        {summary.lastAssessmentDate && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Last assessment: {new Date(summary.lastAssessmentDate).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
