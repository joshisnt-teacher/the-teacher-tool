import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Minus, MessageSquare, Calendar } from 'lucide-react';
import { useRecentTeacherNotes } from '@/hooks/useStudentNotes';
import { format } from 'date-fns';

interface RecentTeacherNotesProps {
  studentId: string;
  classId: string;
  limit?: number;
}

export const RecentTeacherNotes: React.FC<RecentTeacherNotesProps> = ({ 
  studentId, 
  classId, 
  limit = 5 
}) => {
  const { data: notes, isLoading } = useRecentTeacherNotes(studentId, classId, limit);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Recent Teacher Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Recent Teacher Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No recent notes available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRatingIcon = (rating: number) => {
    if (rating > 0) {
      return <ArrowUp className="w-4 h-4 text-green-500" />;
    } else if (rating < 0) {
      return <ArrowDown className="w-4 h-4 text-red-500" />;
    } else {
      return <Minus className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating > 0) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (rating < 0) {
      return 'text-red-600 bg-red-50 border-red-200';
    } else {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'academic':
        return 'bg-blue-100 text-blue-800';
      case 'pastoral':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Recent Teacher Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="border rounded-lg p-4 space-y-3">
              {/* Header with week, category, and rating */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {note.week}
                  </Badge>
                  <Badge className={`text-xs ${getCategoryColor(note.category)}`}>
                    {note.category}
                  </Badge>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getRatingColor(note.rating)}`}>
                  {getRatingIcon(note.rating)}
                  <span>{note.rating > 0 ? `+${note.rating}` : note.rating}</span>
                </div>
              </div>

              {/* Note content */}
              <div className="text-sm text-gray-700">
                {note.note}
              </div>

              {/* Session info and date */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{format(new Date(note.created_at), 'MMM d, yyyy')}</span>
                </div>
                {note.session_title && (
                  <span className="truncate max-w-32" title={note.session_title}>
                    {note.session_title}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {notes.length === limit && (
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Showing last {limit} notes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
