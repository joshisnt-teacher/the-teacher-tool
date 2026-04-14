import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TeacherTask {
  id: string;
  name: string;
  task_type: string | null;
  due_date: string | null;
  status: string | null;
  weight_percent: number | null;
  max_score: number | null;
  class_id: string;
  created_at: string;
  class_name: string;
  class_subject: string | null;
  class_year_level: string;
}

/**
 * Returns upcoming tasks across all non-demo classes for the current teacher,
 * ordered by due date (ascending).
 */
export const useTeacherTasks = (limit = 5) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teacher-tasks', user?.id, limit],
    queryFn: async (): Promise<TeacherTask[]> => {
      if (!user) return [];

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          classes!inner (
            class_name,
            subject,
            year_level
          )
        `)
        .eq('classes.teacher_id', user.id)
        .eq('classes.is_demo', false)
        .not('due_date', 'is', null)
        .gte('due_date', today)
        .order('due_date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching teacher tasks:', error);
        throw error;
      }

      return (data || []).map((task: any) => {
        const cls = Array.isArray(task.classes) ? task.classes[0] : task.classes;
        return {
          id: task.id,
          name: task.name,
          task_type: task.task_type,
          due_date: task.due_date,
          status: task.status,
          weight_percent: task.weight_percent,
          max_score: task.max_score,
          class_id: task.class_id,
          created_at: task.created_at,
          class_name: cls?.class_name || '',
          class_subject: cls?.subject || null,
          class_year_level: cls?.year_level || '',
        };
      });
    },
    enabled: !!user,
  });
};
