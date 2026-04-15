import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { useStudentGrowthAnalytics } from '@/hooks/useEnhancedProgressAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

interface StudentGrowthChartProps {
  classId: string;
}

type ViewMode = 'bar' | 'line';
type FilterMode = 'all' | 'improving' | 'declining' | 'stable';
type SortMode = 'improvement' | 'alphabetical' | 'initial' | 'final';

export const StudentGrowthChart: React.FC<StudentGrowthChartProps> = ({ classId }) => {
  const [threshold, setThreshold] = useState(10);
  const [viewMode, setViewMode] = useState<ViewMode>('bar');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('alphabetical');

  const { data: growthData = [], isLoading } = useStudentGrowthAnalytics(classId, threshold);

  const filteredAndSortedData = React.useMemo(() => {
    let filtered = [...growthData];

    // Apply filter
    switch (filterMode) {
      case 'improving':
        filtered = filtered.filter(student => student.trend === 'up');
        break;
      case 'declining':
        filtered = filtered.filter(student => student.trend === 'down');
        break;
      case 'stable':
        filtered = filtered.filter(student => student.trend === 'stable');
        break;
      default:
        // all - no filter
        break;
    }

    // Apply sort
    switch (sortMode) {
      case 'improvement':
        filtered.sort((a, b) => b.improvementPercent - a.improvementPercent);
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.studentName.localeCompare(b.studentName));
        break;
      case 'initial':
        filtered.sort((a, b) => b.initialScore - a.initialScore);
        break;
      case 'final':
        filtered.sort((a, b) => b.finalScore - a.finalScore);
        break;
    }

    return filtered;
  }, [growthData, filterMode, sortMode]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.studentName}</p>
          <p className="text-sm">Initial: {data.initialScore}%</p>
          <p className="text-sm">Final: {data.finalScore}%</p>
          <p className="text-sm">
            Change: <span className={data.improvement >= 0 ? 'text-green-600' : 'text-red-600'}>
              {data.improvement > 0 ? '+' : ''}{data.improvement}% ({data.improvementPercent > 0 ? '+' : ''}{data.improvementPercent}%)
            </span>
          </p>
          <p className="text-xs text-muted-foreground">{data.assessmentCount} assessments</p>
        </div>
      );
    }
    return null;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'down':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Student Growth Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Student Growth Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare initial vs final performance across assessments
        </p>
      </CardHeader>
      <CardContent>
        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/30 rounded">
          <div className="space-y-2">
            <label className="text-sm font-medium">Threshold for Significant Change</label>
            <Select value={threshold.toString()} onValueChange={(value) => setThreshold(Number(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5%</SelectItem>
                <SelectItem value="10">10%</SelectItem>
                <SelectItem value="15">15%</SelectItem>
                <SelectItem value="20">20%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">View Mode</label>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('bar')}
              >
                Bar Chart
              </Button>
              <Button
                variant={viewMode === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('line')}
              >
                Line Chart
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Filter</label>
            <Select value={filterMode} onValueChange={(value: FilterMode) => setFilterMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="improving">Improving</SelectItem>
                <SelectItem value="declining">Declining</SelectItem>
                <SelectItem value="stable">Stable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sort By</label>
            <Select value={sortMode} onValueChange={(value: SortMode) => setSortMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="improvement">Improvement</SelectItem>
                <SelectItem value="alphabetical">Name</SelectItem>
                <SelectItem value="initial">Initial Score</SelectItem>
                <SelectItem value="final">Final Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {growthData.filter(s => s.trend === 'up').length}
            </div>
            <div className="text-sm text-muted-foreground">Improving</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {growthData.filter(s => s.trend === 'down').length}
            </div>
            <div className="text-sm text-muted-foreground">Declining</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {growthData.filter(s => s.trend === 'stable').length}
            </div>
            <div className="text-sm text-muted-foreground">Stable</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {growthData.length > 0 ? Math.round(growthData.reduce((sum, s) => sum + s.improvement, 0) / growthData.length) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Change</div>
          </div>
        </div>

        {/* Chart */}
        {filteredAndSortedData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No growth data available</p>
            <p className="text-sm text-muted-foreground">Students need at least 2 assessments to show growth</p>
          </div>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'bar' ? (
                <BarChart data={filteredAndSortedData} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="studentName" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Score %', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="initialScore" fill="#94a3b8" name="Initial Score" />
                  <Bar dataKey="finalScore" fill="hsl(var(--primary))" name="Final Score" />
                </BarChart>
              ) : (
                <LineChart data={filteredAndSortedData} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="studentName" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Score %', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="initialScore" 
                    stroke="#94a3b8" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Initial Score"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="finalScore" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Final Score"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* Student List */}
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-medium">Individual Student Progress</h4>
          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {filteredAndSortedData.map((student) => (
              <div key={student.studentId} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                <div className="flex items-center gap-3">
                  {getTrendIcon(student.trend)}
                  <span className="font-medium">{student.studentName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {student.initialScore}% → {student.finalScore}%
                  </span>
                  <Badge className={getTrendColor(student.trend)}>
                    {student.improvement > 0 ? '+' : ''}{student.improvement}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};