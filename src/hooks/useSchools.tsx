import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface School {
  id: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSchoolData {
  name: string;
  domain?: string;
}

export const useSchools = () => {
  return useQuery({
    queryKey: ['schools'],
    queryFn: async (): Promise<School[]> => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching schools:', error);
        throw error;
      }
      
      return data || [];
    },
  });
};

export const useCreateSchool = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (schoolData: CreateSchoolData): Promise<School> => {
      const { data, error } = await supabase
        .from('schools')
        .insert({
          name: schoolData.name.trim(),
          domain: schoolData.domain?.trim() || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating school:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast({
        title: "School created successfully",
        description: `${data.name} has been added to the system.`,
      });
    },
    onError: (error: any) => {
      console.error('Create school error:', error);
      toast({
        title: "Error creating school",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateUserSchool = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, schoolId }: { userId: string; schoolId: string }): Promise<void> => {
      const { error } = await supabase
        .from('users')
        .update({ school_id: schoolId })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user school:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "School updated successfully",
        description: "Your school association has been updated.",
      });
    },
    onError: (error: any) => {
      console.error('Update user school error:', error);
      toast({
        title: "Error updating school",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });
};
