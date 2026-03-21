import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Tag, Brain, Target, TrendingUp, Award } from 'lucide-react';
import { useQuestionResults } from '@/hooks/useQuestionResults';
import { Question, QuestionWithMetadata } from '@/hooks/useQuestions';

interface QuestionAnalysisViewProps {
  question: QuestionWithMetadata;
}

export const QuestionAnalysisView: React.FC<QuestionAnalysisViewProps> = ({ question }) => {
  const { data: questionResults = [] } = useQuestionResults(question.id);

  // Calculate statistics
  const totalAttempts = questionResults.length;
  const correctAnswers = questionResults.filter(result => 
    result.percent_score && result.percent_score >= 50
  ).length;
  const averageScore = totalAttempts > 0 
    ? questionResults.reduce((sum, result) => sum + (result.percent_score || 0), 0) / totalAttempts
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Question {question.number} Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Question Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-900">{averageScore.toFixed(1)}%</div>
            <div className="text-sm text-blue-600">Average Score</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Award className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-900">{correctAnswers}</div>
            <div className="text-sm text-green-600">Correct Answers</div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Target className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-purple-900">{totalAttempts}</div>
            <div className="text-sm text-purple-600">Total Attempts</div>
          </div>
        </div>

        <Separator />

        {/* Question Details */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Question Details</h4>
            <div className="flex flex-wrap gap-2">
              {question.question_type && (
                <Badge variant="outline">{question.question_type}</Badge>
              )}
              {question.max_score && (
                <Badge variant="secondary">{question.max_score} marks</Badge>
              )}
            </div>
          </div>

          {question.question && (
            <div>
              <h4 className="text-sm font-medium mb-2">Question Text</h4>
              <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                {question.question}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Curriculum and Skills */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Curriculum Mapping
          </h4>

          {question.content_item && (
            <div>
              <span className="text-xs text-muted-foreground">Content Descriptor:</span>
              <Badge variant="outline" className="ml-2">{question.content_item}</Badge>
            </div>
          )}

          {question.blooms_taxonomy && (
            <div>
              <span className="text-xs text-muted-foreground">Bloom's Taxonomy:</span>
              <Badge variant="secondary" className="ml-2">
                <Brain className="w-3 h-3 mr-1" />
                {question.blooms_taxonomy}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};