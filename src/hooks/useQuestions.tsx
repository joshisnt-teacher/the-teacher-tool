import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Question {
  id: string;
  task_id: string;
  number: number;
  question: string | null;
  max_score: number | null;
  question_type: string | null;
  content_item: string | null;
  general_capabilities: string[] | null;
  blooms_taxonomy: string | null;
  marking_criteria: Record<string, unknown> | null;
  model_answer: string | null;
  created_at: string;
  updated_at: string;
}

// Keep QuestionWithMetadata for backward compatibility, but now it's just an alias
export interface QuestionWithMetadata extends Question {}

export const useQuestions = (taskId?: string) => {
  return useQuery({
    queryKey: taskId ? ['questions', taskId] : ['questions'],
    queryFn: async () => {
      if (!taskId) {
        throw new Error('Task ID is required');
      }

      // Query questions with all metadata fields directly from the questions table
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('task_id', taskId)
        .order('number', { ascending: true });

      if (questionsError) throw questionsError;

      if (!questions || questions.length === 0) {
        return [];
      }

      // Return questions directly since metadata is now part of the questions table
      return questions.map((q: any) => ({
        ...q,
        question: q.question || null, // Use the actual question field from database
      })) as QuestionWithMetadata[];
    },
    enabled: !!taskId,
  });
};

export const useQuestionMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createQuestion = useMutation({
    mutationFn: async (questionData: Omit<Question, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('questions')
        .insert(questionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['questions', data.task_id] });
      toast({
        title: "Success",
        description: "Question created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating question:', error);
      toast({
        title: "Error",
        description: "Failed to create question",
        variant: "destructive",
      });
    },
  });

  const updateQuestion = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Question> & { id: string }) => {
      const { data, error } = await supabase
        .from('questions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['questions', data.task_id] });
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating question:', error);
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      });
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    },
  });

  return {
    createQuestion,
    updateQuestion,
    deleteQuestion,
  };
};
