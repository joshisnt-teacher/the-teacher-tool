import { useQuery } from '@tanstack/react-query';
import { centralSupabase } from '@/integrations/supabase/centralClient';

export interface Curriculum {
  id: string;
  authority: string;
  subject: string;
  year_level: string;
  year_level_title: string | null;
  year_level_description: string | null;
  achievement_standard: string | null;
  created_at: string;
}

export const useCurriculum = () => {
  return useQuery({
    queryKey: ['curriculum'],
    queryFn: async (): Promise<Curriculum[]> => {
      const { data, error } = await centralSupabase
        .from('curriculum')
        .select('*')
        .order('authority', { ascending: true })
        .order('subject', { ascending: true })
        .order('year_level', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch curriculum: ${error.message}`);
      }

      return data || [];
    },
  });
};
