import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export type AssessmentFilter = 'All' | 'Summative' | 'Formative' | 'Diagnostic' | 'Other';

export interface TimelineControls {
  showAverage: boolean;
  showHighest: boolean;
  showLowest: boolean;
  showScatter: boolean;
  showTrendLine: boolean;
  showStudentLines: boolean;
  selectedStudents: string[];
  assessmentFilter: AssessmentFilter;
}

interface TimelineControlPanelProps {
  controls: TimelineControls;
  onControlChange: (key: keyof TimelineControls, value: any) => void;
  students: Array<{ id: string; name: string }>;
  assessmentTypes: AssessmentFilter[];
}

export const TimelineControlPanel: React.FC<TimelineControlPanelProps> = ({
  controls,
  onControlChange,
  students,
  assessmentTypes,
}) => {
  const handleStudentSelect = (studentId: string) => {
    const newSelectedStudents = controls.selectedStudents.includes(studentId)
      ? controls.selectedStudents.filter(id => id !== studentId)
      : [...controls.selectedStudents, studentId];
    onControlChange('selectedStudents', newSelectedStudents);
  };

  const removeStudent = (studentId: string) => {
    const newSelectedStudents = controls.selectedStudents.filter(id => id !== studentId);
    onControlChange('selectedStudents', newSelectedStudents);
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Series Toggle */}
          <div>
            <h4 className="text-sm font-medium mb-3">Display Series</h4>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-average"
                  checked={controls.showAverage}
                  onCheckedChange={(checked) => onControlChange('showAverage', checked)}
                />
                <label htmlFor="show-average" className="text-sm">Class Average</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-highest"
                  checked={controls.showHighest}
                  onCheckedChange={(checked) => onControlChange('showHighest', checked)}
                />
                <label htmlFor="show-highest" className="text-sm">Highest Mark</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-lowest"
                  checked={controls.showLowest}
                  onCheckedChange={(checked) => onControlChange('showLowest', checked)}
                />
                <label htmlFor="show-lowest" className="text-sm">Lowest Mark</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-scatter"
                  checked={controls.showScatter}
                  onCheckedChange={(checked) => onControlChange('showScatter', checked)}
                />
                <label htmlFor="show-scatter" className="text-sm">Student Scatter</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-trend"
                  checked={controls.showTrendLine}
                  onCheckedChange={(checked) => onControlChange('showTrendLine', checked)}
                />
                <label htmlFor="show-trend" className="text-sm">Trend Line</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-student-lines"
                  checked={controls.showStudentLines}
                  onCheckedChange={(checked) => onControlChange('showStudentLines', checked)}
                />
                <label htmlFor="show-student-lines" className="text-sm">Student Lines</label>
              </div>
            </div>
          </div>

          {/* Assessment Filter */}
          <div>
            <h4 className="text-sm font-medium mb-3">Assessment Filter</h4>
            <Select
              value={controls.assessmentFilter}
              onValueChange={(value) => onControlChange('assessmentFilter', value as AssessmentFilter)}
            >
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Filter by assessment type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All assessments</SelectItem>
                {assessmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === 'Other' ? 'Other assessments' : `${type} assessments`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student Filter */}
          <div>
            <h4 className="text-sm font-medium mb-3">Student Filter</h4>
            <div className="space-y-2">
              <Select onValueChange={handleStudentSelect}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Add specific students..." />
                </SelectTrigger>
                <SelectContent>
                  {students
                    .filter(student => !controls.selectedStudents.includes(student.id))
                    .map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              {controls.selectedStudents.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {controls.selectedStudents.map(studentId => {
                    const student = students.find(s => s.id === studentId);
                    return student ? (
                      <Badge key={studentId} variant="secondary" className="flex items-center gap-1">
                        {student.name}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeStudent(studentId)}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};