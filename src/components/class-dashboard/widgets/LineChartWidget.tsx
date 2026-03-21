import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DashboardWidget } from '@/hooks/useDashboardWidgets';

interface LineChartWidgetProps {
  widget: DashboardWidget;
  classId: string;
}

// Mock data for now
const mockTimelineData = [
  { date: '2025-02-15', average: 72 },
  { date: '2025-02-28', average: 75 },
  { date: '2025-03-15', average: 78 },
  { date: '2025-03-30', average: 76 },
  { date: '2025-04-15', average: 81 },
  { date: '2025-04-30', average: 79 },
];

const chartConfig = {
  average: {
    label: "Class Average",
    color: "hsl(var(--chart-1))",
  },
};

export const LineChartWidget: React.FC<LineChartWidgetProps> = ({ widget }) => {
  return (
    <div className="h-full w-full">
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockTimelineData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="average"
              stroke="var(--color-average)"
              strokeWidth={2}
              dot={{ fill: "var(--color-average)", strokeWidth: 2, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};