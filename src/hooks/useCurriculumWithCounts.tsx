import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Curriculum } from './useCurriculum';

export interface CurriculumWithCounts extends Curriculum {
  content_items_count: number;
  strands_count: number;
}

export const useCurriculumWithCounts = () => {
  return useQuery({
    queryKey: ['curriculum-with-counts'],
    queryFn: async (): Promise<CurriculumWithCounts[]> => {
      // First, get all curricula using the same query as useCurriculum
      const { data: curricula, error: curriculaError } = await supabase
        .from('curriculum')
        .select('*')
        .order('authority', { ascending: true })
        .order('learning_area', { ascending: true })
        .order('year_band', { ascending: true });

      if (curriculaError) {
        console.error('Error fetching curricula:', curriculaError);
        // If it's an RLS error, try to get session info
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('No authenticated session - returning empty array');
          return [];
        }
        throw new Error(`Failed to fetch curriculum: ${curriculaError.message}`);
      }

      if (!curricula || curricula.length === 0) {
        console.log('No curricula found - returning empty array');
        return [];
      }

      // For each curriculum, get the content item count
      const curriculaWithCounts = await Promise.all(
        curricula.map(async (curriculum) => {
          try {
            // Get strands for this curriculum
            const { data: strands, error: strandsError } = await supabase
              .from('strand')
              .select('id')
              .eq('curriculum_id', curriculum.id);
            
            if (strandsError) {
              console.error(`Error fetching strands for ${curriculum.year_band}:`, strandsError);
              return {
                ...curriculum,
                content_items_count: 0,
                strands_count: 0,
              };
            }

            let contentItemsCount = 0;
            
            if (strands && strands.length > 0) {
              // Get content item count for all strands of this curriculum
              const { data: contentItems, error: contentItemsError } = await supabase
                .from('content_item')
                .select('id', { count: 'exact' })
                .in('strand_id', strands.map(s => s.id));

              if (contentItemsError) {
                console.error(`Error fetching content items for ${curriculum.year_band}:`, contentItemsError);
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
            console.error(`Error processing curriculum ${curriculum.year_band}:`, error);
            return {
              ...curriculum,
              content_items_count: 0,
              strands_count: 0,
            };
          }
        })
      );

      return curriculaWithCounts;
    },
    retry: (failureCount, error) => {
      // Don't retry if it's an authentication error
      if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};
