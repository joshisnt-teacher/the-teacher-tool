# Exit Ticket Templates + Runs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate exit ticket definitions (templates) from class activations (runs) so teachers can reuse tickets across classes and clear responses without destroying the ticket.

**Architecture:** Three new DB tables (`exit_ticket_templates`, `template_questions`, `template_question_options`) hold reusable definitions. Each "run" is still a `tasks` row — so all analytics, AssessmentDetail, and student flows are completely untouched — but now carries an `exit_ticket_template_id` FK. The Exit Tickets library shows templates; the Classroom Activities panel shows runs.

**Tech Stack:** React 18, TypeScript, Supabase (PostgreSQL + PostgREST), TanStack React Query, shadcn/ui, Tailwind CSS

---

## File Map

**Created:**
- `supabase/migrations/20260430000000_exit_ticket_templates.sql`
- `src/hooks/useExitTicketTemplates.ts`
- `src/hooks/useTemplateQuestions.ts`
- `src/hooks/useRunsForTemplate.ts`
- `src/hooks/useDeployTemplate.ts`
- `src/hooks/useClearRun.ts`
- `src/hooks/useDeleteRun.ts`

**Modified:**
- `src/integrations/supabase/types.ts` (regenerated)
- `src/hooks/useExitTicketsByClass.ts` (add `exit_ticket_template_id` field)
- `src/hooks/useAssessments.tsx` (filter out exit ticket runs)
- `src/pages/CreateExitTicket.tsx` (save/load templates, `templateId` prop, no class picker)
- `src/pages/ExitTickets.tsx` (show templates, Deploy modal, Runs section)
- `src/components/classroom/ClassroomActivities.tsx` (Clear Results button, template Edit link)

**Deleted:**
- `src/hooks/useExitTickets.ts` (replaced by `useExitTicketTemplates`)

---

## Task 0: Delete existing exit tickets (manual cleanup)

> Do this BEFORE writing any code. After Task 6–7 the library page changes and old tickets won't be accessible from there.

- [ ] Start the dev server: `npm run dev`
- [ ] Go to `/exit-tickets` in the browser
- [ ] Delete every exit ticket using the Delete button on each card
- [ ] Confirm the list is empty (zero tasks rows with `is_exit_ticket = true`)

---

## Task 1: Apply database migration

**Files:**
- Create: `supabase/migrations/20260430000000_exit_ticket_templates.sql`

- [ ] Create the file with this exact content:

```sql
-- ============================================================
-- Exit Ticket Templates: separate definitions from class runs
-- ============================================================

CREATE TABLE exit_ticket_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exit_ticket_templates_teacher_id ON exit_ticket_templates(teacher_id);
CREATE INDEX idx_exit_ticket_templates_school_id  ON exit_ticket_templates(school_id);

ALTER TABLE exit_ticket_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage own templates" ON exit_ticket_templates
  FOR ALL USING (teacher_id = auth.uid());

-- ----

CREATE TABLE template_questions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id          UUID NOT NULL REFERENCES exit_ticket_templates(id) ON DELETE CASCADE,
  number               INTEGER NOT NULL,
  question             TEXT,
  question_type        TEXT,
  max_score            NUMERIC,
  blooms_taxonomy      TEXT,
  content_item         TEXT,
  general_capabilities TEXT[],
  marking_criteria     JSONB,
  model_answer         TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_template_questions_template_id ON template_questions(template_id);
ALTER TABLE template_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage template questions" ON template_questions
  FOR ALL USING (
    template_id IN (
      SELECT id FROM exit_ticket_templates WHERE teacher_id = auth.uid()
    )
  );

-- ----

CREATE TABLE template_question_options (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_question_id UUID NOT NULL REFERENCES template_questions(id) ON DELETE CASCADE,
  option_text          TEXT NOT NULL,
  is_correct           BOOLEAN NOT NULL DEFAULT false,
  order_index          INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_template_question_options_tq_id ON template_question_options(template_question_id);
ALTER TABLE template_question_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage template question options" ON template_question_options
  FOR ALL USING (
    template_question_id IN (
      SELECT tq.id FROM template_questions tq
      JOIN exit_ticket_templates ett ON tq.template_id = ett.id
      WHERE ett.teacher_id = auth.uid()
    )
  );

-- ----

ALTER TABLE tasks
  ADD COLUMN exit_ticket_template_id UUID
    REFERENCES exit_ticket_templates(id) ON DELETE SET NULL;

CREATE INDEX idx_tasks_exit_ticket_template_id ON tasks(exit_ticket_template_id);
```

- [ ] Apply via Supabase MCP — use `mcp__supabase__apply_migration` with name `exit_ticket_templates` and the SQL above.

- [ ] Verify tables exist with `mcp__supabase__execute_sql`:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('exit_ticket_templates','template_questions','template_question_options');
```
Expected: 3 rows.

- [ ] Verify column was added:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'exit_ticket_template_id';
```
Expected: 1 row.

- [ ] Commit:
```bash
git add supabase/migrations/20260430000000_exit_ticket_templates.sql
git commit -m "feat: add exit_ticket_templates migration"
```

---

## Task 2: Regenerate TypeScript types

**Files:**
- Modify: `src/integrations/supabase/types.ts`

- [ ] Use `mcp__supabase__generate_typescript_types` to regenerate types for the project
- [ ] Replace the entire content of `src/integrations/supabase/types.ts` with the output
- [ ] Commit:
```bash
git add src/integrations/supabase/types.ts
git commit -m "chore: regenerate Supabase types after exit_ticket_templates migration"
```

---

## Task 3: New query hooks

**Files:**
- Create: `src/hooks/useExitTicketTemplates.ts`
- Create: `src/hooks/useTemplateQuestions.ts`
- Create: `src/hooks/useRunsForTemplate.ts`

- [ ] Create `src/hooks/useExitTicketTemplates.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExitTicketTemplate {
  id: string;
  name: string;
  description: string | null;
  teacher_id: string;
  school_id: string;
  created_at: string;
  updated_at: string;
  question_count: number;
}

export const useExitTicketTemplates = (schoolId?: string) => {
  return useQuery({
    queryKey: ['exit-ticket-templates', schoolId],
    queryFn: async (): Promise<ExitTicketTemplate[]> => {
      if (!schoolId) return [];

      const { data, error } = await supabase
        .from('exit_ticket_templates')
        .select(`
          id, name, description, teacher_id, school_id, created_at, updated_at,
          template_questions (id)
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        teacher_id: t.teacher_id,
        school_id: t.school_id,
        created_at: t.created_at,
        updated_at: t.updated_at,
        question_count: Array.isArray(t.template_questions) ? t.template_questions.length : 0,
      }));
    },
    enabled: !!schoolId,
  });
};
```

- [ ] Create `src/hooks/useTemplateQuestions.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TemplateQuestionOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface TemplateQuestion {
  id: string;
  template_id: string;
  number: number;
  question: string | null;
  question_type: string | null;
  max_score: number | null;
  blooms_taxonomy: string | null;
  content_item: string | null;
  general_capabilities: string[] | null;
  marking_criteria: unknown | null;
  model_answer: string | null;
  options: TemplateQuestionOption[];
}

