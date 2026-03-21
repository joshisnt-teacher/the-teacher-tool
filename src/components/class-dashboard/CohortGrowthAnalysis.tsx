import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Users, Search, Eye } from 'lucide-react';
import { useDistributionOverTime } from '@/hooks/useEnhancedProgressAnalytics';
import { useStudentGrowthAnalytics } from '@/hooks/useEnhancedProgressAnalytics';
import { useInterventionFlags } from '@/hooks/useComprehensiveAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterState } from './KPIBar';

interface CohortGrowthAnalysisProps {
  classId: string;
  filters: FilterState;
}

interface StudentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Array<{ id: string; name: string; score?: number }>;
  title: string;
}

const StudentListModal: React.FC<StudentListModalProps> = ({ 
  isOpen, 
  onClose, 
  students, 
  title 
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {students.map(student => (
          <div key={student.id} className="flex items-center justify-between p-2 rounded border">
            <span className="font-medium">{student.name}</span>
            {student.score !== undefined && (
              <Badge variant="outline">{student.score}%</Badge>
            )}
          </div>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);

export const CohortGrowthAnalysis: React.FC<CohortGrowthAnalysisProps> = ({
  classId,
  filters
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'improving' | 'declining' | 'stable'>('all');
  const [selectedBandStudents, setSelectedBandStudents] = useState<Array<{ id: string; name: string; score?: number }>>([]);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

  const { data: distributionData = [], isLoading: distributionLoading } = useDistributionOverTime(classId);
  const { data: growthData = [], isLoading: growthLoading } = useStudentGrowthAnalytics(classId, filters.significanceThreshold);
  const { data: interventionFlags = [], isLoading: flagsLoading } = useInterventionFlags(classId, filters.significanceThreshold);

  // Process distribution data for stacked area chart
  const processedDistributionData = useMemo(() => {
    if (!distributionData || distributionData.length === 0) {
      return [];
    }
    
    return distributionData.map(assessment => {
      const distributions = assessment.distributions || [];
      
      return {
        assessment: assessment.assessmentName || 'Unknown Assessment',
        date: assessment.date || '',
        'Excellent (80-100%)': distributions.find(r => r.range === '80-100')?.percentage || 0,
        'Proficient (65-79%)': distributions.find(r => r.range === '65-79')?.percentage || 0,
        'Developing (50-64%)': distributions.find(r => r.range === '50-64')?.percentage || 0,
        'Beginning (0-49%)': distributions.find(r => r.range === '0-49')?.percentage || 0,
      };
    });
  }, [distributionData]);

  // Filter growth data based on selected filter and search term
  const filteredGrowthData = useMemo(() => {
    if (!growthData || growthData.length === 0) {
      return [];
    }
    
    let filtered = [...growthData];
    
    // Filter by improvement trend
    if (selectedFilter !== 'all') {
      const trendMapping = { improving: 'up', declining: 'down', stable: 'stable' };
      const mappedTrend = trendMapping[selectedFilter as keyof typeof trendMapping];
      if (mappedTrend) {
        filtered = filtered.filter(student => student?.trend === mappedTrend);
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student?.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [growthData, selectedFilter, searchTerm]);

  // Handle band click to show students in that band
  const handleBandClick = (data: any, bandName: string) => {
    // This is a simplified version - in a real app, you'd need to track which students are in each band
    const mockStudents = Array.from({ length: Math.floor(Math.random() * 8) + 2 }, (_, i) => ({
      id: `student-${i}`,
      name: `Student ${i + 1}`,
      score: Math.floor(Math.random() * 40) + (bandName.includes('80-100') ? 80 : bandName.includes('65-79') ? 65 : bandName.includes('50-64') ? 50 : 20)
    }));
    
    setSelectedBandStudents(mockStudents);
    setModalTitle(`${bandName} - ${data.assessment}`);
    setIsStudentModalOpen(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-400" />;
    }
  };

  const getFilterCount = (filter: string) => {
    if (!growthData || growthData.length === 0) {
      return 0;
    }
    
    switch (filter) {
      case 'improving':
        return growthData.filter(s => s?.trend === 'up').length;
      case 'declining':
        return growthData.filter(s => s?.trend === 'down').length;
      case 'stable':
        return growthData.filter(s => s?.trend === 'stable').length;
      default:
        return growthData.length;
    }
  };

  return (
    <div className="space-y-6">
      {/* Grade Distribution Evolution - Hidden as requested */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Grade Distribution Evolution
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Click on any segment to view students in that grade band
          </p>
        </CardHeader>
        
        <CardContent>
          {distributionLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : processedDistributionData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No distribution data available</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={processedDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="assessment" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, name]}
                    labelFormatter={(label) => `Assessment: ${label}`}
                  />
                  
                  <Area 
                    type="monotone" 
                    dataKey="Excellent (80-100%)" 
                    stackId="1" 
                    stroke="hsl(var(--success))" 
                    fill="hsl(var(--success))"
                    fillOpacity={0.8}
                    onClick={(data) => handleBandClick(data, 'Excellent (80-100%)')}
                    style={{ cursor: 'pointer' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Proficient (65-79%)" 
                    stackId="1" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.8}
                    onClick={(data) => handleBandClick(data, 'Proficient (65-79%)')}
                    style={{ cursor: 'pointer' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Developing (50-64%)" 
                    stackId="1" 
                    stroke="hsl(var(--warning))" 
                    fill="hsl(var(--warning))"
                    fillOpacity={0.8}
                    onClick={(data) => handleBandClick(data, 'Developing (50-64%)')}
                    style={{ cursor: 'pointer' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Beginning (0-49%)" 
                    stackId="1" 
                    stroke="hsl(var(--destructive))" 
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.8}
                    onClick={(data) => handleBandClick(data, 'Beginning (0-49%)')}
                    style={{ cursor: 'pointer' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card> */}

      {/* Student Growth Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Student Growth Analysis</CardTitle>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Filter Buttons */}
            <div className="flex gap-2">
              {(['all', 'improving', 'declining', 'stable'] as const).map(filter => (
                <Button
                  key={filter}
                  variant={selectedFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter)}
                  className="capitalize"
                >
                  {filter} ({getFilterCount(filter)})
                </Button>
              ))}
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {growthLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredGrowthData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No students match the current filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGrowthData.map(student => (
                <div key={student.studentId} className="p-4 rounded-lg border bg-background/50">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => navigate(`/student/${student.studentId}/class/${classId}`)}
                      className="font-medium truncate hover:text-primary hover:underline cursor-pointer text-left"
                    >
                      {student.studentName}
                    </button>
                    {getTrendIcon(student.trend)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Initial:</span>
                      <span>{student.initialScore}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Final:</span>
                      <span>{student.finalScore}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Change:</span>
                      <Badge variant={student.improvement >= 0 ? "default" : "destructive"}>
                        {student.improvement >= 0 ? '+' : ''}{student.improvement}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Intervention Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Intervention Flags
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Automatically generated alerts for students requiring attention
          </p>
        </CardHeader>
        
        <CardContent>
          {flagsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : interventionFlags.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No intervention flags at this time</p>
              <p className="text-sm text-muted-foreground">All students are performing within expected parameters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {interventionFlags.map(flag => (
                <div key={flag.id} className="flex items-start justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <div className="font-medium">{flag.title}</div>
                      <Badge className={getSeverityColor(flag.severity)}>
                        {flag.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{flag.description}</p>
                  </div>
                  
                  {flag.studentIds && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Mock student data - in real app, fetch actual student details
                        const mockStudents = flag.studentIds!.map((id, index) => ({
                          id,
                          name: `Student ${index + 1}` // This should come from actual student data
                        }));
                        setSelectedBandStudents(mockStudents);
                        setModalTitle(flag.title);
                        setIsStudentModalOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Students
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student List Modal */}
      <StudentListModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        students={selectedBandStudents}
        title={modalTitle}
      />
    </div>
  );
};