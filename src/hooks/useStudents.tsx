import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  year_level?: string;
  class_id: string;
  created_at: string;
  updated_at: string;
}

export const useStudents = (classId?: string) => {
  return useQuery({
    queryKey: classId ? ['students', classId] : ['students'],
    queryFn: async () => {
      let query = supabase.from('students').select('*');
      
      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      const { data, error } = await query.order('first_name');
      
      if (error) throw error;
      return data as Student[];
    },
    enabled: true,
  });
};

export const useStudentCounts = () => {
  return useQuery({
    queryKey: ['student-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('class_id, id')
        .order('class_id');
      
      if (error) throw error;
      
      // Group by class_id and count
      const counts: Record<string, number> = {};
      data.forEach(student => {
        counts[student.class_id] = (counts[student.class_id] || 0) + 1;
      });
      
      return counts;
    },
    enabled: true,
  });
};

export const useTotalStudentCount = () => {
  return useQuery({
    queryKey: ['total-student-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
    enabled: true,
  });
};