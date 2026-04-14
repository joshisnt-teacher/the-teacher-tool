import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Calls the ai-mark-response Edge Function for teacher-triggered marking
export const useAIMarkResponses = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      questionResultIds,
      taskId,
    }: {
      questionResultIds: string[];
      taskId: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-mark-response', {
        body: { question_result_ids: questionResultIds, task_id: taskId },
      });
      if (error) throw error;
      return data as {
        success?: boolean;
        skipped?: boolean;
        reason?: string;
        marked?: { id: string; score: number; feedback: string }[];
      };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assessment-results', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['assessment-question-results', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['results'] });
      if (data?.skipped) {
        toast({
          title: 'No API key set',
          description: 'Add your OpenAI key in Settings to use AI marking.',
        });
      } else {
        toast({
          title: 'AI marking complete',
          description: `Marked ${data?.marked?.length ?? 0} response${data?.marked?.length === 1 ? '' : 's'}.`,
        });
      }
    },
    onError: () => {
      toast({
        title: 'AI marking failed',
        description: 'Check your API key in Settings and try again.',
        variant: 'destructive',
      });
    },
  });
};
