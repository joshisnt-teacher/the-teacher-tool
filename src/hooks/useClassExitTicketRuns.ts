import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClassExitTicketRun {
  id: string;
  name: string;
  status: string;
  is_completed: boolean;
  created_at: string;
  result_count: number;
}

export const useClassExitTicketRuns = (classId?: string) => {
  return useQuery({
    queryKey: ['class-exit-ticket-runs', classId],
    queryFn: async (): Promise<ClassExitTicketRun[]> => {
      if (!classId) return [];

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id, name, status, is_completed, created_at,
          results (id)
        `)
        .eq('class_id', classId)
        .eq('is_exit_ticket', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status || 'draft',
        is_completed: (t.is_completed as boolean) || false,
        created_at: t.created_at,
        result_count: Array.isArray(t.results) ? t.results.length : 0,
      }));
    },
    enabled: !!classId,
  });
};
