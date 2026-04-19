import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Resource {
  id: string;
  school_id: string;
  teacher_id: string;
  title: string;
  url: string;
  description: string | null;
  category: string;
  access_notes: string | null;
  how_to_use: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type ResourceInsert = Omit<Resource, 'id' | 'created_at' | 'updated_at'>;
export type ResourceUpdate = Partial<Omit<Resource, 'id' | 'created_at' | 'updated_at'>> & { id: string };

export function useResources(schoolId?: string) {
  return useQuery({
    queryKey: ['resources', schoolId],
    queryFn: async (): Promise<Resource[]> => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Resource[];
    },
    enabled: !!schoolId,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (resource: ResourceInsert) => {
      const { data, error } = await supabase
        .from('resources')
        .insert(resource)
        .select()
        .single();
      if (error) throw error;
      return data as Resource;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resources', data.school_id] });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: ResourceUpdate) => {
      const { data, error } = await supabase
        .from('resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Resource;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resources', data.school_id] });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, schoolId }: { id: string; schoolId: string }) => {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
      return { id, schoolId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['resources', result.schoolId] });
    },
  });
}
