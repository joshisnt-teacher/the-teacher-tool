# Demo Class Toggle + Live Dashboard Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `is_demo` toggle to classes (hidden from dashboard stats), and replace the two hardcoded dashboard stat cards with real data — upcoming assessments from `tasks.due_date` and average class score from `results.percent_score`.

**Architecture:** A Supabase migration adds `is_demo` to the `classes` table. The `Class` TypeScript interface and `useClasses` hook are updated to carry the new field. `ClassBasicTab` gains a Switch toggle that saves immediately. The Dashboard filters demo classes out of all four stat sources, and two new hooks (`useUpcomingAssessmentsCount`, `useAverageClassScore`) replace the hardcoded values.

**Tech Stack:** React 18, TypeScript, TanStack React Query, Supabase JS client, shadcn/ui Switch component, Tailwind CSS.

---

## File Map

| Action | File | What changes |
|--------|------|--------------|
| Create | `supabase/migrations/20260413000000_add_is_demo_to_classes.sql` | Adds `is_demo` column |
| Modify | `src/hooks/useClasses.tsx` | Add `is_demo` to `Class` interface + `useUpdateClassDemo` mutation |
| Modify | `src/hooks/useStudents.tsx` | `useTotalStudentCount` joins classes and filters `is_demo = false` |
| Create | `src/hooks/useDashboardStats.tsx` | `useUpcomingAssessmentsCount` + `useAverageClassScore` hooks |
| Modify | `src/components/class-dashboard/adjust-class/ClassBasicTab.tsx` | Add Demo toggle Switch |
| Modify | `src/pages/Dashboard.tsx` | Filter demo classes, use new stat hooks, add Demo badge |

---

## Task 1: Supabase Migration — add `is_demo` column

**Files:**
- Create: `supabase/migrations/20260413000000_add_is_demo_to_classes.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/20260413000000_add_is_demo_to_classes.sql
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.classes.is_demo IS
  'When true, this class is excluded from dashboard statistics (Total Classes, Active Students, Avg Score, Upcoming Assessments).';
```

- [ ] **Step 2: Apply migration to Supabase cloud**

Run in the project root:
```bash
npx supabase db push
```

Expected output includes: `Applying migration 20260413000000_add_is_demo_to_classes.sql`

- [ ] **Step 3: Verify column exists**

In Supabase dashboard (or via MCP `execute_sql`), run:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'classes' AND column_name = 'is_demo';
```
Expected: one row with `boolean`, default `false`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260413000000_add_is_demo_to_classes.sql
git commit -m "feat: add is_demo column to classes table"
```

---

## Task 2: Update `Class` interface and add `useUpdateClassDemo` mutation

**Files:**
- Modify: `src/hooks/useClasses.tsx`

- [ ] **Step 1: Add `is_demo` to the `Class` interface**

In `src/hooks/useClasses.tsx`, find the `Class` interface (lines 7–20) and add `is_demo`:

```typescript
export interface Class {
  id: string;
  class_name: string;
  year_level: string;
  subject: string;
  term: string;
  start_date: string;
  end_date: string;
  teacher_id: string;
  school_id: string;
  curriculum_id?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Add `useUpdateClassDemo` mutation**

Append this export at the bottom of `src/hooks/useClasses.tsx`:

```typescript
export const useUpdateClassDemo = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ classId, is_demo }: { classId: string; is_demo: boolean }) => {
      const { error } = await supabase
        .from('classes')
        .update({ is_demo })
        .eq('id', classId);

      if (error) throw error;
    },
    onSuccess: (_, { is_demo }) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['total-student-count'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-assessments-count'] });
      queryClient.invalidateQueries({ queryKey: ['average-class-score'] });
      toast({
        title: is_demo ? 'Demo mode enabled' : 'Demo mode disabled',
        description: is_demo
          ? 'This class will be excluded from dashboard statistics.'
          : 'This class will now appear in dashboard statistics.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update demo setting.',
        variant: 'destructive',
      });
    },
  });
};
```

- [ ] **Step 3: Verify the app still compiles**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useClasses.tsx
git commit -m "feat: add is_demo to Class interface and useUpdateClassDemo mutation"
```

