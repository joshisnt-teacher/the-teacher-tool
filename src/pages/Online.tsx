import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Activity {
  id: string;
  title: string;
  type: string;
  status: string;
}

const Online = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'code' | 'info'>('code');
  const [activityCode, setActivityCode] = useState('');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch activity by join_code
  const { data: activity, isLoading: isLoadingActivity, error: activityError } = useQuery({
    queryKey: ['activity-by-code', activityCode],
    queryFn: async (): Promise<Activity | null> => {
      if (!activityCode.trim()) return null;

      const { data, error } = await supabase
        .from('activities')
        .select('id, title, type, status')
        .eq('join_code', activityCode.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;
      return data as Activity | null;
    },
    enabled: step === 'info' && !!activityCode.trim(),
    retry: false,
  });

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!activityCode.trim()) {
      setError('Please enter an activity code');
      return;
    }

    setStep('info');
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    // Store student info in localStorage
    const studentInfo = {
      name: name.trim(),
      displayName: displayName.trim() || name.trim(),
      activityId: activity?.id,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('studentInfo', JSON.stringify(studentInfo));

    // Navigate to the appropriate activity page based on type
    if (!activity) {
      setError('Activity not found');
      return;
    }

    if (activity.status !== 'published') {
      setError('This activity is not currently available');
      return;
    }

    switch (activity.type) {
      case 'FORM':
        navigate(`/student-form/${activity.id}`);
        break;
      case 'QUIZ':
        navigate(`/student-quiz/${activity.id}`);
        break;
      default:
        setError(`Activity type "${activity.type}" is not yet supported`);
    }
  };

  const handleBack = () => {
    setStep('code');
    setError(null);
    setName('');
    setDisplayName('');
  };

  if (step === 'code') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-2">Welcome to Teacher Tool</CardTitle>
            <CardDescription className="text-base">
              Please enter your activity code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="activityCode">Activity Code</Label>
                <Input
                  id="activityCode"
                  type="text"
                  value={activityCode}
                  onChange={(e) => {
                    // Auto-uppercase and limit to 6 characters
                    const upperValue = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                    setActivityCode(upperValue);
                    setError(null);
                  }}
                  placeholder="Enter 6-character code"
                  className="text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" size="lg">
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Info step
  if (isLoadingActivity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading activity...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activityError || !activity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">Activity Not Found</CardTitle>
            <CardDescription>
              The activity code you entered could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {activityError ? 'Error loading activity' : 'Invalid activity code'}
              </AlertDescription>
            </Alert>
            <Button onClick={handleBack} variant="outline" className="w-full">
              Try Another Code
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activity.status !== 'published') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">Activity Not Available</CardTitle>
            <CardDescription>
              This activity is not currently published.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBack} variant="outline" className="w-full">
              Try Another Code
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl mb-2">{activity.title}</CardTitle>
          <CardDescription className="text-base">
            Please enter your information to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInfoSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="Enter your name"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name (Optional)</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How you'd like to be displayed"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use your name
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleBack}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" size="lg">
                Join Activity
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Online;

