import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AIGeneratedExitTicket {
  name: string;
  description: string;
  questions: {
    question: string;
    question_type: 'multiple_choice' | 'short_answer' | 'extended_answer';
    max_score: number;
    blooms_taxonomy?: string;
    content_item_id?: string;
    options?: { option_text: string; is_correct: boolean }[];
    marking_criteria?: {
      expected_keywords: string[];
      match_type: 'all' | 'any';
      case_sensitive: boolean;
    };
    model_answer?: string;
  }[];
}

export const useAIGenerateExitTicket = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      content,
      questionCount,
      questionTypes,
      classId,
    }: {
      content: string;
      questionCount: number;
      questionTypes: 'mcq' | 'short_answer' | 'extended' | 'mix';
      classId: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-exit-ticket', {
        body: {
          content,
          question_count: questionCount,
          question_types: questionTypes,
          class_id: classId,
        },
      });
      if (error) throw error;
      return data as AIGeneratedExitTicket;
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : (error as { message?: string })?.message;
      toast({
        title: 'Generation failed',
        description: msg || 'Check your OpenAI API key in Settings and try again.',
        variant: 'destructive',
      });
    },
  });
};
