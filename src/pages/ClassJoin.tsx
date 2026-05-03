import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, BookOpen, Loader2, School } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStudentVerification } from '@/hooks/useStudentVerification';
import { useStudentSession } from '@/hooks/useStudentSession';
import { supabase } from '@/integrations/supabase/client';

const ClassJoin = () => {
  const navigate = useNavigate();
  const { setSession } = useStudentSession();

  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isCheckingEnrolment, setIsCheckingEnrolment] = useState(false);

  const { verify, isLoading: isVerifying } = useStudentVerification();

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
        .select('id, first_name, last_name, year_level')
        .eq('central_id', student.id)
        .single();

      if (localError || !localStudent) {
        setLoginError("That username or PIN doesn't look right. Check with your teacher.");
        return;
      }

      // Store session and redirect to dashboard
      setSession({
        student_id: localStudent.id,
        central_id: student.id,
        first_name: localStudent.first_name,
        last_name: localStudent.last_name,
        year_level: localStudent.year_level,
      });
      navigate('/student/dashboard');
    } finally {
      setIsCheckingEnrolment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <School className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl mb-1">Student Sign In</CardTitle>
          <CardDescription className="text-base">
            Enter your username and PIN to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassJoin;
