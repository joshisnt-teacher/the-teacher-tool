import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { School } from 'lucide-react';

const StudentLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <School className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Student Portal</h1>
          <p className="text-muted-foreground text-sm">
            Sign in to access your exit tickets and homework.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => navigate('/join')}
            className="w-full h-12 text-base"
          >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentLanding;
