import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StudentNote {
  id: string;
  student_id: string;
  class_session_id: string;
  category: string;
  note: string;
  rating: number;
  created_at: string;
  updated_at: string;
  class_session: {
    id: string;
    title: string | null;
    description: string | null;
    started_at: string;
    ended_at: string | null;
  };
}

export interface RecentTeacherNote {
  id: string;
  category: string;
  note: string;
  rating: number;
  created_at: string;
  session_title: string | null;
  week: string;
}

export const useStudentNotes = (studentId?: string, classId?: string) => {
  return useQuery({
    queryKey: ['student-notes', studentId, classId],
    queryFn: async (): Promise<StudentNote[]> => {
      if (!studentId || !classId) return [];

      const { data, error } = await supabase
        .from('student_notes')
        .select(`
          *,
          class_session:class_sessions!inner (
            id,
            title,
            description,
            started_at,
            ended_at
          )
        `)
        .eq('student_id', studentId)
        .eq('class_session.class_id', classId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching student notes:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!studentId && !!classId,
  });
};

export const useRecentTeacherNotes = (studentId?: string, classId?: string, limit: number = 5) => {
  return useQuery({
    queryKey: ['recent-teacher-notes', studentId, classId, limit],
    queryFn: async (): Promise<RecentTeacherNote[]> => {
      if (!studentId || !classId) return [];

      const { data, error } = await supabase
        .from('student_notes')
        .select(`
          id,
          category,
          note,
          rating,
          created_at,
          class_session:class_sessions!inner (
            title,
            started_at
          )
        `)
        .eq('student_id', studentId)
        .eq('class_session.class_id', classId)
        .in('category', ['Academic', 'Pastoral'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent teacher notes:', error);
        throw error;
      }

      if (!data) return [];

      return data.map(note => {
        const sessionDate = new Date(note.class_session.started_at);
        const weekNumber = Math.ceil((Date.now() - sessionDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        
        return {
          id: note.id,
          category: note.category,
          note: note.note,
          rating: note.rating,
          created_at: note.created_at,
          session_title: note.class_session.title,
          week: `Week ${weekNumber}`,
        };
      });
    },
    enabled: !!studentId && !!classId,
  });
};

export const useStudentNotesForSession = (sessionId?: string) => {
  return useQuery({
    queryKey: ['student-notes-for-session', sessionId],
    queryFn: async (): Promise<any[]> => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from('student_notes')
        .select(`
          *,
          class_session:class_sessions!inner (
            id,
            title,
            description,
            started_at,
            ended_at
          ),
          students!inner (
            id,
            first_name,
            last_name,
            student_id
          )
        `)
        .eq('class_session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching student notes for session:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!sessionId,
  });
};

export const useCreateStudentNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (noteData: {
      student_id: string;
      class_session_id: string;
      category: string;
      note: string;
      rating: number;
    }) => {
      const { data, error } = await supabase
        .from('student_notes')
        .insert([noteData])
        .select()
        .single();

      if (error) {
        console.error('Error creating student note:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['student-notes'] });
      queryClient.invalidateQueries({ queryKey: ['recent-teacher-notes'] });
      queryClient.invalidateQueries({ queryKey: ['student-notes-for-session'] });
    },
  });
};