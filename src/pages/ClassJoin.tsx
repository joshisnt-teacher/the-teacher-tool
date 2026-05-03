import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, BookOpen, Loader2, School } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useClassByCode } from '@/hooks/useClassByCode';
import { useActiveExitTickets } from '@/hooks/useActiveExitTickets';
import { useStudentVerification } from '@/hooks/useStudentVerification';
import { supabase } from '@/integrations/supabase/client';

const ClassJoin = () => {
  const { classCode } = useParams<{ classCode: string }>();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [verifiedStudentId, setVerifiedStudentId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isCheckingEnrolment, setIsCheckingEnrolment] = useState(false);

  const { data: classData, isLoading: isLoadingClass, error: classError } = useClassByCode(classCode);
  const { data: activeTickets, isLoading: isLoadingTickets } = useActiveExitTickets(classData?.id);
  const { verify, isLoading: isVerifying } = useStudentVerification();

  const isLoading = isLoadingClass || isLoadingTickets;

  const liveTickets = (activeTickets || []).filter((t) => t.status === 'active');
  const homeworkTickets = (activeTickets || []).filter((t) => t.status === 'homework');

  const formatDueDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  const isSubmitting = isVerifying || isCheckingEnrolment;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const student = await verify(username, pin);
    if (!student) {
      setLoginError("That username or PIN doesn't look right. Check with your teacher.");
      return;
    }

    // Find the local student record linked to this central account
    setIsCheckingEnrolment(true);
    try {
      const { data: localStudent, error: localError } = await supabase
        .from('students')
        .select('id')
        .eq('central_id', student.id)
        .single();

      if (localError || !localStudent) {
        setLoginError("That username or PIN doesn't look right. Check with your teacher.");
        return;
      }

      // Confirm that local student is enrolled in this class
      const { data: enrolment, error: enrolmentError } = await supabase
        .from('enrolments')
        .select('student_id')
        .eq('student_id', localStudent.id)
        .eq('class_id', classData!.id)
        .single();

      if (enrolmentError || !enrolment) {
        setLoginError("That username or PIN doesn't look right. Check with your teacher.");
        return;
      }

      setVerifiedStudentId(localStudent.id);
    } finally {
      setIsCheckingEnrolment(false);
    }
  };

  const handleJoin = (ticketId: string) => {
    if (!verifiedStudentId) return;
    navigate(`/exit-ticket/${ticketId}?studentId=${verifiedStudentId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (classError || !classData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">Class Not Found</CardTitle>
            <CardDescription>The class code you entered could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Invalid class code</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <School className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl mb-1">{classData.class_name}</CardTitle>
          <CardDescription className="text-base">
            {classData.subject} • {classData.year_level}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!verifiedStudentId ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  autoComplete="current-password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter your PIN"
                  required
                />
              </div>
              {loginError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          ) : liveTickets.length === 0 && homeworkTickets.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No tasks right now. Check back later!</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {liveTickets.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Active Exit Tickets
                  </h3>
                  {liveTickets.length === 1 ? (
                    <Button className="w-full" size="lg" onClick={() => handleJoin(liveTickets[0].id)}>
                      Start — {liveTickets[0].name}
                    </Button>
                  ) : (
                    liveTickets.map((ticket) => (
                      <Button key={ticket.id} className="w-full" variant="default" onClick={() => handleJoin(ticket.id)}>
                        {ticket.name}
                      </Button>
                    ))
                  )}
                </div>
              )}

              {homeworkTickets.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    Homework
                  </h3>
                  {homeworkTickets.map((ticket) => (
                    <div key={ticket.id} className="p-3 rounded-lg border bg-blue-50/50 border-blue-200">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{ticket.name}</div>
                          {ticket.due_date && (
                            <div className="text-xs text-blue-700 mt-0.5">Due {formatDueDate(ticket.due_date)}</div>
                          )}
                          {ticket.description && (
                            <div className="text-sm text-muted-foreground mt-0.5">{ticket.description}</div>
                          )}
                        </div>
                        <Button size="sm" onClick={() => handleJoin(ticket.id)} className="shrink-0">
                          Start
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassJoin;
