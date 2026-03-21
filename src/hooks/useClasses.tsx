import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCurrentUser } from './useCurrentUser';
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
  created_at: string;
  updated_at: string;
}

export interface CreateClassData {
  class_name: string;
  year_level: string;
  subject: string;
  term: string;
  start_date: string;
  end_date: string;
}

export const useClasses = () => {
  const { user } = useAuth();
  const { data: currentUser } = useCurrentUser();

  return useQuery({
    queryKey: ['classes', user?.id],
    queryFn: async (): Promise<Class[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
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

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (classData: CreateClassData): Promise<Class> => {
      if (!user || !currentUser?.school_id) {
        throw new Error('User must be logged in and have a school');
      }

      const { data, error } = await supabase
        .from('classes')
        .insert({
          ...classData,
          teacher_id: user.id,
          school_id: currentUser.school_id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating class:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: "Class created successfully",
        description: `${data.class_name} has been added to your classes.`,
      });
    },
    onError: (error) => {
      console.error('Create class error:', error);
      toast({
        title: "Error creating class",
        description: "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });
};