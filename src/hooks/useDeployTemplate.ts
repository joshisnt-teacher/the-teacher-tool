import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DeployInput {
  templateId: string;
  classId: string;
}

export const useDeployTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, classId }: DeployInput) => {
      const { data: template, error: tErr } = await supabase
        .from('exit_ticket_templates')
        .select('name, description')
        .eq('id', templateId)
        .single();
      if (tErr) throw tErr;

      const { data: templateQuestions, error: qErr } = await supabase
        .from('template_questions')
        .select('*')
        .eq('template_id', templateId)
        .order('number', { ascending: true });
      if (qErr) throw qErr;

      const totalMaxScore = (templateQuestions || []).reduce(
        (sum, q) => sum + (Number(q.max_score) || 0),
        0
      );

      const { data: run, error: runErr } = await supabase
        .from('tasks')
        .insert({
          name: template.name,
          description: template.description,
          class_id: classId,
          is_exit_ticket: true,
          status: 'draft',
          exit_ticket_template_id: templateId,
          max_score: totalMaxScore,
          task_type: 'Formative',
        })
        .select('id')
        .single();
      if (runErr) throw runErr;

      for (const tq of templateQuestions || []) {
        const { data: question, error: insertQErr } = await supabase
          .from('questions')
          .insert({
            task_id: run.id,
            number: tq.number,
            question: tq.question,
            question_type: tq.question_type,
            max_score: tq.max_score,
            blooms_taxonomy: tq.blooms_taxonomy,
            content_item: tq.content_item,
            general_capabilities: tq.general_capabilities,
            marking_criteria: tq.marking_criteria,
            model_answer: tq.model_answer,
          })
          .select('id')
          .single();
        if (insertQErr) throw insertQErr;

        if (tq.question_type === 'multiple_choice') {
          const { data: opts } = await supabase
            .from('template_question_options')
            .select('option_text, is_correct, order_index')
            .eq('template_question_id', tq.id)
            .order('order_index', { ascending: true });

          if (opts && opts.length > 0) {
            const { error: optErr } = await supabase
              .from('question_options')
              .insert(opts.map((o) => ({
                question_id: question.id,
                option_text: o.option_text,
                is_correct: o.is_correct,
                order_index: o.order_index,
              })));
            if (optErr) throw optErr;
          }
        }
      }

      return run;
    },
    onSuccess: (_, { classId, templateId }) => {
      queryClient.invalidateQueries({ queryKey: ['exit-tickets-by-class', classId] });
      queryClient.invalidateQueries({ queryKey: ['runs-for-template', templateId] });
      queryClient.invalidateQueries({ queryKey: ['assessments', classId] });
    },
  });
};
