import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Target, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { useStudentAssessmentBreakdown } from '@/hooks/useStudentAssessmentResults';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AssessmentBreakdownProps {
  studentId: string;
  classId: string;
  viewType?: 'bar' | 'pie';
  variant?: 'default' | 'compact';
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
  'hsl(var(--destructive))',
  'hsl(var(--warning))',
  'hsl(var(--info))',
];

export const AssessmentBreakdown: React.FC<AssessmentBreakdownProps> = ({ 
  studentId, 
  classId, 
  viewType = 'bar',
  variant = 'default',
}) => {
  const { data: breakdownData, isLoading } = useStudentAssessmentBreakdown(studentId, classId);
  const [currentView, setCurrentView] = useState<'bar' | 'pie'>(viewType);
  const isCompact = variant === 'compact';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Assessment Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('flex items-center justify-center', isCompact ? 'h-64' : 'h-80')}>
            <div className="animate-pulse text-muted-foreground">Loading breakdown data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!breakdownData || breakdownData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Assessment Breakdown
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

  // Validate data before preparing charts
  const validData = breakdownData.filter(item => 
    item && 
    typeof item.averageScore === 'number' && 
    !isNaN(item.averageScore) && 
    item.averageScore >= 0
  );

  if (validData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Assessment Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('flex items-center justify-center', isCompact ? 'h-64' : 'h-80')}>
            <div className="text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No valid assessment data available</p>
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

  // Prepare data for charts with additional validation
  const chartData = validData
    .filter(item => !isNaN(item.averageScore) && item.averageScore >= 0)
    .map((item, index) => ({
      ...item,
      averageScore: sanitizeValue(item.averageScore),
      score: sanitizeValue(item.score),
      maxScore: sanitizeValue(item.maxScore),
      color: COLORS[index % COLORS.length],
    }));

  const pieData = validData
    .filter(item => !isNaN(item.averageScore) && item.averageScore >= 0)
    .map((item, index) => ({
      name: item.type,
      value: sanitizeValue(item.averageScore),
      count: item.count,
      color: COLORS[index % COLORS.length],
    }));

  // Final safety check - if no valid data after filtering, show empty state
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Assessment Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('flex items-center justify-center', isCompact ? 'h-64' : 'h-80')}>
            <div className="text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No valid chart data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Assessment Breakdown
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={currentView === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('bar')}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Bar
            </Button>
            <Button
              variant={currentView === 'pie' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('pie')}
            >
              <PieChartIcon className="w-4 h-4 mr-1" />
              Pie
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {validData.length} assessment types • 
          Average: {Math.round(validData.reduce((sum, item) => sum + item.averageScore, 0) / validData.length)}%
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(isCompact ? 'h-64' : 'h-80')}>
          <ResponsiveContainer width="100%" height="100%">
            {currentView === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="type" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: any) => [`${value}%`, 'Average Score']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Bar dataKey="averageScore" name="Average Score">
                  {chartData.map((item, index) => (
                    <Cell key={`cell-${index}`} fill={item.color} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Tooltip
                  formatter={(value: any, _name, payload: any) => {
                    const count = payload?.payload?.count ?? 0;
                    return [`${value}%`, `Average (${count} assessments)`];
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={isCompact ? 90 : 110}
                  innerRadius={isCompact ? 40 : 50}
                  paddingAngle={3}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`slice-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Best Performance:</span>
            <span className="ml-2 font-medium">
              {validData.reduce((best, current) => 
                current.averageScore > best.averageScore ? current : best
              ).type}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Assessments:</span>
            <span className="ml-2 font-medium">
              {validData.reduce((sum, item) => sum + item.count, 0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
