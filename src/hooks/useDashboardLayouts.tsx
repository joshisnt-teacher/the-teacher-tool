import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DashboardLayout {
  id: string;
  teacher_id: string;
  class_id: string;
  name: string;
  is_default: boolean;
  layout_config: any[];
  created_at: string;
  updated_at: string;
}

export interface CreateDashboardLayoutData {
  class_id: string;
  name: string;
  is_default?: boolean;
  layout_config?: any[];
}

export const useDashboardLayouts = (classId: string) => {
  return useQuery({
    queryKey: ['dashboard-layouts', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DashboardLayout[];
    },
    enabled: !!classId,
  });
};

export const useCreateDashboardLayout = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateDashboardLayoutData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: layout, error } = await supabase
        .from('dashboard_layouts')
        .insert({
          ...data,
          teacher_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return layout as DashboardLayout;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-layouts', data.class_id] });
      toast({
        title: "Layout created",
        description: "Dashboard layout has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create dashboard layout.",
        variant: "destructive",
      });
      console.error('Error creating dashboard layout:', error);
    },
  });
};

export const useUpdateDashboardLayout = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DashboardLayout> & { id: string }) => {
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DashboardLayout;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-layouts', data.class_id] });
      toast({
        title: "Layout updated",
        description: "Dashboard layout has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update dashboard layout.",
        variant: "destructive",
      });
      console.error('Error updating dashboard layout:', error);
    },
  });
};