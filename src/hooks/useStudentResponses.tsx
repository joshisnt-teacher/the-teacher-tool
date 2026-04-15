import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StudentResponse {
  student_id: string;
  confidence_rating: number;
  first_name: string;
  last_name: string;
}

export const useStudentResponses = (taskId?: string) => {
  return useQuery({
    queryKey: ['student-responses', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_responses')
        .select(`
          student_id,
          confidence_rating,
          students (
            first_name,
            last_name
          )
        `)
        .eq('task_id', taskId);
      
      if (error) throw error;
      
      return (data.map((response: any) => ({
        student_id: response.student_id,
        confidence_rating: response.confidence_rating,
        first_name: response.students?.first_name,
        last_name: response.students?.last_name,
      })) as StudentResponse[])
        .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));
    },
    enabled: !!taskId,
  });
};