export const useTemplateQuestions = (templateId?: string | null) => {
  return useQuery({
    queryKey: ['template-questions', templateId],
    queryFn: async (): Promise<TemplateQuestion[]> => {
      if (!templateId) return [];

      const { data: questions, error: qErr } = await supabase
        .from('template_questions')
        .select('*')
        .eq('template_id', templateId)
        .order('number', { ascending: true });

      if (qErr) throw qErr;

      const result: TemplateQuestion[] = [];
      for (const q of questions || []) {
        const { data: opts } = await supabase
          .from('template_question_options')
          .select('id, option_text, is_correct, order_index')
          .eq('template_question_id', q.id)
          .order('order_index', { ascending: true });

        result.push({ ...q, marking_criteria: q.marking_criteria ?? null, options: opts || [] });
      }
      return result;
    },
    enabled: !!templateId,
  });
};
```

- [ ] Create `src/hooks/useRunsForTemplate.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TemplateRun {
  id: string;
  name: string;
  status: string;
  is_completed: boolean;
  class_id: string;
  class_name: string;
  class_code: string | null;
  created_at: string;
}

export const useRunsForTemplate = (templateId?: string) => {
  return useQuery({
    queryKey: ['runs-for-template', templateId],
    queryFn: async (): Promise<TemplateRun[]> => {
      if (!templateId) return [];

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id, name, status, is_completed, class_id, created_at,
          classes (class_name, class_code)
        `)
        .eq('exit_ticket_template_id', templateId)
        .eq('is_exit_ticket', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((t) => {
        const cls = Array.isArray(t.classes) ? t.classes[0] : t.classes;
        return {
          id: t.id,
          name: t.name,
          status: t.status || 'draft',
          is_completed: (t.is_completed as boolean) || false,
          class_id: t.class_id,
          class_name: (cls as { class_name?: string } | null)?.class_name || '',
          class_code: (cls as { class_code?: string } | null)?.class_code || null,
          created_at: t.created_at,
        };
      });
    },
    enabled: !!templateId,
  });
};
```

- [ ] Commit:
```bash
git add src/hooks/useExitTicketTemplates.ts src/hooks/useTemplateQuestions.ts src/hooks/useRunsForTemplate.ts
git commit -m "feat: add exit ticket template query hooks"
```

---

## Task 4: Update useExitTicketsByClass

**Files:**
- Modify: `src/hooks/useExitTicketsByClass.ts`

Add `exit_ticket_template_id` so the classroom panel can link the Edit button to the template editor.

- [ ] Replace the entire content of `src/hooks/useExitTicketsByClass.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExitTicketByClass {
  id: string;
  name: string;
  description: string | null;
  task_type: string | null;
  status: string;
  is_completed: boolean;
  class_session_id: string | null;
  exit_ticket_template_id: string | null;
  created_at: string;
  updated_at: string;
  class_id: string;
  question_count: number;
}

export const useExitTicketsByClass = (classId?: string) => {
  return useQuery({
    queryKey: ['exit-tickets-by-class', classId],
    queryFn: async (): Promise<ExitTicketByClass[]> => {
      if (!classId) return [];

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          id, name, description, task_type, status, is_completed,
          class_session_id, exit_ticket_template_id,
          created_at, updated_at, class_id,
          questions (id)
        `)
        .eq('is_exit_ticket', true)
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (tasks || []).map((task) => ({
        id: task.id,
        name: task.name,
        description: task.description,
        task_type: task.task_type,
        status: task.status || 'draft',
        is_completed: (task.is_completed as boolean) || false,
        class_session_id: task.class_session_id || null,
        exit_ticket_template_id:
          (task as { exit_ticket_template_id?: string | null }).exit_ticket_template_id ?? null,
        created_at: task.created_at,
        updated_at: task.updated_at,
        class_id: task.class_id,
        question_count: Array.isArray(task.questions) ? task.questions.length : 0,
      }));
    },
    enabled: !!classId,
  });
};
```

- [ ] Commit:
```bash
git add src/hooks/useExitTicketsByClass.ts
git commit -m "feat: add exit_ticket_template_id to useExitTicketsByClass"
```

---

## Task 5: New mutation hooks

**Files:**
- Create: `src/hooks/useDeployTemplate.ts`
- Create: `src/hooks/useClearRun.ts`
- Create: `src/hooks/useDeleteRun.ts`

- [ ] Create `src/hooks/useDeployTemplate.ts`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DeployInput {
  templateId: string;
  classId: string;
}

export const useDeployTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, classId }: DeployInput) => {
      const { data: template, error: tErr } = await supabase
        .from('exit_ticket_templates')
        .select('name, description')
        .eq('id', templateId)
        .single();
      if (tErr) throw tErr;

      const { data: templateQuestions, error: qErr } = await supabase
        .from('template_questions')
        .select('*')
        .eq('template_id', templateId)
        .order('number', { ascending: true });
      if (qErr) throw qErr;

      const totalMaxScore = (templateQuestions || []).reduce(
        (sum, q) => sum + (Number(q.max_score) || 0),
        0
      );

      const { data: run, error: runErr } = await supabase
        .from('tasks')
        .insert({
          name: template.name,
          description: template.description,
          class_id: classId,
          is_exit_ticket: true,
          status: 'draft',
          exit_ticket_template_id: templateId,
          max_score: totalMaxScore,
          task_type: 'Formative',
        })
        .select('id')
        .single();
      if (runErr) throw runErr;

      for (const tq of templateQuestions || []) {
        const { data: question, error: insertQErr } = await supabase
          .from('questions')
          .insert({
            task_id: run.id,
            number: tq.number,
            question: tq.question,
            question_type: tq.question_type,
            max_score: tq.max_score,
            blooms_taxonomy: tq.blooms_taxonomy,
            content_item: tq.content_item,
            general_capabilities: tq.general_capabilities,
            marking_criteria: tq.marking_criteria,
            model_answer: tq.model_answer,
          })
          .select('id')
          .single();
        if (insertQErr) throw insertQErr;

        if (tq.question_type === 'multiple_choice') {
          const { data: opts } = await supabase
            .from('template_question_options')
            .select('option_text, is_correct, order_index')
            .eq('template_question_id', tq.id)
            .order('order_index', { ascending: true });

          if (opts && opts.length > 0) {
            const { error: optErr } = await supabase
              .from('question_options')
              .insert(opts.map((o) => ({
                question_id: question.id,
                option_text: o.option_text,
                is_correct: o.is_correct,
                order_index: o.order_index,
              })));
            if (optErr) throw optErr;
          }
        }
      }

      return run;
    },
    onSuccess: (_, { classId, templateId }) => {
      queryClient.invalidateQueries({ queryKey: ['exit-tickets-by-class', classId] });
      queryClient.invalidateQueries({ queryKey: ['runs-for-template', templateId] });
      queryClient.invalidateQueries({ queryKey: ['assessments', classId] });
    },
  });
};
```

- [ ] Create `src/hooks/useClearRun.ts`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ClearRunInput {
  taskId: string;
  classId: string;
  templateId: string | null;
}

