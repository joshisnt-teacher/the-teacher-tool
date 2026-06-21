import { useQuery } from '@tanstack/react-query';
import { centralSupabase } from '@/integrations/supabase/centralClient';

export interface ContentItem {
  id: string;
  strand_id: string;
  source_id: string;
  sub_strand_name: string | null;
  code: string | null;
  description: string;
  examples: string | null;
  position: number;
  created_at: string;
  strand?: {
    id: string;
    name: string;
    curriculum_id: string;
  };
}

interface UseContentItemsParams {
  strandId?: string;
  curriculumId?: string;
  searchCode?: string;
  searchText?: string;
}

export const useContentItems = (params: UseContentItemsParams = {}) => {
  const { strandId, curriculumId, searchCode, searchText } = params;

  return useQuery({
    queryKey: ['contentItems', strandId, curriculumId, searchCode, searchText],
    queryFn: async (): Promise<ContentItem[]> => {
      let query = centralSupabase
        .from('curriculum_content_item')
        .select(`
          *,
          strand:strand_id (
            id,
            name,
            curriculum_id
          )
        `)
        .order('position', { ascending: true });

      if (strandId) {
        query = query.eq('strand_id', strandId);
      }

      if (curriculumId) {
        query = query.eq('curriculum_strand.curriculum_id', curriculumId);
      }

      if (searchCode) {
        query = query.ilike('code', `%${searchCode}%`);
      }

      if (searchText) {
        query = query.ilike('description', `%${searchText}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching content items:', error);
        throw error;
      }

      return data?.map(item => ({
        ...item,
        strand: Array.isArray(item.strand) ? item.strand[0] : item.strand,
      })) || [];
    },
  });
};

export const useContentItemById = (contentItemId?: string) => {
  return useQuery({
    queryKey: ['contentItem', contentItemId],
    queryFn: async (): Promise<ContentItem | null> => {
      if (!contentItemId) return null;

      const { data, error } = await centralSupabase
        .from('curriculum_content_item')
        .select(`
          *,
          strand:strand_id (
            id,
            name,
            curriculum_id
          )
        `)
        .eq('id', contentItemId)
        .single();

      if (error) {
        console.error('Error fetching content item by id:', error);
        throw error;
      }

      return {
        ...data,
        strand: Array.isArray(data.strand) ? data.strand[0] : data.strand,
      };
    },
    enabled: !!contentItemId,
  });
};

export const useContentItemsByIds = (contentItemIds?: string[]) => {
  return useQuery({
    queryKey: ['contentItems', 'byIds', contentItemIds],
    queryFn: async (): Promise<ContentItem[]> => {
      if (!contentItemIds || contentItemIds.length === 0) return [];

      const { data, error } = await centralSupabase
        .from('curriculum_content_item')
        .select(`
          *,
          strand:strand_id (
            id,
            name,
            curriculum_id
          )
        `)
        .in('id', contentItemIds)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching content items by ids:', error);
        throw error;
      }

      return data?.map(item => ({
        ...item,
        strand: Array.isArray(item.strand) ? item.strand[0] : item.strand,
      })) || [];
    },
    enabled: !!contentItemIds && contentItemIds.length > 0,
  });
};

export const useContentItemByCode = (contentItemCode?: string) => {
  return useQuery({
    queryKey: ['contentItem', 'byCode', contentItemCode],
    queryFn: async (): Promise<ContentItem | null> => {
      if (!contentItemCode) return null;

      const { data, error } = await centralSupabase
        .from('curriculum_content_item')
        .select(`
          *,
          strand:strand_id (
            id,
            name,
            curriculum_id
          )
        `)
        .eq('code', contentItemCode)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching content item by code:', error);
        throw error;
      }

      return {
        ...data,
        strand: Array.isArray(data.strand) ? data.strand[0] : data.strand,
      };
    },
    enabled: !!contentItemCode,
  });
};
