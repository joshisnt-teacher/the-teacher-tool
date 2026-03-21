import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Curriculum {
  id: string;
  authority: string;
  learning_area: string;
  year_band: string;
  version: string;
  year_level_description: string;
  created_at: string;
  updated_at: string;
}

export const useCurriculum = () => {
  return useQuery({
    queryKey: ['curriculum'],
    queryFn: async (): Promise<Curriculum[]> => {
      const { data, error } = await supabase
        .from('curriculum')
        .select('*')
        .order('authority', { ascending: true })
        .order('learning_area', { ascending: true })
        .order('year_band', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch curriculum: ${error.message}`);
      }

      return data || [];
    },
  });
};