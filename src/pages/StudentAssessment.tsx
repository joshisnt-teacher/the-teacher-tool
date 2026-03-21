import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';

interface Assessment {
  id: string;
  name: string;
  question_text: string;
  task_type: string;
  class_id: string;
}

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  class_id: string;
}

const StudentAssessment = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [studentId, setStudentId] = useState('');
  const [validatedStudent, setValidatedStudent] = useState<Student | null>(null);
  const [confidenceRating, setConfidenceRating] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch assessment details
  const { data: assessment, isLoading: assessmentLoading } = useQuery({
    queryKey: ['public-assessment', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, name, task_type, class_id')
        .eq('id', assessmentId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Assessment | null;
    },
    enabled: !!assessmentId,
  });

  // Check if student already submitted
  const { data: existingResponse } = useQuery({
    queryKey: ['student-response', assessmentId, validatedStudent?.id],
    queryFn: async () => {
      if (!validatedStudent) return null;
      
      const { data, error } = await supabase
        .from('student_responses')
        .select('*')
        .eq('task_id', assessmentId)
        .eq('student_id', validatedStudent.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!validatedStudent && !!assessmentId,
  });

  // Validate student ID
  const validateStudent = useMutation({
    mutationFn: async (inputStudentId: string) => {
      if (!assessment) throw new Error('Assessment not found');
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', inputStudentId)
        .eq('class_id', assessment.class_id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Student ID not found in this class');
      
      return data as Student;
    },
    onSuccess: (student) => {
      setValidatedStudent(student);
      toast({
        title: "Student verified",
        description: `Welcome, ${student.first_name} ${student.last_name}!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Invalid Student ID",
        description: error.message,
        variant: "destructive",
      });
      setValidatedStudent(null);
    },
  });

  // Submit confidence rating
  const submitResponse = useMutation({
    mutationFn: async () => {
      if (!validatedStudent || confidenceRating === null) {
        throw new Error('Missing required data');
      }

      const { error } = await supabase
        .from('student_responses')
        .insert({
          task_id: assessmentId,
          student_id: validatedStudent.id,
          confidence_rating: confidenceRating,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Response submitted!",
        description: "Thank you for completing the assessment.",
      });
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStudentIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId.trim()) {
      validateStudent.mutate(studentId.trim());
    }
  };

  const handleConfidenceSubmit = () => {
    if (confidenceRating !== null) {
      submitResponse.mutate();
    }
  };

  if (assessmentLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Assessment Not Found</h2>
            <p className="text-muted-foreground">
              The assessment you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{assessment.name}</h1>
          <Badge className="mb-4">
            {assessment.task_type}
          </Badge>
        </div>

        {/* Student ID Input */}
        {!validatedStudent && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Enter Your Student ID
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStudentIdSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter your student ID"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={validateStudent.isPending || !studentId.trim()}
                  className="w-full"
                >
                  {validateStudent.isPending ? 'Verifying...' : 'Continue'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Assessment Question and Rating */}
        {validatedStudent && !isSubmitted && (
          <>
            {existingResponse ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Already Completed</h2>
                  <p className="text-muted-foreground mb-4">
                    You have already completed this assessment with a confidence rating of {existingResponse.confidence_rating}/10.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    If you need to make changes, please contact your teacher.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Alert className="mb-6">
                  <User className="w-4 h-4" />
                  <AlertDescription>
                    Welcome, <strong>{validatedStudent.first_name} {validatedStudent.last_name}</strong>
                  </AlertDescription>
                </Alert>

                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Assessment Question</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg leading-relaxed">
                      {assessment.question_text || 'Please rate your confidence level for this assessment.'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Rate Your Confidence</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      On a scale of 1-10, how confident do you feel about this topic?
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-3 mb-6">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                        <Button
                          key={rating}
                          variant={confidenceRating === rating ? "default" : "outline"}
                          onClick={() => setConfidenceRating(rating)}
                          className="aspect-square text-lg font-semibold"
                        >
                          {rating}
                        </Button>
                      ))}
                    </div>

                    <div className="flex justify-between text-sm text-muted-foreground mb-6">
                      <span>Not confident</span>
                      <span>Very confident</span>
                    </div>

                    <Button 
                      onClick={handleConfidenceSubmit}
                      disabled={confidenceRating === null || submitResponse.isPending}
                      className="w-full"
                      size="lg"
                    >
                      {submitResponse.isPending ? 'Submitting...' : 'Submit Response'}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}

        {/* Success Message */}
        {isSubmitted && (
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Thank You!</h2>
              <p className="text-muted-foreground mb-4">
                Your confidence rating of <strong>{confidenceRating}/10</strong> has been submitted successfully.
              </p>
              <p className="text-sm text-muted-foreground">
                You can now close this window.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentAssessment;