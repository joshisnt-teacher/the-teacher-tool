import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

const CENTRAL_HUB_URL = import.meta.env.VITE_CENTRAL_HUB_URL || 'https://edufied.com.au';

const TeacherSSO = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      window.location.href = `${CENTRAL_HUB_URL}?error=session_expired`;
      return;
    }

    let cancelled = false;

    async function handleSSO() {
      try {
        // 1. Call edge function to validate token and get a magic link token_hash
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/teacher-sso`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              ...(existingSession ? { 'Authorization': `Bearer ${existingSession.access_token}` } : {}),
            },
            body: JSON.stringify({ token }),
          }
        );

        const result = await res.json();

        if (!res.ok || result.error) {
          if (!cancelled) {
            window.location.href = `${CENTRAL_HUB_URL}?error=session_expired`;
          }
          return;
        }

        // 2. Exchange token_hash for a real Supabase session
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: result.token_hash,
          type: 'magiclink',
        });

        if (otpError) {
          if (!cancelled) setError('Failed to establish session. Please try again.');
          return;
        }

        // 3. Session is now set — navigate to dashboard
        if (!cancelled) navigate('/dashboard', { replace: true });

      } catch (err) {
        console.error('Teacher SSO error:', err);
        if (!cancelled) setError('Something went wrong. Please try again.');
      }
    }

    handleSSO();

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

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

export default TeacherSSO;
