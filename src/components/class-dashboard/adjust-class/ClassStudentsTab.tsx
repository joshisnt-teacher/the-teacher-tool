import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Trash2, Upload, FileText } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useStudents } from '@/hooks/useStudents';
import { Class } from '@/hooks/useClasses';

interface ClassStudentsTabProps {
  classData: Class;
}

const parseStudentsCSV = (csvText: string, classId: string) => {
  const lines = csvText.trim().split('\n');
  const students = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = line.split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));

    if (columns.length < 3) {
      throw new Error(`Line ${i + 1}: Expected 3 columns (studentID, firstname, lastname), got ${columns.length}`);
    }

    const [student_id, first_name, last_name] = columns;

    if (!student_id || !first_name || !last_name) {
      throw new Error(`Line ${i + 1}: All fields (studentID, firstname, lastname) are required`);
    }

    students.push({
      student_id: student_id.trim(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      class_id: classId,
    });
  }

  return students;
};

const downloadSampleCSV = () => {
  const sampleData = [
    ['studentID', 'firstname', 'lastname'],
    ['12345', 'John', 'Smith'],
    ['12346', 'Jane', 'Doe'],
    ['12347', 'Bob', 'Johnson'],
  ];
  const csvContent = sampleData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample_students.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const ClassStudentsTab: React.FC<ClassStudentsTabProps> = ({ classData }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: students = [], isLoading: studentsLoading } = useStudents(classData.id);

  const [newStudent, setNewStudent] = useState({ first_name: '', last_name: '', student_id: '' });
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const handleAddStudent = async () => {
    if (!newStudent.first_name || !newStudent.last_name || !newStudent.student_id) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all student fields (first name, last name, and student ID).',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingStudent(true);
    try {
      const { error } = await supabase.from('students').insert([{
        first_name: newStudent.first_name,
        last_name: newStudent.last_name,
        student_id: newStudent.student_id,
        class_id: classData.id,
      }]);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['students', classData.id] });
      setNewStudent({ first_name: '', last_name: '', student_id: '' });
      toast({ title: 'Student Added', description: `${newStudent.first_name} ${newStudent.last_name} has been added to the class.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to add student.', variant: 'destructive' });
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    setDeletingStudentId(studentId);
    try {
      const { error } = await supabase.from('students').delete().eq('id', studentId);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['students', classData.id] });
      toast({ title: 'Student Removed', description: `${studentName} has been removed from the class.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to remove student.', variant: 'destructive' });
    } finally {
      setDeletingStudentId(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({ title: 'Invalid File Type', description: 'Please select a CSV file.', variant: 'destructive' });
        return;
      }
      setCsvFile(file);
    }
  };

  const handleCSVUpload = async () => {
    if (!csvFile) {
      toast({ title: 'No File Selected', description: 'Please select a CSV file to upload.', variant: 'destructive' });
      return;
    }

    setIsUploadingCSV(true);
    try {
      const csvText = await csvFile.text();
      const students = parseStudentsCSV(csvText, classData.id);

      if (students.length === 0) {
        toast({ title: 'No Students Found', description: 'The CSV file appears to be empty or contains no valid student data.', variant: 'destructive' });
        return;
      }

      const { error } = await supabase.from('students').insert(students);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['students', classData.id] });
      setCsvFile(null);
      toast({ title: 'Students Added Successfully', description: `${students.length} student${students.length !== 1 ? 's' : ''} have been added to the class.` });
    } catch (error: any) {
      toast({ title: 'CSV Upload Error', description: error.message || 'Failed to process CSV file.', variant: 'destructive' });
    } finally {
      setIsUploadingCSV(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Student Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add New Student
          </CardTitle>
          <CardDescription>
            Add a student to this class by entering their details below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student_first_name">First Name</Label>
              <Input
                id="student_first_name"
                value={newStudent.first_name}
                onChange={(e) => setNewStudent(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="e.g., John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student_last_name">Last Name</Label>
              <Input
                id="student_last_name"
                value={newStudent.last_name}
                onChange={(e) => setNewStudent(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="e.g., Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student_id">Student ID</Label>
              <Input
                id="student_id"
                value={newStudent.student_id}
                onChange={(e) => setNewStudent(prev => ({ ...prev, student_id: e.target.value }))}
                placeholder="e.g., 12345"
              />
            </div>
          </div>

          <div className="flex justify-between items-end mt-4">
            <div className="flex-1 max-w-md">
              <Label htmlFor="csv-upload" className="text-sm font-medium mb-2 block">
                Or upload CSV file
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="text-sm"
                />
                {csvFile && (
                  <Button
                    onClick={handleCSVUpload}
                    disabled={isUploadingCSV}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploadingCSV ? 'Uploading...' : 'Upload'}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">CSV format: studentID, firstname, lastname</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadSampleCSV}
                  className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                >
                  Download sample
                </Button>
              </div>
              {csvFile && (
                <p className="text-xs text-green-600 mt-1">
                  <FileText className="w-3 h-3 inline mr-1" />
                  {csvFile.name} selected
                </p>
              )}
            </div>

            <Button onClick={handleAddStudent} disabled={isAddingStudent}>
              <UserPlus className="w-4 h-4 mr-2" />
              {isAddingStudent ? 'Adding...' : 'Add Student'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Students in This Class
          </CardTitle>
          <CardDescription>
            {students.length} student{students.length !== 1 ? 's' : ''} enrolled
          </CardDescription>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Students Yet</h3>
              <p className="text-muted-foreground">Add your first student using the form above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/20 transition-colors"
                >
                  <div>
                    <p className="font-medium">{student.first_name} {student.last_name}</p>
                    <p className="text-sm text-muted-foreground">Student ID: {student.student_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Enrolled</Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingStudentId === student.id}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Student</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {student.first_name} {student.last_name} from this class?
                            This action cannot be undone and will remove all their assessment data and progress records.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteStudent(student.id, `${student.first_name} ${student.last_name}`)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove Student
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
