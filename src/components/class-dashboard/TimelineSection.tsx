import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTimelineData } from '@/hooks/useTimelineData';
import { Skeleton } from '@/components/ui/skeleton';

interface TimelineSectionProps {
  classId: string;
  startDate: string;
  endDate: string;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({ classId, startDate, endDate }) => {
  const { data: timelineData, isLoading, error } = useTimelineData(classId, startDate, endDate);
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.assessmentName}</p>
          <p className="text-sm text-muted-foreground">{data.dateLabel}</p>
          <p className="text-sm">
            Class Average: <span className="font-medium text-primary">{data.average}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline of Study Period</CardTitle>
        <p className="text-sm text-muted-foreground">
          Class performance trend across assessments
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-80 space-y-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Error loading timeline data</p>
          </div>
        ) : !timelineData || timelineData.length === 0 ? (
          <div className="text-center py-12">
            <LineChart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No assessment data available yet</p>
            <p className="text-sm text-muted-foreground">Assessment results will appear here once completed</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
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
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};