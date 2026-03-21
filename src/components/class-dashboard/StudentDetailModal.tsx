import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, FileText, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface StudentDetailModalProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Mock data - will be replaced with real student data
const mockStudentData = {
  '1': {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@school.edu',
    studentId: 'STU001',
    tasks: [
      {
        id: '1',
        name: 'Unit 1 Diagnostic Test',
        type: 'Diagnostic',
        date: '2024-01-15',
        rawScore: 34,
        maxScore: 50,
        percentage: 68,
        feedback: 'Good understanding of basic concepts. Focus on problem-solving techniques for improvement.'
      },
      {
        id: '2',
        name: 'Essay Assignment',
        type: 'Formative',
        date: '2024-02-01',
        rawScore: 22,
        maxScore: 25,
        percentage: 88,
        feedback: 'Excellent analysis and well-structured argument. Minor improvements needed in citation format.'
      },
      {
        id: '3',
        name: 'Quiz 1',
        type: 'Formative',
        date: '2024-02-15',
        rawScore: 18,
        maxScore: 20,
        percentage: 90,
        feedback: 'Outstanding performance. Clear understanding of all key concepts demonstrated.'
      }
    ],
    criteriaPerformance: [
      { criteria: 'Knowledge & Understanding', percentage: 78, band: 'P' },
      { criteria: 'Thinking & Inquiry', percentage: 85, band: 'E' },
      { criteria: 'Communication', percentage: 82, band: 'E' },
      { criteria: 'Application', percentage: 75, band: 'D' }
    ]
  }
};

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ 
  studentId, 
  isOpen, 
  onClose 
}) => {
  const student = mockStudentData[studentId as keyof typeof mockStudentData];

  if (!student) {
    return null;
  }

  const getBandColor = (band: string) => {
    switch (band) {
      case 'E': return 'bg-green-100 text-green-800 border-green-200';
      case 'P': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'X': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Diagnostic': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Formative': return 'bg-green-100 text-green-800 border-green-200';
      case 'Summative': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {student.name}
            <Badge variant="outline">{student.studentId}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assessment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Assessment History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {student.tasks.map((task) => (
                <div key={task.id} className="p-4 rounded-lg border bg-background/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{task.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(task.date), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <Badge className={getTypeColor(task.type)}>
                      {task.type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="font-medium">{task.rawScore}/{task.maxScore}</span>
                    </div>
                    <div className="text-sm font-medium text-primary">
                      {task.percentage}%
                    </div>
                  </div>
                  
                  {task.feedback && (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                      <strong>Feedback:</strong> {task.feedback}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Success Criteria Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Success Criteria Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {student.criteriaPerformance.map((criteria, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">{criteria.criteria}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{criteria.percentage}%</span>
                      <Badge className={getBandColor(criteria.band)}>
                        {criteria.band}
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all duration-300" 
                      style={{ width: `${criteria.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Overall Trend</h4>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Improving (+12% this term)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Consistent growth across all criteria with strongest improvement in Thinking & Inquiry.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};