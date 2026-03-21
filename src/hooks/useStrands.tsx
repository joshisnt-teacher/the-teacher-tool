import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Strand {
  id: string;
  curriculum_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  curriculum?: {
    id: string;
    authority: string;
    learning_area: string;
    year_band: string;
    version: string;
  };
}

export const useStrands = (curriculumId?: string) => {
  return useQuery({
    queryKey: ['strands', curriculumId],
    queryFn: async (): Promise<Strand[]> => {
      let query = supabase
        .from('strand')
        .select(`
          *,
          curriculum:curriculum_id (
            id,
            authority,
            learning_area,
            year_band,
            version
          )
        `)
        .order('name', { ascending: true });

      if (curriculumId) {
        query = query.eq('curriculum_id', curriculumId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching strands:', error);
        throw error;
      }

      return data?.map(strand => ({
        ...strand,
        curriculum: Array.isArray(strand.curriculum) ? strand.curriculum[0] : strand.curriculum
      })) || [];
    },
    enabled: !!curriculumId,
  });
};

export const useStrandById = (strandId?: string) => {
  return useQuery({
    queryKey: ['strand', strandId],
    queryFn: async (): Promise<Strand | null> => {
      if (!strandId) return null;

      const { data, error } = await supabase
        .from('strand')
        .select(`
          *,
          curriculum:curriculum_id (
            id,
            authority,
            learning_area,
            year_band,
            version
          )
        `)
        .eq('id', strandId)
        .single();

      if (error) {
        console.error('Error fetching strand by id:', error);
        throw error;
      }

      return {
        ...data,
        curriculum: Array.isArray(data.curriculum) ? data.curriculum[0] : data.curriculum
      };
    },
    enabled: !!strandId,
  });
};