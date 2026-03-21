import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DashboardWidget } from '@/hooks/useDashboardWidgets';

interface BarChartWidgetProps {
  widget: DashboardWidget;
  classId: string;
}

// Mock data for grade distribution
const mockGradeData = [
  { grade: 'A', count: 4 },
  { grade: 'B', count: 7 },
  { grade: 'C', count: 8 },
  { grade: 'D', count: 3 },
  { grade: 'E', count: 2 },
];

const chartConfig = {
  count: {
    label: "Students",
    color: "hsl(var(--chart-2))",
  },
};

export const BarChartWidget: React.FC<BarChartWidgetProps> = ({ widget }) => {
  return (
    <div className="h-full w-full">
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockGradeData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="grade" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};