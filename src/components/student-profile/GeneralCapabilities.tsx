import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleRadarChart } from '@/components/ui/simple-radar-chart';
import { Brain } from 'lucide-react';
import { useStudentGeneralCapabilities } from '@/hooks/useStudentCurriculumData';
import { cn } from '@/lib/utils';

interface GeneralCapabilitiesProps {
  studentId: string;
  classId: string;
  variant?: 'default' | 'compact';
}

export const GeneralCapabilities: React.FC<GeneralCapabilitiesProps> = ({ 
  studentId, 
  classId,
  variant = 'default',
}) => {
  const { data: capabilitiesData, isLoading } = useStudentGeneralCapabilities(studentId, classId);
  const isCompact = variant === 'compact';
  const chartSize = isCompact ? 320 : 400;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            General Capabilities Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('flex items-center justify-center', isCompact ? 'h-80' : 'h-96')}>
            <div className="animate-pulse text-muted-foreground">Loading capabilities data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!capabilitiesData || capabilitiesData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            General Capabilities Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('flex items-center justify-center', isCompact ? 'h-80' : 'h-96')}>
            <div className="text-center">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No capabilities data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Validate data before rendering chart
  const validData = capabilitiesData.filter(item => 
    item && 
    typeof item.value === 'number' && 
    !isNaN(item.value) && 
    item.value >= 0
  );

  if (validData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            General Capabilities Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('flex items-center justify-center', isCompact ? 'h-80' : 'h-96')}>
            <div className="text-center">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No valid capabilities data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for radar chart
  const radarData = validData.map(item => ({
    capability: item.capability,
    value: item.value,
    count: item.count,
  }));

  // Calculate average achievement
  const averageAchievement = Math.round(
    validData.reduce((sum, item) => sum + item.value, 0) / validData.length
  );

  // Find strongest and weakest capabilities
  const sortedData = [...validData].sort((a, b) => b.value - a.value);
  const strongest = sortedData[0];
  const weakest = sortedData[sortedData.length - 1];

  // Group capabilities by performance level
  const excellent = validData.filter(item => item.value >= 85);
  const good = validData.filter(item => item.value >= 70 && item.value < 85);
  const developing = validData.filter(item => item.value < 70);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          General Capabilities Assessment
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {validData.length} capabilities • 
          Average: {averageAchievement}%
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn('flex items-center justify-center', isCompact ? 'h-80' : 'h-96')}>
          <SimpleRadarChart
            data={radarData}
            width={chartSize}
            height={chartSize}
            margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
            dataKey="capability"
            valueKey="value"
          />
        </div>
        
        {/* Performance levels */}
        <div className={cn('space-y-4', isCompact ? 'mt-4' : 'mt-6')}>
          <div className="text-sm font-medium">Performance Levels</div>
          
          {/* Excellent */}
          {excellent.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-green-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Excellent (85%+)
              </div>
              <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-2', isCompact && 'md:grid-cols-1')}>
                {excellent.map((capability, index) => (
                  <div key={index} className="text-xs py-1 px-2 rounded bg-green-50 text-green-700">
                    <div className="font-medium">{capability.capability}</div>
                    <div className="text-green-600">{capability.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Good */}
          {good.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-blue-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Good (70-84%)
              </div>
              <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-2', isCompact && 'md:grid-cols-1')}>
                {good.map((capability, index) => (
                  <div key={index} className="text-xs py-1 px-2 rounded bg-blue-50 text-blue-700">
                    <div className="font-medium">{capability.capability}</div>
                    <div className="text-blue-600">{capability.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Developing */}
          {developing.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-orange-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Developing (&lt;70%)
              </div>
              <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-2', isCompact && 'md:grid-cols-1')}>
                {developing.map((capability, index) => (
                  <div key={index} className="text-xs py-1 px-2 rounded bg-orange-50 text-orange-700">
                    <div className="font-medium">{capability.capability}</div>
                    <div className="text-orange-600">{capability.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Strongest:</span>
            <span className="ml-2 font-medium">{strongest?.capability}</span>
            <span className="ml-1 text-green-600">({strongest?.value}%)</span>
          </div>
          <div>
            <span className="text-muted-foreground">Focus Area:</span>
            <span className="ml-2 font-medium">{weakest?.capability}</span>
            <span className="ml-1 text-orange-600">({weakest?.value}%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
