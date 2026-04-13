import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
}

export const useQuestionOptions = (questionId?: string) => {
  return useQuery({
    queryKey: ['question-options', questionId],
    queryFn: async (): Promise<QuestionOption[]> => {
      if (!questionId) return [];

      const { data, error } = await supabase
        .from('question_options')
        .select('*')
        .eq('question_id', questionId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching question options:', error);
        throw error;
      }

      return (data || []) as QuestionOption[];
    },
    enabled: !!questionId,
  });
};

export const useQuestionOptionsForTask = (taskId?: string) => {
  return useQuery({
    queryKey: ['question-options-for-task', taskId],
    queryFn: async (): Promise<Record<string, QuestionOption[]>> => {
      if (!taskId) return {};

      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('id')
        .eq('task_id', taskId);

      if (qError) {
        console.error('Error fetching questions for options:', qError);
        throw qError;
      }

      if (!questions || questions.length === 0) return {};

      const questionIds = questions.map((q) => q.id);
      const { data, error } = await supabase
        .from('question_options')
        .select('*')
        .in('question_id', questionIds)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching question options for task:', error);
        throw error;
      }

      const map: Record<string, QuestionOption[]> = {};
      for (const opt of (data || []) as QuestionOption[]) {
        if (!map[opt.question_id]) map[opt.question_id] = [];
        map[opt.question_id].push(opt);
      }
      return map;
    },
    enabled: !!taskId,
  });
};
