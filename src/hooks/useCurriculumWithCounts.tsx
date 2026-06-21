import { useQuery } from '@tanstack/react-query';
import { centralSupabase } from '@/integrations/supabase/centralClient';
import { Curriculum } from './useCurriculum';

export interface CurriculumWithCounts extends Curriculum {
  content_items_count: number;
  strands_count: number;
}

export const useCurriculumWithCounts = () => {
  return useQuery({
    queryKey: ['curriculum-with-counts'],
    queryFn: async (): Promise<CurriculumWithCounts[]> => {
      const { data: curricula, error: curriculaError } = await centralSupabase
        .from('curriculum')
        .select('*')
        .order('authority', { ascending: true })
        .order('subject', { ascending: true })
        .order('year_level', { ascending: true });

      if (curriculaError) {
        console.error('Error fetching curricula:', curriculaError);
        throw new Error(`Failed to fetch curriculum: ${curriculaError.message}`);
      }

      if (!curricula || curricula.length === 0) return [];

      const curriculaWithCounts = await Promise.all(
        curricula.map(async (curriculum) => {
          try {
            const { data: strands, error: strandsError } = await centralSupabase
              .from('curriculum_strand')
              .select('id')
              .eq('curriculum_id', curriculum.id);

            if (strandsError) {
              console.error(`Error fetching strands for ${curriculum.year_level}:`, strandsError);
              return { ...curriculum, content_items_count: 0, strands_count: 0 };
            }

            let contentItemsCount = 0;

            if (strands && strands.length > 0) {
              const { data: contentItems, error: contentItemsError } = await centralSupabase
                .from('curriculum_content_item')
                .select('id', { count: 'exact' })
                .in('strand_id', strands.map(s => s.id));

              if (contentItemsError) {
                console.error(`Error fetching content items for ${curriculum.year_level}:`, contentItemsError);
              } else {
                contentItemsCount = contentItems?.length || 0;
              }
            }

            return {
              ...curriculum,
              content_items_count: contentItemsCount,
              strands_count: strands?.length || 0,
            };
          } catch (error) {
            console.error(`Error processing curriculum ${curriculum.year_level}:`, error);
            return { ...curriculum, content_items_count: 0, strands_count: 0 };
          }
        })
      );

      return curriculaWithCounts;
    },
  });
};
