import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Play, Square, Users, Clock, Shuffle, Users2, Settings } from "lucide-react";
import { useClasses } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import { useClassSessions, useCreateClassSession, useUpdateClassSession, useCurrentClassSession } from "@/hooks/useClassSessions";
import { useStudentNotesForSession } from "@/hooks/useStudentNotes";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StudentGrid } from "@/components/classroom/StudentGrid";
import { ClassroomModules } from "@/components/classroom/ClassroomModules";
import { ClassroomActivities } from "@/components/classroom/ClassroomActivities";
import { ClassroomThemeProvider, useClassroomTheme, colorThemes } from "@/contexts/ClassroomThemeContext";
import { cn } from "@/lib/utils";

function ClassroomContent() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: classes } = useClasses();
  const { data: students } = useStudents(classId || "");
  const { data: currentSession, refetch: refetchCurrentSession } = useCurrentClassSession(classId || "");
  const { data: sessionNotes } = useStudentNotesForSession(currentSession?.id || "");
  
  const createSessionMutation = useCreateClassSession();
  const updateSessionMutation = useUpdateClassSession();

  // Student selection state for Name Picker and Group Assigner
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set(students?.map(s => s.id) || [])
  );

  // Update selected students when students data changes
  useEffect(() => {
    if (students) {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  }, [students]);

  const currentClass = classes?.find(c => c.id === classId);
  const isLessonActive = !!currentSession && !currentSession.ended_at;
  const { selectedTheme, setSelectedTheme } = useClassroomTheme();

  // Debug logging
  console.log('Classroom Debug:', {
    classId,
    currentSession,
    isLessonActive,
    sessionNotes: sessionNotes?.length || 0
  });
  
  // Timer state
  const [lessonDuration, setLessonDuration] = useState(0);
  const [showEndLessonDialog, setShowEndLessonDialog] = useState(false);
  
  // Lesson form state
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLessonActive && currentSession?.started_at) {
      const startTime = new Date(currentSession.started_at).getTime();
      
      interval = setInterval(() => {
        const now = new Date().getTime();
        const elapsed = Math.floor((now - startTime) / 1000);
        setLessonDuration(elapsed);
      }, 1000);
    } else {
      setLessonDuration(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLessonActive, currentSession?.started_at]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartLesson = async () => {
    if (!classId) return;
    
    try {
      await createSessionMutation.mutateAsync({
        class_id: classId,
        started_at: new Date().toISOString(),
      });
      
      // Manually refetch the current session to ensure UI updates
      await refetchCurrentSession();
      
      toast({
        title: "Lesson Started",
        description: "Your lesson has been started successfully.",
      });
    } catch (error) {
      console.error('Error starting lesson:', error);
      toast({
        title: "Error",
        description: "Failed to start lesson. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveLesson = async () => {
    if (!currentSession || !lessonTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a lesson title before saving.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateSessionMutation.mutateAsync({
        id: currentSession.id,
        data: {
          ended_at: new Date().toISOString(),
          title: lessonTitle.trim(),
          description: lessonDescription.trim() || null,
        },
      });
      
      // Manually refetch the current session to ensure UI updates
      await refetchCurrentSession();
      
      toast({
        title: "Lesson Saved",
        description: `"${lessonTitle}" has been saved successfully. Duration: ${formatDuration(lessonDuration)}`,
      });
      
      // Reset form and close dialog
      setLessonTitle("");
      setLessonDescription("");
      setShowEndLessonDialog(false);
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast({
        title: "Error",
        description: "Failed to save lesson. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLesson = async () => {
    if (!currentSession) return;
    
    try {
      // Delete the session (this will also delete associated notes due to CASCADE)
      const { error } = await supabase
        .from("class_sessions")
        .delete()
        .eq("id", currentSession.id);
      
      if (error) throw error;
      
      // Manually refetch the current session to ensure UI updates
      await refetchCurrentSession();
      
      toast({
        title: "Lesson Deleted",
        description: "The lesson and all associated notes have been deleted.",
      });
      
      // Reset form and close dialog
      setLessonTitle("");
      setLessonDescription("");
      setShowEndLessonDialog(false);
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast({
        title: "Error",
        description: "Failed to delete lesson. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEndLessonClick = () => {
    setShowEndLessonDialog(true);
  };

  if (!classId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Classroom</h1>
          <p className="text-gray-600">Select a class to access the classroom tools.</p>
        </div>
        
        {classes && classes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {classes.map((classItem) => (
              <Card 
                key={classItem.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/classroom/${classItem.id}`)}
              >
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{classItem.class_name}</h3>
                  <p className="text-gray-600 mb-2">{classItem.subject}</p>
                  <p className="text-sm text-gray-500">{classItem.year_level} • {classItem.term}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600">No classes found. Create a class first to access the classroom.</p>
            <Button 
              onClick={() => navigate('/create-class')}
              className="mt-4"
            >
              Create Class
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (!currentClass) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Classroom</h1>
          <p className="text-gray-600">Class not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classroom</h1>
          <p className="text-gray-600">{currentClass.class_name} • {currentClass.subject}</p>
        </div>
        
        {/* Lesson Control */}
        <div className="flex items-center gap-4">
          {isLessonActive ? (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <Badge variant="default" className="bg-green-100 text-green-800 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Lesson Active
                </Badge>
                <div className="text-2xl font-mono font-bold text-green-600">
                  {formatDuration(lessonDuration)}
                </div>
              </div>
              <Button
                onClick={handleEndLessonClick}
                variant="outline"
                size="lg"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Square className="w-5 h-5 mr-2" />
                End Lesson
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleStartLesson}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
              disabled={createSessionMutation.isPending}
            >
              <Play className="w-5 h-5 mr-2" />
              Start Lesson
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Grid - Takes up 2 columns on large screens */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Students ({students?.length || 0})
              </CardTitle>
              <CardDescription>
                Click on a student to add notes and ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentGrid 
                students={students || []} 
                classSessionId={currentSession?.id}
                isLessonActive={isLessonActive}
                selectedStudents={selectedStudents}
                onSelectionChange={setSelectedStudents}
              />
            </CardContent>
          </Card>

          {/* Activities Section */}
          <ClassroomActivities classId={classId} />
        </div>

        {/* Modules Section */}
        <div className="space-y-6">
          {/* Global Theme Picker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5" />
                Theme Settings
              </CardTitle>
              <CardDescription>
                Choose a color theme for all classroom tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(colorThemes).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTheme(key)}
                    className={cn(
                      "relative h-12 rounded-lg transition-all duration-200",
                      "bg-gradient-to-br shadow-sm border-2",
                      theme.preview,
                      selectedTheme === key
                        ? "ring-2 ring-offset-2 ring-blue-500 scale-105 border-white"
                        : "border-transparent hover:scale-105 opacity-80 hover:opacity-100"
                    )}
                    title={theme.name}
                  >
                    {selectedTheme === key && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-3 text-center">
                {colorThemes[selectedTheme]?.name} theme selected
              </p>
            </CardContent>
          </Card>

          <ClassroomModules 
            students={students || []}
            isLessonActive={isLessonActive}
            selectedStudents={selectedStudents}
          />
        </div>
      </div>

      {/* Session Notes Summary */}
      {isLessonActive && sessionNotes && sessionNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Session Notes ({sessionNotes.length})</CardTitle>
            <CardDescription>
              Notes taken during this lesson
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessionNotes.map((note) => (
                <div key={note.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {note.students.first_name} {note.students.last_name}
                    </span>
                    <Badge 
                      variant={note.rating >= 0 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {note.rating > 0 ? "+" : ""}{note.rating}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{note.note}</p>
                  <Badge variant="outline" className="text-xs">
                    {note.category}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* End Lesson Dialog */}
      <Dialog open={showEndLessonDialog} onOpenChange={setShowEndLessonDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End Lesson</DialogTitle>
            <DialogDescription>
              You are about to end the lesson. Please add a title and description to save this lesson.
              <br />
              <br />
              <strong>Lesson Duration:</strong> {formatDuration(lessonDuration)}
              <br />
              <strong>Notes Taken:</strong> {sessionNotes?.length || 0}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="lesson-title">Lesson Title *</Label>
              <Input
                id="lesson-title"
                placeholder="e.g., Introduction to Fractions"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="lesson-description">Description (Optional)</Label>
              <Textarea
                id="lesson-description"
                placeholder="Brief description of what was covered in this lesson..."
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEndLessonDialog(false);
                setLessonTitle("");
                setLessonDescription("");
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteLesson}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              Delete Lesson
            </Button>
            <Button
              onClick={handleSaveLesson}
              disabled={!lessonTitle.trim() || updateSessionMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateSessionMutation.isPending ? "Saving..." : "Save Lesson"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Classroom() {
  return (
    <ClassroomThemeProvider>
      <ClassroomContent />
    </ClassroomThemeProvider>
  );
}
