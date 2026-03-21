import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ActivityStatus = 'draft' | 'published' | 'archived';
export type ActivityType = 'QUIZ' | 'POLL' | 'FLASHCARDS' | 'EXIT_TICKET' | 'BUZZER' | 'FORM';

export interface ActivitySummary {
  id: string;
  title: string;
  description: string | null;
  type: ActivityType;
  status: ActivityStatus;
  created_at: string;
  updated_at: string;
  class_id: string | null;
  join_code: string | null;
  class?: {
    id: string;
    class_name: string;
    subject: string | null;
  } | null;
  quiz?: {
    id: string;
    questionCount: number;
  } | null;
  form?: {
    questionCount: number;
  } | null;
}

export const useActivities = (schoolId?: string) => {
  return useQuery({
    queryKey: ['activities', schoolId],
    queryFn: async (): Promise<ActivitySummary[]> => {
      if (!schoolId) return [];

      const { data: activitiesData, error } = await supabase
        .from('activities')
        .select(`
          id,
          title,
          description,
          type,
          status,
          created_at,
          updated_at,
          class_id,
          join_code,
          classes:class_id (
            id,
            class_name,
            subject
          ),
          activity_quizzes (
            id,
            quiz_questions (
              id
            )
          )
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activities:', error);
        throw error;
      }

      const activities = activitiesData || [];
      const formActivityIds = activities
        .filter((activity) => activity.type === 'FORM')
        .map((activity) => activity.id);

      let formRecords: Array<{ activity_id: string; schema_json: any }> = [];

      if (formActivityIds.length > 0) {
        const { data: formsData, error: formsError } = await supabase
          .from('activity_forms')
          .select('activity_id, schema_json')
          .in('activity_id', formActivityIds);

        if (formsError) {
          console.error('Error fetching survey forms:', formsError);
          throw formsError;
        }

        formRecords = formsData || [];
      }

      const formMap = new Map<string, number>();
      for (const record of formRecords) {
        let questionCount = 0;
        const schema = record.schema_json;
        if (schema) {
          let parsed = schema;
          if (typeof schema === 'string') {
            try {
              parsed = JSON.parse(schema);
            } catch (parseError) {
              console.warn('Failed to parse survey schema_json', parseError);
              parsed = null;
            }
          }
          if (parsed && Array.isArray(parsed.elements)) {
            questionCount = parsed.elements.length;
          }
        }
        formMap.set(record.activity_id, questionCount);
      }

      return activities.map((activity) => {
        const quizData = Array.isArray(activity.activity_quizzes)
          ? activity.activity_quizzes[0]
          : activity.activity_quizzes;
        const questionCount = quizData?.quiz_questions ? quizData.quiz_questions.length : 0;

        const formQuestionCount = formMap.get(activity.id) ?? 0;

        return {
          id: activity.id,
          title: activity.title,
          description: activity.description,
          type: activity.type,
          status: activity.status as ActivityStatus,
          created_at: activity.created_at,
          updated_at: activity.updated_at,
          class_id: activity.class_id,
          join_code: activity.join_code,
          class: Array.isArray(activity.classes) ? activity.classes[0] : activity.classes,
          quiz: quizData
            ? {
                id: quizData.id,
                questionCount,
              }
            : null,
          form: formQuestionCount > 0 ? { questionCount: formQuestionCount } : null,
        } satisfies ActivitySummary;
      });
    },
    enabled: !!schoolId,
  });
};

export const useActivitiesByClass = (classId?: string) => {
  return useQuery({
    queryKey: ['activities-by-class', classId],
    queryFn: async (): Promise<ActivitySummary[]> => {
      if (!classId) return [];

      const { data: activitiesData, error } = await supabase
        .from('activities')
        .select(`
          id,
          title,
          description,
          type,
          status,
          created_at,
          updated_at,
          class_id,
          join_code
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activities by class:', error);
        throw error;
      }

      const activities = activitiesData || [];

      return activities.map((activity) => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        type: activity.type as ActivityType,
        status: activity.status as ActivityStatus,
        created_at: activity.created_at,
        updated_at: activity.updated_at,
        class_id: activity.class_id,
        join_code: activity.join_code,
      } satisfies ActivitySummary));
    },
    enabled: !!classId,
  });
};
