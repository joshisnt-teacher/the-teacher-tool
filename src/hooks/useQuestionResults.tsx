import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface QuestionResult {
  id: string;
  question_id: string;
  student_id: string;
  raw_score: number | null;
  percent_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionResultWithDetails extends QuestionResult {
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    student_id: string;
  };
  question?: {
    id: string;
    number: number;
    text: string | null;
    max_score: number | null;
  };
}

export const useQuestionResults = (questionId?: string) => {
  return useQuery({
    queryKey: questionId ? ['questionResults', questionId] : ['questionResults'],
    queryFn: async () => {
      if (!questionId) {
        throw new Error('Question ID is required');
      }

      const { data, error } = await supabase
        .from('question_results')
        .select(`
          *,
          students!inner (
            id,
            first_name,
            last_name,
            student_id
          ),
          questions!inner (
            id,
            number,
            text,
            max_score
          )
        `)
        .eq('question_id', questionId);

      if (error) throw error;
      return data as QuestionResultWithDetails[];
    },
    enabled: !!questionId,
  });
};

export const useStudentQuestionResults = (studentId?: string, taskId?: string) => {
  return useQuery({
    queryKey: studentId && taskId ? ['studentQuestionResults', studentId, taskId] : ['studentQuestionResults'],
    queryFn: async () => {
      if (!studentId || !taskId) {
        throw new Error('Student ID and Task ID are required');
      }

      const { data, error } = await supabase
        .from('question_results')
        .select(`
          *,
          questions!inner (
            id,
            task_id,
            number,
            text,
            max_score,
            question_type
          )
        `)
        .eq('student_id', studentId)
        .eq('questions.task_id', taskId)
        .order('questions(number)', { ascending: true });

      if (error) throw error;
      return data as QuestionResultWithDetails[];
    },
    enabled: !!studentId && !!taskId,
  });
};

export const useQuestionResultMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createQuestionResult = useMutation({
    mutationFn: async (resultData: Omit<QuestionResult, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('question_results')
        .insert(resultData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['questionResults', data.question_id] });
      queryClient.invalidateQueries({ queryKey: ['studentQuestionResults', data.student_id] });
      toast({
        title: "Success",
        description: "Question result created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating question result:', error);
      toast({
        title: "Error",
        description: "Failed to create question result",
        variant: "destructive",
      });
    },
  });

  const updateQuestionResult = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<QuestionResult> & { id: string }) => {
      const { data, error } = await supabase
        .from('question_results')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['questionResults', data.question_id] });
      queryClient.invalidateQueries({ queryKey: ['studentQuestionResults', data.student_id] });
      toast({
        title: "Success",
        description: "Question result updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating question result:', error);
      toast({
        title: "Error",
        description: "Failed to update question result",
        variant: "destructive",
      });
    },
  });

  const batchCreateQuestionResults = useMutation({
    mutationFn: async (resultsData: Omit<QuestionResult, 'id' | 'created_at' | 'updated_at'>[]) => {
      const { data, error } = await supabase
        .from('question_results')
        .insert(resultsData)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionResults'] });
      queryClient.invalidateQueries({ queryKey: ['studentQuestionResults'] });
      toast({
        title: "Success",
        description: "Question results imported successfully",
      });
    },
    onError: (error) => {
      console.error('Error batch creating question results:', error);
      toast({
        title: "Error",
        description: "Failed to import question results",
        variant: "destructive",
      });
    },
  });

  return {
    createQuestionResult,
    updateQuestionResult,
    batchCreateQuestionResults,
  };
};