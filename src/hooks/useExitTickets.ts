import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExitTicketSummary {
  id: string;
  name: string;
  description: string | null;
  task_type: string | null;
  status: string;
  is_exit_ticket: boolean;
  is_completed: boolean;
  class_session_id: string | null;
  created_at: string;
  updated_at: string;
  class_id: string;
  class_name: string;
  class_code: string;
  class_subject: string | null;
  question_count: number;
}

export const useExitTickets = (schoolId?: string) => {
  return useQuery({
    queryKey: ['exit-tickets', schoolId],
    queryFn: async (): Promise<ExitTicketSummary[]> => {
      if (!schoolId) return [];

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          id,
          name,
          description,
          task_type,
          status,
          is_exit_ticket,
          is_completed,
          class_session_id,
          created_at,
          updated_at,
          class_id,
          classes!inner (
            class_name,
            class_code,
            subject
          ),
            questions (
            id
          )
        `)
        .eq('is_exit_ticket', true)
        .eq('classes.school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching exit tickets:', error);
        throw error;
      }

      return (tasks || []).map((task) => {
        const cls = Array.isArray(task.classes) ? task.classes[0] : task.classes;
        const qCount = Array.isArray(task.questions) ? task.questions.length : 0;
        return {
          id: task.id,
          name: task.name,
          description: task.description,
          task_type: task.task_type,
          status: task.status || 'draft',
          is_exit_ticket: task.is_exit_ticket,
          is_completed: task.is_completed || false,
          class_session_id: task.class_session_id || null,
          created_at: task.created_at,
          updated_at: task.updated_at,
          class_id: task.class_id,
          class_name: cls?.class_name || '',
          class_code: cls?.class_code || '',
          class_subject: cls?.subject || null,
          question_count: qCount,
        };
      });
    },
    enabled: !!schoolId,
  });
};
