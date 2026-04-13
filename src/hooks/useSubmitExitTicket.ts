import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
    }: {
      taskId: string;
      studentId: string;
      answers: ExitTicketAnswer[];
      optionsMap: Record<string, { id: string; is_correct: boolean }[]>;
    }) => {
      let rawScore = 0;
      let gradableMaxScore = 0;
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
          gradableMaxScore += answer.maxScore || 0;
          rawScore += score;
          responseData = { selected_option_id: answer.selectedOptionId };
        } else {
          // short_answer / extended_answer - pending manual grading
          score = null;
          responseData = { text: answer.textAnswer || '' };
        }

        const percentScore =
          score !== null && (answer.maxScore || 0) > 0
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
        gradableMaxScore > 0
          ? Number(((rawScore / gradableMaxScore) * 100).toFixed(2))
          : null;

      // Insert result
      const { error: resultError } = await supabase.from('results').insert({
        task_id: taskId,
        student_id: studentId,
        raw_score: gradableMaxScore > 0 ? rawScore : null,
        percent_score: totalPercentScore,
        normalised_percent: totalPercentScore,
        feedback: null,
      });

      if (resultError) throw resultError;

      // Insert question results
      if (questionResultInserts.length > 0) {
        const { error: qrError } = await supabase
          .from('question_results')
          .insert(questionResultInserts);

        if (qrError) throw qrError;
      }

      return { taskId, studentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assessment-results', data.taskId] });
      queryClient.invalidateQueries({ queryKey: ['results'] });
      queryClient.invalidateQueries({ queryKey: ['question-results'] });
      toast({
        title: 'Submitted',
        description: 'Your exit ticket has been submitted successfully.',
      });
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
