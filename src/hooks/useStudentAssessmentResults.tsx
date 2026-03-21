import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StudentAssessmentResult {
  id: string;
  student_id: string;
  task_id: string;
  raw_score: number | null;
  percent_score: number | null;
  normalised_percent: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
  task: {
    id: string;
    name: string;
    assessment_format: string | null;
    task_type: string | null;
    due_date: string | null;
    max_score: number | null;
    weight_percent: number | null;
    created_at: string;
  };
}

export interface TermProgressData {
  week: string;
  score: number;
  assessment: string;
  date: string;
  assessment_type: string;
}

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

export interface AssessmentBreakdownData {
  type: string;
  score: number;
  maxScore: number;
  count: number;
  averageScore: number;
}

export const useStudentAssessmentResults = (studentId?: string, classId?: string) => {
  return useQuery({
    queryKey: ['student-assessment-results', studentId, classId],
    queryFn: async (): Promise<StudentAssessmentResult[]> => {
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
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching student assessment results:', error);
        // Return empty array instead of throwing to prevent component crashes
        return [];
      }

      return data || [];
    },
    enabled: !!studentId && !!classId,
  });
};

export const useStudentTermProgress = (studentId?: string, classId?: string) => {
  return useQuery({
    queryKey: ['student-term-progress', studentId, classId],
    queryFn: async (): Promise<TermProgressData[]> => {
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
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching student term progress:', error);
        throw error;
      }

      if (!data) return [];

      // Group by week and calculate average scores
      const weeklyData = new Map<string, { scores: number[], assessments: string[], dates: string[], types: string[] }>();
      
      data.forEach(result => {
        if (result.percent_score !== null && 
            typeof result.percent_score === 'number' && 
            !isNaN(result.percent_score) && 
            result.task) {
          const date = new Date(result.task.created_at);
          const weekNumber = Math.ceil((date.getTime() - new Date(result.task.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
          const weekKey = `Week ${weekNumber}`;
          
          if (!weeklyData.has(weekKey)) {
            weeklyData.set(weekKey, { scores: [], assessments: [], dates: [], types: [] });
          }
          
          const weekData = weeklyData.get(weekKey)!;
          weekData.scores.push(result.percent_score);
          weekData.assessments.push(result.task.name);
          weekData.dates.push(result.task.created_at);
          weekData.types.push(result.task.assessment_format || result.task.task_type || 'Assessment');
        }
      });

      return Array.from(weeklyData.entries())
        .filter(([week, data]) => data.scores.length > 0)
        .map(([week, data]) => {
          const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
          return {
            week,
            score: isNaN(avgScore) ? 0 : Math.round(avgScore),
            assessment: data.assessments[0], // Use first assessment name for the week
            date: data.dates[0],
            assessment_type: data.types[0],
          };
        });
    },
    enabled: !!studentId && !!classId,
  });
};

export const useStudentAssessmentBreakdown = (studentId?: string, classId?: string) => {
  return useQuery({
    queryKey: ['student-assessment-breakdown', studentId, classId],
    queryFn: async (): Promise<AssessmentBreakdownData[]> => {
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
        .eq('task.class_id', classId);

      if (error) {
        console.error('Error fetching student assessment breakdown:', error);
        // Return empty array instead of throwing to prevent component crashes
        return [];
      }

      if (!data) return [];

      // Group by assessment type
      const typeData = new Map<string, { scores: number[], maxScores: number[] }>();
      
      data.forEach(result => {
        if (result.percent_score !== null && 
            typeof result.percent_score === 'number' && 
            !isNaN(result.percent_score) && 
            result.task) {
          const type = result.task.assessment_format || result.task.task_type || 'Assessment';
          const maxScore = result.task.max_score || 100;
          
          if (!typeData.has(type)) {
            typeData.set(type, { scores: [], maxScores: [] });
          }
          
          const typeInfo = typeData.get(type)!;
          typeInfo.scores.push(result.percent_score);
          typeInfo.maxScores.push(maxScore);
        }
      });

      return Array.from(typeData.entries())
        .filter(([type, data]) => data.scores.length > 0)
        .map(([type, data]) => {
          const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
          const avgMaxScore = data.maxScores.reduce((a, b) => a + b, 0) / data.maxScores.length;
          
          return {
            type,
            score: isNaN(avgScore) ? 0 : Math.round(avgScore),
            maxScore: isNaN(avgMaxScore) ? 100 : Math.round(avgMaxScore),
            count: data.scores.length,
            averageScore: isNaN(avgScore) ? 0 : Math.round(avgScore),
          };
        });
    },
    enabled: !!studentId && !!classId,
  });
};
