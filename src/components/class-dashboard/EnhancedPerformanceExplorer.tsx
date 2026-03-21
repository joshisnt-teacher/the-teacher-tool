import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, ArrowUpDown, Users, HelpCircle } from 'lucide-react';
import { useEnhancedTimelineData } from '@/hooks/useEnhancedTimelineData';
import { useQuestionHeatmapData } from '@/hooks/useQuestionHeatmapData';
import { useQuestionDifficulty } from '@/hooks/useComprehensiveAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterState } from './KPIBar';

interface PerformanceExplorerProps {
  classId: string;
  startDate: string;
  endDate: string;
  filters: FilterState;
}

interface TimelineControls {
  showAverage: boolean;
  showMinMax: boolean;
  showScatter: boolean;
  showTrendLine: boolean;
  showBandArea: boolean;
  selectedStudents: string[];
}

export const EnhancedPerformanceExplorer: React.FC<PerformanceExplorerProps> = ({
  classId,
  startDate,
  endDate,
  filters
}) => {
  const [selectedAssessment, setSelectedAssessment] = useState<string>('');
  const [heatmapSort, setHeatmapSort] = useState<'student' | 'difficulty'>('student');
  const [timelineControls, setTimelineControls] = useState<TimelineControls>({
    showAverage: true,
    showMinMax: true,
    showScatter: false,
    showTrendLine: false,
    showBandArea: false,
    selectedStudents: []
  });

  const { data: timelineData = [], isLoading: timelineLoading } = useEnhancedTimelineData(
    classId, 
    startDate, 
    endDate
  );
  
  const { data: heatmapData, isLoading: heatmapLoading } = useQuestionHeatmapData(selectedAssessment);
  const { data: questionDifficulty = [], isLoading: difficultyLoading } = useQuestionDifficulty(classId);

  // Set the first assessment as default when data loads
  React.useEffect(() => {
    if (timelineData.length > 0 && !selectedAssessment) {
      setSelectedAssessment(timelineData[0].taskId);
    }
  }, [timelineData, selectedAssessment]);

  // Calculate trend line data
  const trendLineData = useMemo(() => {
    if (!timelineControls.showTrendLine || timelineData.length < 2) return [];
    
    // Simple linear regression
    const n = timelineData.length;
    const sumX = timelineData.reduce((sum, _, index) => sum + index, 0);
    const sumY = timelineData.reduce((sum, point) => sum + point.average, 0);
    const sumXY = timelineData.reduce((sum, point, index) => sum + index * point.average, 0);
    const sumXX = timelineData.reduce((sum, _, index) => sum + index * index, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return timelineData.map((point, index) => ({
      ...point,
      trendValue: slope * index + intercept
    }));
  }, [timelineData, timelineControls.showTrendLine]);

  // Generate scatter data for selected students
  const scatterData = useMemo(() => {
    if (!timelineControls.showScatter || timelineControls.selectedStudents.length === 0) return [];
    
    return timelineData.flatMap((point, assessmentIndex) => 
      point.studentResults
        .filter(student => timelineControls.selectedStudents.includes(student.studentId))
        .map(student => ({
          x: assessmentIndex,
          y: student.score,
          studentName: student.studentName,
          assessmentName: point.assessmentName,
          dateLabel: point.dateLabel
        }))
    );
  }, [timelineData, timelineControls.selectedStudents, timelineControls.showScatter]);

  // Get unique students for multi-select
  const allStudents = useMemo(() => {
    const studentMap = new Map();
    timelineData.forEach(point => {
      point.studentResults.forEach(student => {
        if (!studentMap.has(student.studentId)) {
          studentMap.set(student.studentId, student.studentName);
        }
      });
    });
    return Array.from(studentMap.entries()).map(([id, name]) => ({ id, name }));
  }, [timelineData]);

  const handleTimelineControlChange = (key: keyof TimelineControls, value: any) => {
    setTimelineControls(prev => ({ ...prev, [key]: value }));
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'very_hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 65) return 'bg-blue-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Timeline Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Timeline
          </CardTitle>
          
          {/* Timeline Controls */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="average"
                checked={timelineControls.showAverage}
                onCheckedChange={(checked) => handleTimelineControlChange('showAverage', checked)}
              />
              <label htmlFor="average" className="text-sm">Class Average</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="minmax"
                checked={timelineControls.showMinMax}
                onCheckedChange={(checked) => handleTimelineControlChange('showMinMax', checked)}
              />
              <label htmlFor="minmax" className="text-sm">Min/Max Range</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="trend"
                checked={timelineControls.showTrendLine}
                onCheckedChange={(checked) => handleTimelineControlChange('showTrendLine', checked)}
              />
              <label htmlFor="trend" className="text-sm">Trend Line</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="scatter"
                checked={timelineControls.showScatter}
                onCheckedChange={(checked) => handleTimelineControlChange('showScatter', checked)}
              />
              <label htmlFor="scatter" className="text-sm">Individual Students</label>
            </div>

            {timelineControls.showScatter && (
              <Select 
                value={timelineControls.selectedStudents[0] || ""} 
                onValueChange={(studentId) => 
                  handleTimelineControlChange('selectedStudents', studentId ? [studentId] : [])
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select students..." />
                </SelectTrigger>
                <SelectContent>
                  {allStudents.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {timelineLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : timelineData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No timeline data available</p>
            </div>
          ) : (
            <div className="h-80 relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="dateLabel" 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, name]}
                    labelFormatter={(label) => `Assessment: ${label}`}
                  />
                  
                  {timelineControls.showAverage && (
                    <Line 
                      type="monotone" 
                      dataKey="average" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                      name="Class Average"
                    />
                  )}
                  
                  {timelineControls.showMinMax && (
                    <>
                      <Line 
                        type="monotone" 
                        dataKey="highest" 
                        stroke="hsl(var(--success))" 
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Highest Score"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="lowest" 
                        stroke="hsl(var(--destructive))" 
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Lowest Score"
                      />
                    </>
                  )}
                  
                  {timelineControls.showTrendLine && trendLineData.length > 0 && (
                    <Line 
                      type="monotone" 
                      dataKey="trendValue" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={2}
                      strokeDasharray="10 5"
                      dot={false}
                      name="Trend Line"
                      data={trendLineData}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
              
              {/* Overlay scatter plot for individual students */}
              {timelineControls.showScatter && scatterData.length > 0 && (
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={scatterData}>
                      <XAxis dataKey="x" domain={[0, timelineData.length - 1]} hide />
                      <YAxis domain={[0, 100]} hide />
                      <Scatter 
                        dataKey="y" 
                        fill="hsl(var(--secondary))" 
                        fillOpacity={0.7}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Score']}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            const data = payload[0].payload;
                            return `${data.studentName} - ${data.assessmentName}`;
                          }
                          return '';
                        }}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessment Heatmap Panel */}
      <Tabs defaultValue="heatmap" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="heatmap">Question Heatmap</TabsTrigger>
          <TabsTrigger value="difficulty">Question Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5" />
                Question Performance Heatmap
              </CardTitle>
              
              <div className="flex items-center gap-4">
                <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Select assessment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {timelineData.map(assessment => (
                      <SelectItem key={assessment.taskId} value={assessment.taskId}>
                        {assessment.assessmentName} ({assessment.dateLabel})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={heatmapSort} onValueChange={(value: 'student' | 'difficulty') => setHeatmapSort(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Sort by Student</SelectItem>
                    <SelectItem value="difficulty">Sort by Difficulty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent>
              {heatmapLoading ? (
                <Skeleton className="h-96 w-full" />
              ) : !heatmapData || !heatmapData.students || heatmapData.students.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Select an assessment to view the heatmap</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Question Headers */}
                  <div className="grid gap-1" style={{ 
                    gridTemplateColumns: `200px repeat(${heatmapData.questions.length}, minmax(40px, 1fr))` 
                  }}>
                    <div className="p-2 font-medium text-sm">Student</div>
                    {heatmapData.questions.map((question) => (
                      <div key={question.id} className="p-2 text-center">
                        <div className="text-xs font-medium">Q{question.number}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(question.averageScore)}%
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Heatmap Grid */}
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {heatmapData.students.map((student) => (
                      <div 
                        key={student.id} 
                        className="grid gap-1" 
                        style={{ 
                          gridTemplateColumns: `200px repeat(${heatmapData.questions.length}, minmax(40px, 1fr))` 
                        }}
                      >
                        <div className="p-2 text-sm font-medium truncate">
                          {student.name}
                        </div>
                        {heatmapData.matrix
                          .find(row => row.find(cell => cell.studentId === student.id))
                          ?.map((cell) => (
                            <div 
                              key={`${cell.studentId}-${cell.questionId}`}
                            className={`p-2 text-center text-xs font-bold text-white rounded ${getScoreColor(cell.percentScore || 0)}`}
                            title={`${cell.percentScore || 0}%`}
                          >
                            {Math.round(cell.percentScore || 0)}
                            </div>
                          )) || []}
                      </div>
                    ))}
                  </div>
                  
                  {/* Color Legend */}
                  <div className="flex items-center gap-4 pt-4 border-t">
                    <span className="text-sm font-medium">Score Range:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-xs">0-49%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div>
                      <span className="text-xs">50-64%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-xs">65-79%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-xs">80-100%</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="difficulty">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Question Difficulty Analysis
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              {difficultyLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : questionDifficulty.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No question difficulty data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-4">
                    Top 10 most challenging questions across all assessments
                  </div>
                  
                  {questionDifficulty.slice(0, 10).map((question, index) => (
                    <div key={question.questionId} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{question.questionTitle}</div>
                          <div className="text-sm text-muted-foreground">{question.taskName}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={getDifficultyColor(question.difficultyLevel)}>
                          {question.difficultyLevel.replace('_', ' ')}
                        </Badge>
                        <div className="text-right">
                          <div className="font-bold">{question.averageScore}%</div>
                          <div className="text-xs text-muted-foreground">Class Average</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};