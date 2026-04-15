import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CreateAssessmentData {
  name: string;
  class_id: string;
  task_type: 'Diagnostic' | 'Formative' | 'Summative';
  description?: string;
  assessment_format: 'confidence_check';
  blooms_taxonomy?: string;
  key_skill?: string;
  content_item_id?: string;
  question_text?: string;
  due_date?: string;
  weight_percent?: number;
  max_score?: number;
  is_legacy: false;
}

export const useCreateAssessment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateAssessmentData) => {
      const { data: assessment, error } = await supabase
        .from('tasks')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return assessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: "Success",
        description: "Assessment created successfully",
      });
    },
    onError: (error) => {
      console.error('Create assessment error:', error);
      toast({
        title: "Error",
        description: "Failed to create assessment",
        variant: "destructive",
      });
    },
  });
};

export const useBloomsTaxonomy = () => {
  return [
    'Remember',
    'Understand', 
    'Apply',
    'Analyse',
    'Evaluate',
    'Create'
  ];
};