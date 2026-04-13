import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActiveExitTicket {
  id: string;
  name: string;
  description: string | null;
  task_type: string | null;
  created_at: string;
  class_id: string;
}

export const useActiveExitTickets = (classId?: string) => {
  return useQuery({
    queryKey: ['active-exit-tickets', classId],
    queryFn: async (): Promise<ActiveExitTicket[]> => {
      if (!classId) return [];

      const { data, error } = await supabase
        .from('tasks')
        .select('id, name, description, task_type, created_at, class_id')
        .eq('is_exit_ticket', true)
        .eq('status', 'active')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active exit tickets:', error);
        throw error;
      }

      return (data || []) as ActiveExitTicket[];
    },
    enabled: !!classId,
  });
};
