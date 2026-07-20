import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Class {
  id: string;
  class_name: string;
  year_level: string;
  subject: string;
  term: string;
  start_date: string;
  end_date: string;
  teacher_id: string;
  school_id: string;
  curriculum_id?: string;
  is_demo: boolean;
  class_code: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export const useClasses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['classes', user?.id],
    queryFn: async (): Promise<Class[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching classes:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user,
  });
};

export const useUpdateClassDemo = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ classId, is_demo }: { classId: string; is_demo: boolean }) => {
      const { error } = await supabase
        .from('classes')
        .update({ is_demo })
        .eq('id', classId);

      if (error) throw error;
    },
    onSuccess: (_, { is_demo }) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['total-student-count'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-assessments-count'] });
      queryClient.invalidateQueries({ queryKey: ['average-class-score'] });
      toast({
        title: is_demo ? 'Demo mode enabled' : 'Demo mode disabled',
        description: is_demo
          ? 'This class will be excluded from dashboard statistics.'
          : 'This class will now appear in dashboard statistics.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update demo setting.',
        variant: 'destructive',
      });
    },
  });
};