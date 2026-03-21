import React from 'react';
import { DashboardWidget } from '@/hooks/useDashboardWidgets';
import { TrendingUp, TrendingDown, Users, FileText, BarChart3 } from 'lucide-react';

interface KPIWidgetProps {
  widget: DashboardWidget;
  classId: string;
}

// Mock data for now - in real implementation this would come from proper hooks
const getMockKPIData = (dataSource: string) => {
  switch (dataSource) {
    case 'class_average':
      return { value: '78.5%', trend: 5.2, icon: BarChart3 };
    case 'student_count':
      return { value: '24', trend: 0, icon: Users };
    case 'assessment_count':
      return { value: '8', trend: 2, icon: FileText };
    case 'highest_score':
      return { value: '95%', trend: 1.5, icon: TrendingUp };
    default:
      return { value: '--', trend: 0, icon: BarChart3 };
  }
};

export const KPIWidget: React.FC<KPIWidgetProps> = ({ widget }) => {
  const data = getMockKPIData(widget.data_source);
  const IconComponent = data.icon;
  
  const trendColor = data.trend > 0 ? 'text-green-600' : data.trend < 0 ? 'text-red-600' : 'text-muted-foreground';
  const TrendIcon = data.trend > 0 ? TrendingUp : data.trend < 0 ? TrendingDown : null;

  return (
    <div className="h-full flex flex-col justify-center items-center text-center p-4">
      <div className="mb-3">
        <IconComponent className="w-8 h-8 text-primary mx-auto" />
      </div>
      
      <div className="mb-2">
        <div className="text-2xl font-bold">{data.value}</div>
      </div>
      
      {data.trend !== 0 && (
        <div className={`flex items-center text-sm ${trendColor}`}>
          {TrendIcon && <TrendIcon className="w-4 h-4 mr-1" />}
          <span>{Math.abs(data.trend)}%</span>
        </div>
      )}
    </div>
  );
};