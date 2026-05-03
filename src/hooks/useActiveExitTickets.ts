import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActiveExitTicket {
  id: string;
  name: string;
  description: string | null;
  task_type: string | null;
  created_at: string;
  class_id: string;
  status: string;
  due_date: string | null;
  is_homework: boolean;
}

export const useActiveExitTickets = (classId?: string) => {
  return useQuery({
    queryKey: ['active-exit-tickets', classId],
    queryFn: async (): Promise<ActiveExitTicket[]> => {
      if (!classId) return [];

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('tasks')
        .select('id, name, description, task_type, created_at, class_id, status, due_date, is_homework')
        .eq('is_exit_ticket', true)
        .eq('class_id', classId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active exit tickets:', error);
        throw error;
      }

      // Filter out past-due homework client-side
      return (data || []).filter(
        (t) => !(t as { is_homework?: boolean }).is_homework ||
               !(t as { due_date?: string | null }).due_date ||
               (t as { due_date?: string | null }).due_date! >= today
      ) as ActiveExitTicket[];
    },
    enabled: !!classId,
  });
};
