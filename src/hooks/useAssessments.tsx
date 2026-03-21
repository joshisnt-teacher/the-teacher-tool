import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Assessment {
  id: string;
  name: string;
  task_type: string | null;
  due_date: string | null;
  weight_percent: number | null;
  max_score: number | null;
  status: 'completed' | 'not_started';
  class_id: string;
  created_at: string;
  updated_at: string;
}

export const useAssessments = (classId?: string) => {
  return useQuery({
    queryKey: classId ? ['assessments', classId] : ['assessments'],
    queryFn: async () => {
      if (!classId) {
        throw new Error('Class ID is required');
      }

      // First, get all tasks for this class
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('class_id', classId)
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;

      if (!tasks || tasks.length === 0) {
        return [];
      }

      // Get all results for tasks in this class to determine completion status
      const taskIds = tasks.map(task => task.id);
      const { data: results, error: resultsError } = await supabase
        .from('results')
        .select('task_id')
        .in('task_id', taskIds);

      if (resultsError) throw resultsError;

      // Create a set of task IDs that have results (completed)
      const completedTaskIds = new Set(results?.map(result => result.task_id) || []);

      // Transform tasks into assessments with status
      const assessments: Assessment[] = tasks.map(task => ({
        id: task.id,
        name: task.name,
        task_type: task.task_type,
        due_date: task.due_date,
        weight_percent: task.weight_percent,
        max_score: task.max_score,
        status: completedTaskIds.has(task.id) ? 'completed' : 'not_started',
        class_id: task.class_id,
        created_at: task.created_at,
        updated_at: task.updated_at,
      }));

      return assessments;
    },
    enabled: !!classId,
  });
};