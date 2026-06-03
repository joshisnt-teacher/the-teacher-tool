import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Atlas JSON types ──────────────────────────────────────────────────────────

export interface AtlasQuestionOption {
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface AtlasMarkingCriteria {
  expected_keywords: string[];
  match_type: 'any' | 'all';
  case_sensitive: boolean;
}

export interface AtlasQuestion {
  number: number;
  question: string;
  question_type: 'multiple_choice' | 'short_answer' | 'extended_answer';
  max_score: number;
  blooms_taxonomy?: string;
  content_item?: string;
  options?: AtlasQuestionOption[];
  marking_criteria?: AtlasMarkingCriteria;
  model_answer?: string;
}

export interface AtlasExitTicketJson {
  source: string;
  version: string;
  exit_ticket: {
    name: string;
    description?: string;
    class_code?: string;
    deploy_to_class?: boolean;
    status?: string;
    is_homework?: boolean;
    due_date?: string | null;
    questions: AtlasQuestion[];
  };
}

// ── Validator ─────────────────────────────────────────────────────────────────

export function parseAtlasJson(raw: unknown): AtlasExitTicketJson {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid file format');
  }
  const obj = raw as Record<string, unknown>;
  if (obj.source !== 'atlas') {
    throw new Error("This file doesn't look like an Atlas export");
  }
  const et = obj.exit_ticket as Record<string, unknown> | undefined;
  if (!et) {
    throw new Error('File is missing required fields: exit_ticket');
  }
  if (!et.name || typeof et.name !== 'string') {
    throw new Error('File is missing required fields: name');
  }
  if (!Array.isArray(et.questions) || et.questions.length === 0) {
    throw new Error('File must contain at least one question');
  }
  for (let i = 0; i < et.questions.length; i++) {
    const q = et.questions[i] as Record<string, unknown>;
    if (!q.question) throw new Error(`Question ${i + 1} is missing text`);
    if (!q.question_type) throw new Error(`Question ${i + 1} is missing question_type`);
  }
  return raw as AtlasExitTicketJson;
}

// ── Mutation ──────────────────────────────────────────────────────────────────

export interface ImportInput {
  parsed: AtlasExitTicketJson;
  classId: string | null;
  teacherId: string;
  schoolId: string;
}

export interface ImportResult {
  templateId: string;
  deployed: boolean;
}

export const useImportExitTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ parsed, classId, teacherId, schoolId }: ImportInput): Promise<ImportResult> => {
      const et = parsed.exit_ticket;

      // 1. Create the template header
      const { data: template, error: tErr } = await supabase
        .from('exit_ticket_templates')
        .insert({
          name: et.name,
          description: et.description || null,
          teacher_id: teacherId,
          school_id: schoolId,
        })
        .select('id')
        .single();
      if (tErr) throw tErr;

      let runId: string | null = null;

      try {
        if (!template) throw new Error('Failed to create template — no data returned');

        // 2. Insert template questions and their options
        for (const q of et.questions) {
          const { data: tq, error: qErr } = await supabase
            .from('template_questions')
            .insert({
              template_id: template.id,
              number: q.number,
              question: q.question,
              question_type: q.question_type,
              max_score: q.max_score,
              blooms_taxonomy: q.blooms_taxonomy || null,
              content_item: q.content_item || null,
              general_capabilities: null,
              marking_criteria: q.question_type !== 'multiple_choice' ? (q.marking_criteria || null) : null,
              model_answer: q.question_type !== 'multiple_choice' ? (q.model_answer || null) : null,
            })
            .select('id')
            .single();
          if (qErr) throw qErr;
          if (!tq) throw new Error('Failed to create template question — no data returned');

          if (q.question_type === 'multiple_choice' && q.options?.length) {
            const { error: optErr } = await supabase
              .from('template_question_options')
              .insert(
                q.options.map((o) => ({
                  template_question_id: tq.id,
                  option_text: o.option_text,
                  is_correct: o.is_correct,
                  order_index: o.order_index,
                }))
              );
            if (optErr) throw optErr;
          }
        }

        // 3. Deploy to class if class was found
        if (classId) {
          const totalMaxScore = et.questions.reduce((sum, q) => sum + (Number(q.max_score) || 0), 0);

          const { data: run, error: runErr } = await supabase
            .from('tasks')
            .insert({
              name: et.name,
              description: et.description || null,
              class_id: classId,
              is_exit_ticket: true,
              status: 'draft',
              exit_ticket_template_id: template.id,
              max_score: totalMaxScore,
              task_type: 'Formative',
            })
            .select('id')
            .single();
          if (runErr) throw runErr;
          if (!run) throw new Error('Failed to create task run — no data returned');
          runId = run.id;

          for (const q of et.questions) {
            const { data: question, error: insertQErr } = await supabase
              .from('questions')
              .insert({
                task_id: run.id,
                number: q.number,
                question: q.question,
                question_type: q.question_type,
                max_score: q.max_score,
                blooms_taxonomy: q.blooms_taxonomy || null,
                content_item: q.content_item || null,
                general_capabilities: null,
                marking_criteria: q.question_type !== 'multiple_choice' ? (q.marking_criteria || null) : null,
                model_answer: q.question_type !== 'multiple_choice' ? (q.model_answer || null) : null,
              })
              .select('id')
              .single();
            if (insertQErr) throw insertQErr;
            if (!question) throw new Error('Failed to create run question — no data returned');

            if (q.question_type === 'multiple_choice' && q.options?.length) {
              const { error: optErr } = await supabase
                .from('question_options')
                .insert(
                  q.options.map((o) => ({
                    question_id: question.id,
                    option_text: o.option_text,
                    is_correct: o.is_correct,
                    order_index: o.order_index,
                  }))
                );
              if (optErr) throw optErr;
            }
          }
        }

        return { templateId: template.id, deployed: !!classId };
      } catch (err) {
        // Clean up orphaned rows on partial failure (cascades handle child rows)
        if (runId) {
          const { error: cleanupRunErr } = await supabase.from('tasks').delete().eq('id', runId);
          if (cleanupRunErr) console.error('Failed to clean up orphaned run:', cleanupRunErr);
        }
        if (template) {
          const { error: cleanupTplErr } = await supabase.from('exit_ticket_templates').delete().eq('id', template.id);
          if (cleanupTplErr) console.error('Failed to clean up orphaned template:', cleanupTplErr);
        }
        throw err;
      }
    },
    onSuccess: (_, { classId }) => {
      queryClient.invalidateQueries({ queryKey: ['exit-ticket-templates'] });
      if (classId) {
        queryClient.invalidateQueries({ queryKey: ['exit-tickets-by-class', classId] });
        queryClient.invalidateQueries({ queryKey: ['assessments', classId] });
      }
    },
  });
};
