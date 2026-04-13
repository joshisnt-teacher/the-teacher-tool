import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, School } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useClassByCode } from '@/hooks/useClassByCode';
import { useActiveExitTickets } from '@/hooks/useActiveExitTickets';
import { useStudents } from '@/hooks/useStudents';

// TODO: Student auth is pending. The current flow uses class code + roster selection
// without any authentication. Future work: add Supabase auth accounts or per-student PINs.

const ClassJoin = () => {
  const { classCode } = useParams<{ classCode: string }>();
  const navigate = useNavigate();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const { data: classData, isLoading: isLoadingClass, error: classError } = useClassByCode(classCode);
  const { data: activeTickets, isLoading: isLoadingTickets } = useActiveExitTickets(classData?.id);
  const { data: students, isLoading: isLoadingStudents } = useStudents(classData?.id);

  const isLoading = isLoadingClass || isLoadingTickets || isLoadingStudents;

  const handleJoin = (ticketId: string) => {
    if (!selectedStudentId) return;
    navigate(`/exit-ticket/${ticketId}?studentId=${selectedStudentId}`);
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
          {!activeTickets || activeTickets.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>There are no active exit tickets right now. Check back later!</AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Active Exit Tickets
                </h3>
                {activeTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-3 rounded-lg border bg-card hover:border-primary transition-colors"
                  >
                    <div className="font-medium">{ticket.name}</div>
                    {ticket.description && (
                      <div className="text-sm text-muted-foreground">{ticket.description}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Select Your Name
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {students?.map((student) => (
                    <Button
                      key={student.id}
                      variant={selectedStudentId === student.id ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => setSelectedStudentId(student.id)}
                    >
                      {student.first_name} {student.last_name}
                    </Button>
                  ))}
                </div>
              </div>

              {activeTickets.length === 1 ? (
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!selectedStudentId}
                  onClick={() => handleJoin(activeTickets[0].id)}
                >
                  Start Exit Ticket
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Choose an exit ticket to start:</p>
                  {activeTickets.map((ticket) => (
                    <Button
                      key={ticket.id}
                      className="w-full"
                      variant="outline"
                      disabled={!selectedStudentId}
                      onClick={() => handleJoin(ticket.id)}
                    >
                      {ticket.name}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassJoin;
