import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TemplateRun {
  id: string;
  name: string;
  status: string;
  is_completed: boolean;
  class_id: string;
  class_name: string;
  class_code: string | null;
  created_at: string;
}

export const useRunsForTemplate = (templateId?: string) => {
  return useQuery({
    queryKey: ['runs-for-template', templateId],
    queryFn: async (): Promise<TemplateRun[]> => {
      if (!templateId) return [];

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id, name, status, is_completed, class_id, created_at,
          classes (class_name, class_code)
        `)
        .eq('exit_ticket_template_id', templateId)
        .eq('is_exit_ticket', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((t) => {
        const cls = Array.isArray(t.classes) ? t.classes[0] : t.classes;
        return {
          id: t.id,
          name: t.name,
          status: t.status || 'draft',
          is_completed: (t.is_completed as boolean) || false,
          class_id: t.class_id,
          class_name: (cls as { class_name?: string } | null)?.class_name || '',
          class_code: (cls as { class_code?: string } | null)?.class_code || null,
          created_at: t.created_at,
        };
      });
    },
    enabled: !!templateId,
  });
};
