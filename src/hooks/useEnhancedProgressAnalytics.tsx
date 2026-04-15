import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StudentGrowthData {
  studentId: string;
  studentName: string;
  initialScore: number;
  finalScore: number;
  improvement: number;
  improvementPercent: number;
  trend: 'up' | 'down' | 'stable';
  assessmentCount: number;
}

export interface DistributionOverTimeData {
  assessmentName: string;
  date: string;
  distributions: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

export const useStudentGrowthAnalytics = (classId: string, threshold: number = 10) => {
  return useQuery({
    queryKey: ['student-growth-analytics', classId, threshold],
    queryFn: async () => {
      // Get all tasks for this class ordered by due date
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, name, due_date')
        .eq('class_id', classId)
        .not('due_date', 'is', null)
        .order('due_date');

      if (tasksError) throw tasksError;
      if (!tasks || tasks.length < 2) return []; // Need at least 2 assessments for growth

      // Get all results for these tasks
      const taskIds = tasks.map(t => t.id);
      const { data: results, error: resultsError } = await supabase
        .from('results')
        .select(`
          task_id,
          student_id,
          percent_score,
          students!inner (
            first_name,
            last_name
          )
        `)
        .in('task_id', taskIds)
        .not('percent_score', 'is', null);

      if (resultsError) throw resultsError;
      if (!results || results.length === 0) return [];

      // Group results by student
      const studentResults = new Map();
      results.forEach(result => {
        const studentId = result.student_id;
        if (!studentResults.has(studentId)) {
          studentResults.set(studentId, {
            studentName: `${result.students.first_name} ${result.students.last_name}`,
            scores: [],
          });
        }
        
        const taskIndex = tasks.findIndex(t => t.id === result.task_id);
        studentResults.get(studentId).scores.push({
          taskIndex,
          score: result.percent_score,
          taskId: result.task_id,
        });
      });

      // Calculate growth for each student
      const growthData: StudentGrowthData[] = [];
      
      studentResults.forEach((data, studentId) => {
        const scores = data.scores.sort((a, b) => a.taskIndex - b.taskIndex);
        if (scores.length < 2) return; // Need at least 2 scores

        const initialScore = scores[0].score;
        const finalScore = scores[scores.length - 1].score;
        const improvement = finalScore - initialScore;
        const improvementPercent = initialScore > 0 ? Math.round((improvement / initialScore) * 100) : 0;

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (Math.abs(improvementPercent) >= threshold) {
          trend = improvementPercent > 0 ? 'up' : 'down';
        }

        growthData.push({
          studentId,
          studentName: data.studentName,
          initialScore: Math.round(initialScore),
          finalScore: Math.round(finalScore),
          improvement: Math.round(improvement),
          improvementPercent,
          trend,
          assessmentCount: scores.length,
        });
      });

      return growthData.sort((a, b) => {
        const aLast = a.studentName.split(' ').pop() || a.studentName;
        const bLast = b.studentName.split(' ').pop() || b.studentName;
        return aLast.localeCompare(bLast);
      });
    },
    enabled: !!classId,
  });
};

export const useDistributionOverTime = (classId: string) => {
  return useQuery({
    queryKey: ['distribution-over-time', classId],
    queryFn: async () => {
      // Get all tasks for this class ordered by due date
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, name, due_date')
        .eq('class_id', classId)
        .not('due_date', 'is', null)
        .order('due_date');

      if (tasksError) throw tasksError;
      if (!tasks || tasks.length === 0) return [];

      // Get all results for these tasks
      const taskIds = tasks.map(t => t.id);
      const { data: results, error: resultsError } = await supabase
        .from('results')
        .select('task_id, percent_score')
        .in('task_id', taskIds)
        .not('percent_score', 'is', null);

      if (resultsError) throw resultsError;
      if (!results || results.length === 0) return [];

      // Calculate distribution for each assessment
      const distributionData: DistributionOverTimeData[] = tasks.map(task => {
        const taskResults = results.filter(r => r.task_id === task.id);
        const totalStudents = taskResults.length;

        if (totalStudents === 0) {
          return {
            assessmentName: task.name,
            date: task.due_date,
            distributions: [
              { range: '0-49', count: 0, percentage: 0 },
              { range: '50-64', count: 0, percentage: 0 },
              { range: '65-79', count: 0, percentage: 0 },
              { range: '80-100', count: 0, percentage: 0 },
            ],
          };
        }

        const ranges = [
          { range: '0-49', count: 0 },
          { range: '50-64', count: 0 },
          { range: '65-79', count: 0 },
          { range: '80-100', count: 0 },
        ];

        taskResults.forEach(result => {
          const score = result.percent_score;
          if (score < 50) ranges[0].count++;
          else if (score < 65) ranges[1].count++;
          else if (score < 80) ranges[2].count++;
          else ranges[3].count++;
        });

        return {
          assessmentName: task.name,
          date: task.due_date,
          distributions: ranges.map(range => ({
            ...range,
            percentage: Math.round((range.count / totalStudents) * 100),
          })),
        };
      });

      return distributionData;
    },
    enabled: !!classId,
  });
};