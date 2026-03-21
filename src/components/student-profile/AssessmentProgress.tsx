import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Calendar, Target, BarChart3 } from 'lucide-react';
import { useStudentAssessmentProgress } from '@/hooks/useStudentAssessmentProgress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { cn } from '@/lib/utils';

interface AssessmentProgressProps {
  studentId: string;
  classId: string;
  variant?: 'default' | 'compact';
}

const TIME_PERIODS = [
  { value: '3', label: 'Last 3 Assessments' },
  { value: '5', label: 'Last 5 Assessments' },
  { value: '10', label: 'Last 10 Assessments' },
  { value: 'all', label: 'All Assessments' },
];

export const AssessmentProgress: React.FC<AssessmentProgressProps> = ({ studentId, classId, variant = 'default' }) => {
  const [timePeriod, setTimePeriod] = useState('5');
  const [viewType, setViewType] = useState<'line' | 'bar'>('line');
  const isCompact = variant === 'compact';
  
  const limit = timePeriod === 'all' ? undefined : parseInt(timePeriod);
  const { data: progressData, isLoading, error } = useStudentAssessmentProgress(studentId, classId, limit);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Assessment Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('flex items-center justify-center', isCompact ? 'h-64' : 'h-80')}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Assessment Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('flex items-center justify-center', isCompact ? 'h-64' : 'h-80')}>
            <div className="text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Error loading assessment data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progressData || progressData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Assessment Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('flex items-center justify-center', isCompact ? 'h-64' : 'h-80')}>
            <div className="text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No assessment data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sanitize data to ensure all values are valid numbers
  const sanitizeValue = (value: any): number => {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return 0;
    }
    return Math.max(0, Math.min(100, value)); // Clamp between 0 and 100
  };

  const sanitizedData = progressData.map(item => ({
    ...item,
    percentScore: sanitizeValue(item.percentScore),
  }));

  const sortedData = [...sanitizedData].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB;
  });

  // Calculate trend
  const firstScore = sortedData[0]?.percentScore || 0;
  const lastScore = sortedData[sortedData.length - 1]?.percentScore || 0;
  const trend = lastScore > firstScore ? 'improving' : lastScore < firstScore ? 'declining' : 'steady';

  // Prepare data for charts
  const chartData = sortedData.map((item, index) => ({
    name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
    fullName: item.name,
    score: item.percentScore,
    rawScore: item.score,
    maxScore: item.maxScore,
    assessmentType: item.assessmentType,
    taskType: item.taskType,
    date: new Date(item.date).toLocaleDateString(),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Assessment Progress
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className={cn('w-48', isCompact && 'w-40')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button
                variant={viewType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('line')}
              >
                <TrendingUp className="w-4 h-4" />
              </Button>
              <Button
                variant={viewType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('bar')}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {sortedData.length} assessments • 
          <span className={`ml-1 ${
            trend === 'improving' ? 'text-green-600' : 
            trend === 'declining' ? 'text-red-600' : 
            'text-yellow-600'
          }`}>
            {trend === 'improving' ? '↗ Improving' : 
             trend === 'declining' ? '↘ Declining' : 
             '→ Steady'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(isCompact ? 'h-64' : 'h-80')}>
          <ResponsiveContainer width="100%" height="100%">
            {viewType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: any, name: string, props: any) => [
                    `${value}%`, 
                    'Score'
                  ]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return `${data.fullName} (${data.date})`;
                    }
                    return label;
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: any, name: string, props: any) => [
                    `${value}%`, 
                    'Score'
                  ]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return `${data.fullName} (${data.date})`;
                    }
                    return label;
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar 
                  dataKey="score" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Assessment List */}
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Recent Assessments:</h4>
          <div className={cn('space-y-1 overflow-y-auto', isCompact ? 'max-h-24' : 'max-h-32')}>
            {sortedData
              .slice(-1 * (isCompact ? 3 : 5))
              .reverse()
              .map((item, index) => {
                const formattedDate = new Date(item.date).toLocaleDateString();
                return (
              <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.fullName}</div>
                  <div className="text-muted-foreground">{item.assessmentType} • {formattedDate}</div>
                </div>
                <div className="ml-2 text-right">
                  <div className="font-medium">{item.score}%</div>
                  <div className="text-muted-foreground">{item.rawScore}/{item.maxScore}</div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