export const useClearRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId }: ClearRunInput) => {
      const { data: questions } = await supabase
        .from('questions')
        .select('id')
        .eq('task_id', taskId);

      if (questions && questions.length > 0) {
        const { error: qrErr } = await supabase
          .from('question_results')
          .delete()
          .in('question_id', questions.map((q) => q.id));
        if (qrErr) throw qrErr;
      }

      const { error: rErr } = await supabase
        .from('results')
        .delete()
        .eq('task_id', taskId);
      if (rErr) throw rErr;

      const { error: tErr } = await supabase
        .from('tasks')
        .update({ status: 'draft', is_completed: false })
        .eq('id', taskId);
      if (tErr) throw tErr;
    },
    onSuccess: (_, { classId, templateId }) => {
      queryClient.invalidateQueries({ queryKey: ['exit-tickets-by-class', classId] });
      if (templateId) {
        queryClient.invalidateQueries({ queryKey: ['runs-for-template', templateId] });
      }
      queryClient.invalidateQueries({ queryKey: ['results'] });
      queryClient.invalidateQueries({ queryKey: ['question-results'] });
    },
  });
};
```

- [ ] Create `src/hooks/useDeleteRun.ts`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DeleteRunInput {
  taskId: string;
  classId: string;
  templateId: string | null;
}

export const useDeleteRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId }: DeleteRunInput) => {
      const { data: questions } = await supabase
        .from('questions')
        .select('id')
        .eq('task_id', taskId);

      if (questions && questions.length > 0) {
        await supabase
          .from('question_results')
          .delete()
          .in('question_id', questions.map((q) => q.id));
      }

      await supabase.from('results').delete().eq('task_id', taskId);

      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: (_, { classId, templateId }) => {
      queryClient.invalidateQueries({ queryKey: ['exit-tickets-by-class', classId] });
      if (templateId) {
        queryClient.invalidateQueries({ queryKey: ['runs-for-template', templateId] });
      }
      queryClient.invalidateQueries({ queryKey: ['assessments', classId] });
    },
  });
};
```

- [ ] Commit:
```bash
git add src/hooks/useDeployTemplate.ts src/hooks/useClearRun.ts src/hooks/useDeleteRun.ts
git commit -m "feat: add deploy, clear, and delete run mutation hooks"
```

---

## Task 6: Refactor CreateExitTicket.tsx

**Files:**
- Modify: `src/pages/CreateExitTicket.tsx`

Key changes from the current file:
- Prop `taskId` → `templateId`
- Load from `exit_ticket_templates` + `template_questions` + `template_question_options` (not tasks/questions)
- Save to `exit_ticket_templates` + `template_questions` + `template_question_options`
- Remove `classId`, `taskType`, `status` state (templates are class-agnostic)
- Add `aiContextClassId` state — used only in the AI panel for curriculum context, never saved
- Validation: remove the `!classId` check
- Content descriptor dropdown uses `aiContextClassId` instead of `classId`
- Delete: deletes `exit_ticket_templates` row (CASCADE handles children)

