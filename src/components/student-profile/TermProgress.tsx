import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useStudentTermProgress } from '@/hooks/useStudentAssessmentResults';

interface TermProgressProps {
  studentId: string;
  classId: string;
}

export const TermProgress: React.FC<TermProgressProps> = ({ studentId, classId }) => {
  const { data: progressData, isLoading } = useStudentTermProgress(studentId, classId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Term Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading progress data...</div>
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
            Term Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No progress data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Validate data before rendering chart
  const validData = progressData.filter(item => 
    item && 
    typeof item.score === 'number' && 
    !isNaN(item.score) && 
    item.score >= 0
  );

  if (validData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Term Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No valid progress data available</p>
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

  const sanitizedData = validData.map(item => ({
    ...item,
    score: sanitizeValue(item.score),
  }));

  // Calculate trend
  const firstScore = sanitizedData[0]?.score || 0;
  const lastScore = sanitizedData[sanitizedData.length - 1]?.score || 0;
  const trend = lastScore > firstScore ? 'improving' : lastScore < firstScore ? 'declining' : 'steady';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Term Progress
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {sanitizedData.length} assessments • 
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
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sanitizedData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="week" 
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
                formatter={(value: any) => [`${value}%`, 'Score']}
                labelFormatter={(label) => `Week: ${label}`}
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
                strokeWidth={3}
                dot={{ 
                  fill: 'hsl(var(--primary))', 
                  strokeWidth: 2, 
                  r: 6,
                  stroke: 'hsl(var(--background))'
                }}
                activeDot={{ 
                  r: 8, 
                  stroke: 'hsl(var(--primary))',
                  strokeWidth: 2,
                  fill: 'hsl(var(--background))'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Additional info */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">First Score:</span>
            <span className="ml-2 font-medium">{firstScore}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Latest Score:</span>
            <span className="ml-2 font-medium">{lastScore}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