---

## Task 3: Update `useTotalStudentCount` to exclude demo classes

**Files:**
- Modify: `src/hooks/useStudents.tsx`

- [ ] **Step 1: Replace the `useTotalStudentCount` query**

Find `useTotalStudentCount` (lines 58–71) in `src/hooks/useStudents.tsx` and replace it:

```typescript
export const useTotalStudentCount = () => {
  return useQuery({
    queryKey: ['total-student-count'],
    queryFn: async () => {
      // Join to classes so we can exclude demo classes
      const { data, error } = await supabase
        .from('students')
        .select('id, classes!inner(is_demo)')
        .eq('classes.is_demo', false);

      if (error) throw error;
      return data?.length ?? 0;
    },
    enabled: true,
  });
};
```

- [ ] **Step 2: Verify the app compiles**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useStudents.tsx
git commit -m "feat: exclude demo class students from total student count"
```

---

## Task 4: Create `useDashboardStats` hooks

**Files:**
- Create: `src/hooks/useDashboardStats.tsx`

- [ ] **Step 1: Create the file with both hooks**

```typescript
// src/hooks/useDashboardStats.tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Returns count of tasks with a due_date >= today, belonging to non-demo classes
 * owned by the current teacher.
 */
export const useUpcomingAssessmentsCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['upcoming-assessments-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      const { data, error } = await supabase
        .from('tasks')
        .select('id, classes!inner(teacher_id, is_demo)')
        .eq('classes.teacher_id', user.id)
        .eq('classes.is_demo', false)
        .gte('due_date', today);

      if (error) throw error;
      return data?.length ?? 0;
    },
    enabled: !!user,
  });
};

/**
 * Returns the mean percent_score across all results for non-demo classes
 * owned by the current teacher. Returns null when no results exist yet.
 */
export const useAverageClassScore = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['average-class-score', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('results')
        .select('percent_score, tasks!inner(class_id, classes!inner(teacher_id, is_demo))')
        .eq('tasks.classes.teacher_id', user.id)
        .eq('tasks.classes.is_demo', false)
        .not('percent_score', 'is', null);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const total = data.reduce((sum, r) => sum + (r.percent_score as number), 0);
      return Math.round(total / data.length);
    },
    enabled: !!user,
  });
};
```

- [ ] **Step 2: Verify the app compiles**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDashboardStats.tsx
git commit -m "feat: add useUpcomingAssessmentsCount and useAverageClassScore hooks"
```

---

## Task 5: Add Demo toggle to `ClassBasicTab`

**Files:**
- Modify: `src/components/class-dashboard/adjust-class/ClassBasicTab.tsx`

- [ ] **Step 1: Add imports**

At the top of `ClassBasicTab.tsx`, add these imports alongside the existing ones:

```typescript
import { Switch } from '@/components/ui/switch';
import { useUpdateClassDemo } from '@/hooks/useClasses';
```

- [ ] **Step 2: Wire up the mutation inside the component**

Inside `ClassBasicTab`, after the existing state declarations (after line 38), add:

```typescript
const updateDemoMutation = useUpdateClassDemo();
```

- [ ] **Step 3: Add the Demo toggle section to the JSX**

In the `CardContent`, after the closing `</div>` of the 2×2 grid (after the term input, before the `<div className="flex justify-between">`), insert:

```tsx
<div className="flex items-center justify-between rounded-lg border p-4">
  <div className="space-y-0.5">
    <Label htmlFor="is_demo" className="text-base">Demo Class</Label>
    <p className="text-sm text-muted-foreground">
      Demo classes are excluded from dashboard statistics (student count, scores, upcoming assessments).
    </p>
  </div>
  <Switch
    id="is_demo"
    checked={classData.is_demo}
    onCheckedChange={(checked) =>
      updateDemoMutation.mutate({ classId: classData.id, is_demo: checked })
    }
    disabled={updateDemoMutation.isPending}
  />
</div>
```

- [ ] **Step 4: Verify the app compiles and the toggle renders**

```bash
npm run build
```

