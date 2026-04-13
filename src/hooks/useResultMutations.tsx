import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TaskResult {
  id?: string;
  task_id: string;
  student_id: string;
  raw_score: number | null;
  percent_score: number | null;
  normalised_percent: number | null;
  feedback: string | null;
}

export const useResultMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createResult = useMutation({
    mutationFn: async (resultData: Omit<TaskResult, 'id'>) => {
      const { data, error } = await supabase
        .from('results')
        .insert(resultData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assessment-results', data.task_id] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['results'] });
      toast({
        title: 'Success',
        description: 'Result added successfully',
      });
    },
    onError: (error) => {
      console.error('Error creating result:', error);
      toast({
        title: 'Error',
        description: 'Failed to add result',
        variant: 'destructive',
      });
    },
  });

  const updateResult = useMutation({
    mutationFn: async ({
      task_id,
      student_id,
      ...updateData
    }: Partial<Omit<TaskResult, 'task_id' | 'student_id'>> & {
      task_id: string;
      student_id: string;
    }) => {
      const { data, error } = await supabase
        .from('results')
        .update(updateData)
        .eq('task_id', task_id)
        .eq('student_id', student_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assessment-results', data.task_id] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['results'] });
      toast({
        title: 'Success',
        description: 'Result updated successfully',
      });
    },
    onError: (error) => {
      console.error('Error updating result:', error);
      toast({
        title: 'Error',
        description: 'Failed to update result',
        variant: 'destructive',
      });
    },
  });

  const deleteResult = useMutation({
    mutationFn: async ({
      task_id,
      student_id,
    }: {
      task_id: string;
      student_id: string;
    }) => {
      const { error } = await supabase
        .from('results')
        .delete()
        .eq('task_id', task_id)
        .eq('student_id', student_id);

      if (error) throw error;
      return { task_id, student_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assessment-results', data.task_id] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['results'] });
      toast({
        title: 'Success',
        description: 'Result removed successfully',
      });
    },
    onError: (error) => {
      console.error('Error deleting result:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove result',
        variant: 'destructive',
      });
    },
  });

  return {
    createResult,
    updateResult,
    deleteResult,
  };
};
