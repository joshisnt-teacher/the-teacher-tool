import { useQuery } from '@tanstack/react-query';
import { centralSupabase } from '@/integrations/supabase/centralClient';

export interface Strand {
  id: string;
  curriculum_id: string;
  name: string;
  position: number;
  created_at: string;
  curriculum?: {
    id: string;
    authority: string;
    subject: string;
    year_level: string;
  };
}

export const useStrands = (curriculumId?: string) => {
  return useQuery({
    queryKey: ['strands', curriculumId],
    queryFn: async (): Promise<Strand[]> => {
      let query = centralSupabase
        .from('curriculum_strand')
        .select(`
          *,
          curriculum:curriculum_id (
            id,
            authority,
            subject,
            year_level
          )
        `)
        .order('position', { ascending: true });

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

      const { data, error } = await centralSupabase
        .from('curriculum_strand')
        .select(`
          *,
          curriculum:curriculum_id (
            id,
            authority,
            subject,
            year_level
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
