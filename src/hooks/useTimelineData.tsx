import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface TimelineDataPoint {
  date: string;
  dateLabel: string;
  average: number;
  assessmentName: string;
  taskId: string;
}

export const useTimelineData = (classId: string, startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['timeline-data', classId, startDate, endDate],
    queryFn: async () => {
      // Get all tasks for this class within the date range
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, name, due_date, max_score')
        .eq('class_id', classId)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .not('due_date', 'is', null)
        .order('due_date');

      if (tasksError) throw tasksError;

      if (!tasks || tasks.length === 0) {
        return [];
      }

      // Get results for all tasks to calculate averages
      const taskIds = tasks.map(task => task.id);
      const { data: results, error: resultsError } = await supabase
        .from('results')
        .select('task_id, percent_score')
        .in('task_id', taskIds)
        .not('percent_score', 'is', null);

      if (resultsError) throw resultsError;

      // Calculate average for each task
      const timelineData: TimelineDataPoint[] = [];
      
      for (const task of tasks) {
        const taskResults = results?.filter(r => r.task_id === task.id) || [];
        
        if (taskResults.length > 0) {
          const average = taskResults.reduce((sum, result) => sum + (result.percent_score || 0), 0) / taskResults.length;
          
          timelineData.push({
            date: task.due_date!,
            dateLabel: format(new Date(task.due_date!), 'MMM d'),
            average: Math.round(average),
            assessmentName: task.name,
            taskId: task.id,
          });
        }
      }

      return timelineData;
    },
    enabled: !!classId,
  });
};