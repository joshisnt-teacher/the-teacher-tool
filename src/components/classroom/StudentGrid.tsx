import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Plus, Star, Toilet } from "lucide-react";
import { useCreateStudentNote } from "@/hooks/useStudentNotes";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
  email?: string | null;
}

interface StudentGridProps {
  students: Student[];
  classSessionId?: string;
  isLessonActive: boolean;
  selectedStudents: Set<string>;
  onSelectionChange: (selectedStudents: Set<string>) => void;
}

export function StudentGrid({ students, classSessionId, isLessonActive, selectedStudents, onSelectionChange }: StudentGridProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [note, setNote] = useState("");
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<"Academic" | "Pastoral" | "Other">("Academic");
  // Map of student ID -> timestamp when they went to toilet
  const [studentsAtToilet, setStudentsAtToilet] = useState<Map<string, number>>(new Map());
  // Map of student ID -> Set of warning types already shown (to avoid duplicate warnings)
  const [shownWarnings, setShownWarnings] = useState<Map<string, Set<string>>>(new Map());
  const [isToiletReturnDialogOpen, setIsToiletReturnDialogOpen] = useState(false);
  
  const createNoteMutation = useCreateStudentNote();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-filled note options
  const quickNoteOptions = [
    { text: "Student correctly answered a check for understanding question.", rating: 2, category: "Academic" as const },
    { text: "Student was encouraging towards one of their peers.", rating: 3, category: "Pastoral" as const },
    { text: "Student had to move because they were disrupting peers around them.", rating: -2, category: "Pastoral" as const },
  ];

  // Check for toilet warnings every 10 seconds
  useEffect(() => {
    if (!isLessonActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const twoMinutes = 2 * 60 * 1000; // 2 minutes in milliseconds
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

      studentsAtToilet.forEach((timestamp, studentId) => {
        const elapsed = now - timestamp;
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        // Check for 2-minute warning
        if (elapsed >= twoMinutes && elapsed < twoMinutes + 10000) { // 10 second window
          const warnings = shownWarnings.get(studentId) || new Set();
          if (!warnings.has('2min')) {
            toast({
              title: "Toilet Reminder",
              description: `${student.first_name} ${student.last_name} has been at the toilet for 2 minutes. Please check if they need follow-up.`,
              duration: 5000,
            });
            setShownWarnings(prev => {
              const newMap = new Map(prev);
              const newSet = new Set(newMap.get(studentId) || []);
              newSet.add('2min');
              newMap.set(studentId, newSet);
              return newMap;
            });
          }
        }

        // Check for 5-minute warning
        if (elapsed >= fiveMinutes && elapsed < fiveMinutes + 10000) { // 10 second window
          const warnings = shownWarnings.get(studentId) || new Set();
          if (!warnings.has('5min')) {
            toast({
              title: "Toilet Reminder",
              description: `${student.first_name} ${student.last_name} has been at the toilet for 5 minutes. Please check if they have returned or need follow-up.`,
              duration: 5000,
            });
            setShownWarnings(prev => {
              const newMap = new Map(prev);
              const newSet = new Set(newMap.get(studentId) || []);
              newSet.add('5min');
              newMap.set(studentId, newSet);
              return newMap;
            });
          }
        }
      });
    }, 10000); // Check every 10 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLessonActive, studentsAtToilet, shownWarnings, students, toast]);

  const handleStudentClick = (student: Student, event: React.MouseEvent) => {
    // If clicking on checkbox or toilet button, don't open note dialog
    if ((event.target as HTMLElement).closest('[role="checkbox"]') || 
        (event.target as HTMLElement).closest('[data-toilet-button]')) {
      return;
    }

    // If student is at toilet, show return confirmation dialog
    if (studentsAtToilet.has(student.id)) {
      setSelectedStudent(student);
      setIsToiletReturnDialogOpen(true);
      return;
    }

    if (!isLessonActive || !classSessionId) {
      toast({
        title: "No Active Lesson",
        description: "Please start a lesson before adding notes.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedStudent(student);
    setIsNoteDialogOpen(true);
  };

  const handleToiletButtonClick = (student: Student, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!isLessonActive) {
      toast({
        title: "No Active Lesson",
        description: "Please start a lesson before marking toilet status.",
        variant: "destructive",
      });
      return;
    }

    if (studentsAtToilet.has(student.id)) {
      // Student is already at toilet, mark as returned
      setSelectedStudent(student);
      setIsToiletReturnDialogOpen(true);
    } else {
      // Mark student as at toilet with current timestamp
      const newMap = new Map(studentsAtToilet);
      newMap.set(student.id, Date.now());
      setStudentsAtToilet(newMap);
      // Clear any warnings for this student
      setShownWarnings(prev => {
        const newWarnings = new Map(prev);
        newWarnings.delete(student.id);
        return newWarnings;
      });
      toast({
        title: "Student at Toilet",
        description: `${student.first_name} ${student.last_name} has been marked as at the toilet.`,
      });
    }
  };

  const handleConfirmToiletReturn = async () => {
    if (!selectedStudent || !classSessionId) return;
    
    // Format the current time
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    // Create note text
    const noteText = `${selectedStudent.first_name} ${selectedStudent.last_name} went to the toilet at ${timeString}.`;
    
    try {
      // Create the note in Supabase
      await createNoteMutation.mutateAsync({
        student_id: selectedStudent.id,
        class_session_id: classSessionId,
        note: noteText,
        rating: 0,
        category: "Toilet",
      });
      
      // Remove student from toilet map
      const newMap = new Map(studentsAtToilet);
      newMap.delete(selectedStudent.id);
      setStudentsAtToilet(newMap);
      // Clear warnings for this student
      setShownWarnings(prev => {
        const newWarnings = new Map(prev);
        newWarnings.delete(selectedStudent.id);
        return newWarnings;
      });
      
      toast({
        title: "Student Returned",
        description: `${selectedStudent.first_name} ${selectedStudent.last_name} has been marked as returned from the toilet.`,
      });
      
      setIsToiletReturnDialogOpen(false);
      setSelectedStudent(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save toilet note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleQuickNoteClick = (quickNote: typeof quickNoteOptions[0]) => {
    setNote(quickNote.text);
    setRating(quickNote.rating);
    setCategory(quickNote.category);
  };

  const handleCheckboxChange = (studentId: string, checked: boolean) => {
    const newSelection = new Set(selectedStudents);
    if (checked) {
      newSelection.add(studentId);
    } else {
      newSelection.delete(studentId);
    }
    onSelectionChange(newSelection);
  };

  const handleSaveNote = async () => {
    if (!selectedStudent || !classSessionId || !note.trim()) {
      toast({
        title: "Invalid Note",
        description: "Please enter a note before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createNoteMutation.mutateAsync({
        student_id: selectedStudent.id,
        class_session_id: classSessionId,
        note: note.trim(),
        rating,
        category,
      });

      toast({
        title: "Note Saved",
        description: `Note saved for ${selectedStudent.first_name} ${selectedStudent.last_name}.`,
      });

      // Reset form
      setNote("");
      setRating(0);
      setCategory("Academic");
      setIsNoteDialogOpen(false);
      setSelectedStudent(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNoteDialogClose = (open: boolean) => {
    if (!open) {
      // Reset form when dialog closes
      setNote("");
      setRating(0);
      setCategory("Academic");
      setSelectedStudent(null);
    }
    setIsNoteDialogOpen(open);
  };

  const getRatingColor = (rating: number) => {
    if (rating > 0) return "text-green-600";
    if (rating < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    const absRating = Math.abs(rating);
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-3 h-3 ${
            i < absRating ? "fill-current" : ""
          } ${getRatingColor(rating)}`}
        />
      );
    }
    return stars;
  };

  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No students found in this class.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {students.map((student) => {
          const isAtToilet = studentsAtToilet.has(student.id);
          return (
            <Card 
              key={student.id} 
              className={`cursor-pointer hover:shadow-md transition-all relative ${
                isAtToilet ? "opacity-50 bg-gray-200" : ""
              }`}
              onClick={(e) => handleStudentClick(student, e)}
            >
              <CardContent className="p-4 text-center">
                {/* Checkbox for selection */}
                <div className="absolute top-2 left-2">
                  <Checkbox
                    checked={selectedStudents.has(student.id)}
                    onCheckedChange={(checked) => handleCheckboxChange(student.id, checked as boolean)}
                    className="bg-white/90"
                  />
                </div>
                
                {/* Toilet button */}
                {isLessonActive && (
                  <div className="absolute top-2 right-2">
                    <Button
                      data-toilet-button
                      variant={isAtToilet ? "default" : "outline"}
                      size="sm"
                      className={`h-7 w-7 p-0 ${
                        isAtToilet ? "bg-blue-600 hover:bg-blue-700" : ""
                      }`}
                      onClick={(e) => handleToiletButtonClick(student, e)}
                      title={isAtToilet ? "Mark as returned from toilet" : "Mark as at toilet"}
                    >
                      <Toilet className={`w-4 h-4 ${isAtToilet ? "text-white" : ""}`} />
                    </Button>
                  </div>
                )}
                
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  isAtToilet ? "bg-gray-300" : "bg-gray-100"
                }`}>
                  <User className={`w-6 h-6 ${isAtToilet ? "text-gray-500" : "text-gray-600"}`} />
                </div>
                <h3 className={`font-medium text-sm truncate ${
                  isAtToilet ? "text-gray-500" : ""
                }`}>
                  {student.first_name} {student.last_name}
                </h3>
                <p className={`text-xs truncate ${
                  isAtToilet ? "text-gray-400" : "text-gray-500"
                }`}>
                  {student.student_id}
                </p>
                {isLessonActive && !isAtToilet && (
                  <div className="mt-2">
                    <Plus className="w-4 h-4 mx-auto text-gray-400" />
                  </div>
                )}
                {isAtToilet && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      At Toilet
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={handleNoteDialogClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Note for {selectedStudent?.first_name} {selectedStudent?.last_name}</DialogTitle>
            <DialogDescription>
              Add a note and rating for this student during the current lesson.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Quick Note Options */}
            <div>
              <Label>Quick Note Options</Label>
              <div className="mt-1 space-y-2">
                {quickNoteOptions.map((quickNote, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    className="w-full text-left justify-start h-auto py-2 px-3 text-sm"
                    onClick={() => handleQuickNoteClick(quickNote)}
                  >
                    <span className="line-clamp-2">{quickNote.text}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                placeholder="Enter your note about this student..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rating">Rating (-5 to +5)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRating(Math.max(-5, rating - 1))}
                    disabled={rating <= -5}
                  >
                    -
                  </Button>
                  <div className="flex items-center gap-1 min-w-[100px] justify-center">
                    {getRatingStars(rating)}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRating(Math.min(5, rating + 1))}
                    disabled={rating >= 5}
                  >
                    +
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {rating > 0 ? "Positive" : rating < 0 ? "Negative" : "Neutral"}
                </p>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(value: "Academic" | "Pastoral" | "Other") => setCategory(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Pastoral">Pastoral</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNoteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={!note.trim() || createNoteMutation.isPending}
            >
              {createNoteMutation.isPending ? "Saving..." : "Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toilet Return Confirmation Dialog */}
      <Dialog open={isToiletReturnDialogOpen} onOpenChange={setIsToiletReturnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Student Returned from Toilet</DialogTitle>
            <DialogDescription>
              Confirm that {selectedStudent?.first_name} {selectedStudent?.last_name} has returned from the toilet.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsToiletReturnDialogOpen(false);
                setSelectedStudent(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmToiletReturn}
            >
              Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
