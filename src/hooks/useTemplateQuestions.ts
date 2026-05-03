import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TemplateQuestionOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface TemplateQuestion {
  id: string;
  template_id: string;
  number: number;
  question: string | null;
  question_type: string | null;
  max_score: number | null;
  blooms_taxonomy: string | null;
  content_item: string | null;
  general_capabilities: string[] | null;
  marking_criteria: unknown | null;
  model_answer: string | null;
  options: TemplateQuestionOption[];
}

export const useTemplateQuestions = (templateId?: string | null) => {
  return useQuery({
    queryKey: ['template-questions', templateId],
    queryFn: async (): Promise<TemplateQuestion[]> => {
      if (!templateId) return [];

      const { data: questions, error: qErr } = await supabase
        .from('template_questions')
        .select('*')
        .eq('template_id', templateId)
        .order('number', { ascending: true });

      if (qErr) throw qErr;

      const result: TemplateQuestion[] = [];
      for (const q of questions || []) {
        const { data: opts } = await supabase
          .from('template_question_options')
          .select('id, option_text, is_correct, order_index')
          .eq('template_question_id', q.id)
          .order('order_index', { ascending: true });

        result.push({ ...q, marking_criteria: q.marking_criteria ?? null, options: opts || [] });
      }
      return result;
    },
    enabled: !!templateId,
  });
};
