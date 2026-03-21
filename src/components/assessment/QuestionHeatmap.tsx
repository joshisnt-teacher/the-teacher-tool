import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, ArrowUp, ArrowDown, Users, BarChart3 } from 'lucide-react';
import { useQuestionHeatmapData } from '@/hooks/useQuestionHeatmapData';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface QuestionHeatmapProps {
  taskId: string;
}

type SortOption = 'student-total-asc' | 'student-total-desc' | 'question-difficulty-asc' | 'question-difficulty-desc' | 'default';

export const QuestionHeatmap: React.FC<QuestionHeatmapProps> = ({ taskId }) => {
  const { data: heatmapData, isLoading, error } = useQuestionHeatmapData(taskId);
  const [sortBy, setSortBy] = useState<SortOption>('default');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Question Performance Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <div className="grid gap-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !heatmapData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Question Performance Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No question-level data available</p>
            <p className="text-sm text-muted-foreground">Complete question-level scoring to see the heatmap</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort data based on current sort option
  const getSortedData = () => {
    let sortedStudents = [...heatmapData.students];
    let sortedQuestions = [...heatmapData.questions];

    switch (sortBy) {
      case 'student-total-asc':
        sortedStudents.sort((a, b) => a.totalPercent - b.totalPercent);
        break;
      case 'student-total-desc':
        sortedStudents.sort((a, b) => b.totalPercent - a.totalPercent);
        break;
      case 'question-difficulty-asc':
        sortedQuestions.sort((a, b) => a.averageScore - b.averageScore);
        break;
      case 'question-difficulty-desc':
        sortedQuestions.sort((a, b) => b.averageScore - a.averageScore);
        break;
      default:
        // Keep original order
        break;
    }

    // Rebuild matrix based on sorted order
    const matrix = sortedStudents.map(student => {
      return sortedQuestions.map(question => {
        return heatmapData.matrix
          .find(row => row[0]?.studentId === student.id)
          ?.find(cell => cell.questionId === question.id) || {
          studentId: student.id,
          studentName: student.name,
          questionId: question.id,
          questionNumber: question.number,
          questionText: question.text,
          maxScore: question.maxScore,
          rawScore: null,
          percentScore: null,
          colorValue: 0,
        };
      });
    });

    return { students: sortedStudents, questions: sortedQuestions, matrix };
  };

  const { students, questions, matrix } = getSortedData();

  // Updated color scheme: Green=high, Yellow/Orange=medium, Red=low/no response
  const getScoreColor = (percentScore: number | null) => {
    if (percentScore === null || percentScore === undefined) return 'bg-red-500'; // No response = incorrect
    if (percentScore >= 80) return 'bg-green-500'; // High performance
    if (percentScore >= 50) return 'bg-yellow-500'; // Medium performance
    return 'bg-red-500'; // Low performance
  };

  const getDifficultyBadge = (difficulty: string, averageScore: number) => {
    const baseClasses = "text-xs px-2 py-1 rounded";
    switch (difficulty) {
      case 'Easy':
        return <div className={`${baseClasses} bg-green-100 text-green-800`}>Easy ({averageScore}%)</div>;
      case 'Hard':
        return <div className={`${baseClasses} bg-red-100 text-red-800`}>Hard ({averageScore}%)</div>;
      default:
        return <div className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Medium ({averageScore}%)</div>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Question Performance Heatmap
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Student performance patterns across questions. Rows = Students, Columns = Questions.
        </p>
      </CardHeader>
      <CardContent>
        {/* Sort Controls */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={sortBy === 'student-total-desc' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy(sortBy === 'student-total-desc' ? 'default' : 'student-total-desc')}
          >
            <ArrowDown className="w-4 h-4 mr-1" />
            Sort by Total (High)
          </Button>
          <Button
            variant={sortBy === 'student-total-asc' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy(sortBy === 'student-total-asc' ? 'default' : 'student-total-asc')}
          >
            <ArrowUp className="w-4 h-4 mr-1" />
            Sort by Total (Low)
          </Button>
          <Button
            variant={sortBy === 'question-difficulty-desc' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy(sortBy === 'question-difficulty-desc' ? 'default' : 'question-difficulty-desc')}
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            Easy Questions First
          </Button>
          <Button
            variant={sortBy === 'question-difficulty-asc' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy(sortBy === 'question-difficulty-asc' ? 'default' : 'question-difficulty-asc')}
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            Hard Questions First
          </Button>
        </div>

        {/* Heatmap */}
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Question Headers */}
            <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: `150px repeat(${questions.length}, 50px)` }}>
              <div className="text-sm font-medium text-muted-foreground p-2 flex items-center">
                Student (Total %)
              </div>
              {questions.map((question) => (
                <div key={question.id} className="text-center p-1">
                  <div className="text-xs font-medium mb-1">Q{question.number}</div>
                  {getDifficultyBadge(question.difficulty, question.averageScore)}
                </div>
              ))}
            </div>

            {/* Heatmap Grid */}
            <div className="space-y-1">
              {matrix.map((studentRow, studentIndex) => (
                <div key={students[studentIndex].id} className="grid gap-1" style={{ gridTemplateColumns: `150px repeat(${questions.length}, 50px)` }}>
                  {/* Student Name and Total Percentage */}
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                    <span className="font-medium truncate text-xs">{students[studentIndex].name}</span>
                    <Badge variant="secondary" className="text-xs">{students[studentIndex].totalPercent}%</Badge>
                  </div>
                  
                  {/* Question Performance Cells - Color Only */}
                  {studentRow.map((cell) => (
                    <Tooltip key={`${cell.studentId}-${cell.questionId}`}>
                      <TooltipTrigger asChild>
                        <div 
                          className={`
                            h-8 w-full rounded cursor-pointer transition-all hover:scale-105 hover:shadow-md
                            ${getScoreColor(cell.percentScore)}
                          `}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-medium">{cell.studentName}</p>
                          <p className="text-sm">Question {cell.questionNumber}</p>
                          {cell.questionText && (
                            <p className="text-xs text-muted-foreground max-w-xs">
                              {cell.questionText.length > 50 
                                ? `${cell.questionText.substring(0, 50)}...` 
                                : cell.questionText
                              }
                            </p>
                          )}
                          {cell.rawScore !== null && cell.maxScore !== null ? (
                            <p className="text-sm">
                              Score: {cell.rawScore}/{cell.maxScore} ({Math.round(cell.percentScore || 0)}%)
                            </p>
                          ) : (
                            <p className="text-sm">No response</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-muted/30 rounded">
          <h4 className="text-sm font-medium mb-3">Performance Legend</h4>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-xs">High (80%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-xs">Medium (50-79%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-xs">Low/No Response (0-49%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
