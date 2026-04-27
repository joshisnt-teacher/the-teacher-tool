import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStudentSession } from '@/hooks/useStudentSession';

const STUDENT_HUB_URL = 'https://student.edufied.com.au';

const StudentSSO = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useStudentSession();
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      window.location.href = `${STUDENT_HUB_URL}?error=invalid_token`;
      return;
    }

    let cancelled = false;

    async function handleSSO() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-sso`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ token }),
          }
        );

        const result = await res.json();

        if (!res.ok || result.error) {
          if (!cancelled) {
            window.location.href = `${STUDENT_HUB_URL}?error=session_expired`;
          }
          return;
        }

        if (!cancelled) {
          setSession({
            student_id: result.student_id,
            central_id: result.central_id,
            first_name: result.first_name,
            last_name: result.last_name,
            year_level: result.year_level,
          });
          navigate('/student/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Student SSO error:', err);
        if (!cancelled) setError('Something went wrong. Please try again.');
      }
    }

    handleSSO();

    return () => {
      cancelled = true;
    };
  }, [token, setSession, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Failed</h2>
            <Alert variant="destructive" className="mt-4 text-left">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
};

export default StudentSSO;
