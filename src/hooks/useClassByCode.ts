import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClassByCode {
  id: string;
  class_name: string;
  subject: string | null;
  year_level: string;
  class_code: string;
  school_id: string;
}

export const useClassByCode = (classCode?: string) => {
  return useQuery({
    queryKey: ['class-by-code', classCode],
    queryFn: async (): Promise<ClassByCode | null> => {
      if (!classCode) return null;

      const { data, error } = await supabase
        .from('classes')
        .select('id, class_name, subject, year_level, class_code, school_id')
        .eq('class_code', classCode.trim().toUpperCase())
        .maybeSingle();

      if (error) {
        console.error('Error fetching class by code:', error);
        throw error;
      }

      return data as ClassByCode | null;
    },
    enabled: !!classCode,
  });
};
