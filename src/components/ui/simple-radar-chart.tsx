import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface SimpleRadarChartProps {
  data: Array<{ [key: string]: string | number }>;
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  dataKey?: string;
  valueKey?: string;
}

export const SimpleRadarChart: React.FC<SimpleRadarChartProps> = ({
  data,
  width = 400,
  height = 400,
  margin = { top: 50, right: 50, bottom: 50, left: 50 },
  dataKey = 'subject',
  valueKey = 'value',
}) => {
  return (
    <ResponsiveContainer width={width} height={height}>
      <RadarChart data={data} margin={margin}>
        <PolarGrid />
        <PolarAngleAxis 
          dataKey={dataKey} 
          tick={{ fontSize: 10, textAnchor: 'middle' }}
          tickLine={false}
          tickFormatter={(value) => {
            // Split long labels into multiple lines
            if (value.length > 15) {
              const words = value.split(' ');
              const midPoint = Math.ceil(words.length / 2);
              return words.slice(0, midPoint).join(' ') + '\n' + words.slice(midPoint).join(' ');
            }
            return value;
          }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]} 
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <Radar
          name="Achievement"
          dataKey={valueKey}
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};
