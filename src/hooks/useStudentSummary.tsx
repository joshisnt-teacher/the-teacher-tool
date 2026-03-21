import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StudentSummary {
  currentGrade: string;
  currentPercentage: number;
  trend: 'improving' | 'steady' | 'declining';
  strengths: string[];
  focusAreas: string[];
  engagement: string;
  totalAssessments: number;
  averageScore: number;
  lastAssessmentDate: string | null;
}

export const useStudentSummary = (studentId?: string, classId?: string) => {
  return useQuery({
    queryKey: ['student-summary', studentId, classId],
    queryFn: async (): Promise<StudentSummary> => {
      if (!studentId || !classId) {
        return {
          currentGrade: 'N/A',
          currentPercentage: 0,
          trend: 'steady',
          strengths: [],
          focusAreas: [],
          engagement: 'No data available',
          totalAssessments: 0,
          averageScore: 0,
          lastAssessmentDate: null,
        };
      }

      // Fetch assessment results
      const { data: results, error: resultsError } = await supabase
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
        .order('created_at', { ascending: false });

      if (resultsError) {
        console.error('Error fetching student summary results:', resultsError);
        // Continue with empty results instead of throwing
        console.log('Continuing with empty results for student summary');
      }

      // Fetch recent notes for engagement assessment
      const { data: notes, error: notesError } = await supabase
        .from('student_notes')
        .select(`
          category,
          rating,
          note,
          created_at
        `)
        .eq('student_id', studentId)
        .in('category', ['Academic', 'Pastoral'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (notesError) {
        console.error('Error fetching student summary notes:', notesError);
        // Don't throw error for notes, just continue without them
        console.log('Continuing without notes for student summary');
      }

      if (!results || results.length === 0) {
        return {
          currentGrade: 'N/A',
          currentPercentage: 0,
          trend: 'steady',
          strengths: [],
          focusAreas: [],
          engagement: 'No assessment data available',
          totalAssessments: 0,
          averageScore: 0,
          lastAssessmentDate: null,
        };
      }

      // Calculate current grade and percentage
      const validScores = results.filter(r => r.percent_score !== null).map(r => r.percent_score!);
      const averageScore = validScores.length > 0 
        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
        : 0;

      const currentGrade = getGradeFromPercentage(averageScore);
      const currentPercentage = averageScore;

      // Calculate trend (compare first half vs second half of results)
      const sortedResults = results
        .filter(r => r.percent_score !== null)
        .sort((a, b) => new Date(a.task.created_at).getTime() - new Date(b.task.created_at).getTime());
      
      let trend: 'improving' | 'steady' | 'declining' = 'steady';
      if (sortedResults.length >= 4) {
        const midPoint = Math.floor(sortedResults.length / 2);
        const firstHalf = sortedResults.slice(0, midPoint).map(r => r.percent_score!);
        const secondHalf = sortedResults.slice(midPoint).map(r => r.percent_score!);
        
        const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        const difference = secondHalfAvg - firstHalfAvg;
        if (difference > 5) trend = 'improving';
        else if (difference < -5) trend = 'declining';
      }

      // Analyze strengths and focus areas based on assessment types
      const assessmentTypes = new Map<string, number[]>();
      results.forEach(result => {
        if (result.percent_score !== null && result.task) {
          const type = result.task.assessment_format || result.task.task_type || 'Assessment';
          if (!assessmentTypes.has(type)) {
            assessmentTypes.set(type, []);
          }
          assessmentTypes.get(type)!.push(result.percent_score);
        }
      });

      const strengths: string[] = [];
      const focusAreas: string[] = [];
      
      assessmentTypes.forEach((scores, type) => {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avgScore >= 80) {
          strengths.push(`Strong in ${type}`);
        } else if (avgScore < 60) {
          focusAreas.push(`Needs support in ${type}`);
        }
      });

      // Analyze engagement from notes
      let engagement = 'No recent notes available';
      if (notes && notes.length > 0) {
        const recentNotes = notes.slice(0, 5);
        const positiveNotes = recentNotes.filter(note => note.rating > 0).length;
        const negativeNotes = recentNotes.filter(note => note.rating < 0).length;
        
        if (positiveNotes > negativeNotes) {
          engagement = 'Positive participation and engagement';
        } else if (negativeNotes > positiveNotes) {
          engagement = 'Needs to work on focus and participation';
        } else {
          engagement = 'Mixed engagement - some positive and negative feedback';
        }
      }

      return {
        currentGrade,
        currentPercentage,
        trend,
        strengths,
        focusAreas,
        engagement,
        totalAssessments: results.length,
        averageScore,
        lastAssessmentDate: results[0]?.task?.created_at || null,
      };
    },
    enabled: !!studentId && !!classId,
  });
};

function getGradeFromPercentage(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'A-';
  if (percentage >= 75) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 65) return 'B-';
  if (percentage >= 60) return 'C+';
  if (percentage >= 55) return 'C';
  if (percentage >= 50) return 'C-';
  if (percentage >= 45) return 'D+';
  if (percentage >= 40) return 'D';
  if (percentage >= 35) return 'D-';
  return 'F';
}
