import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Brain, BookOpen } from 'lucide-react';
import { useTaskQuestionResults } from '@/hooks/useTaskQuestionResults';
import { useQuestions } from '@/hooks/useQuestions';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

interface AssessmentInsightsProps {
  taskId: string;
}

export const AssessmentInsights: React.FC<AssessmentInsightsProps> = ({ taskId }) => {
  const { data: questionResults = [], isLoading: resultsLoading } = useTaskQuestionResults(taskId);
  const { data: questions = [], isLoading: questionsLoading } = useQuestions(taskId);

  if (resultsLoading || questionsLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (questionResults.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No question results available for analysis.
      </div>
    );
  }

  // Find hardest and easiest questions
  const hardestQuestion = questionResults.reduce((hardest, current) => 
    current.percentage_wrong > hardest.percentage_wrong ? current : hardest
  );

  const easiestQuestion = questionResults.reduce((easiest, current) => 
    current.percentage_correct > easiest.percentage_correct ? current : easiest
  );

  // Bloom's taxonomy analysis
  const bloomsLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
  const bloomsData = bloomsLevels.map(level => {
    const questionsWithLevel = questionResults.filter(q => q.blooms_taxonomy === level);
    const count = questionsWithLevel.length;
    const averageScore = count > 0 
      ? questionsWithLevel.reduce((sum, q) => sum + q.average_score, 0) / count 
      : 0;
    
    return {
      level,
      count,
      averageScore,
      percentage: (count / questionResults.length) * 100
    };
  });

  // Content items analysis
  const contentItems = questionResults
    .filter(q => q.content_item)
    .map(q => q.content_item!)
    .filter((item, index, array) => array.indexOf(item) === index); // Remove duplicates

  const contentItemCounts = contentItems.map(item => {
    const questionsWithItem = questionResults.filter(q => q.content_item === item);
    return {
      item,
      count: questionsWithItem.length,
      averageScore: questionsWithItem.reduce((sum, q) => sum + q.average_score, 0) / questionsWithItem.length
    };
  }).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Hardest and Easiest Questions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hardest Question */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Hardest Question
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Q{hardestQuestion.question_number}</Badge>
                <span className="text-sm text-muted-foreground">
                  {hardestQuestion.percentage_wrong.toFixed(1)}% got it wrong
                </span>
              </div>
              <div className="text-sm">
                {hardestQuestion.question_text || `Question ${hardestQuestion.question_number}`}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Average Score</span>
                  <span>{hardestQuestion.average_score.toFixed(1)}%</span>
                </div>
                <Progress value={hardestQuestion.average_score} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Easiest Question */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Easiest Question
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Q{easiestQuestion.question_number}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {easiestQuestion.percentage_correct.toFixed(1)}% got it right
                </span>
              </div>
              <div className="text-sm">
                {easiestQuestion.question_text || `Question ${easiestQuestion.question_number}`}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Average Score</span>
                  <span>{easiestQuestion.average_score.toFixed(1)}%</span>
                </div>
                <Progress value={easiestQuestion.average_score} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bloom's Taxonomy Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Bloom's Taxonomy Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={bloomsData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="level" />
                <PolarRadiusAxis 
                  domain={[0, Math.max(...bloomsData.map(d => d.count))]}
                  tickCount={6}
                />
                <Radar
                  name="Questions"
                  dataKey="count"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {bloomsData.map((item) => (
              <div key={item.level} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  item.level === 'Remember' ? 'bg-blue-500' :
                  item.level === 'Understand' ? 'bg-green-500' :
                  item.level === 'Apply' ? 'bg-yellow-500' :
                  item.level === 'Analyze' ? 'bg-orange-500' :
                  item.level === 'Evaluate' ? 'bg-red-500' :
                  'bg-purple-500'
                }`} />
                <span className="text-muted-foreground">
                  {item.level}: {item.count} ({item.percentage.toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Links Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Content Links Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contentItemCounts.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                {contentItemCounts.length} unique content items linked to questions
              </div>
              <div className="space-y-3">
                {contentItemCounts.slice(0, 10).map((item, index) => (
                  <div key={item.item} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.item}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {item.count} question{item.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg: {item.averageScore.toFixed(1)}%
                      </div>
                    </div>
                    <Progress value={item.averageScore} className="h-2" />
                  </div>
                ))}
                {contentItemCounts.length > 10 && (
                  <div className="text-xs text-muted-foreground text-center">
                    ... and {contentItemCounts.length - 10} more content items
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No content items linked to questions
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
