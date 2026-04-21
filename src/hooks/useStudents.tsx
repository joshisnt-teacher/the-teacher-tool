import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  year_level?: string;
  teacher_id: string;
  created_at: string;
  updated_at: string;
}

export const useStudents = (classId?: string) => {
  return useQuery({
    queryKey: classId ? ['students', classId] : ['students'],
    queryFn: async () => {
      if (classId) {
        const { data, error } = await supabase
          .from('students')
          .select('id, student_id, first_name, last_name, email, year_level, teacher_id, created_at, updated_at, enrolments!inner(class_id)')
          .eq('enrolments.class_id', classId)
          .order('last_name');
        if (error) throw error;
        return data?.map(({ enrolments: _enrolments, ...student }) => student) as Student[];
      }
      const { data, error } = await supabase
        .from('students')
        .select('id, student_id, first_name, last_name, email, year_level, teacher_id, created_at, updated_at')
        .order('last_name');
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
        .from('enrolments')
        .select('class_id, student_id');
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach(enrolment => {
        counts[enrolment.class_id] = (counts[enrolment.class_id] || 0) + 1;
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
      const { data, error } = await supabase
        .from('enrolments')
        .select('student_id, classes!inner(is_demo)')
        .eq('classes.is_demo', false);
      if (error) throw error;
      const uniqueStudents = new Set(data?.map(e => e.student_id));
      return uniqueStudents.size;
    },
    enabled: true,
  });
};
