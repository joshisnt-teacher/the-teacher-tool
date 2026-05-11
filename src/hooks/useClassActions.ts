// src/hooks/useClassActions.ts
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ActionType = 'class_analysis' | 'student_feedback' | 'struggling_students';

export interface ActionResult {
  output_json: Record<string, unknown>;
  created_at: string;
}

export type SavedResults = Record<ActionType, ActionResult | null>;

const EMPTY_RESULTS: SavedResults = {
  class_analysis: null,
  student_feedback: null,
  struggling_students: null,
};

export const useClassActions = (taskId: string | undefined) => {
  const queryClient = useQueryClient();
  const [runningAction, setRunningAction] = useState<ActionType | null>(null);

  const { data: savedResults = EMPTY_RESULTS } = useQuery<SavedResults>({
    queryKey: ['ai-action-results', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_action_results')
        .select('action_type, output_json, created_at')
        .eq('task_id', taskId!);
      if (error) throw error;
      const map: SavedResults = { ...EMPTY_RESULTS };
      for (const row of data ?? []) {
        map[row.action_type as ActionType] = {
          output_json: row.output_json as Record<string, unknown>,
          created_at: row.created_at,
        };
      }
      return map;
    },
    enabled: !!taskId,
  });

  const runAction = async (actionType: ActionType) => {
    setRunningAction(actionType);
    try {
      const { data, error } = await supabase.functions.invoke('ai-class-actions', {
        body: { task_id: taskId, action_type: actionType },
      });
      if (error) throw error;
      if (data?.skipped) {
        toast.error('No OpenAI key found. Add your key in Settings → AI Marking.');
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['ai-action-results', taskId] });
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI action failed';
      toast.error(message);
      throw err;
    } finally {
      setRunningAction(null);
    }
  };

  return { savedResults, runAction, runningAction };
};
