import React from 'react';
import { DashboardWidget } from '@/hooks/useDashboardWidgets';

interface HeatmapWidgetProps {
  widget: DashboardWidget;
  classId: string;
}

// Mock heatmap data
const mockHeatmapData = Array.from({ length: 8 }, (_, studentIndex) =>
  Array.from({ length: 10 }, (_, questionIndex) => ({
    student: `Student ${studentIndex + 1}`,
    question: `Q${questionIndex + 1}`,
    score: Math.random() * 100,
  }))
).flat();

const getColorIntensity = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

export const HeatmapWidget: React.FC<HeatmapWidgetProps> = ({ widget }) => {
  const students = [...new Set(mockHeatmapData.map(d => d.student))].slice(0, 6);
  const questions = [...new Set(mockHeatmapData.map(d => d.question))].slice(0, 8);

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="grid grid-cols-9 gap-1 h-full text-xs">
        {/* Header */}
        <div className="col-span-1"></div>
        {questions.map(q => (
          <div key={q} className="text-center text-[10px] text-muted-foreground truncate">
            {q}
          </div>
        ))}
        
        {/* Rows */}
        {students.map(student => (
          <React.Fragment key={student}>
            <div className="text-[10px] text-muted-foreground truncate flex items-center">
              {student.slice(0, 8)}
            </div>
            {questions.map(question => {
              const dataPoint = mockHeatmapData.find(d => d.student === student && d.question === question);
              const score = dataPoint?.score || 0;
              return (
                <div
                  key={`${student}-${question}`}
                  className={`rounded-sm ${getColorIntensity(score)} opacity-70 hover:opacity-100 transition-opacity`}
                  title={`${student} - ${question}: ${score.toFixed(1)}%`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};