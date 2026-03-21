import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContentItem {
  id: string;
  strand_id: string;
  code: string;
  description: string;
  display_code: string | null;
  created_at: string;
  updated_at: string;
  strand?: {
    id: string;
    name: string;
    curriculum_id: string;
  };
  tags?: {
    id: string;
    name: string;
    type: 'concept' | 'capability' | 'blooms_taxonomy';
  }[];
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
      let query = supabase
        .from('content_item')
        .select(`
          *,
          strand:strand_id (
            id,
            name,
            curriculum_id
          ),
          content_item_tag (
            tag:tag_id (
              id,
              name,
              type
            )
          )
        `)
        .order('code', { ascending: true });

      if (strandId) {
        query = query.eq('strand_id', strandId);
      }

      if (curriculumId) {
        query = query.eq('strand.curriculum_id', curriculumId);
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
        tags: item.content_item_tag?.map((cit: any) => 
          Array.isArray(cit.tag) ? cit.tag[0] : cit.tag
        ).filter(Boolean) || []
      })) || [];
    },
  });
};

export const useContentItemById = (contentItemId?: string) => {
  return useQuery({
    queryKey: ['contentItem', contentItemId],
    queryFn: async (): Promise<ContentItem | null> => {
      if (!contentItemId) return null;

      const { data, error } = await supabase
        .from('content_item')
        .select(`
          *,
          strand:strand_id (
            id,
            name,
            curriculum_id
          ),
          content_item_tag (
            tag:tag_id (
              id,
              name,
              type
            )
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
        tags: data.content_item_tag?.map((cit: any) => 
          Array.isArray(cit.tag) ? cit.tag[0] : cit.tag
        ).filter(Boolean) || []
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

      const { data, error } = await supabase
        .from('content_item')
        .select(`
          *,
          strand:strand_id (
            id,
            name,
            curriculum_id
          ),
          content_item_tag (
            tag:tag_id (
              id,
              name,
              type
            )
          )
        `)
        .in('id', contentItemIds)
        .order('code', { ascending: true });

      if (error) {
        console.error('Error fetching content items by ids:', error);
        throw error;
      }

      return data?.map(item => ({
        ...item,
        strand: Array.isArray(item.strand) ? item.strand[0] : item.strand,
        tags: item.content_item_tag?.map((cit: any) => 
          Array.isArray(cit.tag) ? cit.tag[0] : cit.tag
        ).filter(Boolean) || []
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

      const { data, error } = await supabase
        .from('content_item')
        .select(`
          *,
          strand:strand_id (
            id,
            name,
            curriculum_id
          ),
          content_item_tag (
            tag:tag_id (
              id,
              name,
              type
            )
          )
        `)
        .eq('code', contentItemCode)
        .single();

      if (error) {
        console.error('Error fetching content item by code:', error);
        throw error;
      }

      return {
        ...data,
        strand: Array.isArray(data.strand) ? data.strand[0] : data.strand,
        tags: data.content_item_tag?.map((cit: any) => 
          Array.isArray(cit.tag) ? cit.tag[0] : cit.tag
        ).filter(Boolean) || []
      };
    },
    enabled: !!contentItemCode,
  });
};