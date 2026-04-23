import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, UserPlus, Trash2, Upload, FileText, Search } from 'lucide-react';
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
import { useClasses, Class } from '@/hooks/useClasses';

interface ClassStudentsTabProps {
  classData: Class;
}

const parseStudentsCSV = (csvText: string) => {
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

  // --- data hooks ---
  const { data: students = [], isLoading: studentsLoading } = useStudents(classData.id);
  const { data: classes = [] } = useClasses();
  const { data: allStudents = [] } = useStudents();

  // --- state ---
  const [newStudent, setNewStudent] = useState({ first_name: '', last_name: '', student_id: '' });
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [activeAddTab, setActiveAddTab] = useState<'new' | 'existing'>('new');
  const [selectedSourceClassId, setSelectedSourceClassId] = useState<string>('');
  const [nameSearch, setNameSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isEnrolling, setIsEnrolling] = useState(false);

  // --- hook that depends on state ---
  // When no class is selected, this shares the ['students'] cache key with allStudents above — intentional.
  const { data: classFilteredStudents = [] } = useStudents(selectedSourceClassId || undefined);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('student_id', newStudent.student_id)
        .maybeSingle();

      let studentUuid: string;
      if (existing) {
        studentUuid = existing.id;
      } else {
        const { data: created, error: createError } = await supabase
          .from('students')
          .insert({
            first_name: newStudent.first_name,
            last_name: newStudent.last_name,
            student_id: newStudent.student_id,
            teacher_id: user.id,
          })
          .select('id')
          .single();
        if (createError) throw createError;
        studentUuid = created.id;
      }

      const { error: enrolError } = await supabase
        .from('enrolments')
        .upsert({ class_id: classData.id, student_id: studentUuid }, { ignoreDuplicates: true });
      if (enrolError) throw enrolError;

      await queryClient.invalidateQueries({ queryKey: ['students', classData.id] });
      setNewStudent({ first_name: '', last_name: '', student_id: '' });
      toast({ title: 'Student Added', description: `${newStudent.first_name} ${newStudent.last_name} has been added to the class.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to add student.', variant: 'destructive' });
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleRemoveFromClass = async (studentId: string, studentName: string) => {
    setDeletingStudentId(studentId);
    try {
      const { error: enrolError } = await supabase
        .from('enrolments')
        .delete()
        .eq('class_id', classData.id)
        .eq('student_id', studentId);
      if (enrolError) throw enrolError;

      const { data: remainingEnrolments } = await supabase
        .from('enrolments')
        .select('class_id')
        .eq('student_id', studentId);

      if (!remainingEnrolments || remainingEnrolments.length === 0) {
        await supabase.from('students').delete().eq('id', studentId);
      }

      await queryClient.invalidateQueries({ queryKey: ['students', classData.id] });
      toast({ title: 'Student Removed', description: `${studentName} has been removed from this class.` });
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const csvText = await csvFile.text();
      const parsedStudents = parseStudentsCSV(csvText);

      if (parsedStudents.length === 0) {
        toast({ title: 'No Students Found', description: 'The CSV file appears to be empty or contains no valid student data.', variant: 'destructive' });
        return;
      }

      const incomingIds = parsedStudents.map(s => s.student_id);

      const { data: existing, error: fetchError } = await supabase
        .from('students')
        .select('id, student_id')
        .eq('teacher_id', user.id)
        .in('student_id', incomingIds);
      if (fetchError) throw fetchError;

      const existingMap = new Map<string, string>(existing?.map(s => [s.student_id, s.id]) ?? []);

      const toCreate = parsedStudents.filter(s => !existingMap.has(s.student_id));
      if (toCreate.length > 0) {
        const { data: created, error: createError } = await supabase
          .from('students')
          .insert(toCreate.map(s => ({ ...s, teacher_id: user.id })))
          .select('id, student_id');
        if (createError) throw createError;
        created?.forEach(s => existingMap.set(s.student_id, s.id));
      }

      const { error: enrolError } = await supabase
        .from('enrolments')
        .upsert(
          [...existingMap.values()].map(id => ({ class_id: classData.id, student_id: id })),
          { ignoreDuplicates: true }
        );
      if (enrolError) throw enrolError;

      await queryClient.invalidateQueries({ queryKey: ['students', classData.id] });
      setCsvFile(null);
      toast({
        title: 'Students Processed',
        description: `${parsedStudents.length} student${parsedStudents.length !== 1 ? 's' : ''} added or confirmed in this class.`,
      });
    } catch (error: any) {
      toast({ title: 'CSV Upload Error', description: error.message || 'Failed to process CSV file.', variant: 'destructive' });
    } finally {
      setIsUploadingCSV(false);
    }
  };

  const enrolledIdSet = new Set(students.map(s => s.id));
  const otherClasses = classes.filter(c => c.id !== classData.id);
  const candidatePool = selectedSourceClassId ? classFilteredStudents : allStudents;
  const filteredCandidates = candidatePool
    .filter(s => !enrolledIdSet.has(s.id))
    .filter(s => {
      if (!nameSearch.trim()) return true;
      const full = `${s.first_name} ${s.last_name}`.toLowerCase();
      return full.includes(nameSearch.toLowerCase());
    });
  const allFilteredSelected =
    filteredCandidates.length > 0 && filteredCandidates.every(s => selectedIds.has(s.id));
  const selectedClassName = otherClasses.find(c => c.id === selectedSourceClassId)?.class_name;

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredCandidates.forEach(s => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredCandidates.forEach(s => next.add(s.id));
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Student Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Student
          </CardTitle>
          <CardDescription>
            Add a new student or enroll an existing student from another class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeAddTab} onValueChange={(v) => setActiveAddTab(v as 'new' | 'existing')}>
            <TabsList className="mb-4">
              <TabsTrigger value="new">New Student</TabsTrigger>
              <TabsTrigger value="existing">Existing Student</TabsTrigger>
            </TabsList>

            <TabsContent value="new">
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
            </TabsContent>

            <TabsContent value="existing">
              {otherClasses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">You don't have any other classes to enroll students from yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Filters row */}
                  <div className="flex gap-3">
                    <Select value={selectedSourceClassId} onValueChange={setSelectedSourceClassId}>
                      <SelectTrigger className="w-52">
                        <SelectValue placeholder="All classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All classes</SelectItem>
                        {otherClasses.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="Search by name..."
                        value={nameSearch}
                        onChange={e => setNameSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Candidate list */}
                  {filteredCandidates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">
                        {nameSearch.trim()
                          ? 'No students match your search.'
                          : 'All your students are already enrolled in this class.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Select-all row */}
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Checkbox
                          id="select-all-existing"
                          checked={allFilteredSelected}
                          onCheckedChange={toggleAll}
                        />
                        <label
                          htmlFor="select-all-existing"
                          className="text-sm text-muted-foreground cursor-pointer select-none"
                        >
                          {allFilteredSelected
                            ? 'Deselect all'
                            : `Select all (${filteredCandidates.length})`}
                        </label>
                      </div>

                      {/* Scrollable student list */}
                      <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                        {filteredCandidates.map(student => (
                          <div
                            key={student.id}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30 cursor-pointer transition-colors"
                            onClick={() => toggleStudent(student.id)}
                          >
                            <Checkbox
                              checked={selectedIds.has(student.id)}
                              onCheckedChange={() => toggleStudent(student.id)}
                              onClick={e => e.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm leading-tight">
                                {student.first_name} {student.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">ID: {student.student_id}</p>
                            </div>
                            {selectedSourceClassId && selectedClassName && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                {selectedClassName}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Enroll button — disabled placeholder, Task 3 will wire this up */}
                      <div className="flex justify-end pt-2">
                        <Button disabled={selectedIds.size === 0}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          {selectedIds.size > 0 ? `Enroll ${selectedIds.size} Selected` : 'Enroll Selected'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
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
                            This only removes them from this class — their record and any other class enrolments will not be affected.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveFromClass(student.id, `${student.first_name} ${student.last_name}`)}
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
