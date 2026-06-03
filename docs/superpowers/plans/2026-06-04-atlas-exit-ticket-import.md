# Atlas Exit Ticket Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a file upload flow to Pulse's Exit Ticket library page that accepts an Atlas-generated `.json` file, creates a template, and optionally deploys it as a draft run into the matching class.

**Architecture:** Three new artifacts — a hook (`useImportExitTicket.ts`) that owns all types, parsing, and database logic; a dialog component (`ImportExitTicketDialog.tsx`) that drives the two-step UI; and a small change to `ExitTickets.tsx` to add the import button and render the dialog. No migrations needed — all inserts go into existing tables.

**Tech Stack:** React 18, TypeScript, TanStack Query `useMutation`, Supabase JS client, shadcn/ui `Dialog`, Tailwind CSS, Lucide React icons.

> **Note:** No test runner is configured in this project. Verification steps use the dev server (`npm run dev`, port 8080) and browser manual testing instead of automated tests.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/hooks/useImportExitTicket.ts` | Atlas JSON types, `parseAtlasJson` validator, `useImportExitTicket` mutation |
| Create | `src/components/exit-tickets/ImportExitTicketDialog.tsx` | File drop/pick UI, preview state, confirm + import |
| Modify | `src/pages/ExitTickets.tsx` | Import button in header, import dialog state + render |

---

## Task 1: Create `useImportExitTicket.ts`

**Files:**
- Create: `src/hooks/useImportExitTicket.ts`

This file owns three things: the TypeScript types for the Atlas JSON format, a `parseAtlasJson` function that validates a raw parsed object, and the `useImportExitTicket` mutation that does all Supabase inserts.

- [ ] **Step 1: Create the file with types and the parse utility**

Create `src/hooks/useImportExitTicket.ts` with this exact content:

```typescript
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

      try {
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

        // 3. Deploy to class if requested and class was found
        if (et.deploy_to_class && classId) {
          const totalMaxScore = et.questions.reduce((sum, q) => sum + (q.max_score || 0), 0);

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

        return { templateId: template.id, deployed: !!(et.deploy_to_class && classId) };
      } catch (err) {
        // Clean up orphaned template row on partial failure
        await supabase.from('exit_ticket_templates').delete().eq('id', template.id);
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build 2>&1 | head -30`

Expected: No errors in `src/hooks/useImportExitTicket.ts`. (Build may fail on other unrelated things — only care about this file.)

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useImportExitTicket.ts
git commit -m "feat: add Atlas JSON types, parser, and import mutation"
```

---

## Task 2: Create `ImportExitTicketDialog.tsx`

**Files:**
- Create: `src/components/exit-tickets/ImportExitTicketDialog.tsx`

This component manages two UI states: file pick and preview/confirm. It reads the file, calls `parseAtlasJson`, looks up the class by `class_code`, shows a preview, and fires the mutation on confirm.

- [ ] **Step 1: Create the directory and component file**

Create `src/components/exit-tickets/ImportExitTicketDialog.tsx` with this content:

```typescript
import React, { useRef, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';
import {
  parseAtlasJson, useImportExitTicket,
  type AtlasExitTicketJson,
} from '@/hooks/useImportExitTicket';
import { useToast } from '@/hooks/use-toast';

interface ImportExitTicketDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

interface ParsedPreview {
  parsed: AtlasExitTicketJson;
  className: string | null;
  classId: string | null;
  questionCount: number;
  totalMarks: number;
}

export const ImportExitTicketDialog: React.FC<ImportExitTicketDialogProps> = ({
  open, onClose, onImported,
}) => {
  const { toast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const importMutation = useImportExitTicket();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parseError, setParseError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const reset = () => {
    setParseError(null);
    setPreview(null);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = async (file: File) => {
    setParseError(null);
    setPreview(null);
    setIsProcessing(true);

    if (!file.name.endsWith('.json')) {
      setParseError('Please upload a .json file');
      setIsProcessing(false);
      return;
    }

    try {
      const text = await file.text();
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        throw new Error('File is not valid JSON');
      }

      const parsed = parseAtlasJson(raw);
      const classCode = parsed.exit_ticket.class_code;
      let className: string | null = null;
      let classId: string | null = null;

      if (classCode) {
        const { data: cls } = await supabase
          .from('classes')
          .select('id, class_name')
          .eq('class_code', classCode)
          .maybeSingle();
        if (cls) {
          classId = cls.id;
          className = cls.class_name;
        }
      }

      const questions = parsed.exit_ticket.questions;
      setPreview({
        parsed,
        className,
        classId,
        questionCount: questions.length,
        totalMarks: questions.reduce((sum, q) => sum + (q.max_score || 0), 0),
      });
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    if (!preview || !currentUser?.id || !currentUser?.school_id) return;
    try {
      const result = await importMutation.mutateAsync({
        parsed: preview.parsed,
        classId: preview.classId,
        teacherId: currentUser.id,
        schoolId: currentUser.school_id,
      });
      toast({
        title: result.deployed
          ? `Exit ticket imported and deployed to ${preview.className}`
          : 'Exit ticket imported',
        description: result.deployed
          ? 'It\'s in your class as a draft — activate it from the Classroom page.'
          : 'Find it in your Exit Ticket library.',
      });
      onImported();
      handleClose();
    } catch (err) {
      toast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const isBusy = importMutation.isPending || isProcessing;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isBusy) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from Atlas</DialogTitle>
          <DialogDescription>
            Export an exit ticket from Atlas, then upload the .json file here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File drop zone — shown until a valid file is parsed */}
          {!preview && !isProcessing && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Drop your .json file here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Processing spinner */}
          {isProcessing && (
            <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Reading file…
            </div>
          )}

          {/* Parse error */}
          {parseError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-3">
              <div className="rounded-md border bg-muted/30 px-4 py-3 space-y-2">
                <p className="font-semibold">{preview.parsed.exit_ticket.name}</p>
                {preview.parsed.exit_ticket.description && (
                  <p className="text-sm text-muted-foreground">{preview.parsed.exit_ticket.description}</p>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {preview.questionCount} question{preview.questionCount !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {preview.totalMarks} mark{preview.totalMarks !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              {preview.classId ? (
                <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Will be deployed as a draft to <strong>{preview.className}</strong>
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Class not found — will be saved as a template only. You can deploy it manually.
                  </span>
                </div>
              )}

              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                onClick={reset}
                disabled={isBusy}
              >
                Choose a different file
              </button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isBusy}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!preview || isBusy}>
            {importMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing…</>
            ) : (
              'Import'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build 2>&1 | head -30`

Expected: No errors in `src/components/exit-tickets/ImportExitTicketDialog.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/exit-tickets/ImportExitTicketDialog.tsx
git commit -m "feat: add ImportExitTicketDialog component"
```

---

## Task 3: Wire up the button in `ExitTickets.tsx`

**Files:**
- Modify: `src/pages/ExitTickets.tsx`

Three changes: add the import to bring in the dialog and the `Upload` icon, add a state variable to control the dialog, add the button in the header, and render the dialog.

- [ ] **Step 1: Add the import statement**

In `src/pages/ExitTickets.tsx`, find the existing icon import line:

```typescript
import {
  ArrowLeft, Plus, Ticket, Trash2, Loader2, ChevronDown, ChevronUp,
  Download, RefreshCw, X,
} from 'lucide-react';
```

Replace it with:

```typescript
import {
  ArrowLeft, Plus, Ticket, Trash2, Loader2, ChevronDown, ChevronUp,
  Download, RefreshCw, X, Upload,
} from 'lucide-react';
```

Then, after the existing page-level imports (after `import CreateExitTicket from './CreateExitTicket';`), add:

```typescript
import { ImportExitTicketDialog } from '@/components/exit-tickets/ImportExitTicketDialog';
```

- [ ] **Step 2: Add dialog state**

In the `ExitTickets` component body, find the existing state declarations (around line 197):

```typescript
const [openRunsMap, setOpenRunsMap] = useState<Record<string, boolean>>({});
```

Add one more line immediately after it:

```typescript
const [importDialogOpen, setImportDialogOpen] = useState(false);
```

- [ ] **Step 3: Replace the header button with a button group**

Find the single button in the page header:

```tsx
<Button onClick={openCreateSheet}><Plus className="w-4 h-4 mr-2" />Create Exit Ticket</Button>
```

Replace it with:

```tsx
<div className="flex items-center gap-2">
  <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
    <Upload className="w-4 h-4 mr-2" />Import from Atlas
  </Button>
  <Button onClick={openCreateSheet}>
    <Plus className="w-4 h-4 mr-2" />Create Exit Ticket
  </Button>
</div>
```

- [ ] **Step 4: Render the dialog**

Find the closing `</div>` at the very end of the component's return statement (after all the `AlertDialog` and `Sheet` components). Add the import dialog just before it:

```tsx
<ImportExitTicketDialog
  open={importDialogOpen}
  onClose={() => setImportDialogOpen(false)}
  onImported={() => refetch()}
/>
```

- [ ] **Step 5: Verify TypeScript compiles clean**

Run: `npm run build 2>&1 | head -30`

Expected: No TypeScript errors.

- [ ] **Step 6: Manual verification — start dev server**

Run: `npm run dev`

Open `http://localhost:8080` in the browser, log in as a teacher, and navigate to Exit Tickets.

Verify:
- "Import from Atlas" button appears next to "Create Exit Ticket" in the header
- Clicking it opens the dialog with the drop zone

- [ ] **Step 7: Test with a valid JSON file — template only**

Create a test file `test-import.json` on your desktop with this content:

```json
{
  "source": "atlas",
  "version": "1.0",
  "exit_ticket": {
    "name": "Test Import — Template Only",
    "description": "Checking the import works",
    "class_code": "XXXXXX",
    "deploy_to_class": true,
    "questions": [
      {
        "number": 1,
        "question": "What is 2 + 2?",
        "question_type": "multiple_choice",
        "max_score": 1,
        "options": [
          { "option_text": "3", "is_correct": false, "order_index": 1 },
          { "option_text": "4", "is_correct": true, "order_index": 2 },
          { "option_text": "5", "is_correct": false, "order_index": 3 }
        ]
      }
    ]
  }
}
```

(`XXXXXX` is a deliberately bad class code to test the "class not found" path.)

Upload it in the dialog. Verify:
- Preview shows: "Test Import — Template Only", 1 question, 1 mark
- Amber warning: "Class not found — will be saved as a template only"
- Click "Import" → success toast: "Exit ticket imported"
- Dialog closes
- New template appears in the Exit Ticket library

- [ ] **Step 8: Test with a real class code**

In the Supabase dashboard (or via MCP), find a real `class_code` for one of your classes. Update `test-import.json` with that code and set `"deploy_to_class": true`.

Upload again. Verify:
- Preview shows the green "Will be deployed as a draft to [Class Name]" banner
- Click Import → success toast: "Exit ticket imported and deployed to [Class Name]"
- Navigate to that class's Classroom page — the exit ticket appears in the list with "draft" status

- [ ] **Step 9: Test error states**

a. Upload a non-JSON file (e.g. a `.txt`) → error: "Please upload a .json file"
b. Upload a JSON file where `"source"` is `"other"` → error: "This file doesn't look like an Atlas export"
c. Upload `{}` as JSON → error: "File is missing required fields: exit_ticket"

- [ ] **Step 10: Commit**

```bash
git add src/pages/ExitTickets.tsx
git commit -m "feat: add Import from Atlas button and dialog to Exit Tickets page"
```

---

## Self-Review

**Spec coverage check:**
- ✅ JSON schema defined in types (`AtlasExitTicketJson`, `AtlasQuestion`, etc.)
- ✅ `parseAtlasJson` validates `source`, `name`, non-empty `questions`, per-question `question` and `question_type`
- ✅ Class lookup by `class_code` in the dialog's `processFile`
- ✅ Template created in `exit_ticket_templates`
- ✅ Questions created in `template_questions`, options in `template_question_options`
- ✅ Conditional deploy: `tasks` + `questions` + `question_options` when `deploy_to_class && classId`
- ✅ In-memory deploy (reads from JSON, not from DB) — efficient
- ✅ Cleanup on partial failure — orphaned template deleted in catch block
- ✅ "Import from Atlas" button in Exit Ticket library header
- ✅ Two-state dialog (file pick → preview)
- ✅ Class-found (green) and class-not-found (amber) preview states
- ✅ All error states from spec covered (non-JSON, wrong source, missing fields, class not found, insert failure)
- ✅ No database migrations required
- ✅ Cache invalidation: `exit-ticket-templates`, `exit-tickets-by-class`, `assessments`
