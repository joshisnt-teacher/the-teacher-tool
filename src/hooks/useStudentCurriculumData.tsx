import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CurriculumContentItemAchievement {
  code: string;
  description: string;
  value: number;
  count: number;
  strandName?: string;
}

export interface GeneralCapabilityAchievement {
  capability: string;
  value: number;
  count: number;
}

export const useStudentCurriculumContentItems = (studentId?: string, classId?: string) => {
  return useQuery({
    queryKey: ['student-curriculum-content-items', studentId, classId],
    queryFn: async (): Promise<CurriculumContentItemAchievement[]> => {
      if (!studentId || !classId) return [];

      const { data, error } = await supabase
        .from('question_results')
        .select(`
          *,
          questions!question_results_question_id_fkey (
            id,
            content_item,
            max_score,
            task:tasks!inner (
              class_id
            )
          )
        `)
        .eq('student_id', studentId)
        .eq('questions.task.class_id', classId)
        .not('questions.content_item', 'is', null);

      if (error) {
        console.error('Error fetching student curriculum content items:', error);
        // Return empty array instead of throwing to prevent component crashes
        return [];
      }

      if (!data) return [];

      // Group by content item and calculate average scores
      const contentItemData = new Map<string, { scores: number[], description: string, count: number }>();
      
      data.forEach(result => {
        if (result.percent_score !== null && result.questions?.content_item) {
          const contentItem = result.questions.content_item;
          
          if (!contentItemData.has(contentItem)) {
            contentItemData.set(contentItem, { scores: [], description: contentItem, count: 0 });
          }
          
          const itemData = contentItemData.get(contentItem)!;
          itemData.scores.push(result.percent_score);
          itemData.count += 1;
        }
      });

      const codes = Array.from(contentItemData.keys());

      // Look up strand names from the content_item table using real DB data
      const { data: contentItemRows } = await supabase
        .from('content_item')
        .select('code, strand:strand_id(name)')
        .in('code', codes);

      const codeToStrand = new Map<string, string>();
      contentItemRows?.forEach((row: any) => {
        const strandName = Array.isArray(row.strand) ? row.strand[0]?.name : row.strand?.name;
        if (strandName) codeToStrand.set(row.code, strandName);
      });

      return Array.from(contentItemData.entries()).map(([code, data]) => ({
        code,
        description: data.description,
        value: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        count: data.count,
        strandName: codeToStrand.get(code),
      }));
    },
    enabled: !!studentId && !!classId,
  });
};

export const useStudentGeneralCapabilities = (studentId?: string, classId?: string) => {
  return useQuery({
    queryKey: ['student-general-capabilities', studentId, classId],
    queryFn: async (): Promise<GeneralCapabilityAchievement[]> => {
      if (!studentId || !classId) return [];

      const { data, error } = await supabase
        .from('question_results')
        .select(`
          *,
          questions!question_results_question_id_fkey (
            id,
            general_capabilities,
            max_score,
            task:tasks!inner (
              class_id
            )
          )
        `)
        .eq('student_id', studentId)
        .eq('questions.task.class_id', classId)
        .not('questions.general_capabilities', 'is', null);

      if (error) {
        console.error('Error fetching student general capabilities:', error);
        // Return empty array instead of throwing to prevent component crashes
        return [];
      }

      if (!data) return [];

      // Group by general capabilities and calculate average scores
      const capabilityData = new Map<string, { scores: number[], count: number }>();
      
      data.forEach(result => {
        if (result.percent_score !== null && result.questions?.general_capabilities) {
          const capabilities = result.questions.general_capabilities;
          
          capabilities.forEach((capability: string) => {
            if (!capabilityData.has(capability)) {
              capabilityData.set(capability, { scores: [], count: 0 });
            }
            
            const capData = capabilityData.get(capability)!;
            capData.scores.push(result.percent_score);
            capData.count += 1;
          });
        }
      });

      return Array.from(capabilityData.entries()).map(([capability, data]) => ({
        capability,
        value: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        count: data.count,
      }));
    },
    enabled: !!studentId && !!classId,
  });
};
