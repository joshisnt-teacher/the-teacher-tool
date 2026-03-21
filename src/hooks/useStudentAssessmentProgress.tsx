import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AssessmentProgressData {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  percentScore: number;
  date: string;
  assessmentType: string;
  taskType: string;
}

export const useStudentAssessmentProgress = (studentId?: string, classId?: string, limit?: number) => {
  return useQuery({
    queryKey: ['student-assessment-progress', studentId, classId, limit],
    queryFn: async (): Promise<AssessmentProgressData[]> => {
      if (!studentId || !classId) return [];

      const { data, error } = await supabase
        .from('results')
        .select(`
          *,
          task:tasks!results_task_id_fkey (
            id,
            name,
            assessment_format,
            task_type,
            due_date,
            max_score,
            weight_percent,
            created_at
          )
        `)
        .eq('student_id', studentId)
        .eq('task.class_id', classId)
        .order('created_at', { ascending: false })
        .limit(limit || 10);

      if (error) {
        console.error('Error fetching student assessment progress:', error);
        // Return empty array instead of throwing to prevent component crashes
        return [];
      }

      if (!data) return [];

      return data
        .filter(result => 
          result.percent_score !== null && 
          typeof result.percent_score === 'number' && 
          !isNaN(result.percent_score) && 
          result.task
        )
        .map(result => {
          const taskDate = result.task.due_date || result.task.created_at;
          return {
            id: result.id,
            name: result.task.name,
            score: result.raw_score || 0,
            maxScore: result.task.max_score || 100,
            percentScore: result.percent_score,
            date: taskDate,
            assessmentType: result.task.assessment_format || 'Assessment',
            taskType: result.task.task_type || 'Task',
          };
        });
    },
    enabled: !!studentId && !!classId,
  });
};