- [ ] Replace the entire content of `src/pages/CreateExitTicket.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ArrowLeft, Plus, Trash2, Save, Loader2, GripVertical,
  Bot, Sparkles, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useClasses } from '@/hooks/useClasses';
import { useClassContentItems } from '@/hooks/useClassContentItems';
import { useBloomsTaxonomy } from '@/hooks/useCreateAssessment';
import { useOpenAIKeyStatus } from '@/hooks/useAISettings';
import { useAIGenerateExitTicket } from '@/hooks/useAIGenerateExitTicket';
import type { MarkingCriteria } from '@/lib/autoMarkTextAnswer';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

type QuestionType = 'multiple_choice' | 'short_answer' | 'extended_answer';

interface QuestionOptionDraft {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionDraft {
  id: string;
  text: string;
  type: QuestionType;
  maxScore: number;
  options: QuestionOptionDraft[];
  bloomsTaxonomy?: string;
  contentItemCode?: string;
  markingCriteria?: MarkingCriteria;
  modelAnswer?: string;
}

const defaultQuestion = (): QuestionDraft => ({
  id: generateId(),
  text: '',
  type: 'multiple_choice',
  maxScore: 1,
  options: [
    { id: generateId(), text: '', isCorrect: false },
    { id: generateId(), text: '', isCorrect: false },
  ],
});

interface CreateExitTicketProps {
  embedded?: boolean;
  onClose?: () => void;
  templateId?: string | null;
}

const CreateExitTicket = ({ embedded, onClose, templateId: templateIdProp }: CreateExitTicketProps = {}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const { data: classes = [], isLoading: isLoadingClasses } = useClasses();
  const bloomsLevels = useBloomsTaxonomy();
  const { data: openAIStatus } = useOpenAIKeyStatus();
  const generateExitTicket = useAIGenerateExitTicket();

  const [searchParams] = useSearchParams();
  const editTemplateId = templateIdProp ?? searchParams.get('templateId');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([defaultQuestion()]);
  const [aiContextClassId, setAiContextClassId] = useState<string>('');

  const [isLoading, setIsLoading] = useState(!!editTemplateId);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState(3);
  const [aiQuestionTypes, setAiQuestionTypes] = useState<'mcq' | 'short_answer' | 'extended' | 'mix'>('mix');

  const { data: classContentItems = [] } = useClassContentItems(aiContextClassId || undefined);

  useEffect(() => {
    if (!editTemplateId) { setIsLoading(false); return; }

    const load = async () => {
      setIsLoading(true);
      try {
        const { data: template, error: tErr } = await supabase
          .from('exit_ticket_templates')
          .select('id, name, description')
          .eq('id', editTemplateId)
          .maybeSingle();
        if (tErr) throw tErr;
        if (!template) { toast({ title: 'Exit ticket not found', variant: 'destructive' }); return; }

        setTitle(template.name || '');
        setDescription(template.description || '');

        const { data: qs, error: qErr } = await supabase
          .from('template_questions')
          .select('id, question, question_type, max_score, number, marking_criteria, model_answer, blooms_taxonomy, content_item')
          .eq('template_id', editTemplateId)
          .order('number', { ascending: true });
        if (qErr) throw qErr;

        const loadedQuestions: QuestionDraft[] = [];
        for (const q of qs || []) {
          const draft: QuestionDraft = {
            id: q.id,
            text: q.question || '',
            type: (q.question_type as QuestionType) || 'multiple_choice',
            maxScore: Number(q.max_score || 0),
            options: [],
            bloomsTaxonomy: q.blooms_taxonomy ?? undefined,
            contentItemCode: q.content_item ?? undefined,
            markingCriteria: (q.marking_criteria as MarkingCriteria) || undefined,
            modelAnswer: q.model_answer ?? undefined,
          };
          if (draft.type === 'multiple_choice') {
            const { data: opts } = await supabase
              .from('template_question_options')
              .select('id, option_text, is_correct, order_index')
              .eq('template_question_id', q.id)
              .order('order_index', { ascending: true });
            draft.options = (opts || []).map((o) => ({ id: o.id, text: o.option_text, isCorrect: o.is_correct }));
          }
          loadedQuestions.push(draft);
        }
        setQuestions(loadedQuestions.length > 0 ? loadedQuestions : [defaultQuestion()]);
      } catch (e: unknown) {
        toast({ title: 'Failed to load exit ticket', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [editTemplateId, toast]);

  const addQuestion = () => setQuestions((prev) => [...prev, defaultQuestion()]);
  const removeQuestion = (index: number) => setQuestions((prev) => prev.filter((_, i) => i !== index));

  const updateQuestion = (index: number, updater: (q: QuestionDraft) => QuestionDraft) => {
    setQuestions((prev) => { const copy = [...prev]; copy[index] = updater({ ...copy[index] }); return copy; });
  };

  const addOption = (qIndex: number) =>
    updateQuestion(qIndex, (q) => ({ ...q, options: [...q.options, { id: generateId(), text: '', isCorrect: false }] }));

  const removeOption = (qIndex: number, oIndex: number) =>
    updateQuestion(qIndex, (q) => ({ ...q, options: q.options.filter((_, i) => i !== oIndex) }));

  const updateOptionText = (qIndex: number, oIndex: number, text: string) =>
    updateQuestion(qIndex, (q) => ({ ...q, options: q.options.map((o, i) => (i === oIndex ? { ...o, text } : o)) }));

  const setCorrectOption = (qIndex: number, optionId: string) =>
    updateQuestion(qIndex, (q) => ({ ...q, options: q.options.map((o) => ({ ...o, isCorrect: o.id === optionId })) }));

  const validate = (): string | null => {
    if (!title.trim()) return 'Please enter a title.';
    if (questions.length === 0) return 'Please add at least one question.';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Question ${i + 1} is missing text.`;
      if (q.type === 'multiple_choice') {
        if (q.options.length < 2) return `Question ${i + 1} needs at least 2 options.`;
        if (q.options.some((o) => !o.text.trim())) return `Question ${i + 1} has empty options.`;
        if (!q.options.some((o) => o.isCorrect)) return `Question ${i + 1} needs a correct answer selected.`;
      }
      if ((q.maxScore || 0) < 0) return `Question ${i + 1} max score cannot be negative.`;
    }
    return null;
  };

  const handleSave = async () => {
    if (isSaving) return;
    const err = validate();
    if (err) { toast({ title: 'Validation Error', description: err, variant: 'destructive' }); return; }
    setIsSaving(true);
    try {
      let templateId = editTemplateId;
      if (!templateId) {
        if (!currentUser?.id || !currentUser?.school_id) {
          toast({ title: 'Not logged in', variant: 'destructive' }); return;
        }
        const { data: inserted, error: insertErr } = await supabase
          .from('exit_ticket_templates')
          .insert({ name: title.trim(), description: description.trim() || null, teacher_id: currentUser.id, school_id: currentUser.school_id })
          .select('id').single();
        if (insertErr) throw insertErr;
        templateId = inserted.id;
      } else {
        const { error: updateErr } = await supabase
          .from('exit_ticket_templates')
          .update({ name: title.trim(), description: description.trim() || null })
          .eq('id', templateId);
        if (updateErr) throw updateErr;
      }

      const { error: delErr } = await supabase.from('template_questions').delete().eq('template_id', templateId);
      if (delErr) throw delErr;

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const { data: qRow, error: qErr } = await supabase
          .from('template_questions')
          .insert({
            template_id: templateId, number: i + 1, question: q.text.trim(),
            max_score: q.maxScore, question_type: q.type,
            blooms_taxonomy: q.bloomsTaxonomy || null, content_item: q.contentItemCode || null,
            general_capabilities: null,
            marking_criteria: q.type !== 'multiple_choice' ? (q.markingCriteria || null) : null,
            model_answer: q.type !== 'multiple_choice' ? (q.modelAnswer || null) : null,
          })
          .select('id').single();
        if (qErr) throw qErr;

        if (q.type === 'multiple_choice' && qRow) {
          const { error: optErr } = await supabase.from('template_question_options').insert(
            q.options.map((o, idx) => ({
              template_question_id: qRow.id, option_text: o.text.trim(),
              is_correct: o.isCorrect, order_index: idx + 1,
            }))
          );
          if (optErr) throw optErr;
        }
      }

      toast({ title: 'Exit ticket saved' });
      if (onClose) onClose(); else navigate('/exit-tickets');
    } catch (e: unknown) {
      toast({ title: 'Failed to save', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editTemplateId) { if (onClose) onClose(); else navigate('/exit-tickets'); return; }
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('exit_ticket_templates').delete().eq('id', editTemplateId);
      if (error) throw error;
      toast({ title: 'Exit ticket deleted' });
      if (onClose) onClose(); else navigate('/exit-tickets');
    } catch (e: unknown) {
      toast({ title: 'Failed to delete', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleGenerate = async () => {
    if (!aiContextClassId) { toast({ title: 'Select a class for curriculum context', variant: 'destructive' }); return; }
    if (!aiPrompt.trim()) { toast({ title: 'Enter a prompt', variant: 'destructive' }); return; }
    if (!openAIStatus?.hasKey) { toast({ title: 'No OpenAI key', description: 'Add your key in Settings.', variant: 'destructive' }); return; }
    try {
      const data = await generateExitTicket.mutateAsync({
        content: aiPrompt.trim(), questionCount: aiQuestionCount,
        questionTypes: aiQuestionTypes, classId: aiContextClassId,
      });
      setTitle(data.name);
      setDescription(data.description);
      const drafts: QuestionDraft[] = data.questions.map((q) => {
        const base: QuestionDraft = {
          id: generateId(), text: q.question, type: q.question_type,
          maxScore: q.max_score, options: [],
          bloomsTaxonomy: q.blooms_taxonomy || undefined,
          contentItemCode: q.content_item_id || undefined,
        };
        if (q.question_type === 'multiple_choice') {
          base.options = q.options?.map((o) => ({ id: generateId(), text: o.option_text, isCorrect: o.is_correct })) ||
            [{ id: generateId(), text: 'True', isCorrect: true }, { id: generateId(), text: 'False', isCorrect: false }];
        } else {
          base.markingCriteria = q.marking_criteria || { expected_keywords: [''], match_type: 'any', case_sensitive: false };
          base.modelAnswer = q.model_answer || '';
        }
        return base;
      });
      setQuestions(drafts.length > 0 ? drafts : [defaultQuestion()]);
      toast({ title: 'Exit ticket generated', description: `${drafts.length} question${drafts.length === 1 ? '' : 's'} created.` });
      setShowAIPanel(false);
    } catch { /* handled by mutation onError */ }
  };

  const isBusy = isSaving || isDeleting || isLoading || isLoadingUser || isLoadingClasses || generateExitTicket.isPending;

  const deleteDialog = (
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Exit Ticket</DialogTitle>
          <DialogDescription>
            This deletes the template. Any deployed runs will remain but lose their template link.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const content = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exit Ticket Details</CardTitle>
          <CardDescription>Set the title and description. Choose which class to deploy to after saving.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fractions Check-in" disabled={isBusy} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={2} disabled={isBusy} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border-purple-200">
        <Collapsible open={showAIPanel} onOpenChange={setShowAIPanel}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700"><Bot className="w-5 h-5" /></div>
                <div>
                  <CardTitle className="text-base">Generate with AI</CardTitle>
                  <CardDescription className="text-sm">Let AI draft questions based on class curriculum</CardDescription>
                </div>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {showAIPanel ? <><ChevronUp className="w-4 h-4 mr-2" />Hide</> : <><ChevronDown className="w-4 h-4 mr-2" />Show</>}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {!openAIStatus?.hasKey && (
                <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  No OpenAI API key found. Add your key in Settings to use AI generation.
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="ai-class">Class for curriculum context</Label>
                <Select value={aiContextClassId} onValueChange={setAiContextClassId} disabled={isBusy}>
                  <SelectTrigger id="ai-class"><SelectValue placeholder="Select a class (for curriculum tags)" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.class_name} ({c.subject})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Used only for AI curriculum context — not saved to the template.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-prompt">Describe the topic</Label>
                <Textarea id="ai-prompt" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g. Check students' understanding of photosynthesis" rows={3} disabled={isBusy} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ai-count">Number of questions</Label>
                  <Input id="ai-count" type="number" min={1} max={10} value={aiQuestionCount} onChange={(e) => setAiQuestionCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} disabled={isBusy} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-types">Question types</Label>
                  <Select value={aiQuestionTypes} onValueChange={(v: typeof aiQuestionTypes) => setAiQuestionTypes(v)} disabled={isBusy}>
                    <SelectTrigger id="ai-types"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mix">Mix</SelectItem>
                      <SelectItem value="mcq">Multiple Choice only</SelectItem>
                      <SelectItem value="short_answer">Short Answer only</SelectItem>
                      <SelectItem value="extended">Extended Answer only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleGenerate} disabled={isBusy || !openAIStatus?.hasKey || !aiContextClassId || !aiPrompt.trim()}>
                  {generateExitTicket.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {generateExitTicket.isPending ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Questions ({questions.length})</h2>
          <div className="text-sm text-muted-foreground">Total marks: {questions.reduce((sum, q) => sum + (q.maxScore || 0), 0)}</div>
        </div>
        <div className="flex justify-end">
          <Button onClick={addQuestion} disabled={isBusy}><Plus className="w-4 h-4 mr-2" />Add Question</Button>
        </div>

        {questions.map((q, qIndex) => {
          const isText = q.type !== 'multiple_choice';
          const criteria = q.markingCriteria || { expected_keywords: [''], match_type: 'any' as const, case_sensitive: false };
          return (
            <Card key={q.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Question {qIndex + 1}</span>
                    </div>
                    <Textarea value={q.text} onChange={(e) => updateQuestion(qIndex, (prev) => ({ ...prev, text: e.target.value }))} placeholder="Enter question text" rows={2} disabled={isBusy} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <Select
                        value={q.type}
                        onValueChange={(v: QuestionType) =>
                          updateQuestion(qIndex, (prev) => ({
                            ...prev, type: v,
                            options: v === 'multiple_choice' ? [{ id: generateId(), text: '', isCorrect: false }, { id: generateId(), text: '', isCorrect: false }] : [],
                            markingCriteria: v !== 'multiple_choice' ? { expected_keywords: [''], match_type: 'any', case_sensitive: false } : undefined,
                          }))
                        }
                        disabled={isBusy}
                      >
                        <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="short_answer">Short Answer</SelectItem>
                          <SelectItem value="extended_answer">Extended Answer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="number" min={0} value={q.maxScore} onChange={(e) => updateQuestion(qIndex, (prev) => ({ ...prev, maxScore: Number(e.target.value) || 0 }))} placeholder="Max score" disabled={isBusy} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Select value={q.bloomsTaxonomy || ''} onValueChange={(v) => updateQuestion(qIndex, (prev) => ({ ...prev, bloomsTaxonomy: v || undefined }))} disabled={isBusy}>
                        <SelectTrigger><SelectValue placeholder="Bloom's level" /></SelectTrigger>
                        <SelectContent>{bloomsLevels.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={q.contentItemCode || ''} onValueChange={(v) => updateQuestion(qIndex, (prev) => ({ ...prev, contentItemCode: v || undefined }))} disabled={isBusy || classContentItems.length === 0}>
                        <SelectTrigger><SelectValue placeholder={classContentItems.length === 0 ? 'Select AI context class first' : 'Content descriptor'} /></SelectTrigger>
                        <SelectContent>
                          {classContentItems.map((item) => (
                            <SelectItem key={item.content_item.id} value={item.content_item.code}>
                              {item.content_item.code} — {item.content_item.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeQuestion(qIndex)} disabled={isBusy || questions.length === 1}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              {q.type === 'multiple_choice' && (
                <CardContent className="space-y-3">
                  <Label>Options</Label>
                  {q.options.map((opt, oIndex) => (
                    <div key={opt.id} className="flex items-center gap-3">
                      <input type="radio" name={`correct-${q.id}`} checked={opt.isCorrect} onChange={() => setCorrectOption(qIndex, opt.id)} className="w-4 h-4" disabled={isBusy} />
                      <Input value={opt.text} onChange={(e) => updateOptionText(qIndex, oIndex, e.target.value)} placeholder={`Option ${oIndex + 1}`} disabled={isBusy} className={opt.isCorrect ? 'border-green-500' : ''} />
                      {opt.isCorrect && <span className="text-xs text-green-600 font-medium whitespace-nowrap">Correct</span>}
                      <Button variant="ghost" size="sm" onClick={() => removeOption(qIndex, oIndex)} disabled={isBusy || q.options.length <= 2}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addOption(qIndex)} disabled={isBusy}><Plus className="w-4 h-4 mr-2" />Add Option</Button>
                </CardContent>
              )}
              {isText && (
                <CardContent className="space-y-4 border-t bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Label>Marking Criteria</Label>
                    <span className="text-xs text-muted-foreground">(optional — auto-marks text answers)</span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Expected keywords / phrases</Label>
                    {(criteria.expected_keywords || ['']).map((keyword, kIndex) => (
                      <div key={kIndex} className="flex items-center gap-2">
                        <Input
                          value={keyword}
                          onChange={(e) => {
                            const next = [...(criteria.expected_keywords || [''])];
                            next[kIndex] = e.target.value;
                            updateQuestion(qIndex, (prev) => ({ ...prev, markingCriteria: { ...criteria, expected_keywords: next } }));
                          }}
                          placeholder="e.g. photosynthesis" disabled={isBusy}
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                          onClick={() => {
                            const next = [...(criteria.expected_keywords || [''])];
                            next.splice(kIndex, 1);
                            updateQuestion(qIndex, (prev) => ({ ...prev, markingCriteria: { ...criteria, expected_keywords: next.length ? next : [''] } }));
                          }}
                          disabled={isBusy}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm"
                      onClick={() => updateQuestion(qIndex, (prev) => ({ ...prev, markingCriteria: { ...criteria, expected_keywords: [...(criteria.expected_keywords || []), ''] } }))}
                      disabled={isBusy}>
                      <Plus className="w-4 h-4 mr-2" />Add Keyword
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm">Match type</Label>
                      <Select value={criteria.match_type || 'any'} onValueChange={(v: 'all' | 'any') => updateQuestion(qIndex, (prev) => ({ ...prev, markingCriteria: { ...criteria, match_type: v } }))} disabled={isBusy}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Match any keyword (partial marks)</SelectItem>
                          <SelectItem value="all">Match all keywords (full marks only)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <input type="checkbox" id={`case-${q.id}`} checked={criteria.case_sensitive || false}
                        onChange={(e) => updateQuestion(qIndex, (prev) => ({ ...prev, markingCriteria: { ...criteria, case_sensitive: e.target.checked } }))}
                        disabled={isBusy} className="w-4 h-4" />
                      <Label htmlFor={`case-${q.id}`} className="text-sm cursor-pointer">Case sensitive matching</Label>
                    </div>
                    <div className="space-y-2 mt-3">
                      <Label className="text-sm font-medium">Model Answer (for AI marking)</Label>
                      <Textarea value={q.modelAnswer || ''} onChange={(e) => updateQuestion(qIndex, (prev) => ({ ...prev, modelAnswer: e.target.value }))} placeholder="Write what a full-marks answer looks like." rows={3} className="text-sm resize-none" disabled={isBusy} />
                      <p className="text-xs text-muted-foreground">Optional — AI will still mark without it, just less accurately.</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="relative">
        <div className="sticky top-0 z-10 bg-card border-b border-border/50 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{editTemplateId ? 'Edit Exit Ticket' : 'Create Exit Ticket'}</h2>
            <p className="text-xs text-muted-foreground">Build questions for your students to answer</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} disabled={isBusy}>
              <Trash2 className="w-4 h-4 mr-2" />{editTemplateId ? 'Delete' : 'Discard'}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isBusy}>
              <Save className="w-4 h-4 mr-2" />{isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={isBusy} aria-label="Close"><X className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="px-4 py-6 max-w-4xl mx-auto">{content}</div>
        {deleteDialog}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <header className="bg-card border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/exit-tickets')} disabled={isBusy}>
              <ArrowLeft className="w-4 h-4 mr-2" />Back to Exit Tickets
            </Button>
            <div>
              <h1 className="text-xl font-bold">{editTemplateId ? 'Edit Exit Ticket' : 'Create Exit Ticket'}</h1>
              <p className="text-sm text-muted-foreground">Build questions for your students to answer</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={isBusy}>
              <Trash2 className="w-4 h-4 mr-2" />{editTemplateId ? 'Delete' : 'Discard'}
            </Button>
            <Button onClick={handleSave} disabled={isBusy}>
              <Save className="w-4 h-4 mr-2" />{isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-4xl">{content}</main>
      {deleteDialog}
    </div>
  );
};

export default CreateExitTicket;
```

- [ ] Run a build check: `npm run build 2>&1 | head -60`
  Fix any TypeScript errors before continuing.

- [ ] Commit:
```bash
git add src/pages/CreateExitTicket.tsx
git commit -m "feat: refactor CreateExitTicket to save to exit_ticket_templates"
```

---

## Task 7: Refactor ExitTickets.tsx

**Files:**
- Modify: `src/pages/ExitTickets.tsx`
- Delete: `src/hooks/useExitTickets.ts`

The page now lists templates. Each template card has Edit, Delete, and Deploy buttons, plus a collapsible Runs section. A `TemplateRunsSection` sub-component handles run listing so hook calls work correctly per-template.

- [ ] Replace the entire content of `src/pages/ExitTickets.tsx`:

```typescript
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  ArrowLeft, Plus, Ticket, Trash2, Loader2, ChevronDown, ChevronUp,
  Rocket, RefreshCw, X,
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useClasses } from '@/hooks/useClasses';
import { useExitTicketTemplates, type ExitTicketTemplate } from '@/hooks/useExitTicketTemplates';
import { useRunsForTemplate, type TemplateRun } from '@/hooks/useRunsForTemplate';
import { useDeployTemplate } from '@/hooks/useDeployTemplate';
import { useClearRun } from '@/hooks/useClearRun';
import { useDeleteRun } from '@/hooks/useDeleteRun';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CreateExitTicket from './CreateExitTicket';

// ── Sub-component: runs list for a single template ──────────────────────────

interface TemplateRunsSectionProps {
  template: ExitTicketTemplate;
}

const TemplateRunsSection: React.FC<TemplateRunsSectionProps> = ({ template }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: runs = [], isLoading, refetch } = useRunsForTemplate(template.id);
  const clearRun = useClearRun();
  const deleteRun = useDeleteRun();

  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteRunDialogOpen, setDeleteRunDialogOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<TemplateRun | null>(null);

  const handleClear = async () => {
    if (!selectedRun) return;
    try {
      await clearRun.mutateAsync({
        taskId: selectedRun.id, classId: selectedRun.class_id, templateId: template.id,
      });
      toast({ title: 'Results cleared', description: 'The run has been reset to draft.' });
      refetch();
    } catch (e: unknown) {
      toast({ title: 'Failed to clear', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setClearDialogOpen(false);
      setSelectedRun(null);
    }
  };

  const handleDeleteRun = async () => {
    if (!selectedRun) return;
    try {
      await deleteRun.mutateAsync({
        taskId: selectedRun.id, classId: selectedRun.class_id, templateId: template.id,
      });
      toast({ title: 'Run removed' });
      refetch();
    } catch (e: unknown) {
      toast({ title: 'Failed to remove run', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setDeleteRunDialogOpen(false);
      setSelectedRun(null);
    }
  };

  const getStatusVariant = (status: string) => {
    if (status === 'active') return 'default' as const;
    if (status === 'closed') return 'secondary' as const;
    return 'outline' as const;
  };

  if (isLoading) return <div className="py-3 text-sm text-muted-foreground">Loading runs...</div>;

  if (runs.length === 0) {
    return (
      <div className="py-3 text-sm text-muted-foreground">
        Not deployed to any class yet. Use the Deploy button above.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 pt-1">
        {runs.map((run) => (
          <div key={run.id} className="flex items-center justify-between gap-2 p-2.5 rounded-md border bg-background/50 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant={getStatusVariant(run.status)} className="capitalize text-xs shrink-0">
                {run.status}
              </Badge>
              <span className="truncate font-medium">{run.class_name}</span>
              {run.class_code && (
                <span className="text-xs text-muted-foreground font-mono shrink-0">{run.class_code}</span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost" size="sm" className="h-7 px-2 text-xs"
                onClick={() => navigate(`/classroom/${run.class_id}`)}
              >
                Classroom
              </Button>
              <Button
                variant="ghost" size="sm" className="h-7 px-2 text-xs"
                onClick={() => { setSelectedRun(run); setClearDialogOpen(true); }}
                disabled={clearRun.isPending || deleteRun.isPending}
              >
                <RefreshCw className="w-3 h-3 mr-1" />Clear
              </Button>
              <Button
                variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => { setSelectedRun(run); setDeleteRunDialogOpen(true); }}
                disabled={clearRun.isPending || deleteRun.isPending}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Results?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes all student responses for this run and resets it to draft. The questions stay intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedRun(null)} disabled={clearRun.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} disabled={clearRun.isPending}>
              {clearRun.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Clearing...</> : 'Clear Results'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteRunDialogOpen} onOpenChange={setDeleteRunDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Run?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes this run (including all student responses) from {selectedRun?.class_name}. The template is not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedRun(null)} disabled={deleteRun.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRun} disabled={deleteRun.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRun.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Removing...</> : 'Remove Run'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────

const ExitTickets = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const { data: classes = [] } = useClasses();
  const { data: templates = [], isLoading, isError, error, refetch } = useExitTicketTemplates(currentUser?.school_id || undefined);
  const deployTemplate = useDeployTemplate();

  // Edit sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTemplateId, setSheetTemplateId] = useState<string | null>(null);

  // Delete template dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Deploy dialog
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [deployTemplateId, setDeployTemplateId] = useState<string | null>(null);
  const [deployClassId, setDeployClassId] = useState<string>('');

  // Runs collapsible state per template
  const [openRunsMap, setOpenRunsMap] = useState<Record<string, boolean>>({});

  const openCreateSheet = () => { setSheetTemplateId(null); setSheetOpen(true); };
  const openEditSheet = (templateId: string) => { setSheetTemplateId(templateId); setSheetOpen(true); };
  const closeSheet = () => { setSheetOpen(false); setSheetTemplateId(null); refetch(); };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('exit_ticket_templates').delete().eq('id', templateToDelete);
      if (error) throw error;
      toast({ title: 'Exit ticket deleted' });
      refetch();
    } catch (err: unknown) {
      toast({ title: 'Failed to delete', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleDeployClick = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    setDeployTemplateId(templateId);
    setDeployClassId('');
    setDeployDialogOpen(true);
  };

  const handleDeployConfirm = async () => {
    if (!deployTemplateId || !deployClassId) return;
    try {
      await deployTemplate.mutateAsync({ templateId: deployTemplateId, classId: deployClassId });
      toast({ title: 'Deployed!', description: 'Exit ticket is now ready in that class. Go to the classroom to activate it.' });
      setOpenRunsMap((prev) => ({ ...prev, [deployTemplateId]: true }));
    } catch (err: unknown) {
      toast({ title: 'Deploy failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setDeployDialogOpen(false);
      setDeployTemplateId(null);
      setDeployClassId('');
    }
  };

  const toggleRuns = (templateId: string) =>
    setOpenRunsMap((prev) => ({ ...prev, [templateId]: !prev[templateId] }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <header className="bg-card border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Exit Tickets</h1>
              <p className="text-sm text-muted-foreground">Create templates and deploy them to your classes</p>
            </div>
          </div>
          <Button onClick={openCreateSheet}><Plus className="w-4 h-4 mr-2" />Create Exit Ticket</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Ticket className="w-5 h-5" />Exit Ticket Library</CardTitle>
              <CardDescription>Templates you've built — deploy them to any class when you're ready</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>Refresh</Button>
          </CardHeader>
          <CardContent>
            {isError && (
              <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                <p className="text-sm text-destructive font-medium">Failed to load exit tickets.</p>
                <p className="text-xs text-destructive/80 mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
              </div>
            )}

            {!isError && (
              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse rounded-lg border p-4 bg-muted/50 h-24" />
                    ))}
                  </div>
                ) : templates.length > 0 ? (
                  <div className="space-y-3">
                    {templates.map((template) => (
                      <Card key={template.id} className="border-border/80">
                        <CardContent className="py-4">
                          <div className="flex flex-col gap-3">
                            {/* Top row: info + action buttons */}
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              <div className="space-y-1 flex-1 cursor-pointer" onClick={() => openEditSheet(template.id)}>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline">
                                    {template.question_count} question{template.question_count === 1 ? '' : 's'}
                                  </Badge>
                                </div>
                                <h3 className="text-lg font-semibold">{template.name}</h3>
                                {template.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                                )}
                                <div className="text-xs text-muted-foreground">
                                  Created {formatDistanceToNow(new Date(template.created_at), { addSuffix: true })}
                                </div>
                              </div>
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button size="sm" onClick={(e) => handleDeployClick(e, template.id)}>
                                  <Rocket className="w-3.5 h-3.5 mr-1.5" />Deploy
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => openEditSheet(template.id)}>Edit</Button>
                                <Button variant="destructive" size="sm" onClick={(e) => handleDeleteClick(e, template.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Runs collapsible */}
                            <Collapsible open={openRunsMap[template.id] || false} onOpenChange={() => toggleRuns(template.id)}>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground h-7 px-2">
                                  <span>Deployed runs</span>
                                  {openRunsMap[template.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <TemplateRunsSection template={template} />
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No exit tickets yet</h3>
                    <p className="text-muted-foreground mb-6">Create your first exit ticket template to get started.</p>
                    <Button onClick={openCreateSheet}><Plus className="w-4 h-4 mr-2" />Create Exit Ticket</Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit / Create sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-3xl p-0 overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>{sheetTemplateId ? 'Edit Exit Ticket' : 'Create Exit Ticket'}</SheetTitle>
          </SheetHeader>
          <CreateExitTicket embedded templateId={sheetTemplateId} onClose={closeSheet} />
        </SheetContent>
      </Sheet>

      {/* Deploy dialog */}
      <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deploy to Class</DialogTitle>
            <DialogDescription>
              Choose a class. A copy of this ticket's questions will be created for that class, ready to activate from the classroom.
            </DialogDescription>
          </DialogHeader>
          <Select value={deployClassId} onValueChange={setDeployClassId}>
            <SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.class_name} ({c.subject})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeployDialogOpen(false)} disabled={deployTemplate.isPending}>Cancel</Button>
            <Button onClick={handleDeployConfirm} disabled={!deployClassId || deployTemplate.isPending}>
              {deployTemplate.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deploying...</> : 'Deploy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete template dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exit Ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the template and its questions. Any runs already deployed to classes will remain but lose their template link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm} disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExitTickets;
```

- [ ] Delete the old unused hook:
```bash
rm src/hooks/useExitTickets.ts
```

- [ ] Run a build check: `npm run build 2>&1 | head -60`
  Fix any TypeScript errors. Common fix: `navigate` used inside `TemplateRunsSection` — confirm the `useNavigate()` import is at the top of the file.

- [ ] Commit:
```bash
git add src/pages/ExitTickets.tsx
git rm src/hooks/useExitTickets.ts
git commit -m "feat: refactor ExitTickets page to use templates, add Deploy and Runs sections"
```

---

## Task 8: Update ClassroomActivities.tsx

**Files:**
- Modify: `src/components/classroom/ClassroomActivities.tsx`

Two changes:
1. The **Edit** button currently navigates to `/exit-tickets/create?taskId=${ticket.id}`. Change it to navigate to `/exit-tickets/create?templateId=${ticket.exit_ticket_template_id}` (only show Edit if `exit_ticket_template_id` is set).
2. Add a **Clear Results** button that calls `useClearRun` (same logic as the existing `doRerunTicket`, but without activating afterwards).

- [ ] At the top of `src/components/classroom/ClassroomActivities.tsx`, add these imports after the existing imports:

```typescript
import { useClearRun } from '@/hooks/useClearRun';
```

- [ ] Inside the `ClassroomActivities` function body, add the hook and state after the existing hook calls (after line ~48, near `createSessionMutation`):

```typescript
const clearRun = useClearRun();
const [clearResultsDialogOpen, setClearResultsDialogOpen] = useState(false);
const [clearResultsTicketId, setClearResultsTicketId] = useState<string | null>(null);
```

- [ ] Add the `handleClearResults` function after `handleCancelStartLesson` (around line 350):

```typescript
const handleClearResults = async () => {
  if (!clearResultsTicketId) return;
  const ticket = allExitTickets.find((t) => t.id === clearResultsTicketId);
  if (!ticket) return;
  setClearResultsDialogOpen(false);
  try {
    await clearRun.mutateAsync({
      taskId: clearResultsTicketId,
      classId: classId,
      templateId: ticket.exit_ticket_template_id,
    });
    queryClient.invalidateQueries({ queryKey: ['exit-tickets-by-class', classId] });
    toast({ title: 'Results cleared', description: 'The exit ticket has been reset to draft.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    toast({ title: 'Error', description: msg, variant: 'destructive' });
  } finally {
    setClearResultsTicketId(null);
  }
};
```

- [ ] In the ticket action buttons area (around line 533–544), replace the Edit button:

Find this exact block:
```typescript
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs gap-1"
                        onClick={() =>
                          navigate(`/exit-tickets/create?taskId=${ticket.id}`)
                        }
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </Button>
```

Replace with:
```typescript
                      {ticket.exit_ticket_template_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs gap-1"
                          onClick={() =>
                            navigate(`/exit-tickets/create?templateId=${ticket.exit_ticket_template_id}`)
                          }
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </Button>
                      )}
                      {(ticket.is_completed || ticket.status === 'closed') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs gap-1"
                          disabled={clearRun.isPending}
                          onClick={() => {
                            setClearResultsTicketId(ticket.id);
                            setClearResultsDialogOpen(true);
                          }}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Clear
                        </Button>
                      )}
```

- [ ] Add the `RefreshCw` import to the imports line at the top. Find:
```typescript
import { Copy, Check, Ticket, AlertCircle, ExternalLink, Pencil, Loader2, Play, RotateCcw, Library } from "lucide-react";
```
Replace with:
```typescript
import { Copy, Check, Ticket, AlertCircle, ExternalLink, Pencil, Loader2, Play, RotateCcw, Library, RefreshCw } from "lucide-react";
```

- [ ] Add the Clear Results confirmation dialog before the closing `</>` of the component return, after the existing rerun dialog:

```typescript
      <AlertDialog open={clearResultsDialogOpen} onOpenChange={setClearResultsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Results?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes all student responses for this exit ticket and resets it to draft. The questions stay intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClearResultsTicketId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearResults} disabled={clearRun.isPending}>
              {clearRun.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Clearing...</>
              ) : (
                'Clear Results'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
```

- [ ] Run a build check: `npm run build 2>&1 | head -60`

- [ ] Commit:
```bash
git add src/components/classroom/ClassroomActivities.tsx
git commit -m "feat: add Clear Results button to ClassroomActivities, link Edit to template"
```

---

## Task 9: Filter exit tickets from AssessmentsSection

**Files:**
- Modify: `src/hooks/useAssessments.tsx`

Exit ticket runs are not regular assessments. They shouldn't appear (or be deletable) in the class assessments list.

- [ ] In `src/hooks/useAssessments.tsx`, find the line that transforms tasks to assessments:

```typescript
      const assessments: Assessment[] = tasks.map(task => ({
```

Add a filter immediately before this line:

```typescript
      const nonExitTickets = (tasks || []).filter(task => !task.is_exit_ticket);

      const assessments: Assessment[] = nonExitTickets.map(task => ({
```

Also update the `taskIds` calculation above it to use `nonExitTickets`:

Find:
```typescript
      const taskIds = tasks.map(task => task.id);
```
Replace with:
```typescript
      const nonExitTickets = (tasks || []).filter(task => !task.is_exit_ticket);
      const taskIds = nonExitTickets.map(task => task.id);
```

> Note: Remove the duplicate `nonExitTickets` declaration — declare it once before `taskIds`, then use it for both `taskIds` and the `assessments` map.

- [ ] The final relevant section of `useAssessments.tsx` should look like this:

```typescript
      if (!tasks || tasks.length === 0) {
        return [];
      }

      const nonExitTickets = tasks.filter(task => !task.is_exit_ticket);

      if (nonExitTickets.length === 0) {
        return [];
      }

      const taskIds = nonExitTickets.map(task => task.id);
      const { data: results, error: resultsError } = await supabase
        .from('results')
        .select('task_id')
        .in('task_id', taskIds);

      if (resultsError) throw resultsError;

      const completedTaskIds = new Set(results?.map(result => result.task_id) || []);

      const assessments: Assessment[] = nonExitTickets.map(task => ({
        id: task.id,
        name: task.name,
        task_type: task.task_type,
        due_date: task.due_date,
        weight_percent: task.weight_percent,
        max_score: task.max_score,
        status: completedTaskIds.has(task.id) ? 'completed' : 'not_started',
        class_id: task.class_id,
        created_at: task.created_at,
        updated_at: task.updated_at,
      }));

      return assessments;
```

- [ ] Run a build check: `npm run build 2>&1 | head -60`

- [ ] Commit:
```bash
git add src/hooks/useAssessments.tsx
git commit -m "fix: exclude exit ticket runs from class assessments list"
```

---

## Task 10: End-to-end smoke test

- [ ] Start the dev server: `npm run dev`

**Create a template:**
- [ ] Go to `/exit-tickets` → click "Create Exit Ticket"
- [ ] Enter a title, add 2 questions (1 MCQ + 1 short answer), click Save
- [ ] Confirm the template appears in the library with the correct question count

**Deploy:**
- [ ] Click "Deploy" on the template card → select a class → click Deploy
- [ ] Confirm the "Deployed runs" section shows the new run with status "draft"

**Activate from classroom:**
- [ ] Navigate to `/classroom/<classId>` for that class
- [ ] Confirm the exit ticket appears in the Activities panel with an Activate button
- [ ] Start a lesson and activate the ticket
- [ ] Confirm status changes to "active"

**Student submission:**
- [ ] Open `/<classCode>` in a new tab → answer the exit ticket
- [ ] Deactivate from the classroom panel

**Clear results:**
- [ ] In the classroom panel, click "Clear" on the closed ticket → confirm dialog → confirm
- [ ] Ticket resets to "draft" with no responses

**Clear via library:**
- [ ] Go back to `/exit-tickets` → expand "Deployed runs" for the template
- [ ] Click Clear on the run → confirm → status resets to draft

**Assessments section:**
- [ ] Go to the class page (class dashboard)
- [ ] Confirm the exit ticket does NOT appear in the Assessments section

**Deploy to second class:**
- [ ] Deploy the same template to a second class
- [ ] Confirm two runs appear under the template in the library
- [ ] Confirm the exit ticket appears in the second class's Activities panel

- [ ] Final commit (if any remaining changes):
```bash
git add -p
git commit -m "feat: exit ticket templates and runs — complete"
```
