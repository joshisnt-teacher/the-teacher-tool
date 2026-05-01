import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ClearRunInput {
  taskId: string;
  classId: string;
  templateId: string | null;
}

export const useClearRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId }: ClearRunInput) => {
      const { data: questions } = await supabase
        .from('questions')
        .select('id')
        .eq('task_id', taskId);

      if (questions && questions.length > 0) {
        const { error: qrErr } = await supabase
          .from('question_results')
          .delete()
          .in('question_id', questions.map((q) => q.id));
        if (qrErr) throw qrErr;
      }

      const { error: rErr } = await supabase
        .from('results')
        .delete()
        .eq('task_id', taskId);
      if (rErr) throw rErr;

      const { error: tErr } = await supabase
        .from('tasks')
        .update({ status: 'draft', is_completed: false })
        .eq('id', taskId);
      if (tErr) throw tErr;
    },
    onSuccess: (_, { classId, templateId }) => {
      queryClient.invalidateQueries({ queryKey: ['exit-tickets-by-class', classId] });
      if (templateId) {
        queryClient.invalidateQueries({ queryKey: ['runs-for-template', templateId] });
      }
      queryClient.invalidateQueries({ queryKey: ['results'] });
      queryClient.invalidateQueries({ queryKey: ['question-results'] });
    },
  });
};
