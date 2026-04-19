import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClassResource {
  id: string;
  class_id: string;
  resource_id: string;
  teacher_id: string;
  status: 'created' | 'active' | 'closed';
  created_at: string;
  resource: {
    id: string;
    title: string;
    url: string;
    category: string;
    description: string | null;
  };
}

export function useClassResources(classId?: string) {
  return useQuery({
    queryKey: ['class-resources', classId],
    queryFn: async (): Promise<ClassResource[]> => {
      if (!classId) return [];
      const { data, error } = await supabase
        .from('class_resources')
        .select(`
          *,
          resource:resources(id, title, url, category, description)
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClassResource[];
    },
    enabled: !!classId,
  });
}

export function useAssignResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { class_id: string; resource_id: string; teacher_id: string }) => {
      const { data, error } = await supabase
        .from('class_resources')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['class-resources', vars.class_id] });
    },
  });
}

export function useUnassignResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, classId }: { id: string; classId: string }) => {
      const { error } = await supabase.from('class_resources').delete().eq('id', id);
      if (error) throw error;
      return { classId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['class-resources', result.classId] });
    },
  });
}
