import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExitTicketByClass {
  id: string;
  name: string;
  description: string | null;
  task_type: string | null;
  status: string;
  is_completed: boolean;
  class_session_id: string | null;
  exit_ticket_template_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  class_id: string;
  question_count: number;
}

export const useExitTicketsByClass = (classId?: string) => {
  return useQuery({
    queryKey: ['exit-tickets-by-class', classId],
    queryFn: async (): Promise<ExitTicketByClass[]> => {
      if (!classId) return [];

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          id, name, description, task_type, status, is_completed,
          class_session_id, exit_ticket_template_id, due_date,
          created_at, updated_at, class_id,
          questions (id)
        `)
        .eq('is_exit_ticket', true)
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (tasks || []).map((task) => ({
        id: task.id,
        name: task.name,
        description: task.description,
        task_type: task.task_type,
        status: task.status || 'draft',
        is_completed: (task.is_completed as boolean) || false,
        class_session_id: task.class_session_id || null,
        exit_ticket_template_id:
          (task as { exit_ticket_template_id?: string | null }).exit_ticket_template_id ?? null,
        due_date: (task as { due_date?: string | null }).due_date ?? null,
        created_at: task.created_at,
        updated_at: task.updated_at,
        class_id: task.class_id,
        question_count: Array.isArray(task.questions) ? task.questions.length : 0,
      }));
    },
    enabled: !!classId,
  });
};
