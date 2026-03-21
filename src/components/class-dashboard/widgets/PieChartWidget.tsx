import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { DashboardWidget } from '@/hooks/useDashboardWidgets';

interface PieChartWidgetProps {
  widget: DashboardWidget;
  classId: string;
}

// Mock data for grade distribution
const mockPieData = [
  { name: 'A', value: 16.7, color: 'hsl(var(--chart-1))' },
  { name: 'B', value: 29.2, color: 'hsl(var(--chart-2))' },
  { name: 'C', value: 33.3, color: 'hsl(var(--chart-3))' },
  { name: 'D', value: 12.5, color: 'hsl(var(--chart-4))' },
  { name: 'E', value: 8.3, color: 'hsl(var(--chart-5))' },
];

const chartConfig = {
  value: {
    label: "Percentage",
  },
};

export const PieChartWidget: React.FC<PieChartWidgetProps> = ({ widget }) => {
  return (
    <div className="h-full w-full">
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={mockPieData}
              cx="50%"
              cy="50%"
              innerRadius={20}
              outerRadius={60}
              dataKey="value"
            >
              {mockPieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend 
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};