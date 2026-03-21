import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Trash2, Users, Calendar } from 'lucide-react';
import { useClassSessionsList } from '@/hooks/useClassSessionsList';
import { useDeleteClassSession } from '@/hooks/useClassSessions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ClassSessionsProps {
  classId: string;
}

export const ClassSessions: React.FC<ClassSessionsProps> = ({ classId }) => {
  const navigate = useNavigate();
  const { data: sessions = [], isLoading } = useClassSessionsList(classId);
  const deleteSessionMutation = useDeleteClassSession();
  const { toast } = useToast();

  const formatDuration = (startedAt: string, endedAt: string) => {
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleSessionClick = (sessionId: string) => {
    navigate(`/class/${classId}/session/${sessionId}`);
  };

  const handleDeleteSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this session and all its notes?')) {
      return;
    }

    try {
      await deleteSessionMutation.mutateAsync(sessionId);
      toast({
        title: "Session Deleted",
        description: "The session and all associated notes have been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Class Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading sessions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Class Sessions ({sessions.length})
          </CardTitle>
          <CardDescription>
            Previous lessons and their notes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No completed sessions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start a lesson in the Classroom to create your first session
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Card 
                  key={session.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSessionClick(session.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 truncate">
                          {session.title || 'Untitled Lesson'}
                        </h3>
                        {session.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {session.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDuration(session.started_at, session.ended_at!)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {session.student_notes.length} notes
                          </div>
                          <div className="text-xs">
                            {format(new Date(session.started_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
