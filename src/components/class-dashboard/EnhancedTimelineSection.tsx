import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';
import { useEnhancedTimelineData } from '@/hooks/useEnhancedTimelineData';
import { TimelineControlPanel, TimelineControls, AssessmentFilter } from './TimelineControlPanel';
import { Skeleton } from '@/components/ui/skeleton';

interface EnhancedTimelineSectionProps {
  classId: string;
  startDate: string;
  endDate: string;
}

export const EnhancedTimelineSection: React.FC<EnhancedTimelineSectionProps> = ({ classId, startDate, endDate }) => {
  const { data: timelineData, isLoading, error } = useEnhancedTimelineData(classId, startDate, endDate);
  
  const [controls, setControls] = useState<TimelineControls>({
    showAverage: true,
    showHighest: false,
    showLowest: false,
    showScatter: false,
    showTrendLine: false,
    showStudentLines: false,
    selectedStudents: [],
    assessmentFilter: 'All',
  });

  const handleControlChange = (key: keyof TimelineControls, value: any) => {
    setControls(prev => ({ ...prev, [key]: value }));
  };

  const assessmentTypes = useMemo<AssessmentFilter[]>(() => {
    if (!timelineData) return [];
    const unique = new Set<AssessmentFilter>();
    timelineData.forEach(point => {
      const type = (point.taskType ?? 'Other') as AssessmentFilter;
      if (type !== 'All') {
        unique.add(type);
      }
    });
    return Array.from(unique);
  }, [timelineData]);

  const filteredTimelineData = useMemo(() => {
    if (!timelineData) return [];
    if (controls.assessmentFilter === 'All') {
      return timelineData;
    }
    return timelineData.filter(point => point.taskType === controls.assessmentFilter);
  }, [timelineData, controls.assessmentFilter]);

  // Calculate trend line using linear regression
  const trendValues = useMemo(() => {
    if (!filteredTimelineData || filteredTimelineData.length < 2) return null;
    
    const points = filteredTimelineData.map((point, index) => ({ x: index, y: point.average }));
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return null;
    
    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    
    return filteredTimelineData.map((_, index) => slope * index + intercept);
  }, [filteredTimelineData]);

  // Color palette for students
  const studentColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#f43f5e', '#8b5cf6', '#22c55e', '#eab308'
  ];

  // Prepare scatter data for selected students
  const scatterData = useMemo(() => {
    if (!filteredTimelineData || !controls.showScatter) return [];
    
    const studentColorMap = new Map();
    let colorIndex = 0;
    
    return filteredTimelineData.flatMap((timePoint, timeIndex) => 
      timePoint.studentResults
        .filter(student => 
          controls.selectedStudents.length === 0 || 
          controls.selectedStudents.includes(student.studentId)
        )
        .map(student => {
          if (!studentColorMap.has(student.studentId)) {
            studentColorMap.set(student.studentId, studentColors[colorIndex % studentColors.length]);
            colorIndex++;
          }
          
          return {
            x: timeIndex,
            y: student.score,
            studentName: student.studentName,
            studentId: student.studentId,
            assessmentName: timePoint.assessmentName,
            dateLabel: timePoint.dateLabel,
            color: studentColorMap.get(student.studentId),
          };
        })
    );
  }, [filteredTimelineData, controls.showScatter, controls.selectedStudents]);

  // Get all unique students for the control panel
  const allStudents = useMemo(() => {
    if (!timelineData) return [];
    
    const studentMap = new Map();
    timelineData.forEach(timePoint => {
      timePoint.studentResults.forEach(student => {
        if (!studentMap.has(student.studentId)) {
          studentMap.set(student.studentId, {
            id: student.studentId,
            name: student.studentName,
          });
        }
      });
    });
    
    return Array.from(studentMap.values()).sort((a, b) => {
      const aLast = a.name.split(' ').pop() || a.name;
      const bLast = b.name.split(' ').pop() || b.name;
      return aLast.localeCompare(bLast);
    });
  }, [timelineData]);

  // Prepare combined chart data with student lines
  const chartData = useMemo(() => {
    if (!filteredTimelineData) return [];
    
    return filteredTimelineData.map((timePoint, timeIndex) => {
      const baseData = {
        ...timePoint,
        x: timeIndex,
        trendValue: trendValues ? trendValues[timeIndex] : null,
      };
      
      // Add student data for each selected student
      if (controls.showStudentLines && controls.selectedStudents.length > 0) {
        controls.selectedStudents.forEach(studentId => {
          const studentResult = timePoint.studentResults.find(s => s.studentId === studentId);
          const studentName = allStudents.find(s => s.id === studentId)?.name || 'Unknown Student';
          baseData[`student_${studentId}`] = studentResult ? studentResult.score : null;
          baseData[`student_${studentId}_name`] = studentName;
        });
      }
      
      return baseData;
    });
  }, [filteredTimelineData, controls.showStudentLines, controls.selectedStudents, allStudents, trendValues]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.assessmentName}</p>
          <p className="text-sm text-muted-foreground">{data.dateLabel}</p>
          {controls.showAverage && (
            <p className="text-sm">
              Class Average: <span className="font-medium text-primary">{data.average}%</span>
            </p>
          )}
          {controls.showHighest && (
            <p className="text-sm">
              Highest: <span className="font-medium text-green-600">{data.highest}%</span>
            </p>
          )}
          {controls.showLowest && (
            <p className="text-sm">
              Lowest: <span className="font-medium text-red-600">{data.lowest}%</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {data.totalStudents} students completed
          </p>
        </div>
      );
    }
    return null;
  };

  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.studentName}</p>
          <p className="text-sm">{data.assessmentName}</p>
          <p className="text-sm text-muted-foreground">{data.dateLabel}</p>
          <p className="text-sm">
            Score: <span className="font-medium text-primary">{data.y}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enhanced Timeline Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Interactive class performance trends with multiple series and student tracking
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Error loading timeline data</p>
          </div>
        ) : filteredTimelineData.length === 0 ? (
          <div className="text-center py-12">
            <LineChartIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {timelineData && timelineData.length > 0
                ? 'No assessments match the current filters'
                : 'No assessment data available yet'}
            </p>
            <p className="text-sm text-muted-foreground">
              {timelineData && timelineData.length > 0
                ? 'Try changing the assessment or student filters to see more results'
                : 'Assessment results will appear here once completed'}
            </p>
          </div>
        ) : (
          <>
            <TimelineControlPanel
              controls={controls}
              onControlChange={handleControlChange}
              students={allStudents}
              assessmentTypes={assessmentTypes}
            />
            
            <div className="h-96 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="dateLabel" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Grade %', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {controls.showAverage && (
                    <Line 
                      type="monotone" 
                      dataKey="average" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                      name="Class Average"
                    />
                  )}
                  
                  {controls.showHighest && (
                    <Line 
                      type="monotone" 
                      dataKey="highest" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      name="Highest"
                    />
                  )}
                  
                  {controls.showLowest && (
                    <Line 
                      type="monotone" 
                      dataKey="lowest" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                      name="Lowest"
                    />
                  )}
                  {controls.showTrendLine && trendValues && (
                    <Line 
                      type="monotone" 
                      dataKey="trendValue" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Trend"
                    />
                  )}
                  
                  {/* Student Lines */}
                  {controls.showStudentLines && controls.selectedStudents.map((studentId, index) => {
                    const studentName = allStudents.find(s => s.id === studentId)?.name || 'Unknown Student';
                    const color = studentColors[index % studentColors.length];
                    return (
                      <Line
                        key={studentId}
                        type="monotone"
                        dataKey={`student_${studentId}`}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ fill: color, strokeWidth: 2, r: 4 }}
                        connectNulls={false}
                        name={studentName}
                      />
                    );
                  })}
                </RechartsLineChart>
              </ResponsiveContainer>
              
              {controls.showScatter && scatterData.length > 0 && (
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={scatterData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        type="number"
                        dataKey="x"
                        domain={[0, Math.max(filteredTimelineData.length - 1, 0)]}
                        tick={false}
                        axisLine={false}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                      />
                      <Tooltip content={<ScatterTooltip />} />
                      {/* Group scatter points by student and render each with different color */}
                      {Array.from(new Set(scatterData.map(d => d.studentId))).map((studentId, index) => {
                        const studentData = scatterData.filter(d => d.studentId === studentId);
                        const color = studentData[0]?.color || studentColors[index % studentColors.length];
                        return (
                          <Scatter
                            key={studentId}
                            data={studentData}
                            dataKey="y"
                            fill={color}
                            fillOpacity={0.8}
                            name={studentData[0]?.studentName || 'Student'}
                          />
                        );
                      })}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};