Open the app at http://localhost:8080, navigate to a class → Adjust Class Data → Basic Settings. Confirm the "Demo Class" toggle appears between the form fields and the Delete/Save buttons.

- [ ] **Step 5: Commit**

```bash
git add src/components/class-dashboard/adjust-class/ClassBasicTab.tsx
git commit -m "feat: add demo class toggle to ClassBasicTab"
```

---

## Task 6: Update Dashboard — filter demo classes, live stats, Demo badge

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Add new hook imports**

Replace the existing import line for student hooks and add the new stats hooks. At the top of `Dashboard.tsx`, update the imports section:

```typescript
import { useUpcomingAssessmentsCount, useAverageClassScore } from '@/hooks/useDashboardStats';
```

Keep the existing `useStudentCounts` and `useTotalStudentCount` imports — they stay.

- [ ] **Step 2: Add hook calls inside the component**

After the existing hook calls (after line 18), add:

```typescript
const { data: upcomingCount = 0 } = useUpcomingAssessmentsCount();
const { data: avgScore } = useAverageClassScore();
```

- [ ] **Step 3: Derive non-demo class count**

After the hook calls, add:

```typescript
const nonDemoClasses = classes.filter(c => !c.is_demo);
```

- [ ] **Step 4: Update the "Total Classes" stat card**

Find the card that renders `{classes.length}` (line 89) and change it to:

```tsx
<div className="text-2xl font-bold">{nonDemoClasses.length}</div>
<p className="text-xs text-muted-foreground">
  {isLoadingClasses ? 'Loading...' : 'Active classes'}
</p>
```

- [ ] **Step 5: Replace the "Average Progress" card with "Avg Class Score"**

Find the card with the hardcoded `73%` (lines 109–118) and replace the `CardContent` body:

```tsx
<CardContent>
  <div className="text-2xl font-bold">
    {avgScore !== null && avgScore !== undefined ? `${avgScore}%` : '—'}
  </div>
  <p className="text-xs text-muted-foreground">
    {avgScore !== null && avgScore !== undefined ? 'Mean across all results' : 'No results yet'}
  </p>
</CardContent>
```

Also update the `CardTitle` text from `"Average Progress"` to `"Avg Class Score"`.

- [ ] **Step 6: Replace the "Upcoming Assessments" card with live data**

Find the card with the hardcoded `4` (lines 120–129) and replace the `CardContent` body:

```tsx
<CardContent>
  <div className="text-2xl font-bold">{upcomingCount}</div>
  <p className="text-xs text-muted-foreground">
    {upcomingCount === 1 ? 'Due from today' : 'Due from today'}
  </p>
</CardContent>
```

- [ ] **Step 7: Add Demo badge to the Recent Classes list**

Find the class list map in the Recent Classes section (around line 157). In the class name line, add a badge after the name:

```tsx
<div className="flex items-center gap-2">
  <p className="font-medium">{classItem.class_name}</p>
  {classItem.is_demo && (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Demo
    </span>
  )}
</div>
```

- [ ] **Step 8: Final compile check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 9: Manual smoke test**

Open http://localhost:8080:
1. Dashboard shows non-demo class count (not total)
2. "Avg Class Score" shows `—` if no results, or a real % if results exist
3. "Upcoming Assessments" shows a real number from the database
4. Go to a class → Adjust Class Data → Basic Settings → toggle Demo ON → return to Dashboard → that class is no longer counted

- [ ] **Step 10: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: filter demo classes from dashboard stats and add Demo badge"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Migration ✓, `is_demo` interface ✓, save mutation ✓, toggle UI ✓, demo filtering on all 4 stats ✓, avg score wired ✓, upcoming assessments wired ✓, Demo badge ✓
- [x] **No placeholders:** All steps contain actual code
- [x] **Type consistency:** `Class.is_demo: boolean` defined in Task 2, used in Tasks 5 & 6. `useUpdateClassDemo` defined in Task 2, imported in Task 5. New hooks defined in Task 4, imported in Task 6.
- [x] **Query key consistency:** `['total-student-count']`, `['upcoming-assessments-count']`, `['average-class-score']` all match between hook definitions and invalidation calls in `useUpdateClassDemo`.
