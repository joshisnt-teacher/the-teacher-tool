import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Edit, Trash2, BarChart3, BookOpen, Target, Brain } from 'lucide-react';
import { QuestionWithMetadata } from '@/hooks/useQuestions';
import { useQuestionResults } from '@/hooks/useQuestionResults';
import { ContentItemBadge } from './ContentItemBadge';

interface QuestionCardProps {
  question: QuestionWithMetadata;
  onViewAnalysis?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  onViewAnalysis, 
  onEdit, 
  onDelete 
}) => {
  const { data: results } = useQuestionResults(question.id);

  const averageScore = results && results.length > 0
    ? results.reduce((sum, result) => sum + (result.percent_score || 0), 0) / results.length
    : 0;

  const correctAnswers = results ? results.filter(result => 
    result.percent_score && result.percent_score >= 50
  ).length : 0;

  // Parse metadata fields directly from question
  const contentItem = question.content_item;
  const generalCapabilities = question.general_capabilities;
  const bloomsTaxonomy = question.blooms_taxonomy;

  const formatQuestionType = (type: string | null) => {
    const map: Record<string, string> = {
      multiple_choice: 'Multiple Choice',
      short_answer: 'Short Answer',
      extended_answer: 'Extended Answer',
    };
    return type ? (map[type] ?? type) : null;
  };

  const getBloomsColor = (level: string) => {
    const colors = {
      'Remember': 'bg-blue-50 text-blue-700 border-blue-200',
      'Understand': 'bg-green-50 text-green-700 border-green-200',
      'Apply': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Analyse': 'bg-orange-50 text-orange-700 border-orange-200',
      'Evaluate': 'bg-red-50 text-red-700 border-red-200',
      'Create': 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return colors[level as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
              {question.number}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base leading-tight">
                {question.question || `Question ${question.number}`}
              </CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {question.question_type && (
                  <Badge variant="secondary" className="text-xs">
                    {formatQuestionType(question.question_type)}
                  </Badge>
                )}
                {question.max_score && (
                  <Badge variant="outline" className="text-xs">
                    {question.max_score} marks
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onEdit}
              title="Edit question"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onDelete}
              title="Delete question"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Curriculum Mapping */}
        {(contentItem || bloomsTaxonomy || generalCapabilities) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BookOpen className="w-4 h-4" />
              Curriculum Mapping
            </div>
            
            {/* Content Item */}
            {contentItem && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Content Item:</span>
                <ContentItemBadge contentItemCode={contentItem} />
              </div>
            )}

            {/* General Capabilities */}
            {generalCapabilities && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">General Capabilities:</span>
                <Badge variant="outline" className="text-xs">
                  <Target className="w-3 h-3 mr-1" />
                  {Array.isArray(generalCapabilities) ? generalCapabilities.join(', ') : generalCapabilities}
                </Badge>
              </div>
            )}

            {/* Bloom's Taxonomy */}
            {bloomsTaxonomy && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Bloom's Level:</span>
                <Badge 
                  className={`text-xs ${getBloomsColor(bloomsTaxonomy)}`}
                  variant="outline"
                >
                  <Brain className="w-3 h-3 mr-1" />
                  {bloomsTaxonomy}
                </Badge>
              </div>
            )}
          </div>
        )}


        {/* Performance Statistics */}
        {results && results.length > 0 && (
          <>
            <Separator />
            <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">{averageScore.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Average</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">{correctAnswers}/{results.length}</div>
                <div className="text-xs text-muted-foreground">Correct</div>
              </div>
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onViewAnalysis}
                  className="h-auto flex-col gap-1 p-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-xs">Analysis</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};