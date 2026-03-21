import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleRadarChart } from '@/components/ui/simple-radar-chart';
import { BookOpen, Layers, List } from 'lucide-react';
import { useStudentCurriculumContentItems } from '@/hooks/useStudentCurriculumData';
import { cn } from '@/lib/utils';

interface CurriculumContentItemsProps {
  studentId: string;
  classId: string;
  variant?: 'default' | 'compact';
}

// Map curriculum codes to their strands
const getStrandFromCode = (code: string): string => {
  if (code.startsWith('ACHHK')) return 'History';
  if (code.startsWith('ACHGK')) return 'Geography';
  if (code.startsWith('ACHCK')) return 'Civics & Citizenship';
  if (code.startsWith('ACHEK')) return 'Economics & Business';
  if (code.startsWith('WAHASS')) return 'HASS Skills';
  return 'Other';
};

// Process curriculum data to group by strands
const processStrandData = (data: any[]) => {
  const strandMap = new Map<string, { values: number[], codes: string[], descriptions: string[] }>();
  
  data.forEach(item => {
    const strand = getStrandFromCode(item.code);
    if (!strandMap.has(strand)) {
      strandMap.set(strand, { values: [], codes: [], descriptions: [] });
    }
    const strandData = strandMap.get(strand)!;
    strandData.values.push(item.value);
    strandData.codes.push(item.code);
    strandData.descriptions.push(item.description);
  });

  return Array.from(strandMap.entries()).map(([strand, data]) => ({
    code: strand,
    description: `${data.codes.length} content items`,
    value: Math.round(data.values.reduce((sum, val) => sum + val, 0) / data.values.length),
    count: data.codes.length,
    items: data.codes.map((code, index) => ({
      code,
      description: data.descriptions[index],
      value: data.values[index]
    }))
  }));
};

export const CurriculumContentItems: React.FC<CurriculumContentItemsProps> = ({ 
  studentId, 
  classId,
  variant = 'default',
}) => {
  const [viewType, setViewType] = useState<'strands' | 'items'>('strands');
  const { data: curriculumData, isLoading } = useStudentCurriculumContentItems(studentId, classId);
  const isCompact = variant === 'compact';
  const chartSize = isCompact ? 320 : 400;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Curriculum Content Items Achievement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('flex items-center justify-center', isCompact ? 'h-80' : 'h-96')}>
            <div className="animate-pulse text-muted-foreground">Loading curriculum data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!curriculumData || curriculumData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Curriculum Content Items Achievement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('flex items-center justify-center', isCompact ? 'h-80' : 'h-96')}>
            <div className="text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No curriculum data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Validate data before rendering chart
  const validData = curriculumData.filter(item => 
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
            <BookOpen className="w-5 h-5" />
            Curriculum Content Items Achievement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('flex items-center justify-center', isCompact ? 'h-80' : 'h-96')}>
            <div className="text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No valid curriculum data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Process data based on view type
  const displayData = viewType === 'strands' 
    ? processStrandData(validData)
    : validData;

  // Prepare data for radar chart based on view type
  const radarData = displayData.map(item => ({
    subject: item.code,
    value: item.value,
    description: item.description,
    count: item.count,
  }));

  // Calculate average achievement based on view type
  const averageAchievement = viewType === 'strands' 
    ? Math.round(displayData.reduce((sum, item) => sum + item.value, 0) / displayData.length)
    : Math.round(validData.reduce((sum, item) => sum + item.value, 0) / validData.length);

  // Find strongest and weakest areas based on view type
  const sortedData = [...displayData].sort((a, b) => b.value - a.value);
  const strongest = sortedData[0];
  const weakest = sortedData[sortedData.length - 1];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Curriculum Achievement
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={viewType === 'strands' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('strands')}
            >
              <Layers className="w-4 h-4 mr-1" />
              Strands
            </Button>
            <Button
              variant={viewType === 'items' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('items')}
            >
              <List className="w-4 h-4 mr-1" />
              Items
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {viewType === 'strands' 
            ? `${displayData.length} curriculum strands • Average: ${averageAchievement}%`
            : `${validData.length} content items • Average: ${averageAchievement}%`
          }
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn('flex items-center justify-center', isCompact ? 'h-80' : 'h-96')}>
          <SimpleRadarChart
            data={radarData}
            width={chartSize}
            height={chartSize}
            margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
            dataKey="subject"
            valueKey="value"
          />
        </div>
        
        {/* Summary stats */}
        <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', isCompact ? 'mt-4' : 'mt-6')}>
          <div className="space-y-2">
            <div className="text-sm font-medium text-green-600">
              {viewType === 'strands' ? 'Strongest Strand' : 'Strongest Area'}
            </div>
            <div className="text-sm">
              <div className="font-medium">{strongest?.code}</div>
              <div className="text-muted-foreground text-xs truncate" title={strongest?.description}>
                {strongest?.description}
              </div>
              <div className="text-green-600 font-medium">{strongest?.value}%</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium text-orange-600">
              {viewType === 'strands' ? 'Focus Strand' : 'Focus Area'}
            </div>
            <div className="text-sm">
              <div className="font-medium">{weakest?.code}</div>
              <div className="text-muted-foreground text-xs truncate" title={weakest?.description}>
                {weakest?.description}
              </div>
              <div className="text-orange-600 font-medium">{weakest?.value}%</div>
            </div>
          </div>
        </div>

        {/* Content items list */}
        <div className={cn('space-y-2', isCompact ? 'mt-3' : 'mt-4')}>
          <div className="text-sm font-medium">
            {viewType === 'strands' ? 'Curriculum Strands' : 'All Content Items'}
          </div>
          <div className={cn('overflow-y-auto space-y-1', isCompact ? 'max-h-40' : 'max-h-32')}>
            {displayData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/50">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.code}</div>
                  <div className="text-muted-foreground truncate" title={item.description}>
                    {item.description}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <div className={`w-2 h-2 rounded-full ${
                    item.value >= 80 ? 'bg-green-500' :
                    item.value >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <span className="font-medium">{item.value}%</span>
                  <span className="text-muted-foreground">({item.count} {viewType === 'strands' ? 'items' : 'assessments'})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
