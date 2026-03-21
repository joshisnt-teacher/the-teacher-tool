import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DashboardWidget {
  id: string;
  layout_id: string;
  widget_type: 'kpi' | 'line_chart' | 'bar_chart' | 'pie_chart' | 'heatmap' | 'markdown';
  title: string;
  data_source: string;
  filters: any;
  position: { x: number; y: number; w: number; h: number };
  config: any;
  created_at: string;
  updated_at: string;
}

export interface CreateDashboardWidgetData {
  layout_id: string;
  widget_type: DashboardWidget['widget_type'];
  title: string;
  data_source: string;
  filters?: any;
  position: { x: number; y: number; w: number; h: number };
  config?: any;
}

export const useDashboardWidgets = (layoutId: string) => {
  return useQuery({
    queryKey: ['dashboard-widgets', layoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .eq('layout_id', layoutId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as DashboardWidget[];
    },
    enabled: !!layoutId,
  });
};

export const useCreateDashboardWidget = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateDashboardWidgetData) => {
      const { data: widget, error } = await supabase
        .from('dashboard_widgets')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return widget as DashboardWidget;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets', data.layout_id] });
      toast({
        title: "Widget added",
        description: "Widget has been added to your dashboard.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add widget to dashboard.",
        variant: "destructive",
      });
      console.error('Error creating dashboard widget:', error);
    },
  });
};

export const useUpdateDashboardWidget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DashboardWidget> & { id: string }) => {
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DashboardWidget;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets', data.layout_id] });
    },
    onError: (error) => {
      console.error('Error updating dashboard widget:', error);
    },
  });
};

export const useDeleteDashboardWidget = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dashboard_widgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] });
      toast({
        title: "Widget removed",
        description: "Widget has been removed from your dashboard.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove widget.",
        variant: "destructive",
      });
      console.error('Error deleting dashboard widget:', error);
    },
  });
};