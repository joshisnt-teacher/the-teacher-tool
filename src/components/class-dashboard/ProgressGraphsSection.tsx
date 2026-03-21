import React, { useState, useEffect } from 'react';
import { KPIBar, FilterState } from './KPIBar';
import { CohortGrowthAnalysis } from './CohortGrowthAnalysis';
import { useEnhancedTimelineData } from '@/hooks/useEnhancedTimelineData';
import { useClasses } from '@/hooks/useClasses';

interface ProgressGraphsSectionProps {
  classId: string;
}

export const ProgressGraphsSection: React.FC<ProgressGraphsSectionProps> = ({ classId }) => {
  const [filters, setFilters] = useState<FilterState>({
    assessmentRange: null,
    bandScheme: 'band' as const,
    significanceThreshold: 20
  });

  // Get class data to determine date range
  const { data: classes = [] } = useClasses();
  const currentClass = classes.find(cls => cls.id === classId);
  
  // Use class start/end dates, or fallback to current year if not available
  const startDate = currentClass?.start_date || new Date().getFullYear() + '-01-01';
  const endDate = currentClass?.end_date || new Date().getFullYear() + '-12-31';

  // Fetch timeline data to get available assessments for the filter
  const { data: timelineData = [] } = useEnhancedTimelineData(classId, startDate, endDate);
  
  const availableAssessments = timelineData.map(item => ({
    id: item.taskId,
    name: item.assessmentName,
    date: item.date
  }));

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      {/* KPI Bar - Sticky at top */}
      <KPIBar 
        classId={classId}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableAssessments={availableAssessments}
      />
      
      {/* Student Growth Analysis - Full width */}
      <div className="mb-6">
        <CohortGrowthAnalysis 
          classId={classId}
          filters={filters}
        />
      </div>
      
      {/* Additional Analytics - Coming Soon */}
      <div className="h-96 bg-muted/30 rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Additional Analytics - Coming Soon</p>
      </div>
    </div>
  );
};