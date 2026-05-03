import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Loader2 } from 'lucide-react';
import { useExitTicketsByClass } from '@/hooks/useExitTicketsByClass';

interface HomeworkSectionProps {
  classId: string;
}

export const HomeworkSection: React.FC<HomeworkSectionProps> = ({ classId }) => {
  const navigate = useNavigate();
  const { data: allExitTickets = [], isLoading } = useExitTicketsByClass(classId);

  const today = new Date().toISOString().split('T')[0];

  const homeworkTickets = React.useMemo(() => {
    return allExitTickets
      .filter((t) => t.is_homework && t.status === 'active' && t.due_date && t.due_date >= today)
      .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));
  }, [allExitTickets, today]);

  const formatDueDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Homework
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (homeworkTickets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Homework
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No active homework assigned</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Homework
          </div>
          <Badge variant="outline">{homeworkTickets.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {homeworkTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="p-3 rounded-lg border bg-blue-50/30 border-blue-200 hover:bg-blue-50/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{ticket.name}</h4>
                {ticket.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{ticket.description}</p>
                )}
                {ticket.due_date && (
                  <p className="text-xs text-blue-700 font-medium mt-0.5">
                    Due {formatDueDate(ticket.due_date)}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs shrink-0"
                onClick={() => navigate(`/assessment/${ticket.id}`)}
              >
                View Results
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
