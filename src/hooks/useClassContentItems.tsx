import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { centralSupabase } from '@/integrations/supabase/centralClient';
import { useToast } from '@/hooks/use-toast';

export interface ClassContentItem {
  id: string;
  class_id: string;
  content_item_source_id: string;
  created_at: string;
}

export interface ClassContentItemWithDetails extends ClassContentItem {
  content_item: {
    id: string;
    source_id: string;
    code: string | null;
    description: string;
    strand_id: string;
    strand: {
      id: string;
      name: string;
      curriculum_id: string;
    } | undefined;
  };
}

export const useClassContentItems = (classId?: string) => {
  return useQuery({
    queryKey: ['class-content-items', classId],
    queryFn: async (): Promise<ClassContentItemWithDetails[]> => {
      if (!classId) return [];

      // Step 1: fetch the links from the local Pulse DB
      const { data: links, error } = await supabase
        .from('class_content_item')
        .select('id, class_id, content_item_source_id, created_at')
        .eq('class_id', classId);

      if (error) {
        console.error('Error fetching class content items:', error);
        throw error;
      }

      if (!links?.length) return [];

      // Step 2: resolve full content item details from the central DB
      const sourceIds = links.map(l => l.content_item_source_id);
      const { data: contentItemRows, error: ciError } = await centralSupabase
        .from('curriculum_content_item')
        .select(`
          id,
          source_id,
          code,
          description,
          strand_id,
          strand:strand_id (
            id,
            name,
            curriculum_id
          )
        `)
        .in('source_id', sourceIds);

      if (ciError) {
        console.error('Error fetching content item details from central DB:', ciError);
        throw ciError;
      }

      const ciBySourceId = new Map(
        (contentItemRows ?? []).map(item => [
          item.source_id,
          {
            ...item,
            strand: Array.isArray(item.strand) ? item.strand[0] : item.strand,
          },
        ])
      );

      return links
        .map(link => ({
          ...link,
          content_item: ciBySourceId.get(link.content_item_source_id) ?? null,
        }))
        .filter((item): item is ClassContentItemWithDetails => item.content_item !== null);
    },
    enabled: !!classId,
  });
};

export const useClassContentItemMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateClassContentItems = useMutation({
    mutationFn: async ({
      classId,
      sourceIds,
    }: {
      classId: string;
      sourceIds: string[];
    }) => {
      await supabase.from('class_content_item').delete().eq('class_id', classId);

      if (sourceIds.length > 0) {
        const { data, error } = await supabase
          .from('class_content_item')
          .insert(
            sourceIds.map(source_id => ({
              class_id: classId,
              content_item_source_id: source_id,
            }))
          );

        if (error) throw error;
        return data;
      }
      return [];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-content-items', variables.classId] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: 'Success',
        description: 'Content items updated successfully',
      });
    },
    onError: (error) => {
      console.error('Error updating class content items:', error);
      toast({
        title: 'Error',
        description: 'Failed to update content items',
        variant: 'destructive',
      });
    },
  });

  return { updateClassContentItems };
};
