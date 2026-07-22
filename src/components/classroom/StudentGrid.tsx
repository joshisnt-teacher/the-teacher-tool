import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Plus, Star, DoorOpen, ThumbsUp, AlertTriangle, Settings, Trash2 } from "lucide-react";
import { useCreateStudentNote } from "@/hooks/useStudentNotes";
import { useToast } from "@/hooks/use-toast";

// --- Quick notes ---
type QuickNote = { text: string; rating: number; category: "Academic" | "Pastoral" | "Other" };

const DEFAULT_QUICK_NOTES: QuickNote[] = [
  { text: "Student correctly answered a check for understanding question.", rating: 2, category: "Academic" },
  { text: "Student was encouraging towards one of their peers.", rating: 3, category: "Pastoral" },
  { text: "Student had to move because they were disrupting peers around them.", rating: -2, category: "Pastoral" },
];

const QUICK_NOTES_KEY = "classroom_quick_notes";

function loadQuickNotes(): QuickNote[] {
  try {
    const stored = localStorage.getItem(QUICK_NOTES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_QUICK_NOTES;
}

function formatElapsed(startedAt: number): string {
  const minutes = Math.floor((Date.now() - startedAt) / 60000);
  return minutes < 1 ? "just now" : `${minutes} min`;
}

// --- Types ---
interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
  email?: string | null;
}

type ActionTab = "note" | "strike" | "commend" | "leave-room";

interface StudentGridProps {
  students: Student[];
  classSessionId?: string;
  isLessonActive: boolean;
  selectedStudents: Set<string>;
  onSelectionChange: (selectedStudents: Set<string>) => void;
}

export function StudentGrid({ students, classSessionId, isLessonActive, selectedStudents, onSelectionChange }: StudentGridProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Unified action dialog
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActionTab>("note");

  // Note tab
  const [note, setNote] = useState("");
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<"Academic" | "Pastoral" | "Other">("Academic");

  // Quick notes
  const [quickNoteOptions, setQuickNoteOptions] = useState<QuickNote[]>(loadQuickNotes);
  const [isManagingQuickNotes, setIsManagingQuickNotes] = useState(false);
  const [newQuickNoteText, setNewQuickNoteText] = useState("");
  const [newQuickNoteRating, setNewQuickNoteRating] = useState(0);
  const [newQuickNoteCategory, setNewQuickNoteCategory] = useState<"Academic" | "Pastoral" | "Other">("Academic");

  // Strike tab (per session, resets on page reload)
  const [studentStrikes, setStudentStrikes] = useState<Map<string, number>>(new Map());
  const [strikeReason, setStrikeReason] = useState("");

  // Commend tab
  const [studentCommendations, setStudentCommendations] = useState<Map<string, number>>(new Map());
  const [commendationReason, setCommendationReason] = useState("");

  // Leave Room tab
  const [studentsAway, setStudentsAway] = useState<Map<string, number>>(new Map());
  const [shownWarnings, setShownWarnings] = useState<Map<string, Set<string>>>(new Map());
  const [, forceTick] = useState(0);

  const createNoteMutation = useCreateStudentNote();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Persist quick notes to localStorage
  useEffect(() => {
    localStorage.setItem(QUICK_NOTES_KEY, JSON.stringify(quickNoteOptions));
  }, [quickNoteOptions]);

  // Leave-room warning interval — also forces a re-render so elapsed-time
  // badges/labels stay roughly current without a separate ticking timer.
  useEffect(() => {
    if (!isLessonActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      forceTick((t) => t + 1);
      const now = Date.now();
      const twoMinutes = 2 * 60 * 1000;
      const fiveMinutes = 5 * 60 * 1000;

      studentsAway.forEach((timestamp, studentId) => {
        const elapsed = now - timestamp;
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        if (elapsed >= twoMinutes && elapsed < twoMinutes + 10000) {
          const warnings = shownWarnings.get(studentId) || new Set();
          if (!warnings.has('2min')) {
            toast({
              title: "Left Room Reminder",
              description: `${student.first_name} ${student.last_name} has been out of the room for 2 minutes.`,
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

        if (elapsed >= fiveMinutes && elapsed < fiveMinutes + 10000) {
          const warnings = shownWarnings.get(studentId) || new Set();
          if (!warnings.has('5min')) {
            toast({
              title: "Left Room Reminder",
              description: `${student.first_name} ${student.last_name} has been out of the room for 5 minutes.`,
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
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLessonActive, studentsAway, shownWarnings, students, toast]);

  // --- Handlers ---

  const handleTileClick = (student: Student, event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('[role="checkbox"]')) return;

    if (!isLessonActive || !classSessionId) {
      toast({ title: "No Active Lesson", description: "Please start a lesson before logging anything for a student.", variant: "destructive" });
      return;
    }

    setSelectedStudent(student);
    setActiveTab(studentsAway.has(student.id) ? "leave-room" : "note");
    setNote("");
    setRating(0);
    setCategory("Academic");
    setStrikeReason("");
    setCommendationReason("");
    setIsActionDialogOpen(true);
  };

  const handleActionDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedStudent(null);
      setNote("");
      setRating(0);
      setCategory("Academic");
      setStrikeReason("");
      setCommendationReason("");
    }
    setIsActionDialogOpen(open);
  };

  const handleMarkLeftRoom = () => {
    if (!selectedStudent) return;
    const newMap = new Map(studentsAway);
    newMap.set(selectedStudent.id, Date.now());
    setStudentsAway(newMap);
    setShownWarnings(prev => { const m = new Map(prev); m.delete(selectedStudent.id); return m; });
    toast({ title: "Student Left Room", description: `${selectedStudent.first_name} ${selectedStudent.last_name} has been marked as out of the room.` });
    setIsActionDialogOpen(false);
    setSelectedStudent(null);
  };

  const handleConfirmReturn = async () => {
    if (!selectedStudent || !classSessionId) return;
    const startedAt = studentsAway.get(selectedStudent.id);
    if (!startedAt) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const duration = formatElapsed(startedAt);
    const noteText = `${selectedStudent.first_name} ${selectedStudent.last_name} left the room at ${timeString}, returned after ${duration}.`;

    try {
      await createNoteMutation.mutateAsync({
        student_id: selectedStudent.id,
        class_session_id: classSessionId,
        note: noteText,
        rating: 0,
        category: "Left Room",
      });

      const newMap = new Map(studentsAway);
      newMap.delete(selectedStudent.id);
      setStudentsAway(newMap);
      setShownWarnings(prev => { const m = new Map(prev); m.delete(selectedStudent.id); return m; });

      toast({ title: "Student Returned", description: `${selectedStudent.first_name} ${selectedStudent.last_name} has returned.` });
      setIsActionDialogOpen(false);
      setSelectedStudent(null);
    } catch {
      toast({ title: "Error", description: "Failed to save leave-room note.", variant: "destructive" });
    }
  };

  const handleConfirmStrike = async () => {
    if (!selectedStudent || !classSessionId || !strikeReason.trim()) return;
    const newCount = (studentStrikes.get(selectedStudent.id) || 0) + 1;

    try {
      await createNoteMutation.mutateAsync({
        student_id: selectedStudent.id,
        class_session_id: classSessionId,
        note: `Strike ${newCount}/3: ${strikeReason.trim()}`,
        rating: -3,
        category: "Strike",
      });

      setStudentStrikes(prev => { const m = new Map(prev); m.set(selectedStudent.id, newCount); return m; });
      toast({ title: `Strike ${newCount}/3 Added`, description: `${selectedStudent.first_name} ${selectedStudent.last_name}` });
      setIsActionDialogOpen(false);
      setSelectedStudent(null);
      setStrikeReason("");
    } catch {
      toast({ title: "Error", description: "Failed to save strike.", variant: "destructive" });
    }
  };

  const handleConfirmCommendation = async () => {
    if (!selectedStudent || !classSessionId || !commendationReason.trim()) return;

    try {
      await createNoteMutation.mutateAsync({
        student_id: selectedStudent.id,
        class_session_id: classSessionId,
        note: `Commendation: ${commendationReason.trim()}`,
        rating: 3,
        category: "Commendation",
      });

      setStudentCommendations(prev => { const m = new Map(prev); m.set(selectedStudent.id, (prev.get(selectedStudent.id) || 0) + 1); return m; });
      toast({ title: "Commendation Given", description: `${selectedStudent.first_name} ${selectedStudent.last_name} has been commended.` });
      setIsActionDialogOpen(false);
      setSelectedStudent(null);
      setCommendationReason("");
    } catch {
      toast({ title: "Error", description: "Failed to save commendation.", variant: "destructive" });
    }
  };

  const handleQuickNoteClick = (qn: QuickNote) => {
    setNote(qn.text);
    setRating(qn.rating);
    setCategory(qn.category);
  };

  const handleAddQuickNote = () => {
    if (!newQuickNoteText.trim()) return;
    setQuickNoteOptions(prev => [...prev, { text: newQuickNoteText.trim(), rating: newQuickNoteRating, category: newQuickNoteCategory }]);
    setNewQuickNoteText("");
    setNewQuickNoteRating(0);
    setNewQuickNoteCategory("Academic");
  };

  const handleRemoveQuickNote = (index: number) => {
    setQuickNoteOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckboxChange = (studentId: string, checked: boolean) => {
    const next = new Set(selectedStudents);
    if (checked) next.add(studentId); else next.delete(studentId);
    onSelectionChange(next);
  };

  const handleSaveNote = async () => {
    if (!selectedStudent || !classSessionId || !note.trim()) {
      toast({ title: "Invalid Note", description: "Please enter a note before saving.", variant: "destructive" });
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

      toast({ title: "Note Saved", description: `Note saved for ${selectedStudent.first_name} ${selectedStudent.last_name}.` });
      setIsActionDialogOpen(false);
      setSelectedStudent(null);
      setNote("");
      setRating(0);
      setCategory("Academic");
    } catch {
      toast({ title: "Error", description: "Failed to save note.", variant: "destructive" });
    }
  };

  const getRatingColor = (r: number) => r > 0 ? "text-green-600" : r < 0 ? "text-red-600" : "text-gray-600";

  const getRatingStars = (r: number) => {
    const abs = Math.abs(r);
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-3 h-3 ${i < abs ? "fill-current" : ""} ${getRatingColor(r)}`} />
    ));
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
          const isAway = studentsAway.has(student.id);
          const strikes = studentStrikes.get(student.id) || 0;
          const commendations = studentCommendations.get(student.id) || 0;
          const atMaxStrikes = strikes >= 3;
          const awaySince = studentsAway.get(student.id);

          return (
            <Card
              key={student.id}
              className={`cursor-pointer hover:shadow-md transition-all relative ${
                isAway ? "opacity-50 bg-gray-200" :
                atMaxStrikes ? "border-red-400 bg-red-50" : ""
              }`}
              onClick={(e) => handleTileClick(student, e)}
            >
              <CardContent className="p-4 text-center">
                {/* Checkbox */}
                <div className="absolute top-2 left-2">
                  <Checkbox
                    checked={selectedStudents.has(student.id)}
                    onCheckedChange={(checked) => handleCheckboxChange(student.id, checked as boolean)}
                    className="bg-white/90"
                  />
                </div>

                {/* Strike / commendation badges */}
                {isLessonActive && !isAway && (strikes > 0 || commendations > 0) && (
                  <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                    {strikes > 0 && (
                      <Badge variant="destructive" className="text-xs h-5 px-1.5 gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {strikes}/3
                      </Badge>
                    )}
                    {commendations > 0 && (
                      <Badge className="text-xs h-5 px-1.5 gap-1 bg-yellow-500 hover:bg-yellow-500">
                        <ThumbsUp className="w-3 h-3" />
                        {commendations}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 mt-2 ${
                  isAway ? "bg-gray-300" : atMaxStrikes ? "bg-red-100" : "bg-gray-100"
                }`}>
                  <User className={`w-6 h-6 ${isAway ? "text-gray-500" : atMaxStrikes ? "text-red-600" : "text-gray-600"}`} />
                </div>

                <h3 className={`font-medium text-sm truncate ${isAway ? "text-gray-500" : ""}`}>
                  {student.first_name} {student.last_name}
                </h3>
                <p className={`text-xs truncate ${isAway ? "text-gray-400" : "text-gray-500"}`}>
                  {student.student_id}
                </p>

                {isAway && awaySince && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs gap-1">
                      <DoorOpen className="w-3 h-3" />
                      Left Room · {formatElapsed(awaySince)}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Unified Action Dialog ── */}
      <Dialog open={isActionDialogOpen} onOpenChange={handleActionDialogClose}>
        <DialogContent className="max-w-3xl top-[10vh] translate-y-0 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedStudent?.first_name} {selectedStudent?.last_name}</DialogTitle>
            <DialogDescription>Log a note, strike, commendation, or leave-room event for this student.</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActionTab)}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="note">Note</TabsTrigger>
              <TabsTrigger value="strike" disabled={(studentStrikes.get(selectedStudent?.id || "") || 0) >= 3}>Strike</TabsTrigger>
              <TabsTrigger value="commend">Commend</TabsTrigger>
              <TabsTrigger value="leave-room">Leave Room</TabsTrigger>
            </TabsList>

            {/* Note tab */}
            <TabsContent value="note" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Quick Notes</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 gap-1 text-xs text-gray-500"
                    onClick={() => setIsManagingQuickNotes(true)}
                  >
                    <Settings className="w-3 h-3" />
                    Manage
                  </Button>
                </div>
                <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                  {quickNoteOptions.map((qn, i) => (
                    <Button
                      key={i}
                      type="button"
                      variant="outline"
                      className="w-full text-left justify-start h-auto py-2 px-3 text-sm whitespace-normal"
                      onClick={() => handleQuickNoteClick(qn)}
                    >
                      {qn.text}
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
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rating (-5 to +5)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => setRating(Math.max(-5, rating - 1))} disabled={rating <= -5}>-</Button>
                    <div className="flex items-center gap-1 min-w-[100px] justify-center">{getRatingStars(rating)}</div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setRating(Math.min(5, rating + 1))} disabled={rating >= 5}>+</Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{rating > 0 ? "Positive" : rating < 0 ? "Negative" : "Neutral"}</p>
                </div>

                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v: "Academic" | "Pastoral" | "Other") => setCategory(v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Academic">Academic</SelectItem>
                      <SelectItem value="Pastoral">Pastoral</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveNote} disabled={!note.trim() || createNoteMutation.isPending}>
                  {createNoteMutation.isPending ? "Saving..." : "Save Note"}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* Strike tab */}
            <TabsContent value="strike" className="space-y-4">
              <div className="flex items-center gap-2 text-red-600 font-medium">
                <AlertTriangle className="w-5 h-5" />
                Strike {(studentStrikes.get(selectedStudent?.id || "") || 0) + 1}/3
              </div>
              <div>
                <Label htmlFor="strikeReason">Reason</Label>
                <Textarea
                  id="strikeReason"
                  placeholder="e.g. Repeatedly talking while teacher was explaining..."
                  value={strikeReason}
                  onChange={(e) => setStrikeReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleConfirmStrike} disabled={!strikeReason.trim() || createNoteMutation.isPending}>
                  Add Strike
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* Commend tab */}
            <TabsContent value="commend" className="space-y-4">
              <div className="flex items-center gap-2 text-yellow-600 font-medium">
                <ThumbsUp className="w-5 h-5" />
                Give a commendation
              </div>
              <div>
                <Label htmlFor="commendationReason">Reason</Label>
                <Textarea
                  id="commendationReason"
                  placeholder="e.g. Showed excellent initiative and helped a classmate..."
                  value={commendationReason}
                  onChange={(e) => setCommendationReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>Cancel</Button>
                <Button
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  onClick={handleConfirmCommendation}
                  disabled={!commendationReason.trim() || createNoteMutation.isPending}
                >
                  Give Commendation
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* Leave Room tab */}
            <TabsContent value="leave-room" className="space-y-4">
              {selectedStudent && studentsAway.has(selectedStudent.id) ? (
                <>
                  <div className="flex items-center gap-2 text-gray-700">
                    <DoorOpen className="w-5 h-5" />
                    Out of the room for {formatElapsed(studentsAway.get(selectedStudent.id)!)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Confirm that {selectedStudent.first_name} {selectedStudent.last_name} has returned.
                  </p>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmReturn} disabled={createNoteMutation.isPending}>
                      Confirm Return
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Mark {selectedStudent?.first_name} {selectedStudent?.last_name} as having left the room (toilet, office, locker, etc).
                    You'll get a reminder toast at 2 and 5 minutes.
                  </p>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleMarkLeftRoom}>
                      <DoorOpen className="w-4 h-4 mr-1.5" />
                      Mark as Left Room
                    </Button>
                  </DialogFooter>
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ── Manage Quick Notes Dialog ── */}
      <Dialog open={isManagingQuickNotes} onOpenChange={setIsManagingQuickNotes}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Quick Notes</DialogTitle>
            <DialogDescription>Add or remove quick note templates that appear in the note dialog.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {quickNoteOptions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No quick notes. Add one below.</p>
            )}
            {quickNoteOptions.map((qn, i) => (
              <div key={i} className="flex items-start gap-2 p-2 border rounded-lg bg-gray-50">
                <div className="flex-1 text-sm">{qn.text}</div>
                <Badge variant="outline" className="text-xs shrink-0">{qn.category}</Badge>
                <span className={`text-xs shrink-0 font-medium ${qn.rating > 0 ? "text-green-600" : qn.rating < 0 ? "text-red-600" : "text-gray-400"}`}>
                  {qn.rating > 0 ? "+" : ""}{qn.rating}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-400 hover:text-red-600 shrink-0"
                  onClick={() => handleRemoveQuickNote(i)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <Label className="font-semibold text-sm">Add New Quick Note</Label>
            <Textarea
              placeholder="Quick note text..."
              value={newQuickNoteText}
              onChange={(e) => setNewQuickNoteText(e.target.value)}
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={newQuickNoteCategory} onValueChange={(v: "Academic" | "Pastoral" | "Other") => setNewQuickNoteCategory(v)}>
                  <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Pastoral">Pastoral</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Rating ({newQuickNoteRating > 0 ? "+" : ""}{newQuickNoteRating})</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setNewQuickNoteRating(Math.max(-5, newQuickNoteRating - 1))}>-</Button>
                  <span className={`flex-1 text-center text-sm font-medium ${getRatingColor(newQuickNoteRating)}`}>
                    {newQuickNoteRating > 0 ? "+" : ""}{newQuickNoteRating}
                  </span>
                  <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setNewQuickNoteRating(Math.min(5, newQuickNoteRating + 1))}>+</Button>
                </div>
              </div>
            </div>
            <Button onClick={handleAddQuickNote} disabled={!newQuickNoteText.trim()} className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              Add Quick Note
            </Button>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsManagingQuickNotes(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
