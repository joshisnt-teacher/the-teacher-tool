import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Users, Target, AlertTriangle } from 'lucide-react';
import { useClassKPIs } from '@/hooks/useComprehensiveAnalytics';

export interface FilterState {
  assessmentRange: { start: string; end: string } | null;
  bandScheme: 'grade' | 'band';
  significanceThreshold: number;
}

interface KPIBarProps {
  classId: string;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableAssessments: Array<{ id: string; name: string; date: string }>;
}

export const KPIBar: React.FC<KPIBarProps> = ({ 
  classId, 
  filters, 
  onFiltersChange,
  availableAssessments 
}) => {
  const { data: kpis, isLoading } = useClassKPIs(classId, filters.assessmentRange || undefined);

  const handleAssessmentRangeChange = (range: string) => {
    if (range === 'all') {
      onFiltersChange({ ...filters, assessmentRange: null });
    } else {
      // For now, just use the last 3 assessments as an example
      const recentAssessments = availableAssessments.slice(-3);
      if (recentAssessments.length > 0) {
        onFiltersChange({
          ...filters,
          assessmentRange: {
            start: recentAssessments[0].date,
            end: recentAssessments[recentAssessments.length - 1].date
          }
        });
      }
    }
  };

  const handleBandSchemeChange = (scheme: 'grade' | 'band') => {
    onFiltersChange({ ...filters, bandScheme: scheme });
  };

  const handleThresholdChange = (value: number[]) => {
    onFiltersChange({ ...filters, significanceThreshold: value[0] });
  };

  if (isLoading || !kpis) {
    return (
      <Card className="sticky top-4 z-10 bg-background/95 backdrop-blur-sm border-border/50">
        <CardContent className="p-4">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-4 z-10 bg-background/95 backdrop-blur-sm border-border/50">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <Select value={filters.assessmentRange ? 'recent' : 'all'} onValueChange={handleAssessmentRangeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Assessment Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assessments</SelectItem>
                <SelectItem value="recent">Recent 3</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.bandScheme} onValueChange={handleBandSchemeChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Band Scheme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grade">A-E Grades</SelectItem>
                <SelectItem value="band">E/D/P/X Bands</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 min-w-[200px]">
              <span className="text-sm font-medium whitespace-nowrap">Threshold:</span>
              <Slider
                value={[filters.significanceThreshold]}
                onValueChange={handleThresholdChange}
                max={50}
                min={5}
                step={5}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-8">{filters.significanceThreshold}%</span>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Class Average */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                {kpis.classAverageChange > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : kpis.classAverageChange < 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-muted-foreground" />
                )}
                <div>
                  <div className="text-2xl font-bold">{kpis.classAverage}%</div>
                  <div className="text-xs text-muted-foreground">Class Average</div>
                </div>
              </div>
              {kpis.classAverageChange !== 0 && (
                <Badge variant={kpis.classAverageChange > 0 ? "default" : "destructive"} className="text-xs">
                  {kpis.classAverageChange > 0 ? '+' : ''}{kpis.classAverageChange}%
                </Badge>
              )}
            </div>

            {/* High Band Count */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <Users className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {kpis.highBandCount}
                </div>
                <div className="text-xs text-green-600 dark:text-green-500">
                  High Band ({kpis.highBandPercentage}%)
                </div>
              </div>
            </div>

            {/* Low Band Count */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <Users className="w-4 h-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {kpis.lowBandCount}
                </div>
                <div className="text-xs text-red-600 dark:text-red-500">
                  Low Band ({kpis.lowBandPercentage}%)
                </div>
              </div>
            </div>

            {/* Students on Target */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Target className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {kpis.studentsOnTarget}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-500">
                  On Target ({kpis.studentsOnTargetPercentage}%)
                </div>
              </div>
            </div>

            {/* Flagged Students */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                  {kpis.flaggedStudents}
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-500">
                  Flagged Students
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};