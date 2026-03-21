import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useDistributionOverTime } from '@/hooks/useEnhancedProgressAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface DistributionOverTimeChartProps {
  classId: string;
}

export const DistributionOverTimeChart: React.FC<DistributionOverTimeChartProps> = ({ classId }) => {
  const { data: distributionData = [], isLoading } = useDistributionOverTime(classId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Grade Distribution Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (distributionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Grade Distribution Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No distribution data available</p>
            <p className="text-sm text-muted-foreground">Complete multiple assessments to see grade distribution trends</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value} students ({Math.round((entry.value / payload.reduce((sum: number, p: any) => sum + p.value, 0)) * 100)}%)
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Grade Distribution Over Time
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          See how class performance shifts across assessments
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {distributionData.map((assessment, index) => (
            <div key={index} className="space-y-2">
              <div className="text-center">
                <h4 className="font-medium text-sm truncate" title={assessment.assessmentName}>
                  {assessment.assessmentName}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(assessment.date), 'MMM d, yyyy')}
                </p>
              </div>
              
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={assessment.distributions}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="range" 
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--primary))" 
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Grade band indicators */}
              <div className="space-y-1">
                {assessment.distributions.map((dist, distIndex) => {
                  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
                  return (
                    <div key={distIndex} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${colors[distIndex]}`}></div>
                        <span>{dist.range}%</span>
                      </div>
                      <span className="font-medium">{dist.count} ({dist.percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Summary insights */}
        <div className="mt-6 p-4 bg-muted/30 rounded">
          <h4 className="text-sm font-medium mb-2">Insights</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {distributionData.length >= 2 && (
              <>
                <p>
                  • Class has completed {distributionData.length} assessments over time
                </p>
                {(() => {
                  const first = distributionData[0];
                  const last = distributionData[distributionData.length - 1];
                  const firstExcellent = first.distributions[3].percentage;
                  const lastExcellent = last.distributions[3].percentage;
                  const excellentChange = lastExcellent - firstExcellent;
                  
                  if (excellentChange > 5) {
                    return <p className="text-green-600">• Excellent performance (80-100%) improved by {excellentChange}%</p>;
                  } else if (excellentChange < -5) {
                    return <p className="text-red-600">• Excellent performance (80-100%) declined by {Math.abs(excellentChange)}%</p>;
                  } else {
                    return <p>• Excellent performance (80-100%) remained stable</p>;
                  }
                })()}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};