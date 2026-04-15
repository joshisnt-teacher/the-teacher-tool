import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HeatmapCell {
  studentId: string;
  studentName: string;
  questionId: string;
  questionNumber: number;
  questionText: string | null;
  maxScore: number | null;
  rawScore: number | null;
  percentScore: number | null;
  colorValue: number; // 0-1 for color mapping
}

export interface HeatmapData {
  students: Array<{
    id: string;
    name: string;
    totalScore: number;
    totalPercent: number;
  }>;
  questions: Array<{
    id: string;
    number: number;
    text: string | null;
    maxScore: number | null;
    averageScore: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
  }>;
  matrix: HeatmapCell[][];
}

export const useQuestionHeatmapData = (taskId?: string) => {
  return useQuery({
    queryKey: ['question-heatmap-data', taskId],
    queryFn: async () => {
      if (!taskId) {
        throw new Error('Task ID is required');
      }

      // Get all questions for this task - using any to bypass type issues
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, number, question, max_score')
        .eq('task_id', taskId)
        .order('number', { ascending: true }) as { data: any[] | null; error: any };

      if (questionsError) throw questionsError;
      if (!questions || questions.length === 0) return null;

      // Get all question results with student information
      const questionIds = questions.map((q: any) => q.id);
      const { data: results, error: resultsError } = await supabase
        .from('question_results')
        .select(`
          question_id,
          student_id,
          raw_score,
          percent_score,
          students!inner (
            first_name,
            last_name
          )
        `)
        .in('question_id', questionIds);

      if (resultsError) throw resultsError;
      if (!results || results.length === 0) return null;

      // Process students
      const studentMap = new Map();
      results.forEach(result => {
        const studentId = result.student_id;
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            id: studentId,
            name: `${result.students.first_name} ${result.students.last_name}`,
            scores: [],
            totalScore: 0,
            totalMaxScore: 0,
          });
        }
        
        const student = studentMap.get(studentId);
        student.scores.push({
          questionId: result.question_id,
          rawScore: result.raw_score,
          percentScore: result.percent_score,
        });
        
        if (result.raw_score !== null) {
          const question = questions.find((q: any) => q.id === result.question_id);
          if (question && question.max_score !== null) {
            student.totalScore += result.raw_score;
            student.totalMaxScore += question.max_score;
          }
        }
      });

      // Calculate student totals and sort by last name
      const students = Array.from(studentMap.values())
        .map(student => ({
          id: student.id,
          name: student.name,
          totalScore: student.totalScore,
          totalPercent: student.totalMaxScore > 0 ? Math.round((student.totalScore / student.totalMaxScore) * 100) : 0,
        }))
        .sort((a, b) => {
          const aLast = a.name.split(' ').pop() || a.name;
          const bLast = b.name.split(' ').pop() || b.name;
          return aLast.localeCompare(bLast);
        });

      // Process questions and calculate difficulty
      const questionStats = questions.map((question: any) => {
        const questionResults = results.filter(r => r.question_id === question.id);
        const validResults = questionResults.filter(r => r.percent_score !== null);
        
        const averageScore = validResults.length > 0
          ? validResults.reduce((sum, r) => sum + r.percent_score, 0) / validResults.length
          : 0;

        let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
        if (averageScore >= 80) difficulty = 'Easy';
        else if (averageScore <= 50) difficulty = 'Hard';

        return {
          id: question.id,
          number: question.number,
          text: question.question,
          maxScore: question.max_score,
          averageScore: Math.round(averageScore),
          difficulty,
        };
      });

      // Sort questions by difficulty (hardest first) or by number
      const sortedQuestions = [...questionStats].sort((a, b) => a.number - b.number);

      // Create matrix
      const matrix: HeatmapCell[][] = students.map(student => {
        return sortedQuestions.map(question => {
          const result = results.find(r => 
            r.student_id === student.id && r.question_id === question.id
          );

          const percentScore = result?.percent_score || 0;
          const colorValue = percentScore / 100; // 0-1 for color mapping

          return {
            studentId: student.id,
            studentName: student.name,
            questionId: question.id,
            questionNumber: question.number,
            questionText: question.question,
            maxScore: question.maxScore,
            rawScore: result?.raw_score || null,
            percentScore: result?.percent_score || null,
            colorValue,
          };
        });
      });

      return {
        students,
        questions: sortedQuestions,
        matrix,
      } as HeatmapData;
    },
    enabled: !!taskId,
  });
};