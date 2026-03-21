import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Tag {
  id: string;
  type: 'concept' | 'capability' | 'blooms_taxonomy';
  name: string;
  created_at: string;
  updated_at: string;
}

export const useTags = (type?: 'concept' | 'capability' | 'blooms_taxonomy') => {
  return useQuery({
    queryKey: ['tags', type],
    queryFn: async (): Promise<Tag[]> => {
      let query = supabase
        .from('tag')
        .select('*')
        .order('name', { ascending: true });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tags:', error);
        throw error;
      }

      return data || [];
    },
  });
};

export const useTagById = (tagId?: string) => {
  return useQuery({
    queryKey: ['tag', tagId],
    queryFn: async (): Promise<Tag | null> => {
      if (!tagId) return null;

      const { data, error } = await supabase
        .from('tag')
        .select('*')
        .eq('id', tagId)
        .single();

      if (error) {
        console.error('Error fetching tag by id:', error);
        throw error;
      }

      return data;
    },
    enabled: !!tagId,
  });
};

export const useConceptTags = () => {
  return useTags('concept');
};

export const useCapabilityTags = () => {
  return useTags('capability');
};

export const useBloomsTaxonomyTags = () => {
  return useTags('blooms_taxonomy');
};