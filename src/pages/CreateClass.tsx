import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useClasses } from '@/hooks/useClasses';
import { useSyncClasses } from '@/hooks/useSyncClasses';

const HUB_CLASSES_URL = 'https://edufied.com.au/account/classes';

const CreateClass: React.FC = () => {
  const navigate = useNavigate();
  const { data: classes = [] } = useClasses();
  const syncClasses = useSyncClasses();

  const handleSync = () => {
    const before = classes.length;
    syncClasses.mutate(undefined, {
      onSuccess: (result) => {
        if (result.synced > before) {
          window.dispatchEvent(
            new CustomEvent('pulse:class-created', { detail: { synced: result.synced } })
          );
        }
        navigate('/dashboard');
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create a class on the Edufied hub</CardTitle>
            <CardDescription>
              Classes are created once on edufied.com.au and shared across every Edufied tool —
              no need to set them up separately in Pulse.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild size="lg" className="w-full">
              <a href={HUB_CLASSES_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Go to Edufied to create a class
              </a>
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already created it? Come back here and sync it into Pulse.
            </p>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleSync}
              disabled={syncClasses.isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncClasses.isPending ? 'animate-spin' : ''}`} />
              {syncClasses.isPending ? 'Syncing…' : "I've created my class — sync now"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateClass;
