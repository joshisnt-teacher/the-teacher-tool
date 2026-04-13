// src/hooks/useDashboardStats.tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Returns count of tasks with a due_date >= today, belonging to non-demo classes
 * owned by the current teacher.
 */
export const useUpcomingAssessmentsCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['upcoming-assessments-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // Step 1: Get non-demo class IDs for this teacher
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('is_demo', false);

      if (classError) throw classError;
      if (!classes || classes.length === 0) return 0;

      const classIds = classes.map((c: { id: string }) => c.id);

      // Step 2: Count tasks in those classes with a due date >= today
      const { data, error } = await supabase
        .from('tasks')
        .select('id')
        .in('class_id', classIds)
        .gte('due_date', today);

      if (error) throw error;
      return data?.length ?? 0;
    },
    enabled: !!user,
  });
};

/**
 * Returns the mean percent_score across all results for non-demo classes
 * owned by the current teacher. Returns null when no results exist yet.
 */
export const useAverageClassScore = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['average-class-score', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Step 1: Get non-demo class IDs for this teacher
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('is_demo', false);

      if (classError) throw classError;
      if (!classes || classes.length === 0) return null;

      const classIds = classes.map((c: { id: string }) => c.id);

      // Step 2: Get task IDs belonging to those classes
      const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .select('id')
        .in('class_id', classIds);

      if (taskError) throw taskError;
      if (!tasks || tasks.length === 0) return null;

      const taskIds = tasks.map((t: { id: string }) => t.id);

      // Step 3: Fetch all non-null percent_scores for those tasks
      const { data, error } = await supabase
        .from('results')
        .select('percent_score')
        .in('task_id', taskIds)
        .not('percent_score', 'is', null);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const total = data.reduce(
        (sum: number, r: { percent_score: number | null }) => sum + (r.percent_score as number),
        0
      );
      return Math.round(total / data.length);
    },
    enabled: !!user,
  });
};
