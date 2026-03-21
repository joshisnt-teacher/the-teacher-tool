import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TaskQuestionResult {
  question_id: string;
  question_number: number;
  question_text: string | null;
  question_type: string | null;
  max_score: number | null;
  blooms_taxonomy: string | null;
  content_item: string | null;
  average_score: number;
  total_attempts: number;
  correct_attempts: number;
  percentage_correct: number;
  percentage_wrong: number;
}

export const useTaskQuestionResults = (taskId?: string) => {
  return useQuery({
    queryKey: ['taskQuestionResults', taskId],
    queryFn: async (): Promise<TaskQuestionResult[]> => {
      if (!taskId) {
        throw new Error('Task ID is required');
      }

      // First get all questions for this task
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select(`
          id,
          number,
          question,
          question_type,
          max_score,
          blooms_taxonomy,
          content_item
        `)
        .eq('task_id', taskId) as { data: any[] | null; error: any };

      if (questionsError) throw questionsError;
      if (!questions || questions.length === 0) return [];

      // Then get all question results for these questions
      const questionIds = questions.map(q => q.id);
      const { data: results, error: resultsError } = await supabase
        .from('question_results')
        .select(`
          question_id,
          raw_score,
          percent_score
        `)
        .in('question_id', questionIds);

      if (resultsError) throw resultsError;

      // Group results by question and calculate statistics
      const questionStats = new Map<string, {
        question_id: string;
        question_number: number;
        question_text: string | null;
        question_type: string | null;
        max_score: number | null;
        blooms_taxonomy: string | null;
        content_item: string | null;
        scores: number[];
        percent_scores: number[];
      }>();

      // Initialize with all questions
      questions.forEach(question => {
        questionStats.set(question.id, {
          question_id: question.id,
          question_number: question.number,
          question_text: question.question,
          question_type: question.question_type,
          max_score: question.max_score,
          blooms_taxonomy: question.blooms_taxonomy,
          content_item: question.content_item,
          scores: [],
          percent_scores: []
        });
      });

      // Add results data
      results?.forEach(result => {
        const stats = questionStats.get(result.question_id);
        if (stats) {
          if (result.raw_score !== null) {
            stats.scores.push(result.raw_score);
          }
          if (result.percent_score !== null) {
            stats.percent_scores.push(result.percent_score);
          }
        }
      });

      // Convert to final format with calculated statistics
      return Array.from(questionStats.values()).map(stats => {
        const totalAttempts = stats.percent_scores.length;
        const correctAttempts = stats.percent_scores.filter(score => score >= 50).length;
        const averageScore = totalAttempts > 0 
          ? stats.percent_scores.reduce((sum, score) => sum + score, 0) / totalAttempts 
          : 0;

        return {
          question_id: stats.question_id,
          question_number: stats.question_number,
          question_text: stats.question_text,
          question_type: stats.question_type,
          max_score: stats.max_score,
          blooms_taxonomy: stats.blooms_taxonomy,
          content_item: stats.content_item,
          average_score: averageScore,
          total_attempts: totalAttempts,
          correct_attempts: correctAttempts,
          percentage_correct: totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0,
          percentage_wrong: totalAttempts > 0 ? ((totalAttempts - correctAttempts) / totalAttempts) * 100 : 0,
        };
      }).sort((a, b) => a.question_number - b.question_number);
    },
    enabled: !!taskId,
  });
};
