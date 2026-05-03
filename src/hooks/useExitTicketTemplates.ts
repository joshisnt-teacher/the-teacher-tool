import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExitTicketTemplate {
  id: string;
  name: string;
  description: string | null;
  teacher_id: string;
  school_id: string;
  created_at: string;
  updated_at: string;
  question_count: number;
}

export const useExitTicketTemplates = (schoolId?: string) => {
  return useQuery({
    queryKey: ['exit-ticket-templates', schoolId],
    queryFn: async (): Promise<ExitTicketTemplate[]> => {
      if (!schoolId) return [];

      const { data, error } = await supabase
        .from('exit_ticket_templates')
        .select(`
          id, name, description, teacher_id, school_id, created_at, updated_at,
          template_questions (id)
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        teacher_id: t.teacher_id,
        school_id: t.school_id,
        created_at: t.created_at,
        updated_at: t.updated_at,
        question_count: Array.isArray(t.template_questions) ? t.template_questions.length : 0,
      }));
    },
    enabled: !!schoolId,
  });
};
