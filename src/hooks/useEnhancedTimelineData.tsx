import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface EnhancedTimelineDataPoint {
  date: string;
  dateLabel: string;
  average: number;
  highest: number;
  lowest: number;
  assessmentName: string;
  taskId: string;
  taskType: 'Diagnostic' | 'Formative' | 'Summative' | 'Other';
  studentResults: Array<{
    studentId: string;
    studentName: string;
    score: number;
  }>;
  totalStudents: number;
}

const normalizeTaskType = (taskType: string | null | undefined): EnhancedTimelineDataPoint['taskType'] => {
  if (!taskType) return 'Other';
  switch (taskType.toLowerCase()) {
    case 'diagnostic':
      return 'Diagnostic';
    case 'formative':
      return 'Formative';
    case 'summative':
      return 'Summative';
    default:
      return 'Other';
  }
};

export const useEnhancedTimelineData = (classId: string, startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['enhanced-timeline-data', classId, startDate, endDate],
    queryFn: async () => {
      // Get all tasks for this class within the date range
      // Include tasks with due_date in range OR tasks without due_date (recently created)
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, name, due_date, max_score, created_at, task_type')
        .eq('class_id', classId)
        .or(`and(due_date.gte.${startDate},due_date.lte.${endDate}),and(due_date.is.null,created_at.gte.${startDate})`)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (tasksError) throw tasksError;

      if (!tasks || tasks.length === 0) {
        return [];
      }

      // Get all results for all tasks with student names
      const taskIds = tasks.map(task => task.id);
      const { data: results, error: resultsError } = await supabase
        .from('results')
        .select(`
          task_id, 
          percent_score, 
          student_id,
          students!inner (
            first_name,
            last_name
          )
        `)
        .in('task_id', taskIds)
        .not('percent_score', 'is', null);

      if (resultsError) throw resultsError;

      // Process data for each task
      const timelineData: EnhancedTimelineDataPoint[] = [];
      
      for (const task of tasks) {
        const taskResults = results?.filter(r => r.task_id === task.id) || [];
        const taskType = normalizeTaskType(task.task_type);

        if (taskResults.length > 0) {
          const scores = taskResults.map(r => r.percent_score);
          const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          const highest = Math.max(...scores);
          const lowest = Math.min(...scores);

          const studentResults = taskResults.map(r => ({
            studentId: r.student_id,
            studentName: `${r.students.first_name} ${r.students.last_name}`,
            score: r.percent_score,
          }));
          
          // Use due_date if available, otherwise use created_at
          const taskDate = task.due_date || task.created_at;
          
          timelineData.push({
            date: taskDate,
            dateLabel: format(new Date(taskDate), 'MMM d'),
            average: Math.round(average),
            highest: Math.round(highest),
            lowest: Math.round(lowest),
            assessmentName: task.name,
            taskId: task.id,
            taskType,
            studentResults,
            totalStudents: taskResults.length,
          });
        }
      }

      return timelineData;
    },
    enabled: !!classId,
  });
};