import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { School } from 'lucide-react';

const StudentLanding = () => {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    navigate(`/${trimmed}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <School className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Enter Class Code</h1>
          <p className="text-muted-foreground text-sm">
            Your teacher will display the code on the board.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. X7K9P2"
            className="text-center text-2xl font-mono font-bold tracking-widest h-16 uppercase"
            maxLength={10}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={!code.trim()}
          >
            Join Class
          </Button>
        </form>
      </div>
    </div>
  );
};

export default StudentLanding;
