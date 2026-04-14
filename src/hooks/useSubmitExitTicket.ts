import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { autoMarkTextAnswer, type MarkingCriteria } from '@/lib/autoMarkTextAnswer';

export interface ExitTicketAnswer {
  questionId: string;
  maxScore: number | null;
  questionType: string;
  selectedOptionId?: string | null;
  textAnswer?: string | null;
}

export const useSubmitExitTicket = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      taskId,
      studentId,
      answers,
      optionsMap,
      markingCriteriaMap,
      totalMaxScore,
    }: {
      taskId: string;
      studentId: string;
      answers: ExitTicketAnswer[];
      optionsMap: Record<string, { id: string; is_correct: boolean }[]>;
      markingCriteriaMap: Record<string, MarkingCriteria | null>;
      totalMaxScore: number;
    }) => {
      let rawScore = 0;
      const questionResultInserts: {
        question_id: string;
        student_id: string;
        raw_score: number | null;
        percent_score: number | null;
        response_data: unknown;
      }[] = [];

      for (const answer of answers) {
        let score: number | null = null;
        let responseData: unknown = null;

        if (answer.questionType === 'multiple_choice') {
          const options = optionsMap[answer.questionId] || [];
          const selected = options.find((o) => o.id === answer.selectedOptionId);
          const isCorrect = selected?.is_correct ?? false;
          score = isCorrect ? (answer.maxScore || 0) : 0;
          rawScore += score;
          responseData = { selected_option_id: answer.selectedOptionId };
        } else {
          // short_answer / extended_answer - auto-mark using keywords
          const criteria = markingCriteriaMap[answer.questionId];
          const text = answer.textAnswer || '';
          score = autoMarkTextAnswer(text, criteria, answer.maxScore || 0);
          rawScore += score;
          responseData = { text };
        }

        const percentScore =
          (answer.maxScore || 0) > 0
            ? Number(((score / (answer.maxScore || 1)) * 100).toFixed(2))
            : null;

        questionResultInserts.push({
          question_id: answer.questionId,
          student_id: studentId,
          raw_score: score,
          percent_score: percentScore,
          response_data: responseData,
        });
      }

      const totalPercentScore =
        totalMaxScore > 0
          ? Number(((rawScore / totalMaxScore) * 100).toFixed(2))
          : null;

      // Insert result
      const { error: resultError } = await supabase.from('results').insert({
        task_id: taskId,
        student_id: studentId,
        raw_score: totalMaxScore > 0 ? rawScore : null,
        percent_score: totalPercentScore,
        normalised_percent: totalPercentScore,
        feedback: null,
      });

      if (resultError) throw resultError;

      // Insert question results and capture IDs for AI marking
      let textAnswerQRIds: string[] = [];
      if (questionResultInserts.length > 0) {
        const { data: insertedQRs, error: qrError } = await supabase
          .from('question_results')
          .insert(questionResultInserts)
          .select('id, question_id');

        if (qrError) throw qrError;

        textAnswerQRIds = (insertedQRs ?? [])
          .filter((qr) => {
            const answer = answers.find((a) => a.questionId === qr.question_id);
            return answer && answer.questionType !== 'multiple_choice';
          })
          .map((qr) => qr.id);
      }

      return { taskId, studentId, textAnswerQRIds };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assessment-results', data.taskId] });
      queryClient.invalidateQueries({ queryKey: ['results'] });
      queryClient.invalidateQueries({ queryKey: ['question-results'] });
      toast({
        title: 'Submitted',
        description: 'Your exit ticket has been submitted successfully.',
      });
      // Trigger AI marking for text answers (fire-and-forget — failure is non-blocking)
      if (data.textAnswerQRIds.length > 0) {
        supabase.functions.invoke('ai-mark-response', {
          body: { question_result_ids: data.textAnswerQRIds, task_id: data.taskId },
        }).then(({ error }) => {
          if (error) console.error('AI marking failed silently:', error);
        });
      }
    },
    onError: (error: unknown) => {
      console.error('Submit exit ticket error:', error);
      toast({
        title: 'Submission failed',
        description: error?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });
};
