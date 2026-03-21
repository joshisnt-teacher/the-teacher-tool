import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClassContentItem {
  id: string;
  class_id: string;
  content_item_id: string;
  created_at: string;
}

export interface ClassContentItemWithDetails extends ClassContentItem {
  content_item: {
    id: string;
    code: string;
    description: string;
    display_code: string | null;
    strand_id: string;
    strand?: {
      id: string;
      name: string;
      curriculum_id: string;
    };
  };
}

export const useClassContentItems = (classId?: string) => {
  return useQuery({
    queryKey: ['class-content-items', classId],
    queryFn: async (): Promise<ClassContentItemWithDetails[]> => {
      if (!classId) return [];

      const { data, error } = await supabase
        .from('class_content_item')
        .select(`
          id,
          class_id,
          content_item_id,
          created_at,
          content_item:content_item_id (
            id,
            code,
            description,
            display_code,
            strand_id,
            strand:strand_id (
              id,
              name,
              curriculum_id
            )
          )
        `)
        .eq('class_id', classId);

      if (error) {
        console.error('Error fetching class content items:', error);
        throw error;
      }

      return data?.map(item => ({
        ...item,
        content_item: {
          ...item.content_item,
          strand: Array.isArray(item.content_item.strand) 
            ? item.content_item.strand[0] 
            : item.content_item.strand
        }
      })) || [];
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
      contentItemIds 
    }: { 
      classId: string; 
      contentItemIds: string[]; 
    }) => {
      // First, remove existing links
      await supabase
        .from('class_content_item')
        .delete()
        .eq('class_id', classId);

      // Then add new links
      if (contentItemIds.length > 0) {
        const { data, error } = await supabase
          .from('class_content_item')
          .insert(
            contentItemIds.map(contentItemId => ({
              class_id: classId,
              content_item_id: contentItemId,
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
        title: "Success",
        description: "Content items updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating class content items:', error);
      toast({
        title: "Error",
        description: "Failed to update content items",
        variant: "destructive",
      });
    },
  });

  return { updateClassContentItems };
};
