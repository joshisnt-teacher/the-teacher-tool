import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { centralSupabase } from '@/integrations/supabase/centralClient';
import { supabase } from '@/integrations/supabase/client';
import { useStudentSession } from '@/hooks/useStudentSession';

const StudentSSO = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useStudentSession();
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      window.location.href = 'https://student.edufied.com.au?error=session_expired';
      return;
    }

    let cancelled = false;

    async function handleSSO() {
      try {
        // 1. Look up the token in central DB
        const { data: tokenRow, error: tokenError } = await centralSupabase
          .from('sso_tokens')
          .select('token, student_id, used, expires_at')
          .eq('token', token)
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (tokenError || !tokenRow) {
          if (!cancelled) {
            window.location.href = 'https://student.edufied.com.au?error=session_expired';
          }
          return;
        }

        // 2. Mark token as used
        const { error: updateError } = await centralSupabase
          .from('sso_tokens')
          .update({ used: true })
          .eq('token', token);

        if (updateError) {
          console.error('Failed to mark SSO token as used:', updateError);
        }

        // 3. Retrieve student record from central DB
        const { data: centralStudent, error: studentError } = await centralSupabase
          .from('students')
          .select('id, first_name, last_name, year_level')
          .eq('id', tokenRow.student_id)
          .maybeSingle();

        if (studentError || !centralStudent) {
          if (!cancelled) {
            window.location.href = 'https://student.edufied.com.au?error=session_expired';
          }
          return;
        }

        // 4. Look up local student record by central_id
        const { data: localStudent, error: localError } = await supabase
          .from('students')
          .select('id, central_id')
          .eq('central_id', centralStudent.id)
          .maybeSingle();

        if (localError || !localStudent) {
          if (!cancelled) {
            window.location.href = 'https://student.edufied.com.au?error=session_expired';
          }
          return;
        }

        // 5. Store student session
        if (!cancelled) {
          setSession({
            student_id: localStudent.id,
            central_id: centralStudent.id,
            first_name: centralStudent.first_name,
            last_name: centralStudent.last_name,
            year_level: centralStudent.year_level ?? null,
          });
          navigate('/student/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('SSO error:', err);
        if (!cancelled) {
          setError('Something went wrong. Please try again.');
        }
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
