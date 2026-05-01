import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DeleteRunInput {
  taskId: string;
  classId: string;
  templateId: string | null;
}

export const useDeleteRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId }: DeleteRunInput) => {
      const { data: questions } = await supabase
        .from('questions')
        .select('id')
        .eq('task_id', taskId);

      if (questions && questions.length > 0) {
        await supabase
          .from('question_results')
          .delete()
          .in('question_id', questions.map((q) => q.id));
      }

      await supabase.from('results').delete().eq('task_id', taskId);

      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: (_, { classId, templateId }) => {
      queryClient.invalidateQueries({ queryKey: ['exit-tickets-by-class', classId] });
      if (templateId) {
        queryClient.invalidateQueries({ queryKey: ['runs-for-template', templateId] });
      }
      queryClient.invalidateQueries({ queryKey: ['assessments', classId] });
    },
  });
};
